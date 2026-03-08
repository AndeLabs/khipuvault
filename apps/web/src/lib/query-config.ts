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

  // ===========================================================================
  // PRODUCTION OPTIMIZED PRESETS
  // Goal: Reduce RPC calls by 60-70% while maintaining acceptable UX
  // With 100 users viewing 10 pools each, aggressive intervals cause 1000+ RPC calls/minute
  // ===========================================================================

  /**
   * Pool counter/config - almost never changes
   * Use for: pool counters, admin configs, emergency mode
   */
  POOL_CONFIG: {
    staleTime: TIME.MINUTES(2),
    gcTime: TIME.MINUTES(10),
    retry: 3,
    retryDelay: TIME.SECONDS(2),
  },

  /**
   * Pool/Member info - changes slowly
   * Use for: pool details, member info
   */
  POOL_INFO: {
    staleTime: TIME.MINUTES(1),
    gcTime: TIME.MINUTES(5),
    refetchInterval: TIME.MINUTES(2),
    retry: 3,
    retryDelay: TIME.SECONDS(2),
  },

  /**
   * Member lists - rarely changes
   * Use for: pool members, yield calculations (expensive RPC)
   */
  POOL_MEMBERS: {
    staleTime: TIME.MINUTES(2),
    gcTime: TIME.MINUTES(10),
    refetchInterval: TIME.MINUTES(5),
    retry: 3,
    retryDelay: TIME.SECONDS(2),
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

// ============================================================================
// RETRY STRATEGIES
// ============================================================================

/**
 * Retry delay functions for different scenarios
 */
export const RETRY_DELAYS = {
  /**
   * Exponential backoff (default)
   * 1s -> 2s -> 4s -> 8s (max 30s)
   */
  exponential: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),

  /**
   * Linear backoff
   * 1s -> 2s -> 3s -> 4s
   */
  linear: (attemptIndex: number) => Math.min(1000 * (attemptIndex + 1), 10000),

  /**
   * Constant delay
   * 2s -> 2s -> 2s
   */
  constant: () => 2000,

  /**
   * Fast retry for critical operations
   * 500ms -> 1s -> 1.5s
   */
  fast: (attemptIndex: number) => Math.min(500 * (attemptIndex + 1), 3000),

  /**
   * Aggressive retry for blockchain reads
   * 1s -> 1.5s -> 2s -> 2.5s
   */
  blockchain: (attemptIndex: number) => Math.min(1000 + attemptIndex * 500, 5000),
} as const;

/**
 * Retry condition functions
 */
export const RETRY_CONDITIONS = {
  /**
   * Always retry (default behavior)
   */
  always: () => true,

  /**
   * Never retry
   */
  never: () => false,

  /**
   * Retry only on network errors
   */
  networkOnly: (error: Error) => {
    const message = error.message?.toLowerCase() ?? "";
    return (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("fetch failed")
    );
  },

  /**
   * Retry on RPC errors (blockchain specific)
   */
  rpcErrors: (error: Error) => {
    const message = error.message?.toLowerCase() ?? "";
    return (
      message.includes("rate limit") ||
      message.includes("too many requests") ||
      message.includes("429") ||
      message.includes("503") ||
      message.includes("timeout") ||
      message.includes("econnrefused")
    );
  },

  /**
   * Don't retry on user rejection
   */
  notUserRejection: (error: Error) => {
    const message = error.message?.toLowerCase() ?? "";
    return !(
      message.includes("user rejected") ||
      message.includes("user denied") ||
      message.includes("user cancelled")
    );
  },
} as const;

/**
 * Pre-configured retry strategies
 */
export const RETRY_STRATEGIES = {
  /**
   * Default: 3 retries with exponential backoff
   */
  default: {
    retry: 3,
    retryDelay: RETRY_DELAYS.exponential,
  },

  /**
   * Blockchain reads: More retries, blockchain-specific delay
   */
  blockchain: {
    retry: 4,
    retryDelay: RETRY_DELAYS.blockchain,
  },

  /**
   * User transactions: Fast retry, skip user rejections
   */
  transaction: {
    retry: 2,
    retryDelay: RETRY_DELAYS.fast,
  },

  /**
   * API calls: Standard retry
   */
  api: {
    retry: 3,
    retryDelay: RETRY_DELAYS.exponential,
  },

  /**
   * Critical: More aggressive retry
   */
  critical: {
    retry: 5,
    retryDelay: RETRY_DELAYS.linear,
  },

  /**
   * No retry
   */
  none: {
    retry: false as const,
  },
} as const;

// ============================================================================
// FEATURE-SPECIFIC PRESETS
// ============================================================================

/**
 * Lottery-specific query presets
 */
export const LOTTERY_QUERY_PRESETS = {
  /** Current round - updates frequently */
  CURRENT_ROUND: {
    staleTime: TIME.SECONDS(10),
    gcTime: TIME.MINUTES(2),
  },
  /** Round history - rarely changes */
  ROUND_HISTORY: {
    staleTime: TIME.SECONDS(30),
    gcTime: TIME.MINUTES(5),
    retry: 2,
  },
  /** User participation - changes after purchase */
  USER_PARTICIPATION: {
    staleTime: TIME.SECONDS(20),
    gcTime: TIME.MINUTES(5),
  },
  /** Contract owner - almost never changes */
  OWNER: {
    staleTime: TIME.MINUTES(5),
    gcTime: TIME.MINUTES(30),
  },
} as const;

/**
 * Individual pool query presets
 */
export const INDIVIDUAL_QUERY_PRESETS = {
  /** User balances - needs to be fresh */
  USER_INFO: {
    staleTime: TIME.SECONDS(5),
    gcTime: TIME.MINUTES(2),
  },
  /** Pool statistics - aggregate data */
  POOL_STATS: {
    staleTime: TIME.SECONDS(10),
    gcTime: TIME.MINUTES(5),
  },
  /** Pool config - rarely changes */
  POOL_CONFIG: {
    staleTime: TIME.MINUTES(1),
    gcTime: TIME.MINUTES(10),
  },
} as const;

/**
 * Mezo protocol query presets
 */
export const MEZO_QUERY_PRESETS = {
  /** Price data - needs moderate freshness */
  PRICE: {
    staleTime: TIME.SECONDS(30),
    gcTime: TIME.MINUTES(5),
  },
  /** Trove data - user positions */
  TROVE: {
    staleTime: TIME.SECONDS(15),
    gcTime: TIME.MINUTES(5),
  },
  /** Stability pool - aggregate stats */
  STABILITY_POOL: {
    staleTime: TIME.SECONDS(30),
    gcTime: TIME.MINUTES(5),
  },
  /** Borrower operations config */
  BORROWER_CONFIG: {
    staleTime: TIME.MINUTES(5),
    gcTime: TIME.MINUTES(30),
  },
} as const;

/**
 * Token/balance query presets
 */
export const TOKEN_QUERY_PRESETS = {
  /** Token balance - needs freshness */
  BALANCE: {
    staleTime: TIME.SECONDS(10),
    gcTime: TIME.MINUTES(2),
  },
  /** Token allowance - for approvals */
  ALLOWANCE: {
    staleTime: TIME.SECONDS(10),
    gcTime: TIME.MINUTES(2),
  },
} as const;
