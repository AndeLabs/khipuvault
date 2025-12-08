/**
 * @fileoverview Hook to fetch all Cooperative Pools V3
 *
 * Features:
 * ✅ Fetch all pools with complete info
 * ✅ Filter by status (ACCEPTING, ACTIVE, CLOSED)
 * ✅ Sort by various criteria
 * ✅ User membership detection
 * ✅ Aggregate statistics
 */

"use client";

import { useAccount, useConfig } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { type Address } from "viem";
import {
  MEZO_TESTNET_ADDRESSES,
  COOPERATIVE_POOL_V3_ABI as POOL_ABI,
} from "@/lib/web3/contracts-v3";
import { PoolStatus, type PoolInfo } from "./use-cooperative-pool";

export interface PoolWithMembership extends PoolInfo {
  poolId: number;
  isMember: boolean;
  userContribution: bigint;
  userShares: bigint;
  userPendingYield: bigint;
}

export interface PoolsStatistics {
  totalPools: number;
  acceptingPools: number;
  activePools: number;
  closedPools: number;
  totalBtcLocked: bigint;
  totalMembers: number;
  userMemberships: number;
}

export function useAllCooperativePools() {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const poolAddress = MEZO_TESTNET_ADDRESSES.cooperativePoolV3 as Address;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["cooperative-pool-v3", "all-pools", address],
    queryFn: async () => {
      try {
        // Get pool counter
        const poolCounter = await readContract(config, {
          address: poolAddress,
          abi: POOL_ABI,
          functionName: "poolCounter",
          args: [],
        });

        const totalPools = Number(poolCounter || 0n);

        if (totalPools === 0) {
          return {
            pools: [],
            statistics: {
              totalPools: 0,
              acceptingPools: 0,
              activePools: 0,
              closedPools: 0,
              totalBtcLocked: BigInt(0),
              totalMembers: 0,
              userMemberships: 0,
            } as PoolsStatistics,
          };
        }

        // Fetch pools with CONCURRENCY CONTROL to prevent RPC rate limiting
        // With 100 pools and no limit, we'd send 300+ simultaneous RPC calls
        const CONCURRENCY_LIMIT = 5; // Max 5 concurrent pool fetches
        const poolIds = Array.from({ length: totalPools }, (_, i) => i + 1);
        const poolsResults: (PoolWithMembership | null)[] = [];

        // Process pools in batches
        for (let i = 0; i < poolIds.length; i += CONCURRENCY_LIMIT) {
          const batch = poolIds.slice(i, i + CONCURRENCY_LIMIT);
          const batchPromises = batch.map(async (poolId) => {
            try {
              // Get pool info
              const poolInfoResult = await readContract(config, {
                address: poolAddress,
                abi: POOL_ABI,
                functionName: "getPoolInfo",
                args: [BigInt(poolId)],
              });

              // Contract returns an object, not an array
              if (!poolInfoResult) {
                return null;
              }

              // Access as object properties (viem returns struct as object)
              const poolInfo: PoolInfo = {
                minContribution:
                  (poolInfoResult as any).minContribution || BigInt(0),
                maxContribution:
                  (poolInfoResult as any).maxContribution || BigInt(0),
                maxMembers: Number((poolInfoResult as any).maxMembers || 0),
                currentMembers: Number(
                  (poolInfoResult as any).currentMembers || 0,
                ),
                createdAt: Number((poolInfoResult as any).createdAt || 0),
                status: ((poolInfoResult as any).status ?? 0) as PoolStatus,
                allowNewMembers:
                  (poolInfoResult as any).allowNewMembers ?? false,
                creator: (poolInfoResult as any).creator as Address,
                name: (poolInfoResult as any).name || `Pool #${poolId}`,
                totalBtcDeposited:
                  (poolInfoResult as any).totalBtcDeposited || BigInt(0),
                totalMusdMinted:
                  (poolInfoResult as any).totalMusdMinted || BigInt(0),
                totalYieldGenerated:
                  (poolInfoResult as any).totalYieldGenerated || BigInt(0),
              };

              // Get user membership info if connected
              let isMember = false;
              let userContribution = BigInt(0);
              let userShares = BigInt(0);
              let userPendingYield = BigInt(0);

              if (address) {
                try {
                  const memberInfoResult = await readContract(config, {
                    address: poolAddress,
                    abi: POOL_ABI,
                    functionName: "getMemberInfo",
                    args: [BigInt(poolId), address],
                  });

                  // Contract returns object, not array
                  if (memberInfoResult) {
                    // Contract uses 'active' not 'isMember', and 'btcContributed' not 'contribution'
                    isMember = (memberInfoResult as any).active ?? false;
                    userContribution =
                      (memberInfoResult as any).btcContributed || BigInt(0);
                    userShares = (memberInfoResult as any).shares || BigInt(0);
                  }

                  // Get pending yield if member
                  if (isMember) {
                    const yieldResult = await readContract(config, {
                      address: poolAddress,
                      abi: POOL_ABI,
                      functionName: "calculateMemberYield",
                      args: [BigInt(poolId), address],
                    });
                    userPendingYield = BigInt(
                      (yieldResult as unknown as bigint) || 0n,
                    );
                  }
                } catch (err) {
                  // Member info not available, user not a member
                }
              }

              const pool: PoolWithMembership = {
                ...poolInfo,
                poolId,
                isMember,
                userContribution,
                userShares,
                userPendingYield,
              };

              return pool;
            } catch (err) {
              // Pool fetch failed, skip this pool
              return null;
            }
          });

          const batchResults = await Promise.all(batchPromises);
          poolsResults.push(...batchResults);
        }
        const pools = poolsResults.filter(
          (p): p is PoolWithMembership => p !== null,
        );

        // Calculate statistics
        const statistics: PoolsStatistics = {
          totalPools: pools.length,
          acceptingPools: pools.filter((p) => p.status === PoolStatus.ACCEPTING)
            .length,
          activePools: pools.filter((p) => p.status === PoolStatus.ACTIVE)
            .length,
          closedPools: pools.filter((p) => p.status === PoolStatus.CLOSED)
            .length,
          totalBtcLocked: pools.reduce(
            (sum, p) => sum + p.totalBtcDeposited,
            BigInt(0),
          ),
          totalMembers: pools.reduce((sum, p) => sum + p.currentMembers, 0),
          userMemberships: pools.filter((p) => p.isMember).length,
        };

        return { pools, statistics };
      } catch (err) {
        throw err;
      }
    },
    enabled: isConnected,
    staleTime: 60_000, // 1 min - pool data doesn't change frequently
    refetchInterval: 120_000, // 2 min - conservative to reduce RPC load
    retry: 2,
  });

  return {
    pools: data?.pools || [],
    statistics: data?.statistics || {
      totalPools: 0,
      acceptingPools: 0,
      activePools: 0,
      closedPools: 0,
      totalBtcLocked: BigInt(0),
      totalMembers: 0,
      userMemberships: 0,
    },
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// FILTERED HOOKS
// ============================================================================

export function useUserPools() {
  const { pools, isLoading, error, refetch } = useAllCooperativePools();

  const userPools = pools.filter((pool) => pool.isMember);

  return {
    pools: userPools,
    isLoading,
    error,
    refetch,
  };
}

export function useAvailablePools() {
  const { pools, isLoading, error, refetch } = useAllCooperativePools();

  const availablePools = pools.filter(
    (pool) =>
      pool.status === PoolStatus.ACCEPTING &&
      pool.allowNewMembers &&
      pool.currentMembers < pool.maxMembers &&
      !pool.isMember,
  );

  return {
    pools: availablePools,
    isLoading,
    error,
    refetch,
  };
}

export function useCreatedPools() {
  const { address } = useAccount();
  const { pools, isLoading, error, refetch } = useAllCooperativePools();

  const createdPools = pools.filter(
    (pool) => address && pool.creator.toLowerCase() === address.toLowerCase(),
  );

  return {
    pools: createdPools,
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// SORTING AND FILTERING UTILITIES
// ============================================================================

export type SortBy = "newest" | "oldest" | "members" | "deposits" | "yields";
export type FilterStatus = "all" | "accepting" | "active" | "closed";

export function sortPools(
  pools: PoolWithMembership[],
  sortBy: SortBy,
): PoolWithMembership[] {
  const sorted = [...pools];

  // Helper for safe BigInt comparison (avoids Number() precision loss)
  const compareBigInt = (a: bigint, b: bigint): number => {
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
  };

  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case "oldest":
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case "members":
      return sorted.sort((a, b) => b.currentMembers - a.currentMembers);
    case "deposits":
      // Use BigInt comparison to avoid precision loss with large deposits
      return sorted.sort((a, b) =>
        compareBigInt(b.totalBtcDeposited, a.totalBtcDeposited),
      );
    case "yields":
      // Use BigInt comparison to avoid precision loss with large yields
      return sorted.sort((a, b) =>
        compareBigInt(b.totalYieldGenerated, a.totalYieldGenerated),
      );
    default:
      return sorted;
  }
}

export function filterPoolsByStatus(
  pools: PoolWithMembership[],
  status: FilterStatus,
): PoolWithMembership[] {
  if (status === "all") return pools;

  const statusMap = {
    accepting: PoolStatus.ACCEPTING,
    active: PoolStatus.ACTIVE,
    closed: PoolStatus.CLOSED,
  };

  return pools.filter((pool) => pool.status === statusMap[status]);
}

export function filterPoolsByContribution(
  pools: PoolWithMembership[],
  minBtc: bigint,
  maxBtc: bigint,
): PoolWithMembership[] {
  return pools.filter(
    (pool) => pool.minContribution >= minBtc && pool.maxContribution <= maxBtc,
  );
}

export function searchPools(
  pools: PoolWithMembership[],
  query: string,
): PoolWithMembership[] {
  if (!query.trim()) return pools;

  const lowerQuery = query.toLowerCase();

  return pools.filter(
    (pool) =>
      pool.name.toLowerCase().includes(lowerQuery) ||
      pool.poolId.toString().includes(lowerQuery) ||
      pool.creator.toLowerCase().includes(lowerQuery),
  );
}
