/**
 * @fileoverview Health route tests
 * @module __tests__/routes/health.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@khipu/database";

import { createMockRequest, createMockResponse } from "../setup";

// Import route handler after mocks
import healthRouter from "../../routes/health";

// Helper to get route handler with proper typing
function getRouteHandler(
  router: typeof healthRouter,
  path: string,
  method: "get" | "post" | "put" | "delete"
) {
  const layer = router.stack.find(
    (l: any) => l.route?.path === path && l.route?.methods[method]
  ) as any;

  if (!layer?.route?.stack?.[0]?.handle) {
    throw new Error(`Route handler not found for ${method.toUpperCase()} ${path}`);
  }

  return layer.route.stack[0].handle;
}

describe("Health Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("should return healthy status when database is connected", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const req = createMockRequest({
        method: "GET",
        path: "/",
      });
      const res = createMockResponse();
      const next = vi.fn();

      const handler = getRouteHandler(healthRouter, "/", "get");
      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
          timestamp: expect.any(String),
          services: {
            database: "connected",
            api: "running",
          },
        })
      );
    });

    it("should return unhealthy status when database connection fails", async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("Connection failed"));

      const req = createMockRequest({
        method: "GET",
        path: "/",
      });
      const res = createMockResponse();
      const next = vi.fn();

      const handler = getRouteHandler(healthRouter, "/", "get");
      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "unhealthy",
          timestamp: expect.any(String),
          error: "Database connection failed",
        })
      );
    });

    it("should include ISO timestamp in response", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const req = createMockRequest();
      const res = createMockResponse();
      const next = vi.fn();

      const handler = getRouteHandler(healthRouter, "/", "get");
      await handler(req, res, next);

      const jsonCall = vi.mocked(res.json).mock.calls[0][0];
      expect(new Date(jsonCall.timestamp).toISOString()).toBe(jsonCall.timestamp);
    });
  });
});
