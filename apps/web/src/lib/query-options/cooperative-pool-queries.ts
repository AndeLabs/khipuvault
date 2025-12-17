/**
 * @fileoverview Query options for Cooperative Pool
 * @module lib/query-options/cooperative-pool-queries
 *
 * This file defines reusable query options using TanStack Query's queryOptions helper.
 * This is a best practice that allows:
 * - Type-safe query options
 * - Reuse across useQuery, useSuspenseQuery, useQueries, prefetchQuery, etc.
 * - Co-location of queryKey, queryFn, and options
 * - Easier testing and maintenance
 */

import { queryOptions } from "@tanstack/react-query";

import {
  fetchCooperativePools,
  fetchPoolInfo,
  fetchMemberInfo,
  fetchPoolMembers,
  fetchMemberYield,
} from "@/lib/blockchain/fetch-cooperative-pools";
import { normalizeBigInt } from "@/lib/query-utils";

import type { PublicClient } from "viem";

/**
 * Query options for Cooperative Pool
 *
 * Usage:
 * ```tsx
 * const { data: pools } = useQuery(
 *   cooperativePoolQueries.allPools(publicClient, poolCounter)
 * )
 * ```
 */
export const cooperativePoolQueries = {
  /**
   * All pools query options
   *
   * @param publicClient - Viem PublicClient
   * @param poolCounter - Total number of pools
   * @returns Query options object
   */
  allPools: (
    publicClient: PublicClient | null,
    poolCounter: number | bigint | undefined,
  ) =>
    queryOptions({
      queryKey: ["cooperative-pool", "all-pools", normalizeBigInt(poolCounter)],
      queryFn: async () => {
        if (!publicClient) {
          return [];
        }
        return fetchCooperativePools(publicClient, Number(poolCounter ?? 0));
      },
      enabled: !!publicClient && !!poolCounter && Number(poolCounter) > 0,
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    }),

  /**
   * Specific pool info query options
   *
   * @param publicClient - Viem PublicClient
   * @param poolId - ID of the pool
   * @returns Query options object
   */
  poolInfo: (publicClient: PublicClient | null, poolId: number) =>
    queryOptions({
      queryKey: ["cooperative-pool", "pool-info", poolId],
      queryFn: async () => {
        if (!publicClient) {
          return null;
        }
        return fetchPoolInfo(publicClient, poolId);
      },
      enabled: !!publicClient && poolId > 0,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    }),

  /**
   * Member info query options
   *
   * @param publicClient - Viem PublicClient
   * @param poolId - ID of the pool
   * @param memberAddress - Address of the member
   * @returns Query options object
   */
  memberInfo: (
    publicClient: PublicClient | null,
    poolId: number,
    memberAddress: `0x${string}` | undefined,
  ) =>
    queryOptions({
      queryKey: [
        "cooperative-pool",
        "member-info",
        poolId,
        memberAddress ?? "none",
      ],
      queryFn: async () => {
        if (!publicClient || !memberAddress) {
          return null;
        }
        return fetchMemberInfo(publicClient, poolId, memberAddress);
      },
      enabled: !!publicClient && poolId > 0 && !!memberAddress,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    }),

  /**
   * Pool members query options
   *
   * @param publicClient - Viem PublicClient
   * @param poolId - ID of the pool
   * @returns Query options object
   */
  poolMembers: (publicClient: PublicClient | null, poolId: number) =>
    queryOptions({
      queryKey: ["cooperative-pool", "members", poolId],
      queryFn: async () => {
        if (!publicClient) {
          return [];
        }
        return fetchPoolMembers(publicClient, poolId);
      },
      enabled: !!publicClient && poolId > 0,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    }),

  /**
   * Member yield query options
   *
   * @param publicClient - Viem PublicClient
   * @param poolId - ID of the pool
   * @param memberAddress - Address of the member
   * @returns Query options object
   */
  memberYield: (
    publicClient: PublicClient | null,
    poolId: number,
    memberAddress: `0x${string}` | undefined,
  ) =>
    queryOptions({
      queryKey: [
        "cooperative-pool",
        "member-yield",
        poolId,
        memberAddress ?? "none",
      ],
      queryFn: async () => {
        if (!publicClient || !memberAddress) {
          return null;
        }
        return fetchMemberYield(publicClient, poolId, memberAddress);
      },
      enabled: !!publicClient && poolId > 0 && !!memberAddress,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    }),
};
