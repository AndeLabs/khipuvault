/**
 * @fileoverview Prometheus Metrics Route
 * @module routes/metrics
 *
 * Exposes application metrics in Prometheus format.
 * Should be protected in production or exposed on a separate port.
 */

import { Router, Request, Response } from "express";

import { getMetrics, getContentType } from "../lib/metrics";
import { asyncHandler } from "../middleware/error-handler";

import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

/**
 * GET /metrics
 * Returns all metrics in Prometheus format
 *
 * Response: text/plain (Prometheus format)
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    // Optional: Add basic auth or API key check for production
    const apiKey = req.headers["x-metrics-key"];
    const expectedKey = process.env.METRICS_API_KEY;

    // If METRICS_API_KEY is set, require it
    if (expectedKey && apiKey !== expectedKey) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const metrics = await getMetrics();
    res.set("Content-Type", getContentType());
    res.send(metrics);
  })
);

export default router;
