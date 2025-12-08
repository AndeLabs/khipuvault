import { Router, type Router as ExpressRouter } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { TransactionsService } from "../services/transactions";

const router: ExpressRouter = Router();
const transactionsService = new TransactionsService();

const txHashSchema = z.object({
  params: z.object({
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  }),
});

const querySchema = z.object({
  query: z.object({
    limit: z.coerce.number().min(1).max(1000).optional().default(50),
    offset: z.coerce.number().min(0).max(100000).optional().default(0),
  }),
});

const poolAddressSchema = z.object({
  params: z.object({
    poolAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  }),
  query: z.object({
    limit: z.coerce.number().min(1).max(1000).optional().default(50),
    offset: z.coerce.number().min(0).max(100000).optional().default(0),
  }),
});

// GET /api/transactions/recent
router.get("/recent", validate(querySchema), async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await transactionsService.getRecentTransactions(
      Number(limit),
      Number(offset),
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/transactions/stats
router.get("/stats", async (req, res, next) => {
  try {
    const stats = await transactionsService.getTransactionStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /api/transactions/:txHash
router.get("/:txHash", validate(txHashSchema), async (req, res, next) => {
  try {
    const transaction = await transactionsService.getTransactionByHash(
      req.params.txHash,
    );
    res.json(transaction);
  } catch (error) {
    next(error);
  }
});

// GET /api/transactions/pool/:poolAddress
router.get(
  "/pool/:poolAddress",
  validate(poolAddressSchema),
  async (req, res, next) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const result = await transactionsService.getTransactionsByPool(
        req.params.poolAddress,
        Number(limit),
        Number(offset),
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
