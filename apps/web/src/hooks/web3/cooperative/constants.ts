/**
 * @fileoverview Cooperative Pool V3 Types and Constants
 * @module hooks/web3/cooperative/constants
 *
 * NOTE: Query keys are centralized in @/lib/query-keys
 * NOTE: Query config (staleTime, etc.) is in @/lib/query-config
 */

import type { Address } from "viem";

// Re-export centralized query keys for backwards compatibility
export { queryKeys } from "@/lib/query-keys";
export { QUERY_PRESETS, TIME } from "@/lib/query-config";

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
  id?: number;
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

export type ActionState = "idle" | "executing" | "processing" | "success" | "error";

// ============================================================================
// CONTRACT RESPONSE TYPES (match Solidity struct layout)
// ============================================================================

/**
 * Raw contract response for getMemberInfo
 * Fields are bigint as returned by the EVM
 */
export interface MemberInfoContractResponse {
  btcContributed: bigint;
  shares: bigint;
  joinedAt: bigint;
  active: boolean;
  yieldClaimed: bigint;
}

/**
 * Raw contract response for getPoolInfo
 * Fields are bigint as returned by the EVM
 */
export interface PoolInfoContractResponse {
  minContribution: bigint;
  maxContribution: bigint;
  maxMembers: bigint;
  currentMembers: bigint;
  createdAt: bigint;
  status: number;
  allowNewMembers: boolean;
  creator: Address;
  name: string;
  totalBtcDeposited: bigint;
  totalMusdMinted: bigint;
  totalYieldGenerated: bigint;
}

/**
 * Parse MemberInfo from contract response
 */
export function parseMemberInfo(raw: MemberInfoContractResponse): MemberInfo {
  return {
    btcContributed: raw.btcContributed,
    shares: raw.shares,
    joinedAt: Number(raw.joinedAt),
    active: raw.active,
    yieldClaimed: raw.yieldClaimed,
  };
}

/**
 * Parse PoolInfo from contract response
 */
export function parsePoolInfo(raw: PoolInfoContractResponse): PoolInfo {
  return {
    minContribution: raw.minContribution,
    maxContribution: raw.maxContribution,
    maxMembers: Number(raw.maxMembers),
    currentMembers: Number(raw.currentMembers),
    createdAt: Number(raw.createdAt),
    status: raw.status as PoolStatus,
    allowNewMembers: raw.allowNewMembers,
    creator: raw.creator,
    name: raw.name || "Unknown Pool",
    totalBtcDeposited: raw.totalBtcDeposited,
    totalMusdMinted: raw.totalMusdMinted,
    totalYieldGenerated: raw.totalYieldGenerated,
  };
}
