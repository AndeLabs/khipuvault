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
    const [totalTransactions, totalDeposits, totalWithdrawals, totalYieldClaims] =
      await Promise.all([
        prisma.deposit.count(),
        prisma.deposit.count({ where: { type: 'DEPOSIT' } }),
        prisma.deposit.count({ where: { type: 'WITHDRAW' } }),
        prisma.deposit.count({ where: { type: 'YIELD_CLAIM' } }),
      ])

    // Calculate volumes manually since amount is String type
    const depositsData = await prisma.deposit.findMany({
      where: { type: 'DEPOSIT' },
      select: { amount: true },
    })

    const withdrawalsData = await prisma.deposit.findMany({
      where: { type: 'WITHDRAW' },
      select: { amount: true },
    })

    const totalVolumeDeposit = depositsData.reduce(
      (sum, d) => sum + BigInt(d.amount),
      BigInt(0)
    )

    const totalVolumeWithdraw = withdrawalsData.reduce(
      (sum, d) => sum + BigInt(d.amount),
      BigInt(0)
    )

    return {
      totalTransactions,
      totalDeposits,
      totalWithdrawals,
      totalYieldClaims,
      totalVolumeDeposit: totalVolumeDeposit.toString(),
      totalVolumeWithdraw: totalVolumeWithdraw.toString(),
    }
  }
}
