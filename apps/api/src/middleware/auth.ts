import * as crypto from "crypto";

import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { SiweMessage } from "siwe";
import { verifyMessage } from "viem";

import { tokenBlacklist } from "../lib/cache";
import { logger } from "../lib/logger";

// Extend Express Request type to include auth data
declare global {
  namespace Express {
    interface Request {
      user?: {
        address: string;
        iat: number;
        exp: number;
        jti?: string; // JWT ID for blacklist
      };
      rawToken?: string; // Original token for blacklisting
    }
  }
}

// In-memory nonce storage (in production, use Redis or similar)
// Map<nonce, { timestamp: number, used: boolean }>
const nonceStore = new Map<string, { timestamp: number; used: boolean }>();

// Nonce expiration time: 10 minutes
const NONCE_EXPIRATION_MS = 10 * 60 * 1000;
// Maximum nonces to prevent memory leak
const MAX_NONCES = 10000;

// Automatic cleanup interval (every 5 minutes)
let cleanupInterval: NodeJS.Timeout | null = null;
function startPeriodicCleanup(): void {
  if (cleanupInterval) {
    return;
  } // Already started
  cleanupInterval = setInterval(
    () => {
      cleanupExpiredNonces();
      logger.debug(
        { nonceCount: nonceStore.size },
        "Periodic nonce cleanup completed",
      );
    },
    5 * 60 * 1000,
  );
  // Prevent interval from keeping process alive
  cleanupInterval.unref();
}
startPeriodicCleanup();

// JWT configuration - MUST be set in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET must be set in production environment");
}
// Use crypto-generated secret for development only
const DEV_SECRET =
  process.env.NODE_ENV !== "production"
    ? crypto.randomBytes(32).toString("hex")
    : undefined;
const EFFECTIVE_JWT_SECRET = JWT_SECRET || DEV_SECRET!;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "2h"; // Reduced from 7d to 2h for security

/**
 * Generate a cryptographically secure random nonce
 * @returns {string} A unique nonce string
 */
export function generateNonce(): string {
  const nonce = crypto.randomBytes(32).toString("base64url");

  // Enforce max nonces to prevent memory leak
  if (nonceStore.size >= MAX_NONCES) {
    cleanupExpiredNonces();
    // If still at limit after cleanup, remove oldest 10%
    if (nonceStore.size >= MAX_NONCES) {
      const entries = Array.from(nonceStore.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp,
      );
      const toDelete = Math.floor(entries.length * 0.1);
      for (let i = 0; i < toDelete; i++) {
        nonceStore.delete(entries[i][0]);
      }
      logger.warn(
        { deleted: toDelete, remaining: nonceStore.size },
        "Forced nonce cleanup due to limit",
      );
    }
  }

  // Store nonce with timestamp
  nonceStore.set(nonce, {
    timestamp: Date.now(),
    used: false,
  });

  return nonce;
}

/**
 * Clean up expired nonces from storage
 */
function cleanupExpiredNonces(): void {
  const now = Date.now();
  const entries = Array.from(nonceStore.entries());
  for (let i = 0; i < entries.length; i++) {
    const [nonce, data] = entries[i];
    if (now - data.timestamp > NONCE_EXPIRATION_MS) {
      nonceStore.delete(nonce);
    }
  }
}

/**
 * Verify a SIWE (Sign-In with Ethereum) message and signature
 * @param {string} message - The SIWE message string
 * @param {string} signature - The signature in hex format
 * @returns {Promise<{ valid: boolean; address?: string; error?: string }>}
 */
export async function verifySiweMessage(
  message: string,
  signature: string,
): Promise<{ valid: boolean; address?: string; error?: string }> {
  try {
    // Parse the SIWE message
    const siweMessage = new SiweMessage(message);

    // Verify the message structure and fields
    const fields = await siweMessage.verify({ signature });

    // Check if verification was successful
    if (!fields.success) {
      return {
        valid: false,
        error: "Signature verification failed",
      };
    }

    // Atomically check and consume nonce (prevents TOCTOU race condition)
    // We delete the nonce immediately to prevent concurrent requests from using it
    const nonceData = nonceStore.get(siweMessage.nonce);
    nonceStore.delete(siweMessage.nonce); // Delete immediately for atomicity

    if (!nonceData) {
      return {
        valid: false,
        error: "Invalid nonce: nonce not found",
      };
    }

    if (nonceData.used) {
      return {
        valid: false,
        error: "Invalid nonce: nonce already used",
      };
    }

    // Check nonce expiration
    const now = Date.now();
    if (now - nonceData.timestamp > NONCE_EXPIRATION_MS) {
      return {
        valid: false,
        error: "Invalid nonce: nonce expired",
      };
    }

    // Verify signature using viem
    const isValidSignature = await verifyMessage({
      address: siweMessage.address as `0x${string}`,
      message: message,
      signature: signature as `0x${string}`,
    });

    if (!isValidSignature) {
      return {
        valid: false,
        error: "Invalid signature",
      };
    }

    // Check message expiration if set
    if (siweMessage.expirationTime) {
      const expirationDate = new Date(siweMessage.expirationTime);
      if (expirationDate.getTime() < now) {
        return {
          valid: false,
          error: "Message has expired",
        };
      }
    }

    // Check message not-before time if set
    if (siweMessage.notBefore) {
      const notBeforeDate = new Date(siweMessage.notBefore);
      if (notBeforeDate.getTime() > now) {
        return {
          valid: false,
          error: "Message not yet valid",
        };
      }
    }

    // Nonce already deleted above for atomicity - no need to mark as used

    // Return success with address
    return {
      valid: true,
      address: siweMessage.address,
    };
  } catch (error) {
    logger.error(
      { error, messagePreview: message.substring(0, 100) },
      "SIWE verification error",
    );
    return {
      valid: false,
      error:
        error instanceof Error ? error.message : "Unknown verification error",
    };
  }
}

