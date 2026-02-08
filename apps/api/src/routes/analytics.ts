import { Router, type Router as ExpressRouter } from "express";
import { z } from "zod";

import { requireAuth, optionalAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/error-handler";
import { expensiveOperationLimiter } from "../middleware/rate-limit";
import { validate } from "../middleware/validate";
import { AnalyticsService } from "../services/analytics";

const router: ExpressRouter = Router();
const analyticsService = new AnalyticsService();

/**
 * Reusable query parameter schemas with validation constraints
 * Prevents DoS attacks via unreasonably large limit/offset values
 */
const paginationSchema = z.object({
  query: z.object({
    limit: z.coerce.number().min(1).max(100).optional().default(10),
    offset: z.coerce.number().min(0).max(10000).optional().default(0),
  }),
});

const timelineSchema = z.object({
  query: z.object({
    days: z.coerce.number().min(1).max(365).optional().default(30),
  }),
});

const topItemsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().min(1).max(100).optional().default(10),
  }),
});

// GET /api/analytics/global
router.get(
  "/global",
  expensiveOperationLimiter,
  asyncHandler(async (_req, res) => {
    const stats = await analyticsService.getGlobalStats();
    res.json(stats);
  })
);

// GET /api/analytics/timeline
router.get(
  "/timeline",
  expensiveOperationLimiter,
  validate(timelineSchema),
  asyncHandler(async (req, res) => {
    const { days = 30 } = req.query as { days?: number };
    const timeline = await analyticsService.getActivityTimeline(days);
    res.json(timeline);
  })
);

// GET /api/analytics/top-pools
router.get(
  "/top-pools",
  expensiveOperationLimiter,
  validate(topItemsSchema),
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query as { limit?: number };
    const pools = await analyticsService.getTopPools(limit);
    res.json(pools);
  })
);

// GET /api/analytics/top-users
// Protected: Requires authentication to access user wallet addresses and balances
router.get(
  "/top-users",
  expensiveOperationLimiter,
  requireAuth,
  validate(topItemsSchema),
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query as { limit?: number };
    const users = await analyticsService.getTopUsers(limit);
    res.json(users);
  })
);

// GET /api/analytics/events
// Protected: Event logs may contain sensitive transaction details
router.get(
  "/events",
  expensiveOperationLimiter,
  optionalAuth,
  validate(paginationSchema),
  asyncHandler(async (req, res) => {
    const { limit = 10, offset = 0 } = req.query as { limit?: number; offset?: number };
    const result = await analyticsService.getEventLogs(limit, offset);
    res.json(result);
  })
);

export default router;
