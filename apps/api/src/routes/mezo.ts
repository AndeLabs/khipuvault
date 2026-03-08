/**
 * @fileoverview Mezo Protocol Routes
 * @module api/routes/mezo
 *
 * Handles Mezo protocol queries - troves, stability pool, liquidations, and system stats.
 */

import { Router, type Router as ExpressRouter } from "express";
import { z } from "zod";

import { asyncHandler, sendSuccess } from "../lib/route-handler";
import {
  ethereumAddressSchema,
  paginationQuerySchema,
  timelineQuerySchema,
  addressParamSchema,
  type ValidatedPaginationQuery,
  type ValidatedTimelineQuery,
} from "../lib/validation-schemas";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { verifyOwnership } from "../middleware/ownership";
import { MezoService } from "../services/mezo";

const router: ExpressRouter = Router();
const mezoService = new MezoService();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Troves query schema with pagination and optional status filter
 */
const trovesQuerySchema = z.object({
  query: z
    .object({
      limit: z.coerce.number().int().min(1).max(1000).optional().default(50),
      offset: z.coerce.number().int().min(0).max(100000).optional().default(0),
      status: z
        .enum([
          "NON_EXISTENT",
          "ACTIVE",
          "CLOSED_BY_OWNER",
          "CLOSED_BY_LIQUIDATION",
          "CLOSED_BY_REDEMPTION",
        ])
        .optional(),
      minCollateralRatio: z.coerce.number().min(0).optional(),
      maxCollateralRatio: z.coerce.number().min(0).optional(),
    })
    .optional()
    .default({
      limit: 50,
      offset: 0,
    }),
});

/**
 * Liquidations query schema with pagination
 */
const liquidationsQuerySchema = z.object({
  query: z
    .object({
      limit: z.coerce.number().int().min(1).max(100).optional().default(20),
      offset: z.coerce.number().int().min(0).max(100000).optional().default(0),
      address: ethereumAddressSchema.optional(), // Filter by liquidated address
    })
    .optional()
    .default({
      limit: 20,
      offset: 0,
    }),
});

// ============================================================================
// PUBLIC ROUTES - System-wide data
// ============================================================================

/**
 * GET /api/mezo/stats
 * Get system-wide Mezo protocol statistics
 */
router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const stats = await mezoService.getSystemStats();
    sendSuccess(res, stats);
  })
);

/**
 * GET /api/mezo/prices
 * Get BTC price history
 * Query params: days (default 30, max 365)
 */
router.get(
  "/prices",
  validate(timelineQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ValidatedTimelineQuery;
    const prices = await mezoService.getPriceHistory(query.days);
    sendSuccess(res, prices);
  })
);

/**
 * GET /api/mezo/liquidations
 * Get recent liquidation events
 * Query params: limit, offset, address (optional filter)
 */
router.get(
  "/liquidations",
  validate(liquidationsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query;
    const limit = Number(query.limit) || 20;
    const offset = Number(query.offset) || 0;
    const address = query.address as string | undefined;

    const liquidations = await mezoService.getLiquidations(limit, offset, address);
    sendSuccess(res, liquidations);
  })
);

/**
 * GET /api/mezo/stability-pool
 * Get stability pool statistics
 */
router.get(
  "/stability-pool",
  asyncHandler(async (_req, res) => {
    const stats = await mezoService.getStabilityPoolStats();
    sendSuccess(res, stats);
  })
);

// ============================================================================
// TROVE ROUTES
// ============================================================================

/**
 * GET /api/mezo/troves
 * List all active troves with pagination and filtering
 * Query params: limit, offset, status, minCollateralRatio, maxCollateralRatio
 */
router.get(
  "/troves",
  validate(trovesQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query;
    const limit = Number(query.limit) || 50;
    const offset = Number(query.offset) || 0;
    const status = query.status as string | undefined;
    const minCollateralRatio = query.minCollateralRatio
      ? Number(query.minCollateralRatio)
      : undefined;
    const maxCollateralRatio = query.maxCollateralRatio
      ? Number(query.maxCollateralRatio)
      : undefined;

    const troves = await mezoService.getAllTroves({
      limit,
      offset,
      status,
      minCollateralRatio,
      maxCollateralRatio,
    });

    sendSuccess(res, troves);
  })
);

/**
 * GET /api/mezo/troves/:address
 * Get user's trove details (public data)
 * Optional query param: includeHistory (bool, default false)
 */
router.get(
  "/troves/:address",
  validate(addressParamSchema),
  asyncHandler(async (req, res) => {
    const includeHistory = req.query.includeHistory === "true";
    const trove = await mezoService.getTroveByAddress(req.params.address, includeHistory);
    sendSuccess(res, trove);
  })
);

// ============================================================================
// STABILITY POOL ROUTES
// ============================================================================

/**
 * GET /api/mezo/stability-pool/:address
 * Get user's stability pool position (authenticated + ownership required)
 * Optional query param: includeHistory (bool, default false)
 */
router.get(
  "/stability-pool/:address",
  requireAuth,
  validate(addressParamSchema),
  verifyOwnership("address", "You can only access your own stability pool position"),
  asyncHandler(async (req, res) => {
    const includeHistory = req.query.includeHistory === "true";
    const position = await mezoService.getStabilityDepositByAddress(
      req.params.address,
      includeHistory
    );
    sendSuccess(res, position);
  })
);

export default router;
