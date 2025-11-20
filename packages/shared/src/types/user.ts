export interface User {
  id: string
  address: string
  ensName?: string
  avatar?: string
  createdAt: Date
  lastActiveAt: Date
}

export interface UserPortfolio {
  userId: string
  totalDeposited: string
  totalYields: string
  totalValue: string
  positions: UserPortfolioPosition[]
}

export interface UserPortfolioPosition {
  poolType: string
  poolId: string
  poolName: string
  principal: string
  yields: string
  apr: number
  depositedAt: Date
}
