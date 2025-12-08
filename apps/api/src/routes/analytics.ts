import { Router, type Router as ExpressRouter } from "express";
import { z } from "zod";
import { AnalyticsService } from "../services/analytics";

const router: ExpressRouter = Router();
const analyticsService = new AnalyticsService();

/**
 * Reusable query parameter schemas with validation constraints
 * Prevents DoS attacks via unreasonably large limit/offset values
 */
const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  offset: z.coerce.number().min(0).max(10000).optional().default(0),
});

const timelineSchema = z.object({
  days: z.coerce.number().min(1).max(365).optional().default(30),
});

// GET /api/analytics/global
router.get("/global", async (req, res, next) => {
  try {
    const stats = await analyticsService.getGlobalStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/timeline
router.get("/timeline", async (req, res, next) => {
  try {
    const { days } = timelineSchema.parse(req.query);
    const timeline = await analyticsService.getActivityTimeline(days);
    res.json(timeline);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/top-pools
router.get("/top-pools", async (req, res, next) => {
  try {
    const { limit } = paginationSchema.pick({ limit: true }).parse(req.query);
    const pools = await analyticsService.getTopPools(limit);
    res.json(pools);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/top-users
router.get("/top-users", async (req, res, next) => {
  try {
    const { limit } = paginationSchema.pick({ limit: true }).parse(req.query);
    const users = await analyticsService.getTopUsers(limit);
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/events
router.get("/events", async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const result = await analyticsService.getEventLogs(limit, offset);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
