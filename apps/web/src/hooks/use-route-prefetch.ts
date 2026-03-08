/**
 * @fileoverview Route Prefetching Hook
 * @module hooks/use-route-prefetch
 *
 * Optimized prefetching for critical routes.
 * Uses React Query prefetchQuery for data preloading on hover/focus.
 *
 * Best Practices:
 * - Prefetch on link hover (mouseenter/focus)
 * - Use debounced prefetch to avoid excessive calls
 * - Only prefetch queries that are likely to be needed
 * - Respect staleTime to avoid redundant fetches
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { usePublicClient } from "wagmi";

import { fetchCurrentRoundId, fetchRoundInfo } from "@/lib/blockchain/fetch-lottery-pools";
import { QUERY_PRESETS } from "@/lib/query-config";
import { queryKeys } from "@/lib/query-keys";

/**
 * Debounce delay for prefetching (ms)
 * Prevents rapid prefetch calls on quick mouse movements
 */
const PREFETCH_DEBOUNCE = 100;

/**
 * Hook for optimized route data prefetching
 *
 * @example
 * ```tsx
 * const { prefetchDashboard, prefetchLottery } = useRoutePrefetch();
 *
 * <Link href="/dashboard" onMouseEnter={prefetchDashboard}>
 *   Dashboard
 * </Link>
 * ```
 */
export function useRoutePrefetch() {
  const queryClient = useQueryClient();
  const publicClient = usePublicClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Debounced prefetch helper
   */
  const debouncedPrefetch = useCallback((prefetchFn: () => Promise<void>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      void prefetchFn();
    }, PREFETCH_DEBOUNCE);
  }, []);

  /**
   * Prefetch dashboard data
   * - Individual pool stats
   * - User balances
   */
  const prefetchDashboard = useCallback(() => {
    debouncedPrefetch(async () => {
      // Prefetch pool stats
      await queryClient.prefetchQuery({
        queryKey: queryKeys.individualPool.stats(),
        ...QUERY_PRESETS.POOL_INFO,
      });
    });
  }, [queryClient, debouncedPrefetch]);

  /**
   * Prefetch individual savings page data
   */
  const prefetchIndividualPool = useCallback(() => {
    debouncedPrefetch(async () => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.individualPool.poolInfo(),
        ...QUERY_PRESETS.POOL_INFO,
      });
    });
  }, [queryClient, debouncedPrefetch]);

  /**
   * Prefetch cooperative savings page data
   */
  const prefetchCooperativePools = useCallback(() => {
    debouncedPrefetch(async () => {
      // Prefetch pool counter
      await queryClient.prefetchQuery({
        queryKey: queryKeys.cooperativePool.poolCounter(),
        ...QUERY_PRESETS.POOL_CONFIG,
      });
    });
  }, [queryClient, debouncedPrefetch]);

  /**
   * Prefetch rotating pools page data
   */
  const prefetchRotatingPools = useCallback(() => {
    debouncedPrefetch(async () => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.rotatingPool.pools(),
        ...QUERY_PRESETS.POOL_INFO,
      });
    });
  }, [queryClient, debouncedPrefetch]);

  /**
   * Prefetch lottery/prize pool data
   */
  const prefetchLotteryPool = useCallback(() => {
    if (!publicClient) {
      return;
    }

    debouncedPrefetch(async () => {
      // Prefetch current round ID
      const currentRoundId = await queryClient.fetchQuery({
        queryKey: queryKeys.lotteryPool.currentRound(),
        queryFn: () => fetchCurrentRoundId(publicClient),
        ...QUERY_PRESETS.REALTIME,
      });

      // Prefetch round info if we have a current round
      if (currentRoundId && currentRoundId > 0) {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.lotteryPool.roundInfo(currentRoundId),
          queryFn: () => fetchRoundInfo(publicClient, currentRoundId),
          ...QUERY_PRESETS.REALTIME,
        });
      }
    });
  }, [queryClient, publicClient, debouncedPrefetch]);

  /**
   * Prefetch all critical data for initial app load
   */
  const prefetchCriticalData = useCallback(() => {
    void prefetchDashboard();
  }, [prefetchDashboard]);

  return {
    prefetchDashboard,
    prefetchIndividualPool,
    prefetchCooperativePools,
    prefetchRotatingPools,
    prefetchLotteryPool,
    prefetchCriticalData,
  };
}

/**
 * Link props helper for prefetching
 *
 * @example
 * ```tsx
 * const prefetchProps = usePrefetchLinkProps();
 *
 * <Link href="/dashboard" {...prefetchProps.dashboard}>
 *   Dashboard
 * </Link>
 * ```
 */
export function usePrefetchLinkProps() {
  const {
    prefetchDashboard,
    prefetchIndividualPool,
    prefetchCooperativePools,
    prefetchRotatingPools,
    prefetchLotteryPool,
  } = useRoutePrefetch();

  return {
    dashboard: {
      onMouseEnter: prefetchDashboard,
      onFocus: prefetchDashboard,
    },
    individualSavings: {
      onMouseEnter: prefetchIndividualPool,
      onFocus: prefetchIndividualPool,
    },
    cooperativeSavings: {
      onMouseEnter: prefetchCooperativePools,
      onFocus: prefetchCooperativePools,
    },
    rotatingPool: {
      onMouseEnter: prefetchRotatingPools,
      onFocus: prefetchRotatingPools,
    },
    prizePool: {
      onMouseEnter: prefetchLotteryPool,
      onFocus: prefetchLotteryPool,
    },
  };
}
