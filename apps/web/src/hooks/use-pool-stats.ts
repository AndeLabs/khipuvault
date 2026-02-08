/**
 * @fileoverview Pool statistics hook
 * @module hooks/use-pool-stats
 *
 * Fetches real-time pool statistics from backend API:
 * - activeDepositors: Count of unique users with balance > 0
 * - change24h: Percentage change in TVL over last 24 hours
 */

"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export interface PoolStats {
  /** Number of active depositors with balance > 0 */
  activeDepositors: number;
  /** 24h percentage change in TVL (e.g., 5.2 for +5.2%) */
  change24h: number;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
}

/**
 * Hook to fetch real-time pool statistics from backend
 *
 * @param poolAddress - Contract address of the pool
 * @returns Pool statistics including activeDepositors and change24h
 *
 * @example
 * ```tsx
 * const { activeDepositors, change24h, isLoading } = usePoolStats("0x...");
 * ```
 */
export function usePoolStats(poolAddress: string | undefined): PoolStats {
  const { data, isLoading, error } = useQuery({
    queryKey: ["pool-stats", poolAddress],
    queryFn: async () => {
      if (!poolAddress) {
        throw new Error("Pool address is required");
      }
      return await apiClient.getPoolStats(poolAddress);
    },
    enabled: !!poolAddress,
    staleTime: 30_000, // 30 seconds - fresh enough for dashboard
    refetchInterval: 60_000, // 1 minute - keep stats updated
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    activeDepositors: data?.activeDepositors ?? 0,
    change24h: data?.change24h ?? 0,
    isLoading,
    error: error as Error | null,
  };
}
