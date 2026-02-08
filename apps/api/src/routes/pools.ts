/**
 * @fileoverview Pool Routes
 * @module api/routes/pools
 *
 * Handles pool queries - list pools, pool details, analytics, and refresh.
 */

import { Router, type Router as ExpressRouter } from "express";

import { asyncHandler, sendSuccess } from "../lib/route-handler";
import {
  addressParamSchema,
  flexiblePoolIdParamSchema,
  poolAnalyticsSchema,
} from "../lib/validation-schemas";
import { requireAuth } from "../middleware/auth";
import { writeRateLimiter } from "../middleware/rate-limit";
import { validate } from "../middleware/validate";
import { PoolsService } from "../services/pools";

const router: ExpressRouter = Router();
const poolsService = new PoolsService();

// ============================================================================
// ROUTES
// ============================================================================

// GET /api/pools
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const pools = await poolsService.getAllPools();
    sendSuccess(res, pools);
  })
);

// IMPORTANT: /address routes must come BEFORE /:poolId to prevent routing conflicts
// An Ethereum address like 0x123... would match /:poolId otherwise

// GET /api/pools/address/:address
router.get(
  "/address/:address",
  validate(addressParamSchema),
  asyncHandler(async (req, res) => {
    const pool = await poolsService.getPoolByAddress(req.params.address);
    sendSuccess(res, pool);
  })
);

// GET /api/pools/address/:address/users
router.get(
  "/address/:address/users",
  validate(addressParamSchema),
  asyncHandler(async (req, res) => {
    const users = await poolsService.getPoolUsers(req.params.address);
    sendSuccess(res, users);
  })
);

// GET /api/pools/address/:address/stats
router.get(
  "/address/:address/stats",
  validate(addressParamSchema),
  asyncHandler(async (req, res) => {
    const stats = await poolsService.getPoolStats(req.params.address);
    sendSuccess(res, stats);
  })
);

// GET /api/pools/:poolId
router.get(
  "/:poolId",
  validate(flexiblePoolIdParamSchema),
  asyncHandler(async (req, res) => {
    const pool = await poolsService.getPoolById(req.params.poolId);
    sendSuccess(res, pool);
  })
);

// GET /api/pools/:poolId/analytics
router.get(
  "/:poolId/analytics",
  validate(poolAnalyticsSchema),
  asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    const analytics = await poolsService.getPoolAnalytics(req.params.poolId, Number(days));
    sendSuccess(res, analytics);
  })
);

// POST /api/pools/address/:address/refresh
// Note: This endpoint triggers pool stats recalculation from blockchain
// Any authenticated user can refresh pool stats (public data)
router.post(
  "/address/:address/refresh",
  writeRateLimiter,
  requireAuth,
  validate(addressParamSchema),
  asyncHandler(async (req, res) => {
    const pool = await poolsService.updatePoolStats(req.params.address);
    sendSuccess(res, pool);
  })
);

export default router;
