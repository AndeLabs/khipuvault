/**
 * @fileoverview Pools service tests
 * @module __tests__/services/pools.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import { prisma } from "@khipu/database";

import { PoolsService } from "../../services/pools";
import { fixtures } from "../setup";

describe("PoolsService", () => {
  let poolsService: PoolsService;

  beforeEach(() => {
    poolsService = new PoolsService();
    vi.clearAllMocks();
  });

  describe("getAllPools", () => {
    it("should return all active pools sorted by APR", async () => {
      const mockPools = [
        { ...fixtures.mockPool, apr: 10.5 },
        { ...fixtures.mockPool, id: "pool-2", apr: 8.5 },
      ];

      vi.mocked(prisma.pool.findMany).mockResolvedValue(mockPools as any);

      const result = await poolsService.getAllPools();

      expect(prisma.pool.findMany).toHaveBeenCalledWith({
        where: { status: "ACTIVE" },
        orderBy: { apr: "desc" },
        select: expect.any(Object),
      });
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no pools exist", async () => {
      vi.mocked(prisma.pool.findMany).mockResolvedValue([]);

      const result = await poolsService.getAllPools();

      expect(result).toHaveLength(0);
    });
  });

  describe("getPoolById", () => {
    it("should return pool with analytics", async () => {
      const mockPoolWithAnalytics = {
        ...fixtures.mockPool,
        analytics: [{ tvl: "1000000", timestamp: new Date() }],
      };

      vi.mocked(prisma.pool.findUnique).mockResolvedValue(mockPoolWithAnalytics as any);

      const result = await poolsService.getPoolById("pool-1");

      expect(prisma.pool.findUnique).toHaveBeenCalledWith({
        where: { id: "pool-1" },
        include: {
          analytics: {
            orderBy: { timestamp: "desc" },
            take: 30,
          },
        },
      });
      expect(result.id).toBe(fixtures.mockPool.id);
    });

    it("should throw 404 when pool not found", async () => {
      vi.mocked(prisma.pool.findUnique).mockResolvedValue(null);

      await expect(poolsService.getPoolById("non-existent")).rejects.toThrow("Pool not found");
    });
  });

  describe("getPoolByAddress", () => {
    it("should return pool by contract address", async () => {
      const mockPool = { ...fixtures.mockPool, analytics: [] };
      vi.mocked(prisma.pool.findUnique).mockResolvedValue(mockPool as any);

      const result = await poolsService.getPoolByAddress("0xPool123");

      expect(prisma.pool.findUnique).toHaveBeenCalledWith({
        where: { contractAddress: "0xpool123" }, // lowercased
        include: expect.any(Object),
      });
      expect(result.contractAddress).toBe(fixtures.mockPool.contractAddress);
    });

    it("should throw 404 when pool not found by address", async () => {
      vi.mocked(prisma.pool.findUnique).mockResolvedValue(null);

      await expect(poolsService.getPoolByAddress("0xnonexistent")).rejects.toThrow(
        "Pool not found"
      );
    });
  });

  describe("getPoolAnalytics", () => {
    it("should return analytics for specified days", async () => {
      const mockAnalytics = [
        { tvl: "1000000", timestamp: new Date() },
        { tvl: "1100000", timestamp: new Date() },
      ];

      vi.mocked(prisma.poolAnalytics.findMany).mockResolvedValue(mockAnalytics as any);

      const result = await poolsService.getPoolAnalytics("pool-1", 30);

      expect(prisma.poolAnalytics.findMany).toHaveBeenCalledWith({
        where: {
          poolId: "pool-1",
          timestamp: { gte: expect.any(Date) },
        },
        orderBy: { timestamp: "asc" },
      });
      expect(result).toHaveLength(2);
    });

    it("should use default 30 days when not specified", async () => {
      vi.mocked(prisma.poolAnalytics.findMany).mockResolvedValue([]);

      await poolsService.getPoolAnalytics("pool-1");

      expect(prisma.poolAnalytics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            poolId: "pool-1",
            timestamp: { gte: expect.any(Date) },
          },
        })
      );
    });
  });

  describe("getPoolUsers", () => {
    it("should return users with calculated balances", async () => {
      const mockDeposits = [
        {
          ...fixtures.mockDeposit,
          type: "DEPOSIT",
          amount: "1000",
          user: {
            address: fixtures.validAddressLower,
            ensName: null,
            avatar: null,
          },
        },
        {
          ...fixtures.mockDeposit,
          type: "WITHDRAW",
          amount: "200",
          user: {
            address: fixtures.validAddressLower,
            ensName: null,
            avatar: null,
          },
        },
      ];

      vi.mocked(prisma.deposit.findMany).mockResolvedValue(mockDeposits as any);

      const result = await poolsService.getPoolUsers("0xPool123");

      expect(prisma.deposit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            poolAddress: "0xpool123",
            status: "CONFIRMED",
          },
        })
      );
      expect(result[0].balance).toBe("800"); // 1000 - 200
    });

    it("should filter out users with zero balance", async () => {
      const mockDeposits = [
        {
          ...fixtures.mockDeposit,
          type: "DEPOSIT",
          amount: "1000",
          user: {
            address: fixtures.validAddressLower,
            ensName: null,
            avatar: null,
          },
        },
        {
          ...fixtures.mockDeposit,
          type: "WITHDRAW",
          amount: "1000",
          user: {
            address: fixtures.validAddressLower,
            ensName: null,
            avatar: null,
          },
        },
      ];

      vi.mocked(prisma.deposit.findMany).mockResolvedValue(mockDeposits as any);

      const result = await poolsService.getPoolUsers("0xPool123");

      expect(result).toHaveLength(0);
    });
  });

  describe("updatePoolStats", () => {
    it("should update pool with aggregated stats", async () => {
      const mockStats = [
        {
          total_deposited: "1000000",
          total_withdrawn: "200000",
          deposit_count: BigInt(100),
          withdrawal_count: BigInt(20),
          active_users: BigInt(50),
        },
      ];

      vi.mocked(prisma.$queryRaw).mockResolvedValue(mockStats);
      vi.mocked(prisma.pool.update).mockResolvedValue(fixtures.mockPool as any);

      await poolsService.updatePoolStats("0xPool123");

      expect(prisma.pool.update).toHaveBeenCalledWith({
        where: { contractAddress: "0xpool123" },
        data: expect.objectContaining({
          tvl: "800000", // 1000000 - 200000
          totalUsers: 50,
          totalDeposits: 100,
          totalWithdrawals: 20,
        }),
      });
    });

    it("should handle pools with no transactions", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]);
      vi.mocked(prisma.pool.update).mockResolvedValue(fixtures.mockPool as any);

      await poolsService.updatePoolStats("0xPool123");

      expect(prisma.pool.update).toHaveBeenCalledWith({
        where: { contractAddress: "0xpool123" },
        data: { lastSyncAt: expect.any(Date) },
      });
    });
  });

  describe("createAnalyticsSnapshot", () => {
    it("should create analytics snapshot for pool", async () => {
      vi.mocked(prisma.pool.findUnique).mockResolvedValue(fixtures.mockPool as any);
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.poolAnalytics.upsert).mockResolvedValue({} as any);

      const result = await poolsService.createAnalyticsSnapshot("pool-1");

      expect(prisma.poolAnalytics.upsert).toHaveBeenCalled();
      expect(result.id).toBe(fixtures.mockPool.id);
    });

    it("should throw 404 when pool not found", async () => {
      vi.mocked(prisma.pool.findUnique).mockResolvedValue(null);

      await expect(poolsService.createAnalyticsSnapshot("non-existent")).rejects.toThrow(
        "Pool not found"
      );
    });
  });
});
