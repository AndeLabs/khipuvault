import { prisma } from '@khipu/database'
import type { EventLog } from '@prisma/client'
import { cache, CACHE_TTL, CACHE_KEYS } from '../lib/cache'

export class AnalyticsService {
  async getGlobalStats() {
    // Use cache to avoid recalculating on every request
    return cache.getOrSet(
      CACHE_KEYS.globalStats(),
      async () => {
        const [totalUsers, activePools, totalTransactions] = await Promise.all([
          prisma.user.count(),
          prisma.pool.count({ where: { status: 'ACTIVE' } }),
          prisma.deposit.count(),
        ])

        // Calculate total TVL across all pools
        const pools = await prisma.pool.findMany({
          where: { status: 'ACTIVE' },
        })

        const totalTVL = pools.reduce((sum, pool) => sum + BigInt(pool.tvl), BigInt(0))

        // Get average APR
        const avgAPR =
          pools.reduce((sum, pool) => sum + pool.apr, 0) / (pools.length || 1)

        return {
          totalUsers,
          activePools,
          totalTransactions,
          totalTVL: totalTVL.toString(),
          avgAPR: avgAPR.toFixed(2),
        }
      },
      CACHE_TTL.GLOBAL_STATS
    )
  }

  async getActivityTimeline(days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const deposits = await prisma.deposit.findMany({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    })

    // Group by day
    const timeline = new Map<string, { date: string; deposits: number; withdrawals: number; volume: bigint }>()

    for (const deposit of deposits) {
      const dateKey = deposit.timestamp.toISOString().split('T')[0]

      if (!timeline.has(dateKey)) {
        timeline.set(dateKey, {
          date: dateKey,
          deposits: 0,
          withdrawals: 0,
          volume: BigInt(0),
        })
      }

      const day = timeline.get(dateKey)!

      if (deposit.type === 'DEPOSIT') {
        day.deposits++
        day.volume += BigInt(deposit.amount)
      } else if (deposit.type === 'WITHDRAW') {
        day.withdrawals++
        day.volume += BigInt(deposit.amount)
      }
    }

    return Array.from(timeline.values()).map(day => ({
      ...day,
      volume: day.volume.toString(),
    }))
  }

  async getTopPools(limit: number = 10) {
    // Cache top pools for 10 minutes
    return cache.getOrSet(
      CACHE_KEYS.topPools(limit),
      async () => {
        const pools = await prisma.pool.findMany({
          where: { status: 'ACTIVE' },
          orderBy: { tvl: 'desc' },
          take: limit,
        })
        return pools
      },
      CACHE_TTL.TOP_POOLS
    )
  }

  async getTopUsers(limit: number = 10) {
    // OPTIMIZED: Use raw SQL aggregation instead of loading all users into memory
    // This scales from O(n*m) to O(n) where n=users, m=deposits per user

    const topUsers = await prisma.$queryRaw<Array<{
      address: string
      ensName: string | null
      avatar: string | null
      totalDeposited: string
      totalWithdrawn: string
    }>>`
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
      LIMIT ${limit}
    `

    return topUsers.map(u => ({
      address: u.address,
      ensName: u.ensName,
      avatar: u.avatar,
      totalDeposited: u.totalDeposited,
      currentBalance: (BigInt(u.totalDeposited) - BigInt(u.totalWithdrawn)).toString(),
    }))
  }

  async getEventLogs(limit: number = 100, offset: number = 0): Promise<{
    logs: EventLog[]
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  }> {
    const logs = await prisma.eventLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.eventLog.count()

    return {
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    }
  }
}
