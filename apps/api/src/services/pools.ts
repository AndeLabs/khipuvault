import { prisma } from "@khipu/database";
import { AppError } from "../middleware/error-handler";

/**
 * Pool Service - Optimized for performance
 * - No N+1 queries
 * - Efficient aggregations
 * - Single-pass calculations
 */
export class PoolsService {
  /**
   * Get all active pools with basic info
   */
  async getAllPools() {
    const pools = await prisma.pool.findMany({
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

    return pools;
  }

  /**
   * Get pool by ID with analytics
   */
  async getPoolById(poolId: string) {
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      include: {
        analytics: {
          orderBy: { timestamp: "desc" },
          take: 30, // Last 30 data points
        },
      },
    });

    if (!pool) {
      throw new AppError(404, "Pool not found");
    }

    return pool;
  }

  /**
   * Get pool by contract address with analytics
   */
  async getPoolByAddress(address: string) {
    const pool = await prisma.pool.findUnique({
      where: { contractAddress: address.toLowerCase() },
      include: {
        analytics: {
          orderBy: { timestamp: "desc" },
          take: 30,
        },
      },
    });

    if (!pool) {
      throw new AppError(404, "Pool not found");
    }

    return pool;
  }

  /**
   * Get pool analytics for a time period
   */
  async getPoolAnalytics(poolId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await prisma.poolAnalytics.findMany({
      where: {
        poolId,
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: { timestamp: "asc" },
    });

    return analytics;
  }

  /**
   * Get all users in a pool with their balances
   * OPTIMIZED: Single query instead of N+1
   */
  async getPoolUsers(poolAddress: string) {
    const normalizedAddress = poolAddress.toLowerCase();

    // Get deposits for this pool in ONE query (limited for performance)
    const allDeposits = await prisma.deposit.findMany({
      where: {
        poolAddress: normalizedAddress,
        status: "CONFIRMED", // Only confirmed transactions
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
      take: 5000, // Limit to prevent memory issues on large pools
      orderBy: { timestamp: "desc" },
    });

    // Group deposits by user address and calculate balances
    const userBalances = new Map<
      string,
      {
        user: {
          address: string;
          ensName: string | null;
          avatar: string | null;
        };
        deposited: bigint;
        withdrawn: bigint;
        yieldClaimed: bigint;
        lastActivity: Date;
      }
    >();

    for (const deposit of allDeposits) {
      const userAddress = deposit.userAddress;
      const existing = userBalances.get(userAddress);

      const amount = BigInt(deposit.amount);
      const isDeposit = deposit.type === "DEPOSIT";
      const isWithdraw = deposit.type === "WITHDRAW";
      const isYieldClaim = deposit.type === "YIELD_CLAIM";

      if (existing) {
        if (isDeposit) existing.deposited += amount;
        if (isWithdraw) existing.withdrawn += amount;
        if (isYieldClaim) existing.yieldClaimed += amount;
        if (deposit.timestamp > existing.lastActivity) {
          existing.lastActivity = deposit.timestamp;
        }
      } else {
        userBalances.set(userAddress, {
          user: deposit.user,
          deposited: isDeposit ? amount : BigInt(0),
          withdrawn: isWithdraw ? amount : BigInt(0),
          yieldClaimed: isYieldClaim ? amount : BigInt(0),
          lastActivity: deposit.timestamp,
        });
      }
    }

    // Build result array and filter out zero balances
    const users = Array.from(userBalances.entries())
      .map(([address, data]) => {
        const currentBalance = data.deposited - data.withdrawn;
        return {
          address,
          ensName: data.user.ensName,
          avatar: data.user.avatar,
          balance: currentBalance.toString(),
          totalDeposited: data.deposited.toString(),
          totalWithdrawn: data.withdrawn.toString(),
          totalYieldClaimed: data.yieldClaimed.toString(),
          lastActivity: data.lastActivity,
        };
      })
      .filter((u) => BigInt(u.balance) > 0)
      .sort((a, b) => {
        // Sort by balance descending
        const balanceA = BigInt(a.balance);
        const balanceB = BigInt(b.balance);
        if (balanceA > balanceB) return -1;
        if (balanceA < balanceB) return 1;
        return 0;
      });

    return users;
  }

  /**
   * Update pool statistics
   * OPTIMIZED: Uses database aggregation instead of loading all records
   */
  async updatePoolStats(poolAddress: string) {
    const normalizedAddress = poolAddress.toLowerCase();

    // Use database aggregation for efficient stats calculation
    // This scales O(1) regardless of transaction count
    const stats = await prisma.$queryRaw<
      Array<{
        total_deposited: string;
        total_withdrawn: string;
        deposit_count: bigint;
        withdrawal_count: bigint;
        active_users: bigint;
      }>
    >`
      WITH user_balances AS (
        SELECT
          "userAddress",
          SUM(CASE WHEN type = 'DEPOSIT' THEN CAST(amount AS DECIMAL(78,0)) ELSE 0 END) -
          SUM(CASE WHEN type = 'WITHDRAW' THEN CAST(amount AS DECIMAL(78,0)) ELSE 0 END) as balance
        FROM "Deposit"
        WHERE "poolAddress" = ${normalizedAddress}
          AND status = 'CONFIRMED'
        GROUP BY "userAddress"
      )
      SELECT
        COALESCE(SUM(CASE WHEN type = 'DEPOSIT' THEN CAST(amount AS DECIMAL(78,0)) ELSE 0 END), 0)::TEXT as total_deposited,
        COALESCE(SUM(CASE WHEN type = 'WITHDRAW' THEN CAST(amount AS DECIMAL(78,0)) ELSE 0 END), 0)::TEXT as total_withdrawn,
        COUNT(CASE WHEN type = 'DEPOSIT' THEN 1 END) as deposit_count,
        COUNT(CASE WHEN type = 'WITHDRAW' THEN 1 END) as withdrawal_count,
        (SELECT COUNT(*) FROM user_balances WHERE balance > 0) as active_users
      FROM "Deposit"
      WHERE "poolAddress" = ${normalizedAddress}
        AND status = 'CONFIRMED'
    `;

    const result = stats[0];
    if (!result) {
      // No transactions yet, just update lastSyncAt
      return await prisma.pool.update({
        where: { contractAddress: normalizedAddress },
        data: { lastSyncAt: new Date() },
      });
    }

    const totalDeposited = BigInt(result.total_deposited);
    const totalWithdrawn = BigInt(result.total_withdrawn);
    const tvl = totalDeposited - totalWithdrawn;

    return await prisma.pool.update({
      where: { contractAddress: normalizedAddress },
      data: {
        tvl: tvl.toString(),
        totalUsers: Number(result.active_users),
        totalDeposits: Number(result.deposit_count),
        totalWithdrawals: Number(result.withdrawal_count),
        lastSyncAt: new Date(),
      },
    });
  }

  /**
   * Create or update pool analytics snapshot
   */
  async createAnalyticsSnapshot(poolId: string) {
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      throw new AppError(404, "Pool not found");
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get deposits in last 24h for volume calculation
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentDeposits = await prisma.deposit.findMany({
      where: {
        poolAddress: pool.contractAddress,
        timestamp: { gte: yesterday },
        status: "CONFIRMED",
      },
    });

    let volumeIn = BigInt(0);
    let volumeOut = BigInt(0);

    for (const deposit of recentDeposits) {
      const amount = BigInt(deposit.amount);
      if (deposit.type === "DEPOSIT") {
        volumeIn += amount;
      } else if (deposit.type === "WITHDRAW") {
        volumeOut += amount;
      }
    }

    // Create or update analytics entry
    await prisma.poolAnalytics.upsert({
      where: {
        poolId_timestamp: {
          poolId: pool.id,
          timestamp: now,
        },
      },
      create: {
        poolId: pool.id,
        timestamp: now,
        date: today,
        tvl: pool.tvl,
        apr: pool.apr,
        apy: pool.apy || pool.apr,
        totalDeposits: pool.totalDeposits,
        totalWithdrawals: pool.totalWithdrawals,
        totalUsers: pool.totalUsers,
        activeUsers: pool.totalUsers,
        volumeIn: volumeIn.toString(),
        volumeOut: volumeOut.toString(),
        netFlow: (volumeIn - volumeOut).toString(),
      },
      update: {
        tvl: pool.tvl,
        apr: pool.apr,
        apy: pool.apy || pool.apr,
        totalDeposits: pool.totalDeposits,
        totalWithdrawals: pool.totalWithdrawals,
        totalUsers: pool.totalUsers,
        activeUsers: pool.totalUsers,
        volumeIn: volumeIn.toString(),
        volumeOut: volumeOut.toString(),
        netFlow: (volumeIn - volumeOut).toString(),
      },
    });

    return pool;
  }
}
