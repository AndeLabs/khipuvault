import { Router, type Router as ExpressRouter } from "express";

import { requireAuth, optionalAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/error-handler";
import { expensiveOperationLimiter } from "../middleware/rate-limit";
import { validate } from "../middleware/validate";
import {
  paginationQuerySchema,
  timelineQuerySchema,
  topItemsQuerySchema,
  type ValidatedPaginationQuery,
  type ValidatedTimelineQuery,
  type ValidatedTopItemsQuery,
} from "../lib/validation-schemas";
import { AnalyticsService } from "../services/analytics";

const router: ExpressRouter = Router();
const analyticsService = new AnalyticsService();

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
  validate(timelineQuerySchema),
  asyncHandler(async (req, res) => {
    const { days } = req.query as ValidatedTimelineQuery;
    const timeline = await analyticsService.getActivityTimeline(days);
    res.json(timeline);
  })
);

// GET /api/analytics/top-pools
router.get(
  "/top-pools",
  expensiveOperationLimiter,
  validate(topItemsQuerySchema),
  asyncHandler(async (req, res) => {
    const { limit } = req.query as ValidatedTopItemsQuery;
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
  validate(topItemsQuerySchema),
  asyncHandler(async (req, res) => {
    const { limit } = req.query as ValidatedTopItemsQuery;
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
  validate(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    const { limit, offset } = req.query as ValidatedPaginationQuery;
    const result = await analyticsService.getEventLogs(limit, offset);
    res.json(result);
  })
);

export default router;
