import { prisma } from "@khipu/database";

import { cache, CACHE_TTL, CACHE_KEYS } from "../lib/cache";

import type { EventLog } from "@prisma/client";

export class AnalyticsService {
  async getGlobalStats() {
    // Use cache to avoid recalculating on every request
    return cache.getOrSet(
      CACHE_KEYS.globalStats(),
      async () => {
        const [totalUsers, activePools, totalTransactions] = await Promise.all([
          prisma.user.count(),
          prisma.pool.count({ where: { status: "ACTIVE" } }),
          prisma.deposit.count(),
        ]);

        // Calculate total TVL across all pools
        const pools = await prisma.pool.findMany({
          where: { status: "ACTIVE" },
        });

        const totalTVL = pools.reduce(
          (sum, pool) => sum + BigInt(pool.tvl),
          BigInt(0),
        );

        // Get average APR
        const avgAPR =
          pools.reduce((sum, pool) => sum + pool.apr, 0) / (pools.length || 1);

        return {
          totalUsers,
          activePools,
          totalTransactions,
          totalTVL: totalTVL.toString(),
          avgAPR: avgAPR.toFixed(2),
        };
      },
      CACHE_TTL.GLOBAL_STATS,
    );
  }

  async getActivityTimeline(days: number = 30) {
    // Validate days parameter (max 365 days)
    const safeDays = Math.min(Math.max(1, days), 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - safeDays);

    // OPTIMIZED: Use database aggregation instead of loading all records
    // This scales efficiently regardless of transaction volume
    const dailyStats = await prisma.$queryRaw<
      Array<{
        date: string;
        deposits: bigint;
        withdrawals: bigint;
        deposit_volume: string;
        withdraw_volume: string;
      }>
    >`
      SELECT
        DATE(timestamp) as date,
        COUNT(CASE WHEN type = 'DEPOSIT' THEN 1 END) as deposits,
        COUNT(CASE WHEN type = 'WITHDRAW' THEN 1 END) as withdrawals,
        COALESCE(SUM(CASE WHEN type = 'DEPOSIT' THEN CAST(amount AS DECIMAL(78,0)) ELSE 0 END), 0)::TEXT as deposit_volume,
        COALESCE(SUM(CASE WHEN type = 'WITHDRAW' THEN CAST(amount AS DECIMAL(78,0)) ELSE 0 END), 0)::TEXT as withdraw_volume
      FROM "Deposit"
      WHERE timestamp >= ${startDate}
        AND status = 'CONFIRMED'
      GROUP BY DATE(timestamp)
      ORDER BY DATE(timestamp) ASC
    `;

    return dailyStats.map((day) => ({
      date: day.date,
      deposits: Number(day.deposits),
      withdrawals: Number(day.withdrawals),
      volume: (
        BigInt(day.deposit_volume) + BigInt(day.withdraw_volume)
      ).toString(),
    }));
  }

  async getTopPools(limit: number = 10) {
    // Cache top pools for 10 minutes
    return cache.getOrSet(
      CACHE_KEYS.topPools(limit),
      async () => {
        const pools = await prisma.pool.findMany({
          where: { status: "ACTIVE" },
          orderBy: { tvl: "desc" },
          take: limit,
        });
        return pools;
      },
      CACHE_TTL.TOP_POOLS,
    );
  }

  async getTopUsers(limit: number = 10) {
    // Defense in depth: validate limit even though routes already validate
    // This prevents issues if service is called from other contexts
    const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);

    // OPTIMIZED: Use raw SQL aggregation instead of loading all users into memory
    // This scales from O(n*m) to O(n) where n=users, m=deposits per user

    const topUsers = await prisma.$queryRaw<
      Array<{
        address: string;
        ensName: string | null;
        avatar: string | null;
        totalDeposited: string;
        totalWithdrawn: string;
      }>
    >`
      SELECT
        u.address,
        u."ensName",
        u.avatar,
        COALESCE(SUM(CASE WHEN d.type = 'DEPOSIT' THEN CAST(d.amount AS DECIMAL(78,0)) ELSE 0 END), 0)::TEXT as "totalDeposited",
        COALESCE(SUM(CASE WHEN d.type = 'WITHDRAW' THEN CAST(d.amount AS DECIMAL(78,0)) ELSE 0 END), 0)::TEXT as "totalWithdrawn"
      FROM "User" u
      LEFT JOIN "Deposit" d ON d."userAddress" = u.address
      GROUP BY u.address, u."ensName", u.avatar
      HAVING COALESCE(SUM(CASE WHEN d.type = 'DEPOSIT' THEN CAST(d.amount AS DECIMAL(78,0)) ELSE 0 END), 0) -
             COALESCE(SUM(CASE WHEN d.type = 'WITHDRAW' THEN CAST(d.amount AS DECIMAL(78,0)) ELSE 0 END), 0) > 0
      ORDER BY (
        COALESCE(SUM(CASE WHEN d.type = 'DEPOSIT' THEN CAST(d.amount AS DECIMAL(78,0)) ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN d.type = 'WITHDRAW' THEN CAST(d.amount AS DECIMAL(78,0)) ELSE 0 END), 0)
      ) DESC
      LIMIT ${safeLimit}
    `;

    return topUsers.map((u) => ({
      address: u.address,
      ensName: u.ensName,
      avatar: u.avatar,
      totalDeposited: u.totalDeposited,
      currentBalance: (
        BigInt(u.totalDeposited) - BigInt(u.totalWithdrawn)
      ).toString(),
    }));
  }

  async getEventLogs(
    limit: number = 100,
    offset: number = 0,
  ): Promise<{
    logs: EventLog[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const logs = await prisma.eventLog.findMany({
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.eventLog.count();

    return {
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }
}
