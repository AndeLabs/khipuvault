/**
 * @fileoverview Async Route Handler Utilities
 * @module api/lib/route-handler
 *
 * Provides utilities for handling async route handlers and standardizing
 * error handling across all API routes.
 */

import type { Request, Response, NextFunction, RequestHandler } from "express";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Async request handler type
 */
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// ============================================================================
// ASYNC HANDLER WRAPPER
// ============================================================================

/**
 * Wrap an async route handler to catch errors and pass to error middleware
 *
 * Eliminates the need for try-catch in every route handler.
 *
 * @example
 * ```typescript
 * // Before (repetitive)
 * router.get("/:id", async (req, res, next) => {
 *   try {
 *     const result = await service.getById(req.params.id);
 *     res.json(result);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 *
 * // After (clean)
 * router.get("/:id", asyncHandler(async (req, res) => {
 *   const result = await service.getById(req.params.id);
 *   res.json(result);
 * }));
 * ```
 */
export function asyncHandler(handler: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Send a successful JSON response
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
  } satisfies ApiResponse<T>);
}

/**
 * Send a successful response with pagination metadata
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  options: {
    page?: number;
    limit: number;
    total: number;
  }
): void {
  const { page = 1, limit, total } = options;
  const hasMore = page * limit < total;

  res.json({
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      hasMore,
    },
  } satisfies ApiResponse<T[]>);
}

/**
 * Send an error response
 */
export function sendError(res: Response, message: string, statusCode = 500): void {
  res.status(statusCode).json({
    success: false,
    error: message,
  } satisfies ApiResponse);
}

/**
 * Send a 404 Not Found response
 */
export function sendNotFound(res: Response, resource = "Resource"): void {
  sendError(res, `${resource} not found`, 404);
}

/**
 * Send a 400 Bad Request response
 */
export function sendBadRequest(res: Response, message: string): void {
  sendError(res, message, 400);
}

/**
 * Send a 401 Unauthorized response
 */
export function sendUnauthorized(res: Response, message = "Unauthorized"): void {
  sendError(res, message, 401);
}

/**
 * Send a 403 Forbidden response
 */
export function sendForbidden(res: Response, message = "Forbidden"): void {
  sendError(res, message, 403);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Extract and validate pagination params from request
 */
export function getPaginationParams(
  req: Request,
  defaults: { limit: number; offset: number } = { limit: 50, offset: 0 }
): { limit: number; offset: number } {
  const limit = Math.min(Math.max(1, Number(req.query.limit) || defaults.limit), 1000);
  const offset = Math.max(0, Number(req.query.offset) || defaults.offset);

  return { limit, offset };
}

/**
 * Normalize Ethereum address from request params
 */
export function getAddressParam(req: Request, paramName = "address"): string {
  const address = req.params[paramName];
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Invalid ${paramName} parameter`);
  }
  return address.toLowerCase();
}

// ============================================================================
// COMBINED HANDLER WITH VALIDATION
// ============================================================================

/**
 * Create a validated async handler
 *
 * Combines Zod validation with async error handling.
 *
 * @example
 * ```typescript
 * router.get(
 *   "/:address",
 *   validatedHandler(addressParamSchema, async (req, res) => {
 *     const { address } = req.params;
 *     const user = await userService.getByAddress(address);
 *     sendSuccess(res, user);
 *   })
 * );
 * ```
 */
export function validatedHandler<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: { parse: (data: any) => T },
  handler: (
    req: Request & { validated: T },
    res: Response,
    next: NextFunction
  ) => Promise<void | Response>
): RequestHandler {
  return asyncHandler(async (req, res, next) => {
    const validated = schema.parse({
      params: req.params,
      query: req.query,
      body: req.body,
    });

    (req as Request & { validated: T }).validated = validated;

    return handler(req as Request & { validated: T }, res, next);
  });
}
