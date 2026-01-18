/**
 * @fileoverview Transaction Routes
 * @module api/routes/transactions
 *
 * Handles transaction queries - recent transactions, stats, and pool-specific history.
 */

import { Router, type Router as ExpressRouter } from "express";

import { asyncHandler, sendSuccess } from "../lib/route-handler";
import {
  txHashParamSchema,
  paginationQuerySchema,
  addressWithPaginationSchema,
} from "../lib/validation-schemas";
import { validate } from "../middleware/validate";
import { TransactionsService } from "../services/transactions";

const router: ExpressRouter = Router();
const transactionsService = new TransactionsService();

// ============================================================================
// ROUTES
// ============================================================================

// GET /api/transactions/recent
router.get(
  "/recent",
  validate(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;
    const result = await transactionsService.getRecentTransactions(Number(limit), Number(offset));
    sendSuccess(res, result);
  })
);

// GET /api/transactions/stats
router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const stats = await transactionsService.getTransactionStats();
    sendSuccess(res, stats);
  })
);

// GET /api/transactions/:txHash
router.get(
  "/:txHash",
  validate(txHashParamSchema),
  asyncHandler(async (req, res) => {
    const transaction = await transactionsService.getTransactionByHash(req.params.txHash);
    sendSuccess(res, transaction);
  })
);

// GET /api/transactions/pool/:address
router.get(
  "/pool/:address",
  validate(addressWithPaginationSchema),
  asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;
    const result = await transactionsService.getTransactionsByPool(
      req.params.address,
      Number(limit),
      Number(offset)
    );
    sendSuccess(res, result);
  })
);

export default router;
