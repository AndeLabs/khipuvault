/**
 * @fileoverview Cooperative Pool V3 Constants and Types
 * @module hooks/web3/cooperative/constants
 */

import type { Address } from 'viem'

// ============================================================================
// ENUMS
// ============================================================================

export enum PoolStatus {
  ACCEPTING = 0,
  ACTIVE = 1,
  CLOSED = 2
}

// ============================================================================
// TYPES
// ============================================================================

export interface PoolInfo {
  minContribution: bigint
  maxContribution: bigint
  maxMembers: number
  currentMembers: number
  createdAt: number
  status: PoolStatus
  allowNewMembers: boolean
  creator: Address
  name: string
  totalBtcDeposited: bigint
  totalMusdMinted: bigint
  totalYieldGenerated: bigint
}

export interface MemberInfo {
  btcContributed: bigint
  shares: bigint
  joinedAt: number
  active: boolean
  yieldClaimed: bigint
}

export interface MemberWithAddress extends MemberInfo {
  address: Address
}

export type ActionState =
  | 'idle'
  | 'executing'
  | 'processing'
  | 'success'
  | 'error'

// ============================================================================
// CONSTANTS
// ============================================================================

export const QUERY_KEYS = {
  BASE: ['cooperative-pool-v3'] as const,
  POOL_COUNTER: ['cooperative-pool-v3', 'pool-counter'] as const,
  PERFORMANCE_FEE: ['cooperative-pool-v3', 'performance-fee'] as const,
  EMERGENCY_MODE: ['cooperative-pool-v3', 'emergency-mode'] as const,
  POOL_INFO: (poolId: number) => ['cooperative-pool-v3', 'pool-info', poolId] as const,
  MEMBER_INFO: (poolId: number, address: Address) =>
    ['cooperative-pool-v3', 'member-info', poolId, address] as const,
  POOL_MEMBERS: (poolId: number) => ['cooperative-pool-v3', 'pool-members', poolId] as const,
  MEMBER_YIELD: (poolId: number, address: Address) =>
    ['cooperative-pool-v3', 'member-yield', poolId, address] as const,
} as const

// OPTIMIZED: Increased stale times to reduce RPC load
// Previous values were too aggressive (5-10s) causing excessive RPC calls
export const STALE_TIMES = {
  POOL_COUNTER: 60_000,     // 1 min (was 30s) - counter rarely changes
  PERFORMANCE_FEE: 300_000, // 5 min (was 60s) - config rarely changes
  EMERGENCY_MODE: 60_000,   // 1 min (was 30s) - check less frequently
  POOL_INFO: 30_000,        // 30s (was 10s) - pool info doesn't change often
  MEMBER_INFO: 30_000,      // 30s (was 10s) - member info doesn't change often
  POOL_MEMBERS: 60_000,     // 1 min (was 30s) - member list rarely changes
  MEMBER_YIELD: 30_000,     // 30s (was 5s) - yield accrues slowly
} as const

// OPTIMIZED: Increased refetch intervals to reduce RPC load
// With 10 users viewing 5 pools each, previous values caused 100+ RPC calls/minute
export const REFETCH_INTERVALS = {
  POOL_INFO: 60_000,        // 1 min (was 30s)
  MEMBER_INFO: 60_000,      // 1 min (was 30s)
  POOL_MEMBERS: 120_000,    // 2 min (was 60s)
  MEMBER_YIELD: 60_000,     // 1 min (was 15s) - yield calc is expensive
} as const
