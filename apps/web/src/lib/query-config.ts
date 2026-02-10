/**
 * Centralized React Query Configuration
 *
 * Provides consistent caching and refetching settings across all hooks.
 * Use these presets instead of hardcoding staleTime, gcTime, etc.
 *
 * @example
 * ```ts
 * import { QUERY_PRESETS } from "@/lib/query-config";
 *
 * useQuery({
 *   queryKey: ["my-query"],
 *   queryFn: fetchData,
 *   ...QUERY_PRESETS.BLOCKCHAIN_READ,
 * });
 * ```
 */

/**
 * Time constants in milliseconds
 */
export const TIME = {
  SECONDS: (n: number) => n * 1000,
  MINUTES: (n: number) => n * 60 * 1000,
} as const;

/**
 * Query preset configurations for different use cases
 *
 * REALTIME: For data that changes frequently (balances, pending yields)
 * BLOCKCHAIN_READ: For on-chain data that updates with each block
 * NORMAL: Default caching for most API calls
 * SLOW: For data that rarely changes (pool info, user settings)
 * STATIC: For data that never changes (contract addresses, chain config)
 */
export const QUERY_PRESETS = {
  /**
   * Real-time data - aggressive refetching
   * Use for: balances, pending transactions, live yields
   */
  REALTIME: {
    staleTime: TIME.SECONDS(5),
    gcTime: TIME.MINUTES(1),
    refetchInterval: TIME.SECONDS(10),
    retry: 2,
    retryDelay: TIME.SECONDS(1),
  },

  /**
   * Blockchain reads - moderate caching
   * Use for: contract state, pool info, member lists
   */
  BLOCKCHAIN_READ: {
    staleTime: TIME.SECONDS(30),
    gcTime: TIME.MINUTES(5),
    refetchInterval: TIME.SECONDS(30),
    retry: 3,
    retryDelay: TIME.SECONDS(2),
  },

  /**
   * Normal API calls - standard caching
   * Use for: user data, transaction history
   */
  NORMAL: {
    staleTime: TIME.MINUTES(1),
    gcTime: TIME.MINUTES(10),
    retry: 2,
    retryDelay: TIME.SECONDS(1),
  },

  /**
   * Slow-changing data - long cache
   * Use for: pool configurations, historical data
   */
  SLOW: {
    staleTime: TIME.MINUTES(5),
    gcTime: TIME.MINUTES(30),
    retry: 3,
    retryDelay: TIME.SECONDS(2),
  },

  /**
   * Static data - cache forever
   * Use for: chain config, contract ABIs, constants
   */
  STATIC: {
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  },

  /**
   * User-triggered only - no automatic refetch
   * Use for: manual refresh buttons, one-time fetches
   */
  MANUAL: {
    staleTime: TIME.MINUTES(5),
    gcTime: TIME.MINUTES(30),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  },
} as const;

/**
 * Refetch intervals for polling
 */
export const REFETCH_INTERVALS = {
  /** Fast polling - every 5 seconds */
  FAST: TIME.SECONDS(5),
  /** Normal polling - every 15 seconds */
  NORMAL: TIME.SECONDS(15),
  /** Slow polling - every 30 seconds */
  SLOW: TIME.SECONDS(30),
  /** Very slow polling - every minute */
  VERY_SLOW: TIME.MINUTES(1),
} as const;

/**
 * Default query options that should be applied globally
 */
export const DEFAULT_QUERY_OPTIONS = {
  staleTime: QUERY_PRESETS.NORMAL.staleTime,
  gcTime: QUERY_PRESETS.NORMAL.gcTime,
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const;

export type QueryPreset = keyof typeof QUERY_PRESETS;
