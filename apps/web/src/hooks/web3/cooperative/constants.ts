/**
 * @fileoverview Cooperative Pool V3 Constants and Types
 * @module hooks/web3/cooperative/constants
 */

import type { Address } from "viem";

// ============================================================================
// ENUMS
// ============================================================================

export enum PoolStatus {
  ACCEPTING = 0,
  ACTIVE = 1,
  CLOSED = 2,
}

// ============================================================================
// TYPES
// ============================================================================

export interface PoolInfo {
  minContribution: bigint;
  maxContribution: bigint;
  maxMembers: number;
  currentMembers: number;
  createdAt: number;
  status: PoolStatus;
  allowNewMembers: boolean;
  creator: Address;
  name: string;
  totalBtcDeposited: bigint;
  totalMusdMinted: bigint;
  totalYieldGenerated: bigint;
}

export interface MemberInfo {
  btcContributed: bigint;
  shares: bigint;
  joinedAt: number;
  active: boolean;
  yieldClaimed: bigint;
}

export interface MemberWithAddress extends MemberInfo {
  address: Address;
}

export type ActionState =
  | "idle"
  | "executing"
  | "processing"
  | "success"
  | "error";

// ============================================================================
// CONSTANTS
// ============================================================================

export const QUERY_KEYS = {
  BASE: ["cooperative-pool-v3"] as const,
  POOL_COUNTER: ["cooperative-pool-v3", "pool-counter"] as const,
  PERFORMANCE_FEE: ["cooperative-pool-v3", "performance-fee"] as const,
  EMERGENCY_MODE: ["cooperative-pool-v3", "emergency-mode"] as const,
  POOL_INFO: (poolId: number) =>
    ["cooperative-pool-v3", "pool-info", poolId] as const,
  MEMBER_INFO: (poolId: number, address: Address) =>
    ["cooperative-pool-v3", "member-info", poolId, address] as const,
  POOL_MEMBERS: (poolId: number) =>
    ["cooperative-pool-v3", "pool-members", poolId] as const,
  MEMBER_YIELD: (poolId: number, address: Address) =>
    ["cooperative-pool-v3", "member-yield", poolId, address] as const,
} as const;

// PRODUCTION OPTIMIZED: Conservative stale times to minimize RPC load
// Goal: Reduce RPC calls by 60-70% while maintaining acceptable UX
// With 100 users viewing 10 pools each, aggressive intervals cause 1000+ RPC calls/minute
export const STALE_TIMES = {
  POOL_COUNTER: 120_000, // 2 min - counter only changes when pools created (rare)
  PERFORMANCE_FEE: 600_000, // 10 min - admin config, almost never changes
  EMERGENCY_MODE: 120_000, // 2 min - check less frequently, alert system handles emergencies
  POOL_INFO: 60_000, // 1 min - pool info rarely changes during session
  MEMBER_INFO: 60_000, // 1 min - member info rarely changes
  POOL_MEMBERS: 120_000, // 2 min - member list changes slowly
  MEMBER_YIELD: 120_000, // 2 min - yield accrues slowly, expensive RPC call
} as const;

// PRODUCTION OPTIMIZED: Conservative refetch intervals
// These control automatic background refreshes - users can always manually refresh
export const REFETCH_INTERVALS = {
  POOL_INFO: 120_000, // 2 min - pool state changes slowly
  MEMBER_INFO: 120_000, // 2 min - member state rarely changes
  POOL_MEMBERS: 300_000, // 5 min - member list rarely changes
  MEMBER_YIELD: 300_000, // 5 min - yield calculation is expensive, accrues slowly
} as const;
