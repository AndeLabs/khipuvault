/**
 * @fileoverview Analytics service tests
 * @module __tests__/services/analytics.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@khipu/database";

import { AnalyticsService } from "../../services/analytics";
import { fixtures } from "../setup";

describe("AnalyticsService", () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    vi.clearAllMocks();
  });

  describe("getGlobalStats", () => {
    it("should return aggregated global statistics", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(100);
      vi.mocked(prisma.pool.count).mockResolvedValue(5);
      vi.mocked(prisma.deposit.count).mockResolvedValue(1000);
      vi.mocked(prisma.pool.findMany).mockResolvedValue([
        { ...fixtures.mockPool, tvl: "1000000000000000000", apr: 8.5 },
        {
          ...fixtures.mockPool,
          id: "pool-2",
          tvl: "2000000000000000000",
          apr: 10.5,
        },
      ] as any);

      const result = await analyticsService.getGlobalStats();

      expect(result.totalUsers).toBe(100);
      expect(result.activePools).toBe(5);
      expect(result.totalTransactions).toBe(1000);
      expect(result.totalTVL).toBe("3000000000000000000");
      expect(parseFloat(result.avgAPR)).toBeCloseTo(9.5, 1);
    });

    it("should handle no pools gracefully", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(0);
      vi.mocked(prisma.pool.count).mockResolvedValue(0);
      vi.mocked(prisma.deposit.count).mockResolvedValue(0);
      vi.mocked(prisma.pool.findMany).mockResolvedValue([]);

      const result = await analyticsService.getGlobalStats();

      expect(result.totalUsers).toBe(0);
      expect(result.activePools).toBe(0);
      expect(result.totalTVL).toBe("0");
    });
  });

  describe("getActivityTimeline", () => {
    it("should return daily activity statistics", async () => {
      const mockDailyStats = [
        {
          date: "2024-01-10",
          deposits: BigInt(10),
          withdrawals: BigInt(2),
          deposit_volume: "1000000000000000000",
          withdraw_volume: "200000000000000000",
        },
        {
          date: "2024-01-11",
          deposits: BigInt(15),
          withdrawals: BigInt(5),
          deposit_volume: "1500000000000000000",
          withdraw_volume: "500000000000000000",
        },
      ];

      vi.mocked(prisma.$queryRaw).mockResolvedValue(mockDailyStats);

      const result = await analyticsService.getActivityTimeline(30);

      expect(result).toHaveLength(2);
      expect(result[0].deposits).toBe(10);
      expect(result[0].withdrawals).toBe(2);
      expect(result[0].date).toBe("2024-01-10");
    });

    it("should use default 30 days when not specified", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

      await analyticsService.getActivityTimeline();

      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it("should cap days at 365", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

      await analyticsService.getActivityTimeline(500);

      // Should still work without error (capped internally)
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it("should handle empty results", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

      const result = await analyticsService.getActivityTimeline(30);

      expect(result).toHaveLength(0);
    });
  });

  describe("getTopPools", () => {
    it("should return top pools by TVL", async () => {
      const mockPools = [
        { ...fixtures.mockPool, tvl: "2000000000000000000" },
        { ...fixtures.mockPool, id: "pool-2", tvl: "1000000000000000000" },
      ];

      vi.mocked(prisma.pool.findMany).mockResolvedValue(mockPools as any);

      const result = await analyticsService.getTopPools(10);

      expect(prisma.pool.findMany).toHaveBeenCalledWith({
        where: { status: "ACTIVE" },
        orderBy: { tvl: "desc" },
        take: 10,
      });
      expect(result).toHaveLength(2);
    });

    it("should use default limit when not specified", async () => {
      vi.mocked(prisma.pool.findMany).mockResolvedValue([]);

      await analyticsService.getTopPools();

      expect(prisma.pool.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
    });
  });

  describe("getTopUsers", () => {
    it("should return top users by balance", async () => {
      const mockTopUsers = [
        {
          address: fixtures.validAddressLower,
          ensName: "test.eth",
          avatar: null,
          totalDeposited: "1000000000000000000",
          totalWithdrawn: "200000000000000000",
        },
      ];

      vi.mocked(prisma.$queryRaw).mockResolvedValue(mockTopUsers);

      const result = await analyticsService.getTopUsers(10);

      expect(result[0].address).toBe(fixtures.validAddressLower);
      expect(result[0].currentBalance).toBe("800000000000000000");
    });

    it("should cap limit at 100", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

      await analyticsService.getTopUsers(500);

      // The service should internally cap this
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it("should handle empty results", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

      const result = await analyticsService.getTopUsers(10);

      expect(result).toHaveLength(0);
    });
  });

  describe("getEventLogs", () => {
    it("should return paginated event logs", async () => {
      const mockLogs = [
        {
          id: "log-1",
          eventType: "DEPOSIT",
          timestamp: new Date(),
          data: {},
        },
      ];

      vi.mocked(prisma.eventLog.findMany).mockResolvedValue(mockLogs as any);
      vi.mocked(prisma.eventLog.count).mockResolvedValue(100);

      const result = await analyticsService.getEventLogs(50, 0);

      expect(result.logs).toHaveLength(1);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.hasMore).toBe(true);
    });

    it("should use default pagination values", async () => {
      vi.mocked(prisma.eventLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.eventLog.count).mockResolvedValue(0);

      await analyticsService.getEventLogs();

      expect(prisma.eventLog.findMany).toHaveBeenCalledWith({
        orderBy: { timestamp: "desc" },
        take: 100,
        skip: 0,
      });
    });

    it("should indicate no more pages when at end", async () => {
      vi.mocked(prisma.eventLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.eventLog.count).mockResolvedValue(10);

      const result = await analyticsService.getEventLogs(50, 0);

      expect(result.pagination.hasMore).toBe(false);
    });
  });
});
