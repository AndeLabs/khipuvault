/**
 * @fileoverview User Routes
 * @module api/routes/users
 *
 * Handles user profile, portfolio, transactions, and positions endpoints.
 */

import { Router, type Router as ExpressRouter } from "express";
import { z } from "zod";

import {
  asyncHandler,
  sendSuccess,
  sendUnauthorized,
  sendForbidden,
} from "../lib/route-handler";
import {
  addressParamSchema,
  addressWithPaginationSchema,
  ethereumAddressSchema,
} from "../lib/validation-schemas";
import { requireAuth } from "../middleware/auth";
import { writeRateLimiter } from "../middleware/rate-limit";
import { validate } from "../middleware/validate";
import { UsersService } from "../services/users";

const router: ExpressRouter = Router();
const usersService = new UsersService();

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verify the authenticated user matches the requested address
 */
function verifyAddressOwnership(
  req: import("express").Request,
  res: import("express").Response,
  requestedAddress: string,
): boolean {
  if (!req.user) {
    sendUnauthorized(res, "Authentication required");
    return false;
  }

  if (req.user.address.toLowerCase() !== requestedAddress.toLowerCase()) {
    sendForbidden(res, "You can only access your own data");
    return false;
  }

  return true;
}

// ============================================================================
// ROUTES
// ============================================================================

// GET /api/users/:address
router.get(
  "/:address",
  requireAuth,
  validate(addressParamSchema),
  asyncHandler(async (req, res) => {
    if (!verifyAddressOwnership(req, res, req.params.address)) {
      return;
    }
    const user = await usersService.getUserByAddress(req.params.address);
    sendSuccess(res, user);
  }),
);

// GET /api/users/:address/portfolio
router.get(
  "/:address/portfolio",
  requireAuth,
  validate(addressParamSchema),
  asyncHandler(async (req, res) => {
    if (!verifyAddressOwnership(req, res, req.params.address)) {
      return;
    }
    const portfolio = await usersService.getUserPortfolio(req.params.address);
    sendSuccess(res, portfolio);
  }),
);

// GET /api/users/:address/transactions
router.get(
  "/:address/transactions",
  requireAuth,
  validate(addressWithPaginationSchema),
  asyncHandler(async (req, res) => {
    if (!verifyAddressOwnership(req, res, req.params.address)) {
      return;
    }
    const { limit = 50, offset = 0 } = req.query;
    const transactions = await usersService.getUserTransactions(
      req.params.address,
      Number(limit),
      Number(offset),
    );
    sendSuccess(res, transactions);
  }),
);

// GET /api/users/:address/positions
router.get(
  "/:address/positions",
  requireAuth,
  validate(addressParamSchema),
  asyncHandler(async (req, res) => {
    if (!verifyAddressOwnership(req, res, req.params.address)) {
      return;
    }
    const positions = await usersService.getUserPositions(req.params.address);
    sendSuccess(res, positions);
  }),
);

// POST /api/users - Create or update user profile
const createUserBodySchema = z.object({
  body: z.object({
    address: ethereumAddressSchema,
    ensName: z.string().optional(),
    avatar: z.string().url().optional(),
  }),
});

router.post(
  "/",
  writeRateLimiter,
  requireAuth,
  validate(createUserBodySchema),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      sendUnauthorized(res, "Authentication required");
      return;
    }

    // Verify that the address in the request body matches the authenticated user's address
    if (req.body.address.toLowerCase() !== req.user.address.toLowerCase()) {
      sendForbidden(res, "You can only create/update your own user profile");
      return;
    }

    const user = await usersService.createOrUpdateUser(req.body.address, {
      ensName: req.body.ensName,
      avatar: req.body.avatar,
    });

    sendSuccess(res, user, 201);
  }),
);

export default router;
