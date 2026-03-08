/**
 * @fileoverview User Routes
 * @module api/routes/users
 *
 * Handles user profile, portfolio, transactions, and positions endpoints.
 */

import { Router, type Router as ExpressRouter } from "express";
import { z } from "zod";

import { asyncHandler, sendSuccess } from "../lib/route-handler";
import {
  addressParamSchema,
  addressWithPaginationSchema,
  ethereumAddressSchema,
} from "../lib/validation-schemas";
import { requireAuth } from "../middleware/auth";
import { verifyOwnership, verifyBodyOwnership } from "../middleware/ownership";
import { writeRateLimiter } from "../middleware/rate-limit";
import { validate } from "../middleware/validate";
import { UsersService } from "../services/users";

const router: ExpressRouter = Router();
const usersService = new UsersService();

// ============================================================================
// ROUTES
// ============================================================================

// GET /api/users/:address
router.get(
  "/:address",
  requireAuth,
  validate(addressParamSchema),
  verifyOwnership(),
  asyncHandler(async (req, res) => {
    const user = await usersService.getUserByAddress(req.params.address);
    sendSuccess(res, user);
  })
);

// GET /api/users/:address/portfolio
router.get(
  "/:address/portfolio",
  requireAuth,
  validate(addressParamSchema),
  verifyOwnership(),
  asyncHandler(async (req, res) => {
    const portfolio = await usersService.getUserPortfolio(req.params.address);
    sendSuccess(res, portfolio);
  })
);

// GET /api/users/:address/transactions
router.get(
  "/:address/transactions",
  requireAuth,
  validate(addressWithPaginationSchema),
  verifyOwnership(),
  asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;
    const transactions = await usersService.getUserTransactions(
      req.params.address,
      Number(limit),
      Number(offset)
    );
    sendSuccess(res, transactions);
  })
);

// GET /api/users/:address/positions
router.get(
  "/:address/positions",
  requireAuth,
  validate(addressParamSchema),
  verifyOwnership(),
  asyncHandler(async (req, res) => {
    const positions = await usersService.getUserPositions(req.params.address);
    sendSuccess(res, positions);
  })
);

// POST /api/users - Create or update user profile
const createUserBodySchema = z.object({
  body: z.object({
    address: ethereumAddressSchema,
    ensName: z.string().max(100).optional(),
    avatar: z.string().url().max(500).optional(),
  }),
});

router.post(
  "/",
  writeRateLimiter,
  requireAuth,
  validate(createUserBodySchema),
  verifyBodyOwnership("address", "You can only create/update your own user profile"),
  asyncHandler(async (req, res) => {
    const user = await usersService.createOrUpdateUser(req.body.address, {
      ensName: req.body.ensName,
      avatar: req.body.avatar,
    });

    sendSuccess(res, user, 201);
  })
);

export default router;
