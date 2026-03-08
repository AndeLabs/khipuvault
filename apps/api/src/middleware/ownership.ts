/**
 * @fileoverview Ownership Verification Middleware
 * @module api/middleware/ownership
 *
 * Middleware for verifying that authenticated users can only access their own data.
 * Centralizes ownership verification logic used across multiple routes.
 */

import type { Request, Response, NextFunction } from "express";

import { AppError } from "./error-handler";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Request with authenticated user
 */
interface AuthenticatedRequest extends Request {
  user?: {
    address: string;
    [key: string]: unknown;
  };
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Middleware factory that verifies the authenticated user owns the requested address
 *
 * @param paramName - The request parameter containing the address to verify (default: "address")
 * @param errorMessage - Custom error message (default: "You can only access your own data")
 *
 * @example
 * ```typescript
 * // Basic usage - verifies req.params.address matches req.user.address
 * router.get(
 *   "/user/:address",
 *   requireAuth,
 *   verifyOwnership(),
 *   asyncHandler(async (req, res) => { ... })
 * );
 *
 * // Custom param name
 * router.get(
 *   "/wallet/:walletAddress",
 *   requireAuth,
 *   verifyOwnership("walletAddress"),
 *   asyncHandler(async (req, res) => { ... })
 * );
 *
 * // Custom error message
 * router.get(
 *   "/user/:address/lottery",
 *   requireAuth,
 *   verifyOwnership("address", "You can only access your own lottery data"),
 *   asyncHandler(async (req, res) => { ... })
 * );
 * ```
 */
export function verifyOwnership(
  paramName: string = "address",
  errorMessage: string = "You can only access your own data"
) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    // Check authentication
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    // Get the address from request params
    const requestedAddress = req.params[paramName];

    if (!requestedAddress) {
      throw new AppError(400, `Missing ${paramName} parameter`);
    }

    // Verify ownership (case-insensitive comparison)
    if (req.user.address.toLowerCase() !== requestedAddress.toLowerCase()) {
      throw new AppError(403, errorMessage);
    }

    next();
  };
}

/**
 * Middleware factory that verifies the authenticated user owns the address in request body
 *
 * @param bodyField - The body field containing the address to verify (default: "address")
 * @param errorMessage - Custom error message
 *
 * @example
 * ```typescript
 * router.post(
 *   "/user",
 *   requireAuth,
 *   verifyBodyOwnership(),
 *   asyncHandler(async (req, res) => { ... })
 * );
 * ```
 */
export function verifyBodyOwnership(
  bodyField: string = "address",
  errorMessage: string = "You can only modify your own data"
) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    // Check authentication
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    // Get the address from request body
    const requestedAddress = req.body?.[bodyField];

    if (!requestedAddress) {
      throw new AppError(400, `Missing ${bodyField} in request body`);
    }

    // Verify ownership (case-insensitive comparison)
    if (req.user.address.toLowerCase() !== requestedAddress.toLowerCase()) {
      throw new AppError(403, errorMessage);
    }

    next();
  };
}

/**
 * Helper function for inline ownership verification (non-middleware usage)
 * Throws AppError if ownership check fails.
 *
 * @example
 * ```typescript
 * asyncHandler(async (req, res) => {
 *   assertOwnership(req.user?.address, req.params.address);
 *   // ... continue with handler
 * });
 * ```
 */
export function assertOwnership(
  userAddress: string | undefined,
  requestedAddress: string,
  errorMessage: string = "You can only access your own data"
): void {
  if (!userAddress) {
    throw new AppError(401, "Authentication required");
  }

  if (userAddress.toLowerCase() !== requestedAddress.toLowerCase()) {
    throw new AppError(403, errorMessage);
  }
}
