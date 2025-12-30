/**
 * @fileoverview Users service tests
 * @module __tests__/services/users.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@khipu/database";

import { UsersService } from "../../services/users";
import { fixtures } from "../setup";

describe("UsersService", () => {
  let usersService: UsersService;

  beforeEach(() => {
    usersService = new UsersService();
    vi.clearAllMocks();
  });

  describe("getUserByAddress", () => {
    it("should return user with deposits for valid address", async () => {
      const mockUserWithDeposits = {
        ...fixtures.mockUser,
        deposits: [fixtures.mockDeposit],
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(
        mockUserWithDeposits as any,
      );

      const result = await usersService.getUserByAddress(fixtures.validAddress);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { address: fixtures.validAddressLower },
        include: {
          deposits: {
            orderBy: { timestamp: "desc" },
            take: 10,
          },
        },
      });
      expect(result.address).toBe(fixtures.mockUser.address);
      expect(result.deposits).toHaveLength(1);
    });

    it("should throw 404 error when user not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        usersService.getUserByAddress(fixtures.validAddress),
      ).rejects.toThrow("User not found");
    });

    it("should throw 400 error for invalid address format", async () => {
      await expect(
        usersService.getUserByAddress(fixtures.invalidAddress),
      ).rejects.toThrow("Invalid Ethereum address format");
    });

    it("should normalize address to lowercase", async () => {
      const mockUser = { ...fixtures.mockUser, deposits: [] };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      // Use mixed case address (0x prefix stays lowercase as per Ethereum convention)
      const mixedCaseAddress = "0x742D35CC6634C0532925A3B844BC9E7595F3A123";
      await usersService.getUserByAddress(mixedCaseAddress);

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { address: fixtures.validAddressLower },
        }),
      );
    });
  });

  describe("getUserPortfolio", () => {
    it("should return portfolio with aggregated data", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(
        fixtures.mockUser as any,
      );
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ total: "1000000000000000000" }]) // deposits
        .mockResolvedValueOnce([{ total: "500000000000000000" }]) // withdrawals
        .mockResolvedValueOnce([{ total: "100000000000000000" }]); // yield claims
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([
        fixtures.mockDeposit,
      ] as any);
      vi.mocked(prisma.pool.findMany).mockResolvedValue([
        fixtures.mockPool,
      ] as any);

      const result = await usersService.getUserPortfolio(fixtures.validAddress);

      expect(result.address).toBe(fixtures.mockUser.address);
      expect(result.portfolio.totalDeposited).toBe("1000000000000000000");
      expect(result.portfolio.totalWithdrawn).toBe("500000000000000000");
      expect(result.portfolio.totalYieldClaimed).toBe("100000000000000000");
      expect(result.portfolio.currentBalance).toBe("500000000000000000");
    });

    it("should throw 404 when user not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        usersService.getUserPortfolio(fixtures.validAddress),
      ).rejects.toThrow("User not found");
    });
  });

  describe("getUserPositions", () => {
    it("should return user positions grouped by pool", async () => {
      const deposits = [
        { ...fixtures.mockDeposit, type: "DEPOSIT", amount: "1000" },
        { ...fixtures.mockDeposit, type: "WITHDRAW", amount: "200" },
      ];

      vi.mocked(prisma.deposit.findMany).mockResolvedValue(deposits as any);
      vi.mocked(prisma.pool.findMany).mockResolvedValue([
        fixtures.mockPool,
      ] as any);

      const result = await usersService.getUserPositions(fixtures.validAddress);

      expect(Array.isArray(result)).toBe(true);
      expect(prisma.deposit.findMany).toHaveBeenCalled();
    });

    it("should filter out positions with zero balance", async () => {
      const deposits = [
        { ...fixtures.mockDeposit, type: "DEPOSIT", amount: "1000" },
        { ...fixtures.mockDeposit, type: "WITHDRAW", amount: "1000" },
      ];

      vi.mocked(prisma.deposit.findMany).mockResolvedValue(deposits as any);
      vi.mocked(prisma.pool.findMany).mockResolvedValue([
        fixtures.mockPool,
      ] as any);

      const result = await usersService.getUserPositions(fixtures.validAddress);

      expect(result).toHaveLength(0);
    });
  });

  describe("getUserTransactions", () => {
    it("should return paginated transactions", async () => {
      const mockTransactions = [fixtures.mockDeposit];
      vi.mocked(prisma.deposit.findMany).mockResolvedValue(
        mockTransactions as any,
      );
      vi.mocked(prisma.deposit.count).mockResolvedValue(100);

      const result = await usersService.getUserTransactions(
        fixtures.validAddress,
        50,
        0,
      );

      expect(result.transactions).toHaveLength(1);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.limit).toBe(50);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.hasMore).toBe(true);
    });

    it("should indicate no more pages when at end", async () => {
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([
        fixtures.mockDeposit,
      ] as any);
      vi.mocked(prisma.deposit.count).mockResolvedValue(10);

      const result = await usersService.getUserTransactions(
        fixtures.validAddress,
        50,
        0,
      );

      expect(result.pagination.hasMore).toBe(false);
    });

    it("should use default pagination values", async () => {
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.deposit.count).mockResolvedValue(0);

      await usersService.getUserTransactions(fixtures.validAddress);

      expect(prisma.deposit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0,
        }),
      );
    });
  });

  describe("createOrUpdateUser", () => {
    it("should create new user if not exists", async () => {
      const newUser = { ...fixtures.mockUser };
      vi.mocked(prisma.user.upsert).mockResolvedValue(newUser as any);

      const result = await usersService.createOrUpdateUser(
        fixtures.validAddress,
      );

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { address: fixtures.validAddressLower },
        update: expect.objectContaining({
          lastActiveAt: expect.any(Date),
        }),
        create: {
          address: fixtures.validAddressLower,
        },
      });
      expect(result.address).toBe(fixtures.mockUser.address);
    });

    it("should update existing user with ENS name", async () => {
      const updatedUser = { ...fixtures.mockUser, ensName: "newname.eth" };
      vi.mocked(prisma.user.upsert).mockResolvedValue(updatedUser as any);

      const result = await usersService.createOrUpdateUser(
        fixtures.validAddress,
        {
          ensName: "newname.eth",
        },
      );

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { address: fixtures.validAddressLower },
        update: expect.objectContaining({
          ensName: "newname.eth",
          lastActiveAt: expect.any(Date),
        }),
        create: expect.objectContaining({
          address: fixtures.validAddressLower,
          ensName: "newname.eth",
        }),
      });
      expect(result.ensName).toBe("newname.eth");
    });

    it("should validate address format", async () => {
      await expect(
        usersService.createOrUpdateUser(fixtures.invalidAddress),
      ).rejects.toThrow("Invalid Ethereum address format");
    });
  });
});
