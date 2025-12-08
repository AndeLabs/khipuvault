import { describe, it, expect, beforeEach, vi } from "vitest";
import { AnalyticsService } from "../../services/analytics";
import type {
  User,
  Pool,
  Deposit,
  EventLog,
  PoolType,
  DepositType,
  TransactionStatus,
} from "@prisma/client";

// Mock Prisma
vi.mock("@khipu/database", () => ({
  prisma: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    pool: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    deposit: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    eventLog: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@khipu/database";

describe("AnalyticsService", () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    vi.clearAllMocks();
  });

  describe("getGlobalStats", () => {
    it("should return comprehensive global statistics", async () => {
      const mockPools: Pool[] = [
        {
          id: "1",
          contractAddress: "0xpool1",
          poolType: "INDIVIDUAL" as PoolType,
          name: "Pool 1",
          description: "Test pool 1",
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
        },
        {
          id: "2",
          contractAddress: "0xpool2",
          poolType: "COOPERATIVE" as PoolType,
          name: "Pool 2",
          description: "Test pool 2",
          tvl: "2000000000000000000",
          apr: 15.0,
          apy: 16.0,
          totalUsers: 20,
          totalDeposits: 40,
          totalWithdrawals: 10,
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

      vi.mocked(prisma.user.count).mockResolvedValue(100);
      vi.mocked(prisma.pool.count).mockResolvedValue(2);
      vi.mocked(prisma.deposit.count).mockResolvedValue(500);
      vi.mocked(prisma.pool.findMany).mockResolvedValue(mockPools);

      const result = await analyticsService.getGlobalStats();

      expect(result).toEqual({
        totalUsers: 100,
        activePools: 2,
        totalTransactions: 500,
        totalTVL: "3000000000000000000",
        avgAPR: "13.50",
      });
    });

    it("should handle zero pools gracefully", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(0);
      vi.mocked(prisma.pool.count).mockResolvedValue(0);
      vi.mocked(prisma.deposit.count).mockResolvedValue(0);
      vi.mocked(prisma.pool.findMany).mockResolvedValue([]);

      const result = await analyticsService.getGlobalStats();

      expect(result).toEqual({
        totalUsers: 0,
        activePools: 0,
        totalTransactions: 0,
        totalTVL: "0",
        avgAPR: "0.00",
      });
    });

    it("should only count active pools", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(10);
      vi.mocked(prisma.pool.count).mockResolvedValue(5);
      vi.mocked(prisma.deposit.count).mockResolvedValue(50);
      vi.mocked(prisma.pool.findMany).mockResolvedValue([]);

      await analyticsService.getGlobalStats();

      expect(prisma.pool.count).toHaveBeenCalledWith({
        where: { status: "ACTIVE" },
      });
      expect(prisma.pool.findMany).toHaveBeenCalledWith({
        where: { status: "ACTIVE" },
      });
    });

    it("should calculate average APR correctly", async () => {
      const mockPools: Pool[] = [
        {
          id: "1",
          contractAddress: "0xpool1",
          poolType: "INDIVIDUAL" as PoolType,
          name: "Pool 1",
          description: null,
          tvl: "1000000000000000000",
          apr: 10.0,
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
        },
        {
          id: "2",
          contractAddress: "0xpool2",
          poolType: "COOPERATIVE" as PoolType,
          name: "Pool 2",
          description: null,
          tvl: "1000000000000000000",
          apr: 20.0,
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
        },
      ];

      vi.mocked(prisma.user.count).mockResolvedValue(10);
      vi.mocked(prisma.pool.count).mockResolvedValue(2);
      vi.mocked(prisma.deposit.count).mockResolvedValue(50);
      vi.mocked(prisma.pool.findMany).mockResolvedValue(mockPools);

      const result = await analyticsService.getGlobalStats();

      expect(result.avgAPR).toBe("15.00");
    });
  });

  describe("getActivityTimeline", () => {
    it("should group transactions by day", async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

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
          timestamp: today,
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
          userId: "user2",
          userAddress: "0xuser2",
          poolType: "INDIVIDUAL" as PoolType,
          poolId: "pool1",
          poolAddress: "0xpool1",
          type: "WITHDRAW" as DepositType,
          amount: "500000000000000000",
          txHash: "0xtx2",
          blockNumber: 1001,
          blockHash: "0xblock2",
          logIndex: 0,
          timestamp: today,
          status: "CONFIRMED" as TransactionStatus,
          gasUsed: null,
          gasPrice: null,
          error: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.deposit.findMany).mockResolvedValue(mockDeposits);

      const result = await analyticsService.getActivityTimeline(30);

      expect(result).toHaveLength(1);
      expect(result[0].deposits).toBe(1);
      expect(result[0].withdrawals).toBe(1);
      expect(result[0].volume).toBe("1500000000000000000");
    });

    it("should use default 30 days when no period specified", async () => {
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([]);

      await analyticsService.getActivityTimeline();

      const callArgs = vi.mocked(prisma.deposit.findMany).mock.calls[0][0];
      const startDate = callArgs?.where?.timestamp?.gte as Date;
      const now = new Date();
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 30);

      expect(startDate).toBeDefined();
      expect(
        Math.abs(startDate.getTime() - expectedDate.getTime()),
      ).toBeLessThan(1000);
    });

    it("should return empty array when no transactions exist", async () => {
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([]);

      const result = await analyticsService.getActivityTimeline(7);

      expect(result).toEqual([]);
    });
  });

  describe("getTopPools", () => {
    it("should return pools ordered by TVL descending", async () => {
      const mockPools: Pool[] = [
        {
          id: "1",
          contractAddress: "0xpool1",
          poolType: "INDIVIDUAL" as PoolType,
          name: "High TVL Pool",
          description: "Pool with highest TVL",
          tvl: "5000000000000000000",
          apr: 12.0,
          apy: 12.5,
          totalUsers: 100,
          totalDeposits: 200,
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
          name: "Medium TVL Pool",
          description: "Pool with medium TVL",
          tvl: "2000000000000000000",
          apr: 15.0,
          apy: 16.0,
          totalUsers: 50,
          totalDeposits: 100,
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

      const result = await analyticsService.getTopPools(10);

      expect(result).toEqual(mockPools);
      expect(prisma.pool.findMany).toHaveBeenCalledWith({
        where: { status: "ACTIVE" },
        orderBy: { tvl: "desc" },
        take: 10,
      });
    });

    it("should use default limit of 10", async () => {
      vi.mocked(prisma.pool.findMany).mockResolvedValue([]);

      await analyticsService.getTopPools();

      expect(prisma.pool.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });

    it("should only return active pools", async () => {
      vi.mocked(prisma.pool.findMany).mockResolvedValue([]);

      await analyticsService.getTopPools(5);

      expect(prisma.pool.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "ACTIVE" },
        }),
      );
    });
  });

  describe("getTopUsers", () => {
    it("should return users sorted by current balance", async () => {
      const mockUsers: (User & { deposits: Deposit[] })[] = [
        {
          id: "user1",
          address: "0xuser1",
          ensName: "user1.eth",
          avatar: null,
          createdAt: new Date(),
          lastActiveAt: new Date(),
          deposits: [
            {
              id: "1",
              userId: "user1",
              userAddress: "0xuser1",
              poolType: "INDIVIDUAL" as PoolType,
              poolId: "pool1",
              poolAddress: "0xpool1",
              type: "DEPOSIT" as DepositType,
              amount: "3000000000000000000",
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
          ],
        },
        {
          id: "user2",
          address: "0xuser2",
          ensName: "user2.eth",
          avatar: null,
          createdAt: new Date(),
          lastActiveAt: new Date(),
          deposits: [
            {
              id: "2",
              userId: "user2",
              userAddress: "0xuser2",
              poolType: "INDIVIDUAL" as PoolType,
              poolId: "pool1",
              poolAddress: "0xpool1",
              type: "DEPOSIT" as DepositType,
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
            },
          ],
        },
      ];

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers);

      const result = await analyticsService.getTopUsers(10);

      expect(result).toHaveLength(2);
      expect(result[0].address).toBe("0xuser1");
      expect(result[0].currentBalance).toBe("3000000000000000000");
      expect(result[1].address).toBe("0xuser2");
      expect(result[1].currentBalance).toBe("1000000000000000000");
    });

    it("should filter out users with zero balance", async () => {
      const mockUsers: (User & { deposits: Deposit[] })[] = [
        {
          id: "user1",
          address: "0xuser1",
          ensName: null,
          avatar: null,
          createdAt: new Date(),
          lastActiveAt: new Date(),
          deposits: [
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
            },
          ],
        },
      ];

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers);

      const result = await analyticsService.getTopUsers(10);

      expect(result).toHaveLength(0);
    });

    it("should use default limit of 10", async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      await analyticsService.getTopUsers();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        include: {
          deposits: true,
        },
      });
    });
  });

  describe("getEventLogs", () => {
    it("should return paginated event logs", async () => {
      const mockLogs: EventLog[] = [
        {
          id: "1",
          contractAddress: "0xcontract1",
          eventName: "Deposit",
          txHash: "0xtx1",
          blockNumber: 1000,
          blockHash: "0xblock1",
          logIndex: 0,
          transactionIndex: 0,
          args: { user: "0xuser1", amount: "1000000000000000000" },
          timestamp: new Date(),
          processed: true,
          removed: false,
          confirmedAt: 1012,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.eventLog.findMany).mockResolvedValue(mockLogs);
      vi.mocked(prisma.eventLog.count).mockResolvedValue(1);

      const result = await analyticsService.getEventLogs(100, 0);

      expect(result.logs).toEqual(mockLogs);
      expect(result.pagination).toEqual({
        total: 1,
        limit: 100,
        offset: 0,
        hasMore: false,
      });
    });

    it("should use default limit and offset values", async () => {
      vi.mocked(prisma.eventLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.eventLog.count).mockResolvedValue(0);

      await analyticsService.getEventLogs();

      expect(prisma.eventLog.findMany).toHaveBeenCalledWith({
        orderBy: { timestamp: "desc" },
        take: 100,
        skip: 0,
      });
    });

    it("should indicate hasMore when there are more logs", async () => {
      vi.mocked(prisma.eventLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.eventLog.count).mockResolvedValue(200);

      const result = await analyticsService.getEventLogs(100, 0);

      expect(result.pagination.hasMore).toBe(true);
    });
  });
});
