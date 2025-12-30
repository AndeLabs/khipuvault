/**
 * @fileoverview Transactions service tests
 * @module __tests__/services/transactions.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@khipu/database";

import { TransactionsService } from "../../services/transactions";
import { fixtures } from "../setup";

describe("TransactionsService", () => {
  let transactionsService: TransactionsService;

  beforeEach(() => {
    transactionsService = new TransactionsService();
    vi.clearAllMocks();
  });

  describe("getTransactionByHash", () => {
    it("should return transaction for valid hash", async () => {
      vi.mocked(prisma.deposit.findUnique).mockResolvedValue(
        fixtures.mockDeposit as any,
      );

      const result = await transactionsService.getTransactionByHash("0xTx123");

      expect(prisma.deposit.findUnique).toHaveBeenCalledWith({
        where: { txHash: "0xtx123" }, // lowercased
      });
      expect(result.txHash).toBe(fixtures.mockDeposit.txHash);
    });

    it("should throw 404 when transaction not found", async () => {
      vi.mocked(prisma.deposit.findUnique).mockResolvedValue(null);

      await expect(
        transactionsService.getTransactionByHash("0xnonexistent"),
      ).rejects.toThrow("Transaction not found");
    });

    it("should normalize hash to lowercase", async () => {
      vi.mocked(prisma.deposit.findUnique).mockResolvedValue(
        fixtures.mockDeposit as any,
      );

      await transactionsService.getTransactionByHash("0xABCDEF123456");

      expect(prisma.deposit.findUnique).toHaveBeenCalledWith({
        where: { txHash: "0xabcdef123456" },
      });
    });
  });

  describe("getRecentTransactions", () => {
    it("should return paginated transactions", async () => {
      const mockTransactions = [fixtures.mockDeposit];
      vi.mocked(prisma.deposit.findMany).mockResolvedValue(
        mockTransactions as any,
      );
      vi.mocked(prisma.deposit.count).mockResolvedValue(100);

      const result = await transactionsService.getRecentTransactions(50, 0);

      expect(prisma.deposit.findMany).toHaveBeenCalledWith({
        orderBy: { timestamp: "desc" },
        take: 50,
        skip: 0,
      });
      expect(result.transactions).toHaveLength(1);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.hasMore).toBe(true);
    });

    it("should use default pagination values", async () => {
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.deposit.count).mockResolvedValue(0);

      await transactionsService.getRecentTransactions();

      expect(prisma.deposit.findMany).toHaveBeenCalledWith({
        orderBy: { timestamp: "desc" },
        take: 50,
        skip: 0,
      });
    });

    it("should indicate no more pages when at end", async () => {
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([
        fixtures.mockDeposit,
      ] as any);
      vi.mocked(prisma.deposit.count).mockResolvedValue(10);

      const result = await transactionsService.getRecentTransactions(50, 0);

      expect(result.pagination.hasMore).toBe(false);
    });
  });

  describe("getTransactionsByPool", () => {
    it("should return transactions for specific pool", async () => {
      const mockTransactions = [fixtures.mockDeposit];
      vi.mocked(prisma.deposit.findMany).mockResolvedValue(
        mockTransactions as any,
      );
      vi.mocked(prisma.deposit.count).mockResolvedValue(50);

      const result = await transactionsService.getTransactionsByPool(
        "0xPool123",
        20,
        0,
      );

      expect(prisma.deposit.findMany).toHaveBeenCalledWith({
        where: { poolAddress: "0xpool123" },
        orderBy: { timestamp: "desc" },
        take: 20,
        skip: 0,
      });
      expect(result.transactions).toHaveLength(1);
      expect(result.pagination.total).toBe(50);
    });

    it("should normalize pool address to lowercase", async () => {
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.deposit.count).mockResolvedValue(0);

      await transactionsService.getTransactionsByPool("0xABCDEF");

      expect(prisma.deposit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { poolAddress: "0xabcdef" },
        }),
      );
    });

    it("should calculate hasMore correctly", async () => {
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([
        fixtures.mockDeposit,
      ] as any);
      vi.mocked(prisma.deposit.count).mockResolvedValue(100);

      const result = await transactionsService.getTransactionsByPool(
        "0xPool123",
        50,
        40,
      );

      expect(result.pagination.hasMore).toBe(true); // 40 + 50 < 100
    });
  });

  describe("getTransactionStats", () => {
    it("should return aggregated transaction stats", async () => {
      const mockStats = [
        { type: "DEPOSIT", count: BigInt(100), volume: "1000000000000000000" },
        { type: "WITHDRAW", count: BigInt(20), volume: "200000000000000000" },
        { type: "YIELD_CLAIM", count: BigInt(10), volume: "50000000000000000" },
      ];

      vi.mocked(prisma.$queryRaw).mockResolvedValue(mockStats);
      vi.mocked(prisma.deposit.count).mockResolvedValue(130);

      const result = await transactionsService.getTransactionStats();

      expect(result.totalTransactions).toBe(130);
      expect(result.totalDeposits).toBe(100);
      expect(result.totalWithdrawals).toBe(20);
      expect(result.totalYieldClaims).toBe(10);
      expect(result.totalVolumeDeposit).toBe("1000000000000000000");
      expect(result.totalVolumeWithdraw).toBe("200000000000000000");
    });

    it("should handle empty results", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]);
      vi.mocked(prisma.deposit.count).mockResolvedValue(0);

      const result = await transactionsService.getTransactionStats();

      expect(result.totalTransactions).toBe(0);
      expect(result.totalDeposits).toBe(0);
      expect(result.totalWithdrawals).toBe(0);
      expect(result.totalYieldClaims).toBe(0);
      expect(result.totalVolumeDeposit).toBe("0");
      expect(result.totalVolumeWithdraw).toBe("0");
    });
  });
});
