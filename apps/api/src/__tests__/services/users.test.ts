import { describe, it, expect, beforeEach, vi } from "vitest";
import { UsersService } from "../../services/users";
import { AppError } from "../../middleware/error-handler";
import type { User, Deposit, DepositType } from "@prisma/client";

// Mock Prisma
vi.mock("@khipu/database", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    deposit: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    pool: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@khipu/database";

describe("UsersService", () => {
  let usersService: UsersService;

  beforeEach(() => {
    usersService = new UsersService();
    vi.clearAllMocks();
  });

  describe("getUserByAddress", () => {
    it("should return user with deposits when user exists", async () => {
      const mockUser: User & { deposits: Deposit[] } = {
        id: "1",
        address: "0x1234567890123456789012345678901234567890",
        ensName: "test.eth",
        avatar: null,
        createdAt: new Date(),
        lastActiveAt: new Date(),
        deposits: [
          {
            id: "1",
            txHash: "0xabc",
            userAddress: "0x1234567890123456789012345678901234567890",
            poolAddress: "0x9876543210987654321098765432109876543210",
            amount: "1000000000000000000",
            type: "DEPOSIT" as DepositType,
            timestamp: new Date(),
            blockNumber: 12345,
            confirmed: true,
          },
        ],
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await usersService.getUserByAddress(
        "0x1234567890123456789012345678901234567890",
      );

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { address: "0x1234567890123456789012345678901234567890" },
        include: {
          deposits: {
            orderBy: { timestamp: "desc" },
            take: 10,
          },
        },
      });
    });

    it("should throw AppError 404 when user does not exist", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        usersService.getUserByAddress(
          "0x0000000000000000000000000000000000000000",
        ),
      ).rejects.toThrow(AppError);

      await expect(
        usersService.getUserByAddress(
          "0x0000000000000000000000000000000000000000",
        ),
      ).rejects.toThrow("User not found");
    });

    it("should convert address to lowercase before querying", async () => {
      const mockUser: User & { deposits: Deposit[] } = {
        id: "1",
        address: "0x1234567890123456789012345678901234567890",
        ensName: null,
        avatar: null,
        createdAt: new Date(),
        lastActiveAt: new Date(),
        deposits: [],
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      await usersService.getUserByAddress(
        "0x1234567890123456789012345678901234567890".toUpperCase(),
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { address: "0x1234567890123456789012345678901234567890" },
        }),
      );
    });
  });

  describe("getUserTransactions", () => {
    it("should return paginated transactions for a user", async () => {
      const mockDeposits: Deposit[] = [
        {
          id: "1",
          txHash: "0xabc",
          userAddress: "0x1234567890123456789012345678901234567890",
          poolAddress: "0x9876543210987654321098765432109876543210",
          amount: "1000000000000000000",
          type: "DEPOSIT" as DepositType,
          timestamp: new Date(),
          blockNumber: 12345,
          confirmed: true,
        },
      ];

      vi.mocked(prisma.deposit.findMany).mockResolvedValue(mockDeposits);
      vi.mocked(prisma.deposit.count).mockResolvedValue(1);

      const result = await usersService.getUserTransactions(
        "0x1234567890123456789012345678901234567890",
        10,
        0,
      );

      expect(result).toEqual({
        transactions: mockDeposits,
        pagination: {
          total: 1,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      });

      expect(prisma.deposit.findMany).toHaveBeenCalledWith({
        where: { userAddress: "0x1234567890123456789012345678901234567890" },
        orderBy: { timestamp: "desc" },
        take: 10,
        skip: 0,
      });
    });

    it("should indicate hasMore when there are more transactions", async () => {
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.deposit.count).mockResolvedValue(100);

      const result = await usersService.getUserTransactions(
        "0x1234567890123456789012345678901234567890",
        10,
        0,
      );

      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.total).toBe(100);
    });

    it("should use default limit and offset values", async () => {
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.deposit.count).mockResolvedValue(0);

      await usersService.getUserTransactions(
        "0x1234567890123456789012345678901234567890",
      );

      expect(prisma.deposit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0,
        }),
      );
    });
  });

  describe("createOrUpdateUser", () => {
    it("should create a new user when user does not exist", async () => {
      const mockUser: User = {
        id: "1",
        address: "0x1234567890123456789012345678901234567890",
        ensName: "test.eth",
        avatar: "https://example.com/avatar.png",
        createdAt: new Date(),
        lastActiveAt: new Date(),
      };

      vi.mocked(prisma.user.upsert).mockResolvedValue(mockUser);

      const result = await usersService.createOrUpdateUser(
        "0x1234567890123456789012345678901234567890",
        {
          ensName: "test.eth",
          avatar: "https://example.com/avatar.png",
        },
      );

      expect(result).toEqual(mockUser);
      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { address: "0x1234567890123456789012345678901234567890" },
        update: {
          ensName: "test.eth",
          avatar: "https://example.com/avatar.png",
          lastActiveAt: expect.any(Date),
        },
        create: {
          address: "0x1234567890123456789012345678901234567890",
          ensName: "test.eth",
          avatar: "https://example.com/avatar.png",
        },
      });
    });

    it("should update existing user with new data", async () => {
      const mockUser: User = {
        id: "1",
        address: "0x1234567890123456789012345678901234567890",
        ensName: "updated.eth",
        avatar: null,
        createdAt: new Date(),
        lastActiveAt: new Date(),
      };

      vi.mocked(prisma.user.upsert).mockResolvedValue(mockUser);

      const result = await usersService.createOrUpdateUser(
        "0x1234567890123456789012345678901234567890",
        {
          ensName: "updated.eth",
        },
      );

      expect(result.ensName).toBe("updated.eth");
      expect(prisma.user.upsert).toHaveBeenCalled();
    });

    it("should update lastActiveAt timestamp on upsert", async () => {
      const mockUser: User = {
        id: "1",
        address: "0x1234567890123456789012345678901234567890",
        ensName: null,
        avatar: null,
        createdAt: new Date(),
        lastActiveAt: new Date(),
      };

      vi.mocked(prisma.user.upsert).mockResolvedValue(mockUser);

      await usersService.createOrUpdateUser(
        "0x1234567890123456789012345678901234567890",
      );

      const callArgs = vi.mocked(prisma.user.upsert).mock.calls[0][0];
      expect(callArgs.update).toHaveProperty("lastActiveAt");
      expect(callArgs.update.lastActiveAt).toBeInstanceOf(Date);
    });
  });

  describe("getUserPortfolio", () => {
    it("should return user portfolio with positions and activity", async () => {
      const mockDeposits: Deposit[] = [
        {
          id: "1",
          txHash: "0xtx1",
          userAddress: "0x1234567890123456789012345678901234567890",
          poolAddress: "0x9876543210987654321098765432109876543210",
          amount: "2000000000000000000",
          type: "DEPOSIT" as DepositType,
          timestamp: new Date(),
          blockNumber: 12345,
          confirmed: true,
        },
        {
          id: "2",
          txHash: "0xtx2",
          userAddress: "0x1234567890123456789012345678901234567890",
          poolAddress: "0x9876543210987654321098765432109876543210",
          amount: "500000000000000000",
          type: "WITHDRAW" as DepositType,
          timestamp: new Date(),
          blockNumber: 12346,
          confirmed: true,
        },
      ] as Deposit[];

      const mockUser: User & { deposits: Deposit[] } = {
        id: "1",
        address: "0x1234567890123456789012345678901234567890",
        ensName: "test.eth",
        avatar: null,
        createdAt: new Date(),
        lastActiveAt: new Date(),
        deposits: mockDeposits,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.deposit.findMany).mockResolvedValue([
        {
          poolAddress: "0x9876543210987654321098765432109876543210",
        } as any,
      ]);
      vi.mocked(prisma.pool.findUnique).mockResolvedValue(null);

      const result = await usersService.getUserPortfolio(
        "0x1234567890123456789012345678901234567890",
      );

      expect(result.address).toBe("0x1234567890123456789012345678901234567890");
      expect(result.ensName).toBe("test.eth");
      expect(result.portfolio.totalDeposited).toBe("2000000000000000000");
      expect(result.portfolio.totalWithdrawn).toBe("500000000000000000");
      expect(result.portfolio.currentBalance).toBe("1500000000000000000");
      expect(result.recentActivity).toHaveLength(2);
    });

    it("should throw AppError 404 when user does not exist", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        usersService.getUserPortfolio(
          "0x0000000000000000000000000000000000000000",
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe("getUserPositions", () => {
    it("should return positions for each pool with balance", async () => {
      const mockDeposits: Deposit[] = [
        {
          id: "1",
          txHash: "0xtx1",
          userAddress: "0x1234567890123456789012345678901234567890",
          poolAddress: "0xpool1",
          amount: "1000000000000000000",
          type: "DEPOSIT" as DepositType,
          timestamp: new Date(),
          blockNumber: 12345,
          confirmed: true,
        },
      ] as Deposit[];

      vi.mocked(prisma.deposit.findMany)
        .mockResolvedValueOnce([{ poolAddress: "0xpool1" } as any])
        .mockResolvedValueOnce(mockDeposits);

      vi.mocked(prisma.pool.findUnique).mockResolvedValue({
        name: "Test Pool",
        poolType: "INDIVIDUAL",
      } as any);

      const result = await usersService.getUserPositions(
        "0x1234567890123456789012345678901234567890",
      );

      expect(result).toHaveLength(1);
      expect(result[0].poolAddress).toBe("0xpool1");
      expect(result[0].balance).toBe("1000000000000000000");
      expect(result[0].poolName).toBe("Test Pool");
    });

    it("should filter out positions with zero balance", async () => {
      const mockDeposits: Deposit[] = [
        {
          id: "1",
          txHash: "0xtx1",
          userAddress: "0x1234567890123456789012345678901234567890",
          poolAddress: "0xpool1",
          amount: "1000000000000000000",
          type: "DEPOSIT" as DepositType,
          timestamp: new Date(),
          blockNumber: 12345,
          confirmed: true,
        },
        {
          id: "2",
          txHash: "0xtx2",
          userAddress: "0x1234567890123456789012345678901234567890",
          poolAddress: "0xpool1",
          amount: "1000000000000000000",
          type: "WITHDRAW" as DepositType,
          timestamp: new Date(),
          blockNumber: 12346,
          confirmed: true,
        },
      ] as Deposit[];

      vi.mocked(prisma.deposit.findMany)
        .mockResolvedValueOnce([{ poolAddress: "0xpool1" } as any])
        .mockResolvedValueOnce(mockDeposits);

      vi.mocked(prisma.pool.findUnique).mockResolvedValue(null);

      const result = await usersService.getUserPositions(
        "0x1234567890123456789012345678901234567890",
      );

      expect(result).toHaveLength(0);
    });
  });
});
