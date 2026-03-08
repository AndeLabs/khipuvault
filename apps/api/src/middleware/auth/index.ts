/**
 * @fileoverview Auth Module - Centralized Authentication
 * @module middleware/auth
 *
 * This module provides all authentication functionality:
 * - Nonce generation and management
 * - SIWE (Sign-In with Ethereum) verification
 * - JWT token generation and verification
 * - Express authentication middleware
 *
 * @example
 * ```ts
 * import { requireAuth, generateNonce, verifySiweMessage, generateJWT } from "./auth";
 *
 * // Generate nonce for SIWE
 * const nonce = await generateNonce();
 *
 * // Verify SIWE message
 * const result = await verifySiweMessage(message, signature);
 *
 * // Generate JWT
 * const token = generateJWT(address);
 *
 * // Protect route
 * app.get("/protected", requireAuth, handler);
 * ```
 */

// Types
export type { NonceData, NonceStats, SiweVerificationResult, JWTPayload } from "./types";

// Nonce management
export { generateNonce, getNonceStats, cleanupExpiredNonces } from "./nonce-manager";

// SIWE verification
export { verifySiweMessage } from "./siwe-verifier";

// JWT operations
export { generateJWT, verifyJWT, invalidateToken, tokenBlacklist } from "./jwt-manager";

// Middleware
export { requireAuth, optionalAuth } from "./middleware";
