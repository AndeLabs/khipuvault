import { describe, it, expect, beforeEach, vi } from "vitest";
import { PoolsService } from "../../services/pools";
import { AppError } from "../../middleware/error-handler";
import type {
  Pool,
  PoolAnalytics,
  Deposit,
  User,
  PoolType,
  DepositType,
  TransactionStatus,
} from "@prisma/client";

// Mock Prisma
vi.mock("@khipu/database", () => ({
  prisma: {
    pool: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    poolAnalytics: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    deposit: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@khipu/database";

describe("PoolsService", () => {
  let poolsService: PoolsService;

  beforeEach(() => {
    poolsService = new PoolsService();
    vi.clearAllMocks();
  });

  describe("getAllPools", () => {
    it("should return all active pools ordered by APR", async () => {
      const mockPools: Pool[] = [
        {
          id: "1",
          contractAddress: "0xpool1",
          poolType: "INDIVIDUAL" as PoolType,
          name: "High APR Pool",
          description: "Pool with high returns",
          tvl: "1000000000000000000",
          apr: 15.5,
          apy: 16.2,
          totalUsers: 100,
          totalDeposits: 150,
          totalWithdrawals: 50,
          status: "ACTIVE",
          isPaused: false,
          lastSyncAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          minDeposit: null,
          maxDeposit: null,
          depositFee: 0,
          withdrawFee: 0,
          lastYieldAt: null,
          version: "1.0.0",
        },
        {
          id: "2",
          contractAddress: "0xpool2",
          poolType: "COOPERATIVE" as PoolType,
          name: "Medium APR Pool",
          description: "Pool with medium returns",
          tvl: "500000000000000000",
          apr: 10.0,
          apy: 10.5,
          totalUsers: 50,
          totalDeposits: 75,
          totalWithdrawals: 25,
          status: "ACTIVE",
          isPaused: false,
          lastSyncAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          minDeposit: null,
          maxDeposit: null,
          depositFee: 0,
          withdrawFee: 0,
          lastYieldAt: null,
          version: "1.0.0",
        },
      ];

      vi.mocked(prisma.pool.findMany).mockResolvedValue(mockPools);

      const result = await poolsService.getAllPools();

      expect(result).toEqual(mockPools);
      expect(prisma.pool.findMany).toHaveBeenCalledWith({
        where: { status: "ACTIVE" },
        orderBy: { apr: "desc" },
        select: {
          id: true,
          contractAddress: true,
          poolType: true,
          name: true,
          description: true,
          tvl: true,
          apr: true,
          apy: true,
          totalUsers: true,
          totalDeposits: true,
          totalWithdrawals: true,
          status: true,
          lastSyncAt: true,
          createdAt: true,
        },
      });
    });

    it("should return empty array when no active pools exist", async () => {
      vi.mocked(prisma.pool.findMany).mockResolvedValue([]);

      const result = await poolsService.getAllPools();

      expect(result).toEqual([]);
    });
  });

  describe("getPoolById", () => {
    it("should return pool with analytics when pool exists", async () => {
      const mockPool: Pool & { analytics: PoolAnalytics[] } = {
        id: "1",
        contractAddress: "0xpool1",
        poolType: "INDIVIDUAL" as PoolType,
        name: "Test Pool",
        description: "A test pool",
        tvl: "1000000000000000000",
        apr: 12.0,
        apy: 12.5,
        totalUsers: 10,
        totalDeposits: 20,
        totalWithdrawals: 5,
        status: "ACTIVE",
        isPaused: false,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        minDeposit: null,
        maxDeposit: null,
        depositFee: 0,
        withdrawFee: 0,
        lastYieldAt: null,
        version: "1.0.0",
        analytics: [],
      };

      vi.mocked(prisma.pool.findUnique).mockResolvedValue(mockPool);

      const result = await poolsService.getPoolById("1");

      expect(result).toEqual(mockPool);
      expect(prisma.pool.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        include: {
          analytics: {
            orderBy: { timestamp: "desc" },
            take: 30,
          },
        },
      });
    });

    it("should throw AppError 404 when pool does not exist", async () => {
      vi.mocked(prisma.pool.findUnique).mockResolvedValue(null);

      await expect(poolsService.getPoolById("nonexistent")).rejects.toThrow(
        AppError,
      );
      await expect(poolsService.getPoolById("nonexistent")).rejects.toThrow(
        "Pool not found",
      );
    });
  });

  describe("getPoolByAddress", () => {
    it("should return pool by contract address with analytics", async () => {
      const mockPool: Pool & { analytics: PoolAnalytics[] } = {
        id: "1",
        contractAddress: "0xpool1",
        poolType: "INDIVIDUAL" as PoolType,
        name: "Test Pool",
        description: "A test pool",
        tvl: "1000000000000000000",
        apr: 12.0,
        apy: 12.5,
        totalUsers: 10,
        totalDeposits: 20,
        totalWithdrawals: 5,
        status: "ACTIVE",
        isPaused: false,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        minDeposit: null,
        maxDeposit: null,
        depositFee: 0,
        withdrawFee: 0,
        lastYieldAt: null,
        version: "1.0.0",
        analytics: [],
      };

      vi.mocked(prisma.pool.findUnique).mockResolvedValue(mockPool);

      const result = await poolsService.getPoolByAddress("0xPOOL1");

      expect(result).toEqual(mockPool);
      expect(prisma.pool.findUnique).toHaveBeenCalledWith({
        where: { contractAddress: "0xpool1" },
        include: {
          analytics: {
            orderBy: { timestamp: "desc" },
            take: 30,
          },
        },
      });
    });

    it("should convert address to lowercase before querying", async () => {
      const mockPool: Pool & { analytics: PoolAnalytics[] } = {
        id: "1",
        contractAddress: "0xabcdef",
        poolType: "INDIVIDUAL" as PoolType,
        name: "Test Pool",
        description: "A test pool",
        tvl: "1000000000000000000",
        apr: 12.0,
        apy: null,
        totalUsers: 10,
        totalDeposits: 20,
        totalWithdrawals: 5,
        status: "ACTIVE",
        isPaused: false,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        minDeposit: null,
        maxDeposit: null,
        depositFee: 0,
        withdrawFee: 0,
        lastYieldAt: null,
        version: "1.0.0",
        analytics: [],
      };

      vi.mocked(prisma.pool.findUnique).mockResolvedValue(mockPool);

      await poolsService.getPoolByAddress("0xABCDEF");

      expect(prisma.pool.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contractAddress: "0xabcdef" },
        }),
      );
    });

    it("should throw AppError 404 when pool not found", async () => {
      vi.mocked(prisma.pool.findUnique).mockResolvedValue(null);

      await expect(
        poolsService.getPoolByAddress("0xnonexistent"),
      ).rejects.toThrow(AppError);
    });
  });

  describe("getPoolAnalytics", () => {
    it("should return analytics for specified time period", async () => {
      const mockAnalytics: PoolAnalytics[] = [
        {
          id: "1",
          poolId: "pool1",
          timestamp: new Date(),
          date: new Date(),
          tvl: "1000000000000000000",
          apr: 12.0,
          apy: 12.5,
          totalDeposits: 20,
          totalWithdrawals: 5,
          totalUsers: 10,
          activeUsers: 8,
          volumeIn: "500000000000000000",
          volumeOut: "100000000000000000",
          netFlow: "400000000000000000",
          yieldGenerated: null,
          yieldDistributed: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.poolAnalytics.findMany).mockResolvedValue(mockAnalytics);

      const result = await poolsService.getPoolAnalytics("pool1", 30);

      expect(result).toEqual(mockAnalytics);
      expect(prisma.poolAnalytics.findMany).toHaveBeenCalledWith({
        where: {
          poolId: "pool1",
          timestamp: {
            gte: expect.any(Date),
          },
        },
        orderBy: { timestamp: "asc" },
      });
    });

    it("should use default 30 days when no period specified", async () => {
      vi.mocked(prisma.poolAnalytics.findMany).mockResolvedValue([]);

      await poolsService.getPoolAnalytics("pool1");

      expect(prisma.poolAnalytics.findMany).toHaveBeenCalled();
    });
  });

  describe("getPoolUsers", () => {
    it("should return users with positive balances sorted by balance", async () => {
      const mockDeposits: (Deposit & {
        user: Pick<User, "address" | "ensName" | "avatar">;
      })[] = [
        {
          id: "1",
          userId: "user1",
          userAddress: "0xuser1",
          poolType: "INDIVIDUAL" as PoolType,
          poolId: "pool1",
          poolAddress: "0xpool1",
          type: "DEPOSIT" as DepositType,
          amount: "2000000000000000000",
          txHash: "0xtx1",
          blockNumber: 1000,
          blockHash: "0xblock1",
          logIndex: 0,
          timestamp: new Date(),
          status: "CONFIRMED" as TransactionStatus,
          gasUsed: null,
          gasPrice: null,
          error: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            address: "0xuser1",
            ensName: "user1.eth",
            avatar: null,
          },
        },
        {
          id: "2",
          userId: "user1",
          userAddress: "0xuser1",
          poolType: "INDIVIDUAL" as PoolType,
          poolId: "pool1",
          poolAddress: "0xpool1",
          type: "WITHDRAW" as DepositType,
          amount: "500000000000000000",
          txHash: "0xtx2",
          blockNumber: 1001,
          blockHash: "0xblock2",
          logIndex: 0,
          timestamp: new Date(),
          status: "CONFIRMED" as TransactionStatus,
          gasUsed: null,
          gasPrice: null,
          error: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            address: "0xuser1",
            ensName: "user1.eth",
            avatar: null,
          },
        },
      ];

      vi.mocked(prisma.deposit.findMany).mockResolvedValue(mockDeposits);

      const result = await poolsService.getPoolUsers("0xPOOL1");

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe("0xuser1");
      expect(result[0].balance).toBe("1500000000000000000");
      expect(result[0].totalDeposited).toBe("2000000000000000000");
      expect(result[0].totalWithdrawn).toBe("500000000000000000");
    });

    it("should filter out users with zero balance", async () => {
      const mockDeposits: (Deposit & {
        user: Pick<User, "address" | "ensName" | "avatar">;
      })[] = [
        {
          id: "1",
          userId: "user1",
          userAddress: "0xuser1",
          poolType: "INDIVIDUAL" as PoolType,
          poolId: "pool1",
          poolAddress: "0xpool1",
          type: "DEPOSIT" as DepositType,
          amount: "1000000000000000000",
          txHash: "0xtx1",
          blockNumber: 1000,
          blockHash: "0xblock1",
          logIndex: 0,
          timestamp: new Date(),
          status: "CONFIRMED" as TransactionStatus,
          gasUsed: null,
          gasPrice: null,
          error: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            address: "0xuser1",
            ensName: null,
            avatar: null,
          },
        },
        {
          id: "2",
          userId: "user1",
          userAddress: "0xuser1",
          poolType: "INDIVIDUAL" as PoolType,
          poolId: "pool1",
          poolAddress: "0xpool1",
          type: "WITHDRAW" as DepositType,
          amount: "1000000000000000000",
          txHash: "0xtx2",
          blockNumber: 1001,
          blockHash: "0xblock2",
          logIndex: 0,
          timestamp: new Date(),
          status: "CONFIRMED" as TransactionStatus,
          gasUsed: null,
          gasPrice: null,
          error: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            address: "0xuser1",
            ensName: null,
            avatar: null,
          },
        },
      ];

      vi.mocked(prisma.deposit.findMany).mockResolvedValue(mockDeposits);

      const result = await poolsService.getPoolUsers("0xpool1");

      expect(result).toHaveLength(0);
    });

    it("should only count confirmed transactions", async () => {
      const mockDeposits: (Deposit & {
        user: Pick<User, "address" | "ensName" | "avatar">;
      })[] = [
        {
          id: "1",
          userId: "user1",
          userAddress: "0xuser1",
          poolType: "INDIVIDUAL" as PoolType,
          poolId: "pool1",
          poolAddress: "0xpool1",
          type: "DEPOSIT" as DepositType,
          amount: "1000000000000000000",
          txHash: "0xtx1",
          blockNumber: 1000,
          blockHash: "0xblock1",
          logIndex: 0,
          timestamp: new Date(),
          status: "CONFIRMED" as TransactionStatus,
          gasUsed: null,
          gasPrice: null,
          error: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            address: "0xuser1",
            ensName: null,
            avatar: null,
          },
        },
      ];

      vi.mocked(prisma.deposit.findMany).mockResolvedValue(mockDeposits);

      const result = await poolsService.getPoolUsers("0xpool1");

      expect(prisma.deposit.findMany).toHaveBeenCalledWith({
        where: {
          poolAddress: "0xpool1",
          status: "CONFIRMED",
        },
        include: {
          user: {
            select: {
              address: true,
              ensName: true,
              avatar: true,
            },
          },
        },
      });
    });
  });

  describe("updatePoolStats", () => {
    it("should update pool statistics based on confirmed deposits", async () => {
      const mockDeposits: Deposit[] = [
        {
          id: "1",
          userId: "user1",
          userAddress: "0xuser1",
          poolType: "INDIVIDUAL" as PoolType,
          poolId: "pool1",
          poolAddress: "0xpool1",
          type: "DEPOSIT" as DepositType,
          amount: "2000000000000000000",
          txHash: "0xtx1",
          blockNumber: 1000,
          blockHash: "0xblock1",
          logIndex: 0,
          timestamp: new Date(),
          status: "CONFIRMED" as TransactionStatus,
          gasUsed: null,
          gasPrice: null,
          error: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          userId: "user1",
          userAddress: "0xuser1",
          poolType: "INDIVIDUAL" as PoolType,
          poolId: "pool1",
          poolAddress: "0xpool1",
          type: "WITHDRAW" as DepositType,
          amount: "500000000000000000",
          txHash: "0xtx2",
          blockNumber: 1001,
          blockHash: "0xblock2",
          logIndex: 0,
          timestamp: new Date(),
          status: "CONFIRMED" as TransactionStatus,
          gasUsed: null,
          gasPrice: null,
          error: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockUpdatedPool: Pool = {
        id: "1",
        contractAddress: "0xpool1",
        poolType: "INDIVIDUAL" as PoolType,
        name: "Test Pool",
        description: "A test pool",
        tvl: "1500000000000000000",
        apr: 12.0,
        apy: 12.5,
        totalUsers: 1,
        totalDeposits: 1,
        totalWithdrawals: 1,
        status: "ACTIVE",
        isPaused: false,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        minDeposit: null,
        maxDeposit: null,
        depositFee: 0,
        withdrawFee: 0,
        lastYieldAt: null,
        version: "1.0.0",
      };

      vi.mocked(prisma.deposit.findMany).mockResolvedValue(mockDeposits);
      vi.mocked(prisma.pool.update).mockResolvedValue(mockUpdatedPool);

      const result = await poolsService.updatePoolStats("0xPOOL1");

      expect(result.tvl).toBe("1500000000000000000");
      expect(result.totalUsers).toBe(1);
      expect(result.totalDeposits).toBe(1);
      expect(result.totalWithdrawals).toBe(1);
    });

    it("should ignore pending transactions", async () => {
      const mockDeposits: Deposit[] = [
        {
          id: "1",
          userId: "user1",
          userAddress: "0xuser1",
          poolType: "INDIVIDUAL" as PoolType,
          poolId: "pool1",
          poolAddress: "0xpool1",
          type: "DEPOSIT" as DepositType,
          amount: "1000000000000000000",
          txHash: "0xtx1",
          blockNumber: 1000,
          blockHash: "0xblock1",
          logIndex: 0,
          timestamp: new Date(),
          status: "PENDING" as TransactionStatus,
          gasUsed: null,
          gasPrice: null,
          error: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockUpdatedPool: Pool = {
        id: "1",
        contractAddress: "0xpool1",
        poolType: "INDIVIDUAL" as PoolType,
        name: "Test Pool",
        description: "A test pool",
        tvl: "0",
        apr: 12.0,
        apy: 12.5,
        totalUsers: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        status: "ACTIVE",
        isPaused: false,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        minDeposit: null,
        maxDeposit: null,
        depositFee: 0,
        withdrawFee: 0,
        lastYieldAt: null,
        version: "1.0.0",
      };

      vi.mocked(prisma.deposit.findMany).mockResolvedValue(mockDeposits);
      vi.mocked(prisma.pool.update).mockResolvedValue(mockUpdatedPool);

      const result = await poolsService.updatePoolStats("0xpool1");

      expect(result.tvl).toBe("0");
      expect(result.totalDeposits).toBe(0);
    });
  });

  describe("createAnalyticsSnapshot", () => {
    it("should create analytics snapshot for existing pool", async () => {
      const mockPool: Pool = {
        id: "1",
        contractAddress: "0xpool1",
        poolType: "INDIVIDUAL" as PoolType,
        name: "Test Pool",
        description: "A test pool",
        tvl: "1000000000000000000",
        apr: 12.0,
        apy: 12.5,
        totalUsers: 10,
        totalDeposits: 20,
        totalWithdrawals: 5,
        status: "ACTIVE",
        isPaused: false,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        minDeposit: null,
        maxDeposit: null,
        depositFee: 0,
        withdrawFee: 0,
        lastYieldAt: null,
        version: "1.0.0",
      };

      vi.mocked(prisma.pool.findUnique).mockResolvedValue(mockPool);
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.poolAnalytics.upsert).mockResolvedValue({} as any);

      const result = await poolsService.createAnalyticsSnapshot("1");

      expect(result).toEqual(mockPool);
      expect(prisma.poolAnalytics.upsert).toHaveBeenCalled();
    });

    it("should throw AppError 404 when pool does not exist", async () => {
      vi.mocked(prisma.pool.findUnique).mockResolvedValue(null);

      await expect(
        poolsService.createAnalyticsSnapshot("nonexistent"),
      ).rejects.toThrow(AppError);
      await expect(
        poolsService.createAnalyticsSnapshot("nonexistent"),
      ).rejects.toThrow("Pool not found");
    });

    it("should calculate volume from recent deposits", async () => {
      const mockPool: Pool = {
        id: "1",
        contractAddress: "0xpool1",
        poolType: "INDIVIDUAL" as PoolType,
        name: "Test Pool",
        description: "A test pool",
        tvl: "1000000000000000000",
        apr: 12.0,
        apy: 12.5,
        totalUsers: 10,
        totalDeposits: 20,
        totalWithdrawals: 5,
        status: "ACTIVE",
        isPaused: false,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        minDeposit: null,
        maxDeposit: null,
        depositFee: 0,
        withdrawFee: 0,
        lastYieldAt: null,
        version: "1.0.0",
      };

      const mockDeposits: Deposit[] = [
        {
          id: "1",
          userId: "user1",
          userAddress: "0xuser1",
          poolType: "INDIVIDUAL" as PoolType,
          poolId: "pool1",
          poolAddress: "0xpool1",
          type: "DEPOSIT" as DepositType,
          amount: "1000000000000000000",
          txHash: "0xtx1",
          blockNumber: 1000,
          blockHash: "0xblock1",
          logIndex: 0,
          timestamp: new Date(),
          status: "CONFIRMED" as TransactionStatus,
          gasUsed: null,
          gasPrice: null,
          error: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.pool.findUnique).mockResolvedValue(mockPool);
      vi.mocked(prisma.deposit.findMany).mockResolvedValue(mockDeposits);
      vi.mocked(prisma.poolAnalytics.upsert).mockResolvedValue({} as any);

      await poolsService.createAnalyticsSnapshot("1");

      expect(prisma.poolAnalytics.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            volumeIn: "1000000000000000000",
            volumeOut: "0",
          }),
        }),
      );
    });
  });
});
