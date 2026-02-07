/**
 * Hook to prefetch data for routes on hover
 * @module hooks/use-route-prefetch
 *
 * Best Practices 2026:
 * - Prefetch queries on link hover
 * - Improves perceived performance
 * - Uses React Query prefetchQuery
 */

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Hook to prefetch route data on hover
 */
export function useRoutePrefetch() {
  const queryClient = useQueryClient();

  /**
   * Prefetch individual pool data
   */
  const prefetchIndividualPool = useCallback(() => {
    // Individual pool queries are handled by useIndividualPoolV3
    // The hook automatically fetches when the component mounts
    // Prefetching here would duplicate the logic
    // Instead, we rely on staleTime to keep data fresh
  }, []);

  /**
   * Prefetch cooperative pools data
   */
  const prefetchCooperativePools = useCallback(() => {
    // Cooperative pools are prefetched automatically
    // by useAllCooperativePools hook when component mounts
  }, []);

  /**
   * Prefetch rotating pools data
   */
  const prefetchRotatingPools = useCallback(async () => {
    // Prefetch pool counter
    await queryClient.prefetchQuery({
      queryKey: ["rotating-pool-counter"],
      staleTime: 1000 * 30, // 30 sec
    });
  }, [queryClient]);

  /**
   * Prefetch lottery pool data
   */
  const prefetchLotteryPool = useCallback(() => {
    // Lottery pool queries are handled by useLotteryPool
    // Rely on automatic fetching when component mounts
  }, []);

  return {
    prefetchIndividualPool,
    prefetchCooperativePools,
    prefetchRotatingPools,
    prefetchLotteryPool,
  };
}
