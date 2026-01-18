import { Router, type Router as ExpressRouter } from "express";

import { prisma } from "@khipu/database";

const router: ExpressRouter = Router();

/**
 * GET /health
 * Basic health check - checks API and database
 */
router.get("/", async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        api: "running",
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Database connection failed",
    });
  }
});

/**
 * GET /health/indexer
 * Indexer health check - checks sync status and lag
 */
router.get("/indexer", async (req, res) => {
  try {
    // Get the latest event log from database
    const latestEvent = await prisma.eventLog.findFirst({
      orderBy: { blockNumber: "desc" },
      select: {
        blockNumber: true,
        timestamp: true,
      },
    });

    // Get indexer sync status from a dedicated table if available
    // For now, we'll use the latest event as an indicator
    const now = new Date();
    const lastSyncTime = latestEvent?.timestamp || null;
    const lastBlockNumber = latestEvent?.blockNumber || 0;

    // Calculate lag in seconds
    const lagSeconds = lastSyncTime
      ? Math.floor((now.getTime() - new Date(lastSyncTime).getTime()) / 1000)
      : null;

    // Consider unhealthy if lag > 5 minutes (300 seconds)
    const isHealthy = lagSeconds === null || lagSeconds < 300;

    // Get event count for monitoring
    const eventCount = await prisma.eventLog.count();

    const response = {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: now.toISOString(),
      indexer: {
        lastBlockNumber,
        lastSyncTime: lastSyncTime?.toISOString() || null,
        lagSeconds,
        totalEventsIndexed: eventCount,
        isHealthy,
      },
    };

    res.status(isHealthy ? 200 : 503).json(response);
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Failed to check indexer health",
      indexer: {
        isHealthy: false,
      },
    });
  }
});

/**
 * GET /health/ready
 * Readiness check - returns 200 only if all services are ready
 */
router.get("/ready", async (req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    // All checks passed
    res.json({
      ready: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/live
 * Liveness check - simple check that the process is alive
 */
router.get("/live", async (req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

export default router;