/**
 * Generate a JWT token for an authenticated address
 * @param {string} address - Ethereum address
 * @returns {string} JWT token
 */
export function generateJWT(address: string): string {
  // Generate unique JWT ID for blacklisting
  const jti = crypto.randomBytes(16).toString("hex");

  const payload = {
    address: address.toLowerCase(), // Normalize address to lowercase
    jti, // JWT ID for token revocation
  };

  const token = jwt.sign(payload, EFFECTIVE_JWT_SECRET, {
    expiresIn: JWT_EXPIRATION as string,
    issuer: "khipuvault-api",
    audience: "khipuvault-app",
  } as jwt.SignOptions);

  return token;
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function verifyJWT(token: string): {
  address: string;
  iat: number;
  exp: number;
  jti?: string;
} | null {
  try {
    const decoded = jwt.verify(token, EFFECTIVE_JWT_SECRET, {
      issuer: "khipuvault-api",
      audience: "khipuvault-app",
    }) as {
      address: string;
      iat: number;
      exp: number;
      jti?: string;
    };

    return decoded;
  } catch (error) {
    logger.warn({ error }, "JWT verification failed");
    return null;
  }
}

/**
 * Express middleware to require authentication
 * Validates JWT token from Authorization header
 * Checks token blacklist for revoked tokens
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: "Unauthorized",
        message: "No authorization token provided",
      });
      return;
    }

    // Extract token from "Bearer <token>" format
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid authorization header format. Use: Bearer <token>",
      });
      return;
    }

    const token = parts[1];

    // Verify token
    const decoded = verifyJWT(token);

    if (!decoded) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
      return;
    }

    // Check if token is blacklisted (revoked on logout)
    if (decoded.jti) {
      const isRevoked = await tokenBlacklist.isBlacklisted(decoded.jti);
      if (isRevoked) {
        res.status(401).json({
          error: "Unauthorized",
          message: "Token has been revoked. Please log in again.",
        });
        return;
      }
    }

    // Attach user data and raw token to request
    req.user = decoded;
    req.rawToken = token;

    next();
  } catch (error) {
    logger.error(
      { error, path: req.path, method: req.method },
      "Auth middleware error",
    );
    res.status(500).json({
      error: "Internal Server Error",
      message: "Authentication failed",
    });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token provided
 * Useful for routes that have different behavior for authenticated users
 * Logs unexpected errors but continues without blocking the request
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(" ");

    if (parts.length === 2 && parts[0] === "Bearer") {
      const token = parts[1];
      const decoded = verifyJWT(token);

      if (decoded) {
        // Check blacklist for consistency with requireAuth
        if (decoded.jti) {
          const isRevoked = await tokenBlacklist.isBlacklisted(decoded.jti);
          if (!isRevoked) {
            req.user = decoded;
            req.rawToken = token;
          }
        } else {
          req.user = decoded;
          req.rawToken = token;
        }
      }
    }

    next();
  } catch (error) {
    // Log unexpected errors but continue without auth
    logger.warn(
      { error, path: req.path },
      "Optional auth failed - continuing without authentication",
    );
    next();
  }
}

/**
 * Get nonce store statistics (for monitoring/debugging)
 */
export function getNonceStats(): {
  total: number;
  used: number;
  unused: number;
  expired: number;
} {
  cleanupExpiredNonces();

  let used = 0;
  let unused = 0;
  let expired = 0;
  const now = Date.now();

  const entries = Array.from(nonceStore.entries());
  for (let i = 0; i < entries.length; i++) {
    const [_, data] = entries[i];
    if (now - data.timestamp > NONCE_EXPIRATION_MS) {
      expired++;
    } else if (data.used) {
      used++;
    } else {
      unused++;
    }
  }

  return {
    total: nonceStore.size,
    used,
    unused,
    expired,
  };
}

/**
 * Invalidate a JWT token by adding it to the blacklist
 * @param jti JWT ID from the token
 * @param expiresAt Token expiration timestamp
 */
export async function invalidateToken(
  jti: string,
  expiresAt: number,
): Promise<void> {
  // Calculate remaining time until token expires
  const now = Math.floor(Date.now() / 1000);
  const remainingSeconds = Math.max(0, expiresAt - now);

  // Add to blacklist (only keep until token would naturally expire)
  await tokenBlacklist.add(jti, remainingSeconds);
  logger.info({ jti }, "Token invalidated on logout");
}

// Re-export tokenBlacklist for routes that need direct access
export { tokenBlacklist };
