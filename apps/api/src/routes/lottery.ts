/**
 * @fileoverview Lottery Routes
 * @module api/routes/lottery
 *
 * Handles lottery pool queries - rounds, tickets, winners, and stats.
 */

import { Router, type Router as ExpressRouter } from "express";
import { z } from "zod";

import { asyncHandler, sendSuccess } from "../lib/route-handler";
import {
  paginationQuerySchema,
  ethereumAddressSchema,
  addressParamSchema,
  type ValidatedPaginationQuery,
} from "../lib/validation-schemas";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { verifyOwnership } from "../middleware/ownership";
import { LotteryService } from "../services/lottery";

const router: ExpressRouter = Router();
const lotteryService = new LotteryService();

// ============================================================================
// VALIDATION SCHEMAS (using centralized base schemas)
// ============================================================================

/**
 * Round ID parameter schema
 */
const roundIdParamSchema = z.object({
  params: z.object({
    roundId: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1)),
  }),
});

/**
 * User round schema - address + roundId params
 */
const userRoundSchema = z.object({
  params: z.object({
    address: ethereumAddressSchema,
    roundId: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1)),
  }),
});

// ============================================================================
// ROUTES
// ============================================================================

// GET /api/lottery/stats
// Public endpoint - get lottery pool statistics
router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const stats = await lotteryService.getPoolStats();
    sendSuccess(res, stats);
  })
);

// GET /api/lottery/rounds
// Public endpoint - get all rounds with pagination
router.get(
  "/rounds",
  validate(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    const { limit, offset } = req.query as ValidatedPaginationQuery;
    const rounds = await lotteryService.getAllRounds(limit, offset);
    sendSuccess(res, rounds);
  })
);

// GET /api/lottery/rounds/active
// Public endpoint - get active/open rounds
router.get(
  "/rounds/active",
  asyncHandler(async (_req, res) => {
    const rounds = await lotteryService.getActiveRounds();
    sendSuccess(res, rounds);
  })
);

// GET /api/lottery/rounds/:roundId
// Public endpoint - get round details
router.get(
  "/rounds/:roundId",
  validate(roundIdParamSchema),
  asyncHandler(async (req, res) => {
    const roundId = parseInt(req.params.roundId, 10);
    const round = await lotteryService.getRoundById(roundId);
    sendSuccess(res, round);
  })
);

// GET /api/lottery/draws
// Public endpoint - get draw history (completed rounds with winners)
router.get(
  "/draws",
  validate(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    const { limit, offset } = req.query as ValidatedPaginationQuery;
    const draws = await lotteryService.getDrawHistory(limit, offset);
    sendSuccess(res, draws);
  })
);

// GET /api/lottery/winners
// Public endpoint - get top winners
router.get(
  "/winners",
  asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt((req.query.limit as string) || "10", 10), 50);
    const winners = await lotteryService.getTopWinners(limit);
    sendSuccess(res, winners);
  })
);

// ============================================================================
// USER-SPECIFIC ROUTES (require auth + ownership verification)
// ============================================================================

// GET /api/lottery/user/:address/stats
// Get user's lottery statistics (authenticated + ownership)
router.get(
  "/user/:address/stats",
  requireAuth,
  validate(addressParamSchema),
  verifyOwnership("address", "You can only access your own lottery data"),
  asyncHandler(async (req, res) => {
    const stats = await lotteryService.getUserStats(req.params.address);
    sendSuccess(res, stats);
  })
);

// GET /api/lottery/user/:address/history
// Get user's lottery participation history (authenticated + ownership)
router.get(
  "/user/:address/history",
  requireAuth,
  validate(addressParamSchema),
  validate(paginationQuerySchema),
  verifyOwnership("address", "You can only access your own lottery data"),
  asyncHandler(async (req, res) => {
    const { limit, offset } = req.query as ValidatedPaginationQuery;
    const history = await lotteryService.getUserLotteryHistory(req.params.address, limit, offset);
    sendSuccess(res, history);
  })
);

// GET /api/lottery/user/:address/rounds/:roundId
// Get user's tickets for a specific round (authenticated + ownership)
router.get(
  "/user/:address/rounds/:roundId",
  requireAuth,
  validate(userRoundSchema),
  verifyOwnership("address", "You can only access your own lottery data"),
  asyncHandler(async (req, res) => {
    const roundId = parseInt(req.params.roundId, 10);
    const ticket = await lotteryService.getUserTickets(req.params.address, roundId);
    sendSuccess(res, ticket);
  })
);

export default router;
