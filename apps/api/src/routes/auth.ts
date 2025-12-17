import { Router, Request, Response } from "express";
import { z } from "zod";

import {
  generateNonce,
  verifySiweMessage,
  generateJWT,
  requireAuth,
  getNonceStats,
  invalidateToken,
} from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/error-handler";
import { authRateLimiter } from "../middleware/rate-limit";
import { validate } from "../middleware/validate";

import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

// ===== VALIDATION SCHEMAS =====

/**
 * Schema for SIWE message verification request
 */
const verifySchema = z.object({
  message: z.string().min(1, "Message is required"),
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]{130}$/, "Invalid signature format")
    .min(1, "Signature is required"),
});

// ===== ROUTES =====

/**
 * GET /api/auth/nonce
 * Generate a new nonce for SIWE authentication
 *
 * Response:
 * {
 *   nonce: string
 * }
 */
router.get(
  "/nonce",
  authRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const nonce = generateNonce();

    res.json({
      nonce,
    });
  }),
);

/**
 * POST /api/auth/verify
 * Verify a SIWE message and signature, return JWT token
 *
 * Request body:
 * {
 *   message: string   // SIWE message
 *   signature: string // Signature in hex format (0x...)
 * }
 *
 * Response:
 * {
 *   token: string     // JWT token
 *   address: string   // Ethereum address
 *   expiresIn: string // Token expiration time
 * }
 */
router.post(
  "/verify",
  authRateLimiter,
  validate(verifySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { message, signature } = req.body;

    // Verify SIWE message
    const verification = await verifySiweMessage(message, signature);

    if (!verification.valid) {
      throw new AppError(401, "Authentication failed", true, {
        reason: verification.error,
      });
    }

    if (!verification.address) {
      throw new AppError(
        500,
        "Verification succeeded but no address returned",
        true,
      );
    }

    // Generate JWT token
    const token = generateJWT(verification.address);

    // Get token expiration from env or use secure default (2 hours)
    const expiresIn = process.env.JWT_EXPIRATION || "2h";

    res.json({
      token,
      address: verification.address.toLowerCase(),
      expiresIn,
    });
  }),
);

/**
 * POST /api/auth/logout
 * Logout and invalidate the JWT token
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   success: boolean
 *   message: string
 * }
 *
 * Note: The token is added to a blacklist until its natural expiration.
 * Subsequent requests with this token will be rejected.
 */
router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    // Invalidate the token by adding it to the blacklist
    if (req.user?.jti && req.user.exp) {
      await invalidateToken(req.user.jti, req.user.exp);
    }

    res.json({
      success: true,
      message: "Logged out successfully. Token has been invalidated.",
    });
  }),
);

/**
 * GET /api/auth/me
 * Get current authenticated user information
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   address: string
 *   authenticated: boolean
 *   iat: number  // Token issued at (Unix timestamp)
 *   exp: number  // Token expires at (Unix timestamp)
 * }
 */
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, "User not authenticated", true);
    }

    res.json({
      address: req.user.address,
      authenticated: true,
      iat: req.user.iat,
      exp: req.user.exp,
    });
  }),
);

/**
 * GET /api/auth/stats
 * Get authentication statistics (development/monitoring only)
 *
 * Note: This endpoint should be protected or removed in production
 *
 * Response:
 * {
 *   nonces: {
 *     total: number
 *     used: number
 *     unused: number
 *     expired: number
 *   }
 * }
 */
router.get(
  "/stats",
  asyncHandler(async (req: Request, res: Response) => {
    // Only allow in development or with admin auth
    if (process.env.NODE_ENV === "production") {
      throw new AppError(
        403,
        "Stats endpoint not available in production",
        true,
      );
    }

    const stats = getNonceStats();

    res.json({
      nonces: stats,
    });
  }),
);

export default router;
