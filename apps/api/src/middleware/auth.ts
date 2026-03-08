/**
 * @fileoverview Authentication Module
 * @module middleware/auth
 *
 * @deprecated This file re-exports from ./auth/ for backwards compatibility.
 * New code should import from "./auth" directory directly.
 *
 * @example
 * ```ts
 * // Preferred (new code)
 * import { requireAuth, generateJWT } from "./middleware/auth";
 *
 * // Also works (backwards compatible)
 * import { requireAuth, generateJWT } from "./middleware/auth";
 * ```
 */

// Re-export everything from the auth module
export {
  // Types
  type NonceData,
  type NonceStats,
  type SiweVerificationResult,
  type JWTPayload,

  // Nonce management
  generateNonce,
  getNonceStats,
  cleanupExpiredNonces,

  // SIWE verification
  verifySiweMessage,

  // JWT operations
  generateJWT,
  verifyJWT,
  invalidateToken,
  tokenBlacklist,

  // Middleware
  requireAuth,
  optionalAuth,
} from "./auth/index";
