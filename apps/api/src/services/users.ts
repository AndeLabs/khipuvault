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
    // OPTIMIZED: Single query with groupBy to avoid N+1 problem
    const normalizedAddress = address.toLowerCase()

    // Get all deposits in one query
    const allDeposits = await prisma.deposit.findMany({
      where: { userAddress: normalizedAddress },
      select: {
        poolAddress: true,
        type: true,
        amount: true,
      },
    })

    // Get unique pool addresses
    const poolAddresses = [...new Set(allDeposits.map(d => d.poolAddress))]

    // Get all pools in one query
    const pools = await prisma.pool.findMany({
      where: { contractAddress: { in: poolAddresses } },
      select: {
        contractAddress: true,
        name: true,
        poolType: true,
      },
    })

    // Create pool lookup map for O(1) access
    const poolMap = new Map(pools.map(p => [p.contractAddress, p]))

    // Group deposits by pool and calculate totals in memory (much faster than N queries)
    const positionMap = new Map<string, {
      deposited: bigint
      withdrawn: bigint
      yieldClaimed: bigint
    }>()

    for (const deposit of allDeposits) {
      if (!positionMap.has(deposit.poolAddress)) {
        positionMap.set(deposit.poolAddress, {
          deposited: BigInt(0),
          withdrawn: BigInt(0),
          yieldClaimed: BigInt(0),
        })
      }

      const position = positionMap.get(deposit.poolAddress)!
      const amount = BigInt(deposit.amount)

      if (deposit.type === 'DEPOSIT') {
        position.deposited += amount
      } else if (deposit.type === 'WITHDRAW') {
        position.withdrawn += amount
      } else if (deposit.type === 'YIELD_CLAIM') {
        position.yieldClaimed += amount
      }
    }

    // Build result array
    const positions = Array.from(positionMap.entries()).map(([poolAddress, totals]) => {
      const pool = poolMap.get(poolAddress)
      const balance = totals.deposited - totals.withdrawn

      return {
        poolAddress,
        poolName: pool?.name || 'Unknown Pool',
        poolType: pool?.poolType || 'unknown',
        balance: balance.toString(),
        totalDeposited: totals.deposited.toString(),
        totalWithdrawn: totals.withdrawn.toString(),
        totalYieldClaimed: totals.yieldClaimed.toString(),
      }
    })

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
