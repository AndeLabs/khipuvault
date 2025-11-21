import { prisma } from '@khipu/database'
import { AppError } from '../middleware/error-handler'
import type { User, Deposit } from '@prisma/client'

export class UsersService {
  async getUserByAddress(address: string): Promise<User & { deposits: Deposit[] }> {
    const user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
      include: {
        deposits: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    })

    if (!user) {
      throw new AppError(404, 'User not found')
    }

    return user
  }

  async getUserPortfolio(address: string): Promise<{
    address: string
    ensName: string | null
    avatar: string | null
    portfolio: {
      totalDeposited: string
      totalWithdrawn: string
      totalYieldClaimed: string
      currentBalance: string
    }
    positions: any[]
    recentActivity: Deposit[]
  }> {
    const user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
      include: {
        deposits: true,
      },
    })

    if (!user) {
      throw new AppError(404, 'User not found')
    }

    // Calculate portfolio metrics
    const deposits = user.deposits.filter(d => d.type === 'DEPOSIT')
    const withdrawals = user.deposits.filter(d => d.type === 'WITHDRAW')
    const yieldClaims = user.deposits.filter(d => d.type === 'YIELD_CLAIM')

    const totalDeposited = deposits.reduce(
      (sum, d) => sum + BigInt(d.amount),
      BigInt(0)
    )
    const totalWithdrawn = withdrawals.reduce(
      (sum, d) => sum + BigInt(d.amount),
      BigInt(0)
    )
    const totalYieldClaimed = yieldClaims.reduce(
      (sum, d) => sum + BigInt(d.amount),
      BigInt(0)
    )

    const currentBalance = totalDeposited - totalWithdrawn

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
      recentActivity: user.deposits.slice(0, 5),
    }
  }

  async getUserPositions(address: string) {
    // Get unique pools user has interacted with
    const deposits = await prisma.deposit.findMany({
      where: {
        userAddress: address.toLowerCase(),
      },
      distinct: ['poolAddress'],
      select: {
        poolAddress: true,
      },
    })

    const positions = await Promise.all(
      deposits.map(async (d) => {
        const poolDeposits = await prisma.deposit.findMany({
          where: {
            userAddress: address.toLowerCase(),
            poolAddress: d.poolAddress,
          },
        })

        const deposited = poolDeposits
          .filter(p => p.type === 'DEPOSIT')
          .reduce((sum, p) => sum + BigInt(p.amount), BigInt(0))

        const withdrawn = poolDeposits
          .filter(p => p.type === 'WITHDRAW')
          .reduce((sum, p) => sum + BigInt(p.amount), BigInt(0))

        const yieldClaimed = poolDeposits
          .filter(p => p.type === 'YIELD_CLAIM')
          .reduce((sum, p) => sum + BigInt(p.amount), BigInt(0))

        const balance = deposited - withdrawn

        // Get pool info
        const pool = await prisma.pool.findUnique({
          where: { contractAddress: d.poolAddress },
        })

        return {
          poolAddress: d.poolAddress,
          poolName: pool?.name || 'Unknown Pool',
          poolType: pool?.poolType || 'unknown',
          balance: balance.toString(),
          totalDeposited: deposited.toString(),
          totalWithdrawn: withdrawn.toString(),
          totalYieldClaimed: yieldClaimed.toString(),
        }
      })
    )

    return positions.filter(p => BigInt(p.balance) > 0)
  }

  async getUserTransactions(address: string, limit = 50, offset = 0): Promise<{
    transactions: Deposit[]
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  }> {
    const transactions = await prisma.deposit.findMany({
      where: {
        userAddress: address.toLowerCase(),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.deposit.count({
      where: {
        userAddress: address.toLowerCase(),
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

  async createOrUpdateUser(address: string, data?: { ensName?: string; avatar?: string }) {
    return await prisma.user.upsert({
      where: { address: address.toLowerCase() },
      update: {
        ...data,
        lastActiveAt: new Date(),
      },
      create: {
        address: address.toLowerCase(),
        ...data,
      },
    })
  }
}
