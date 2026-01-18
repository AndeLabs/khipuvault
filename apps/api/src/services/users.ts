import { prisma } from "@khipu/database";

import { cache, CACHE_TTL, CACHE_KEYS } from "../lib/cache";
import { AppError } from "../middleware/error-handler";

import type { User, Deposit, PoolType } from "@prisma/client";

// Ethereum address validation regex
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

// Type for user positions (poolType can be any valid PoolType or the string 'unknown')
interface UserPosition {
  poolAddress: string;
  poolName: string;
  poolType: PoolType | string;
  balance: string;
  totalDeposited: string;
  totalWithdrawn: string;
  totalYieldClaimed: string;
}

/**
 * Validates and normalizes an Ethereum address
 * @throws AppError if address is invalid
 */
function validateAndNormalizeAddress(address: string): string {
  if (!ETH_ADDRESS_REGEX.test(address)) {
    throw new AppError(400, "Invalid Ethereum address format");
  }
  return address.toLowerCase();
}

export class UsersService {
  async getUserByAddress(address: string): Promise<User & { deposits: Deposit[] }> {
    const normalizedAddress = validateAndNormalizeAddress(address);
    const user = await prisma.user.findUnique({
      where: { address: normalizedAddress },
      include: {
        deposits: {
          orderBy: { timestamp: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    return user;
  }

  async getUserPortfolio(address: string): Promise<{
    address: string;
    ensName: string | null;
    avatar: string | null;
    portfolio: {
      totalDeposited: string;
      totalWithdrawn: string;
      totalYieldClaimed: string;
      currentBalance: string;
    };
    positions: UserPosition[];
    recentActivity: Deposit[];
  }> {
    // Validate address before any operations (defense in depth)
    const normalizedAddress = validateAndNormalizeAddress(address);

    // Use cache to reduce database load
    return cache.getOrSet(
      CACHE_KEYS.userPortfolio(normalizedAddress),
      async () => {
        // Get user info without loading all deposits
        const user = await prisma.user.findUnique({
          where: { address: normalizedAddress },
        });

        if (!user) {
          throw new AppError(404, "User not found");
        }

        // Use raw SQL for efficient BigInt string aggregation
        // This scales to millions of transactions without memory issues
        type SumResult = { total: string | null }[];

        const [depositResult, withdrawResult, yieldResult, recentDeposits] = await Promise.all([
          prisma.$queryRaw<SumResult>`
            SELECT COALESCE(SUM(CAST(amount AS DECIMAL(78,0))), 0)::text as total
            FROM "Deposit"
            WHERE "userAddress" = ${normalizedAddress} AND type = 'DEPOSIT'
          `,
          prisma.$queryRaw<SumResult>`
            SELECT COALESCE(SUM(CAST(amount AS DECIMAL(78,0))), 0)::text as total
            FROM "Deposit"
            WHERE "userAddress" = ${normalizedAddress} AND type = 'WITHDRAW'
          `,
          prisma.$queryRaw<SumResult>`
            SELECT COALESCE(SUM(CAST(amount AS DECIMAL(78,0))), 0)::text as total
            FROM "Deposit"
            WHERE "userAddress" = ${normalizedAddress} AND type = 'YIELD_CLAIM'
          `,
          prisma.deposit.findMany({
            where: { userAddress: normalizedAddress },
            orderBy: { timestamp: "desc" },
            take: 5,
          }),
        ]);

        const totalDeposited = BigInt(depositResult[0]?.total || "0");
        const totalWithdrawn = BigInt(withdrawResult[0]?.total || "0");
        const totalYieldClaimed = BigInt(yieldResult[0]?.total || "0");
        const currentBalance = totalDeposited - totalWithdrawn;

        return {
          address: user.address,
          ensName: user.ensName,
          avatar: user.avatar,
          portfolio: {
            totalDeposited: totalDeposited.toString(),
            totalWithdrawn: totalWithdrawn.toString(),
            totalYieldClaimed: totalYieldClaimed.toString(),
            currentBalance: currentBalance.toString(),
          },
          positions: await this.getUserPositions(address),
          recentActivity: recentDeposits,
        };
      },
      CACHE_TTL.USER_PORTFOLIO
    );
  }

  async getUserPositions(address: string): Promise<UserPosition[]> {
    // Validate and normalize address (defense in depth)
    const normalizedAddress = validateAndNormalizeAddress(address);

    // Get all deposits in one query
    const allDeposits = await prisma.deposit.findMany({
      where: { userAddress: normalizedAddress },
      select: {
        poolAddress: true,
        type: true,
        amount: true,
      },
    });

    // Get unique pool addresses
    const poolAddresses = [...new Set(allDeposits.map((d) => d.poolAddress))];

    // Get all pools in one query
    const pools = await prisma.pool.findMany({
      where: { contractAddress: { in: poolAddresses } },
      select: {
        contractAddress: true,
        name: true,
        poolType: true,
      },
    });

    // Create pool lookup map for O(1) access
    const poolMap = new Map(pools.map((p) => [p.contractAddress, p]));

    // Group deposits by pool and calculate totals in memory (much faster than N queries)
    const positionMap = new Map<
      string,
      {
        deposited: bigint;
        withdrawn: bigint;
        yieldClaimed: bigint;
      }
    >();

    for (const deposit of allDeposits) {
      if (!positionMap.has(deposit.poolAddress)) {
        positionMap.set(deposit.poolAddress, {
          deposited: BigInt(0),
          withdrawn: BigInt(0),
          yieldClaimed: BigInt(0),
        });
      }

      const position = positionMap.get(deposit.poolAddress)!;
      const amount = BigInt(deposit.amount);

      if (deposit.type === "DEPOSIT") {
        position.deposited += amount;
      } else if (deposit.type === "WITHDRAW") {
        position.withdrawn += amount;
      } else if (deposit.type === "YIELD_CLAIM") {
        position.yieldClaimed += amount;
      }
    }

    // Build result array
    const positions = Array.from(positionMap.entries()).map(([poolAddress, totals]) => {
      const pool = poolMap.get(poolAddress);
      const balance = totals.deposited - totals.withdrawn;

      return {
        poolAddress,
        poolName: pool?.name || "Unknown Pool",
        poolType: pool?.poolType || "unknown",
        balance: balance.toString(),
        totalDeposited: totals.deposited.toString(),
        totalWithdrawn: totals.withdrawn.toString(),
        totalYieldClaimed: totals.yieldClaimed.toString(),
      };
    });

    return positions.filter((p) => BigInt(p.balance) > 0);
  }

  async getUserTransactions(
    address: string,
    limit = 50,
    offset = 0
  ): Promise<{
    transactions: Deposit[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    // Validate address before query
    const normalizedAddress = validateAndNormalizeAddress(address);
    const transactions = await prisma.deposit.findMany({
      where: {
        userAddress: normalizedAddress,
      },
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.deposit.count({
      where: {
        userAddress: normalizedAddress,
      },
    });

    return {
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async createOrUpdateUser(address: string, data?: { ensName?: string; avatar?: string }) {
    // Validate address before database operation
    const normalizedAddress = validateAndNormalizeAddress(address);
    return prisma.user.upsert({
      where: { address: normalizedAddress },
      update: {
        ...data,
        lastActiveAt: new Date(),
      },
      create: {
        address: normalizedAddress,
        ...data,
      },
    });
  }
}
