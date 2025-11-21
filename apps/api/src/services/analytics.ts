import { prisma } from '@khipu/database'
import type { EventLog } from '@prisma/client'

export class AnalyticsService {
  async getGlobalStats() {
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
    const pools = await prisma.pool.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { tvl: 'desc' },
      take: limit,
    })

    return pools
  }

  async getTopUsers(limit: number = 10) {
    const users = await prisma.user.findMany({
      include: {
        deposits: true,
      },
    })

    // Calculate total deposited for each user
    const usersWithTotals = users.map(user => {
      const totalDeposited = user.deposits
        .filter(d => d.type === 'DEPOSIT')
        .reduce((sum, d) => sum + BigInt(d.amount), BigInt(0))

      const totalWithdrawn = user.deposits
        .filter(d => d.type === 'WITHDRAW')
        .reduce((sum, d) => sum + BigInt(d.amount), BigInt(0))

      const currentBalance = totalDeposited - totalWithdrawn

      return {
        address: user.address,
        ensName: user.ensName,
        avatar: user.avatar,
        totalDeposited: totalDeposited.toString(),
        currentBalance: currentBalance.toString(),
      }
    })

    // Sort by current balance and return top users
    return usersWithTotals
      .filter(u => BigInt(u.currentBalance) > 0)
      .sort((a, b) => (BigInt(b.currentBalance) > BigInt(a.currentBalance) ? 1 : -1))
      .slice(0, limit)
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
