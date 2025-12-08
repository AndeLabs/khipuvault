import { describe, it, expect, beforeEach, vi } from "vitest";
import { TransactionsService } from "../../services/transactions";
import { AppError } from "../../middleware/error-handler";
import type {
  Deposit,
  DepositType,
  TransactionStatus,
  PoolType,
} from "@prisma/client";

// Mock Prisma
vi.mock("@khipu/database", () => ({
  prisma: {
    deposit: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@khipu/database";

describe("TransactionsService", () => {
  let transactionsService: TransactionsService;

  beforeEach(() => {
    transactionsService = new TransactionsService();
    vi.clearAllMocks();
  });

  describe("getTransactionByHash", () => {
    it("should return transaction when hash exists", async () => {
      const mockTransaction: Deposit = {
        id: "1",
        userId: "user1",
        userAddress: "0xuser1",
        poolType: "INDIVIDUAL" as PoolType,
        poolId: "pool1",
        poolAddress: "0xpool1",
        type: "DEPOSIT" as DepositType,
        amount: "1000000000000000000",
        txHash: "0xabc123",
        blockNumber: 12345,
        blockHash: "0xblock123",
        logIndex: 0,
        timestamp: new Date(),
        status: "CONFIRMED" as TransactionStatus,
        gasUsed: "21000",
        gasPrice: "20000000000",
        error: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.deposit.findUnique).mockResolvedValue(mockTransaction);

      const result = await transactionsService.getTransactionByHash("0xABC123");

      expect(result).toEqual(mockTransaction);
      expect(prisma.deposit.findUnique).toHaveBeenCalledWith({
        where: { txHash: "0xabc123" },
      });
    });

    it("should convert hash to lowercase before querying", async () => {
      const mockTransaction: Deposit = {
        id: "1",
        userId: "user1",
        userAddress: "0xuser1",
        poolType: "INDIVIDUAL" as PoolType,
        poolId: "pool1",
        poolAddress: "0xpool1",
        type: "DEPOSIT" as DepositType,
        amount: "1000000000000000000",
        txHash: "0xabcdef",
        blockNumber: 12345,
        blockHash: "0xblock123",
        logIndex: 0,
        timestamp: new Date(),
        status: "CONFIRMED" as TransactionStatus,
        gasUsed: null,
        gasPrice: null,
        error: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.deposit.findUnique).mockResolvedValue(mockTransaction);

      await transactionsService.getTransactionByHash("0xABCDEF");

      expect(prisma.deposit.findUnique).toHaveBeenCalledWith({
        where: { txHash: "0xabcdef" },
      });
    });

    it("should throw AppError 404 when transaction does not exist", async () => {
      vi.mocked(prisma.deposit.findUnique).mockResolvedValue(null);

      await expect(
        transactionsService.getTransactionByHash("0xnonexistent"),
      ).rejects.toThrow(AppError);

      await expect(
        transactionsService.getTransactionByHash("0xnonexistent"),
      ).rejects.toThrow("Transaction not found");
    });
  });

  describe("getRecentTransactions", () => {
    it("should return paginated transactions with correct metadata", async () => {
      const mockTransactions: Deposit[] = [
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
          blockNumber: 12345,
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
          userId: "user2",
          userAddress: "0xuser2",
          poolType: "COOPERATIVE" as PoolType,
          poolId: "pool2",
          poolAddress: "0xpool2",
          type: "WITHDRAW" as DepositType,
          amount: "500000000000000000",
          txHash: "0xtx2",
          blockNumber: 12346,
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

      vi.mocked(prisma.deposit.findMany).mockResolvedValue(mockTransactions);
      vi.mocked(prisma.deposit.count).mockResolvedValue(100);

      const result = await transactionsService.getRecentTransactions(10, 0);

      expect(result.transactions).toEqual(mockTransactions);
      expect(result.pagination).toEqual({
        total: 100,
        limit: 10,
        offset: 0,
        hasMore: true,
      });
    });

    it("should use default limit and offset values", async () => {
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.deposit.count).mockResolvedValue(0);

      await transactionsService.getRecentTransactions();

      expect(prisma.deposit.findMany).toHaveBeenCalledWith({
        orderBy: { timestamp: "desc" },
        take: 50,
        skip: 0,
      });
    });

    it("should indicate hasMore is false when at end of results", async () => {
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.deposit.count).mockResolvedValue(10);

      const result = await transactionsService.getRecentTransactions(10, 0);

      expect(result.pagination.hasMore).toBe(false);
    });

    it("should order transactions by timestamp descending", async () => {
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.deposit.count).mockResolvedValue(0);

      await transactionsService.getRecentTransactions(20, 10);

      expect(prisma.deposit.findMany).toHaveBeenCalledWith({
        orderBy: { timestamp: "desc" },
        take: 20,
        skip: 10,
      });
    });
  });

  describe("getTransactionsByPool", () => {
    it("should return transactions filtered by pool address", async () => {
      const mockTransactions: Deposit[] = [
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
          blockNumber: 12345,
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

      vi.mocked(prisma.deposit.findMany).mockResolvedValue(mockTransactions);
      vi.mocked(prisma.deposit.count).mockResolvedValue(1);

      const result = await transactionsService.getTransactionsByPool(
        "0xPOOL1",
        10,
        0,
      );

      expect(result.transactions).toEqual(mockTransactions);
      expect(result.pagination).toEqual({
        total: 1,
        limit: 10,
        offset: 0,
        hasMore: false,
      });
    });

    it("should convert pool address to lowercase before querying", async () => {
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.deposit.count).mockResolvedValue(0);

      await transactionsService.getTransactionsByPool("0xABCDEF", 10, 0);

      expect(prisma.deposit.findMany).toHaveBeenCalledWith({
        where: {
          poolAddress: "0xabcdef",
        },
        orderBy: { timestamp: "desc" },
        take: 10,
        skip: 0,
      });

      expect(prisma.deposit.count).toHaveBeenCalledWith({
        where: {
          poolAddress: "0xabcdef",
        },
      });
    });

    it("should use default limit and offset values", async () => {
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.deposit.count).mockResolvedValue(0);

      await transactionsService.getTransactionsByPool("0xpool1");

      expect(prisma.deposit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0,
        }),
      );
    });
  });

  describe("getTransactionStats", () => {
    it("should return comprehensive transaction statistics", async () => {
      const mockDepositData: Pick<Deposit, "amount">[] = [
        { amount: "1000000000000000000" },
        { amount: "2000000000000000000" },
      ];

      const mockWithdrawalData: Pick<Deposit, "amount">[] = [
        { amount: "500000000000000000" },
      ];

      vi.mocked(prisma.deposit.count)
        .mockResolvedValueOnce(100) // total transactions
        .mockResolvedValueOnce(60) // total deposits
        .mockResolvedValueOnce(30) // total withdrawals
        .mockResolvedValueOnce(10); // total yield claims

      vi.mocked(prisma.deposit.findMany)
        .mockResolvedValueOnce(mockDepositData as any)
        .mockResolvedValueOnce(mockWithdrawalData as any);

      const result = await transactionsService.getTransactionStats();

      expect(result).toEqual({
        totalTransactions: 100,
        totalDeposits: 60,
        totalWithdrawals: 30,
        totalYieldClaims: 10,
        totalVolumeDeposit: "3000000000000000000",
        totalVolumeWithdraw: "500000000000000000",
      });
    });

    it("should handle empty transaction list", async () => {
      vi.mocked(prisma.deposit.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.deposit.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await transactionsService.getTransactionStats();

      expect(result).toEqual({
        totalTransactions: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalYieldClaims: 0,
        totalVolumeDeposit: "0",
        totalVolumeWithdraw: "0",
      });
    });

    it("should calculate volumes correctly using BigInt", async () => {
      const mockDepositData: Pick<Deposit, "amount">[] = [
        { amount: "1000000000000000000" },
        { amount: "1000000000000000000" },
        { amount: "1000000000000000000" },
      ];

      const mockWithdrawalData: Pick<Deposit, "amount">[] = [
        { amount: "500000000000000000" },
        { amount: "500000000000000000" },
      ];

      vi.mocked(prisma.deposit.count)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.deposit.findMany)
        .mockResolvedValueOnce(mockDepositData as any)
        .mockResolvedValueOnce(mockWithdrawalData as any);

      const result = await transactionsService.getTransactionStats();

      expect(result.totalVolumeDeposit).toBe("3000000000000000000");
      expect(result.totalVolumeWithdraw).toBe("1000000000000000000");
    });
  });
});
