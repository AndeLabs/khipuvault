/**
 * @fileoverview Fetch functions for Cooperative Pool data
 * @module lib/blockchain/fetch-cooperative-pools
 *
 * Separated from hooks for:
 * - Testability and reusability
 * - Type safety with explicit return types
 * - Easy integration with TanStack Query
 */

import { MEZO_TESTNET_ADDRESSES } from "@/lib/web3/contracts";
import { COOPERATIVE_POOL_ABI } from "@/lib/web3/cooperative-pool-abi";

import type { PublicClient } from "viem";

// Development-only logging
const isDev = process.env.NODE_ENV === "development";
// eslint-disable-next-line no-console
const devLog = isDev ? console.log.bind(console) : () => {};
// eslint-disable-next-line no-console
const devWarn = isDev ? console.warn.bind(console) : () => {};
// eslint-disable-next-line no-console
const devError = isDev ? console.error.bind(console) : () => {};

// Types matching contract interface
export interface PoolInfo {
  poolId: bigint;
  name: string;
  creator: string;
  minContribution: bigint;
  maxContribution: bigint;
  maxMembers: bigint;
  currentMembers: bigint;
  totalBtcDeposited: bigint;
  totalMusdMinted: bigint;
  totalYieldGenerated: bigint;
  createdAt: bigint;
  status: number; // 0=ACCEPTING, 1=ACTIVE, 2=CLOSED
  allowNewMembers: boolean;
}

export interface MemberInfo {
  btcContributed: bigint;
  shares: bigint;
  yieldClaimed: bigint;
  joinedAt: bigint;
  active: boolean;
}

const poolAddress = MEZO_TESTNET_ADDRESSES.cooperativePool as `0x${string}`;

/**
 * Fetch all cooperative pools from contract
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @param poolCounter - Total number of pools to fetch
 * @returns Array of PoolInfo objects
 */
export async function fetchCooperativePools(
  publicClient: PublicClient,
  poolCounter: number,
): Promise<PoolInfo[]> {
  if (!publicClient || poolCounter <= 0) {
    return [];
  }

  devLog(`🔄 Fetching ${poolCounter} cooperative pools`);

  try {
    const poolsData: PoolInfo[] = [];

    // Fetch each pool info in parallel where possible
    const poolPromises = Array.from({ length: poolCounter }, (_, i) =>
      publicClient.readContract({
        address: poolAddress,
        abi: COOPERATIVE_POOL_ABI,
        functionName: "getPoolInfo",
        args: [BigInt(i + 1)],
      }),
    );

    const results = await Promise.allSettled(poolPromises);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        try {
          poolsData.push(result.value as PoolInfo);
        } catch (error) {
          devWarn(`⚠️ Failed to parse pool ${i + 1}:`, error);
        }
      } else {
        devWarn(`⚠️ Failed to fetch pool ${i + 1}:`, result.reason);
      }
    }

    devLog(`✅ Fetched ${poolsData.length} cooperative pools`);
    return poolsData;
  } catch (error) {
    devError("Error fetching cooperative pools:", error);
    return [];
  }
}

/**
 * Fetch pool counter (total number of pools)
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @returns Total number of pools
 */
export async function fetchPoolCounter(
  publicClient: PublicClient,
): Promise<number> {
  if (!publicClient) {
    return 0;
  }

  try {
    const counter = await publicClient.readContract({
      address: poolAddress,
      abi: COOPERATIVE_POOL_ABI,
      functionName: "poolCounter",
    });

    return Number(counter || 0);
  } catch (error) {
    devError("Error fetching pool counter:", error);
    return 0;
  }
}

/**
 * Fetch specific pool info
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @param poolId - ID of the pool to fetch
 * @returns PoolInfo object
 */
export async function fetchPoolInfo(
  publicClient: PublicClient,
  poolId: number,
): Promise<PoolInfo | null> {
  if (!publicClient || poolId <= 0) {
    return null;
  }

  try {
    const poolInfo = await publicClient.readContract({
      address: poolAddress,
      abi: COOPERATIVE_POOL_ABI,
      functionName: "getPoolInfo",
      args: [BigInt(poolId)],
    });

    return poolInfo as PoolInfo;
  } catch (error) {
    devError(`Error fetching pool ${poolId}:`, error);
    return null;
  }
}

/**
 * Fetch member info for a specific pool
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @param poolId - ID of the pool
 * @param memberAddress - Address of the member
 * @returns MemberInfo object
 */
export async function fetchMemberInfo(
  publicClient: PublicClient,
  poolId: number,
  memberAddress: `0x${string}`,
): Promise<MemberInfo | null> {
  if (!publicClient || poolId <= 0 || !memberAddress) {
    return null;
  }

  try {
    const memberInfo = await publicClient.readContract({
      address: poolAddress,
      abi: COOPERATIVE_POOL_ABI,
      functionName: "getMemberInfo",
      args: [BigInt(poolId), memberAddress],
    });

    return memberInfo as MemberInfo;
  } catch (error) {
    devError(`Error fetching member info for pool ${poolId}:`, error);
    return null;
  }
}

/**
 * Fetch pool members
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @param poolId - ID of the pool
 * @returns Array of member addresses
 */
export async function fetchPoolMembers(
  publicClient: PublicClient,
  poolId: number,
): Promise<string[]> {
  if (!publicClient || poolId <= 0) {
    return [];
  }

  try {
    const members = await publicClient.readContract({
      address: poolAddress,
      abi: COOPERATIVE_POOL_ABI,
      functionName: "getPoolMembers",
      args: [BigInt(poolId)],
    });

    return (members as string[]) || [];
  } catch (error) {
    devError(`Error fetching pool members for pool ${poolId}:`, error);
    return [];
  }
}

/**
 * Calculate member yield
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @param poolId - ID of the pool
 * @param memberAddress - Address of the member
 * @returns Yield amount
 */
export async function fetchMemberYield(
  publicClient: PublicClient,
  poolId: number,
  memberAddress: `0x${string}`,
): Promise<bigint | null> {
  if (!publicClient || poolId <= 0 || !memberAddress) {
    return null;
  }

  try {
    const yieldAmount = await publicClient.readContract({
      address: poolAddress,
      abi: COOPERATIVE_POOL_ABI,
      functionName: "calculateMemberYield",
      args: [BigInt(poolId), memberAddress],
    });

    return yieldAmount as bigint;
  } catch (error) {
    devError(`Error calculating member yield:`, error);
    return null;
  }
}
