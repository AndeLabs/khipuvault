import { z } from 'zod'

export const PoolTypeSchema = z.enum(['individual', 'cooperative', 'lottery', 'rotating'])
export type PoolType = z.infer<typeof PoolTypeSchema>

export const PoolStatusSchema = z.enum(['active', 'paused', 'emergency', 'closed'])
export type PoolStatus = z.infer<typeof PoolStatusSchema>

export interface Pool {
  id: string
  contractAddress: string
  poolType: PoolType
  name: string
  tvl: string // BigInt as string
  apr: number
  totalUsers: number
  totalDeposits: number
  status: PoolStatus
  createdAt: Date
  updatedAt: Date
}

export interface UserPosition {
  poolId: string
  userId: string
  principal: string // BigInt as string
  yields: string // BigInt as string
  shares: string // BigInt as string
  depositedAt: Date
  lastClaimAt: Date | null
  autoCompound: boolean
}

export interface PoolAnalytics {
  poolId: string
  date: Date
  tvl: string
  apr: number
  totalDeposits: number
  totalUsers: number
  volumeIn: string
  volumeOut: string
}
