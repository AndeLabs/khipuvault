/**
 * @fileoverview JWT Token Generation and Verification
 * @module middleware/auth/jwt-manager
 */

import * as crypto from "crypto";

import * as jwt from "jsonwebtoken";

import { tokenBlacklist } from "../../lib/cache";
import { logger } from "../../lib/logger";

import type { JWTPayload } from "./types";

// JWT configuration - MUST be set in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET must be set in production environment");
}

// Use crypto-generated secret for development only
const DEV_SECRET =
  process.env.NODE_ENV !== "production" ? crypto.randomBytes(32).toString("hex") : undefined;
const EFFECTIVE_JWT_SECRET = JWT_SECRET || DEV_SECRET!;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "2h";

/**
 * Generate a JWT token for an authenticated address
 */
export function generateJWT(address: string): string {
  const jti = crypto.randomBytes(16).toString("hex");

  const payload = {
    address: address.toLowerCase(),
    jti,
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
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, EFFECTIVE_JWT_SECRET, {
      issuer: "khipuvault-api",
      audience: "khipuvault-app",
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    logger.warn({ error }, "JWT verification failed");
    return null;
  }
}

/**
 * Invalidate a JWT token by adding it to the blacklist
 */
export async function invalidateToken(jti: string, expiresAt: number): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const remainingSeconds = Math.max(0, expiresAt - now);

  await tokenBlacklist.add(jti, remainingSeconds);
  logger.info({ jti }, "Token invalidated on logout");
}

// Re-export tokenBlacklist for routes that need direct access
export { tokenBlacklist };
