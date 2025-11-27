import { prisma } from '@khipu/database'
import { AppError } from '../middleware/error-handler'
import type { Deposit } from '@prisma/client'

export class TransactionsService {
  async getTransactionByHash(txHash: string): Promise<Deposit> {
    const transaction = await prisma.deposit.findUnique({
      where: { txHash: txHash.toLowerCase() },
    })

    if (!transaction) {
      throw new AppError(404, 'Transaction not found')
    }

    return transaction
  }

  async getRecentTransactions(limit = 50, offset = 0): Promise<{
    transactions: Deposit[]
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  }> {
    const transactions = await prisma.deposit.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.deposit.count()

    return {
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    }
  }

  async getTransactionsByPool(poolAddress: string, limit = 50, offset = 0): Promise<{
    transactions: Deposit[]
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  }> {
    const transactions = await prisma.deposit.findMany({
      where: {
        poolAddress: poolAddress.toLowerCase(),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.deposit.count({
      where: {
        poolAddress: poolAddress.toLowerCase(),
      },
    })

    return {
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    }
  }

  async getTransactionStats() {
    // OPTIMIZED: Single query using raw SQL aggregation
    // Reduced from 6 queries to 1 query
    const stats = await prisma.$queryRaw<Array<{
      type: string
      count: bigint
      volume: string
    }>>`
      SELECT
        type,
        COUNT(*)::BIGINT as count,
        COALESCE(SUM(CAST(amount AS DECIMAL(78,0))), 0)::TEXT as volume
      FROM "Deposit"
      GROUP BY type
    `

    // Also get total count
    const totalTransactions = await prisma.deposit.count()

    // Parse results into structured response
    const typeStats = new Map(stats.map(s => [s.type, { count: Number(s.count), volume: s.volume }]))

    return {
      totalTransactions,
      totalDeposits: typeStats.get('DEPOSIT')?.count || 0,
      totalWithdrawals: typeStats.get('WITHDRAW')?.count || 0,
      totalYieldClaims: typeStats.get('YIELD_CLAIM')?.count || 0,
      totalVolumeDeposit: typeStats.get('DEPOSIT')?.volume || '0',
      totalVolumeWithdraw: typeStats.get('WITHDRAW')?.volume || '0',
    }
  }
}
