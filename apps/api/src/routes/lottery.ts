/**
 * @fileoverview Lottery Routes
 * @module api/routes/lottery
 *
 * Handles lottery pool queries - rounds, tickets, winners, and stats.
 */

import { Router, type Router as ExpressRouter } from "express";
import { z } from "zod";

import { asyncHandler, sendSuccess } from "../lib/route-handler";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { LotteryService } from "../services/lottery";

const router: ExpressRouter = Router();
const lotteryService = new LotteryService();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const paginationSchema = z.object({
  query: z.object({
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1).max(100))
      .optional(),
    offset: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(0))
      .optional(),
  }),
});

const roundIdParamSchema = z.object({
  params: z.object({
    roundId: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1)),
  }),
});

const addressParamSchema = z.object({
  params: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  }),
});

const userRoundSchema = z.object({
  params: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
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
  validate(paginationSchema),
  asyncHandler(async (req, res) => {
    const { limit = 20, offset = 0 } = req.query as {
      limit?: number;
      offset?: number;
    };
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
  validate(paginationSchema),
  asyncHandler(async (req, res) => {
    const { limit = 20, offset = 0 } = req.query as {
      limit?: number;
      offset?: number;
    };
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
// USER-SPECIFIC ROUTES (require auth)
// ============================================================================

// GET /api/lottery/user/:address/stats
// Get user's lottery statistics
router.get(
  "/user/:address/stats",
  validate(addressParamSchema),
  asyncHandler(async (req, res) => {
    const stats = await lotteryService.getUserStats(req.params.address);
    sendSuccess(res, stats);
  })
);

// GET /api/lottery/user/:address/history
// Get user's lottery participation history
router.get(
  "/user/:address/history",
  validate(addressParamSchema),
  validate(paginationSchema),
  asyncHandler(async (req, res) => {
    const { limit = 20, offset = 0 } = req.query as {
      limit?: number;
      offset?: number;
    };
    const history = await lotteryService.getUserLotteryHistory(req.params.address, limit, offset);
    sendSuccess(res, history);
  })
);

// GET /api/lottery/user/:address/rounds/:roundId
// Get user's tickets for a specific round
router.get(
  "/user/:address/rounds/:roundId",
  validate(userRoundSchema),
  asyncHandler(async (req, res) => {
    const roundId = parseInt(req.params.roundId, 10);
    const ticket = await lotteryService.getUserTickets(req.params.address, roundId);
    sendSuccess(res, ticket);
  })
);

export default router;
