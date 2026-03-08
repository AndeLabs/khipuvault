/**
 * Centralized Query Keys Factory
 *
 * Provides consistent, type-safe query keys for React Query across all features.
 * Prevents cache misses and makes invalidation predictable.
 *
 * @example
 * ```ts
 * import { queryKeys } from "@/lib/query-keys";
 *
 * // Use in queries
 * useQuery({
 *   queryKey: queryKeys.individualPool.userInfo(address),
 *   queryFn: fetchUserInfo,
 * });
 *
 * // Invalidate related queries
 * queryClient.invalidateQueries({
 *   queryKey: queryKeys.individualPool.all,
 * });
 * ```
 */

/**
 * Query key factory for all features
 *
 * Structure follows the pattern:
 * - `all`: Base key for invalidating all related queries
 * - `lists()`: List queries
 * - `detail(id)`: Single item queries
 * - `infinite()`: Paginated queries
 */
export const queryKeys = {
  /**
   * Individual Pool queries (V3 contract)
   */
  individualPool: {
    all: ["individual-pool"] as const,
    v3: ["individual-pool-v3"] as const, // V3 specific base key
    userInfo: (address: string) => [...queryKeys.individualPool.all, "user-info", address] as const,
    poolInfo: () => [...queryKeys.individualPool.all, "pool-info"] as const,
    yields: (address: string) => [...queryKeys.individualPool.all, "yields", address] as const,
    history: (address: string) => [...queryKeys.individualPool.all, "history", address] as const,
    stats: () => [...queryKeys.individualPool.all, "stats"] as const,
  },

  /**
   * Yield Aggregator queries (V3)
   */
  yieldAggregator: {
    all: ["yield-aggregator-v3"] as const,
    vaults: () => [...queryKeys.yieldAggregator.all, "vaults"] as const,
    userPosition: (address: string) =>
      [...queryKeys.yieldAggregator.all, "user-position", address] as const,
  },

  /**
   * Balance queries (for invalidation)
   */
  balance: {
    all: ["balance"] as const,
    user: (address: string) => [...queryKeys.balance.all, address] as const,
  },

  /**
   * Cooperative Pool queries
   */
  cooperativePool: {
    all: ["cooperative-pool"] as const,
    v3: ["cooperative-pool-v3"] as const, // V3 specific base key
    pools: () => [...queryKeys.cooperativePool.all, "pools"] as const,
    pool: (poolId: number) => [...queryKeys.cooperativePool.all, "pool", poolId] as const,
    poolInfo: (poolId: number) => [...queryKeys.cooperativePool.v3, "pool-info", poolId] as const,
    members: (poolId: number) => [...queryKeys.cooperativePool.all, "members", poolId] as const,
    poolMembers: (poolId: number) =>
      [...queryKeys.cooperativePool.v3, "pool-members", poolId] as const,
    memberInfo: (poolId: number, address: string) =>
      [...queryKeys.cooperativePool.v3, "member-info", poolId, address] as const,
    memberYield: (poolId: number, address: string) =>
      [...queryKeys.cooperativePool.v3, "member-yield", poolId, address] as const,
    userPools: (address: string) =>
      [...queryKeys.cooperativePool.all, "user-pools", address] as const,
    poolCounter: () => [...queryKeys.cooperativePool.v3, "pool-counter"] as const,
    performanceFee: () => [...queryKeys.cooperativePool.v3, "performance-fee"] as const,
    emergencyMode: () => [...queryKeys.cooperativePool.v3, "emergency-mode"] as const,
  },

  /**
   * Rotating Pool (ROSCA) queries
   */
  rotatingPool: {
    all: ["rotating-pool"] as const,
    pools: () => [...queryKeys.rotatingPool.all, "pools"] as const,
    pool: (poolId: number) => [...queryKeys.rotatingPool.all, "pool", poolId] as const,
    members: (poolId: number) => [...queryKeys.rotatingPool.all, "members", poolId] as const,
    currentRound: (poolId: number) =>
      [...queryKeys.rotatingPool.all, "current-round", poolId] as const,
    userPools: (address: string) => [...queryKeys.rotatingPool.all, "user-pools", address] as const,
  },

  /**
   * Lottery Pool queries
   */
  lotteryPool: {
    all: ["lottery-pool"] as const,
    currentRound: () => [...queryKeys.lotteryPool.all, "current-round"] as const,
    roundInfo: (roundId: number) => [...queryKeys.lotteryPool.all, "round", roundId] as const,
    userTickets: (roundId: number, address: string) =>
      [...queryKeys.lotteryPool.all, "user-tickets", roundId, address] as const,
    history: () => [...queryKeys.lotteryPool.all, "history"] as const,
  },

  /**
   * Token queries (mUSD, BTC balances)
   */
  tokens: {
    all: ["tokens"] as const,
    balance: (tokenAddress: string, userAddress: string) =>
      [...queryKeys.tokens.all, "balance", tokenAddress, userAddress] as const,
    allowance: (tokenAddress: string, userAddress: string, spender: string) =>
      [...queryKeys.tokens.all, "allowance", tokenAddress, userAddress, spender] as const,
    musdBalance: (address: string) => [...queryKeys.tokens.all, "musd-balance", address] as const,
    btcBalance: (address: string) => [...queryKeys.tokens.all, "btc-balance", address] as const,
  },

  /**
   * User-related queries
   */
  user: {
    all: ["user"] as const,
    profile: (address: string) => [...queryKeys.user.all, "profile", address] as const,
    portfolio: (address: string) => [...queryKeys.user.all, "portfolio", address] as const,
    transactions: (address: string) => [...queryKeys.user.all, "transactions", address] as const,
    referrals: (address: string) => [...queryKeys.user.all, "referrals", address] as const,
  },

  /**
   * API queries (backend endpoints)
   */
  api: {
    all: ["api"] as const,
    pools: () => [...queryKeys.api.all, "pools"] as const,
    transactions: (filters?: Record<string, unknown>) =>
      [...queryKeys.api.all, "transactions", filters] as const,
    analytics: () => [...queryKeys.api.all, "analytics"] as const,
  },
} as const;

/**
 * Type for query key values
 */
export type QueryKeys = typeof queryKeys;

/**
 * Helper to invalidate all queries for a feature
 *
 * @example
 * ```ts
 * import { invalidateFeature } from "@/lib/query-keys";
 *
 * // Invalidate all individual pool queries
 * await invalidateFeature(queryClient, "individualPool");
 * ```
 */
export function invalidateFeature(
  queryClient: { invalidateQueries: (options: { queryKey: readonly unknown[] }) => Promise<void> },
  feature: keyof QueryKeys
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: queryKeys[feature].all,
  });
}

/**
 * Helper to invalidate token-related queries after a transaction
 *
 * @example
 * ```ts
 * await invalidateTokenQueries(queryClient, userAddress);
 * ```
 */
export function invalidateTokenQueries(
  queryClient: { invalidateQueries: (options: { queryKey: readonly unknown[] }) => Promise<void> },
  userAddress: string
): Promise<void[]> {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.tokens.musdBalance(userAddress),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.tokens.btcBalance(userAddress),
    }),
  ]);
}

// ============================================================================
// CACHE INVALIDATION HELPERS
// ============================================================================

type QueryClient = {
  invalidateQueries: (options: { queryKey: readonly unknown[] }) => Promise<void>;
  refetchQueries: (options: {
    queryKey: readonly unknown[];
    type?: "active" | "inactive" | "all";
  }) => Promise<void>;
  removeQueries: (options: { queryKey: readonly unknown[] }) => void;
  resetQueries: (options: { queryKey: readonly unknown[] }) => Promise<void>;
};

/**
 * Invalidation presets for common scenarios
 */
export const invalidationPresets = {
  /**
   * After a deposit transaction
   * Invalidates: user info, pool stats, token balances
   */
  afterDeposit: (queryClient: QueryClient, userAddress: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.individualPool.userInfo(userAddress) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.individualPool.stats() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tokens.musdBalance(userAddress) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.balance.user(userAddress) }),
    ]),

  /**
   * After a withdrawal transaction
   * Invalidates: user info, pool stats, token balances
   */
  afterWithdraw: (queryClient: QueryClient, userAddress: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.individualPool.userInfo(userAddress) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.individualPool.stats() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tokens.musdBalance(userAddress) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.balance.user(userAddress) }),
    ]),

  /**
   * After joining a cooperative pool
   * Invalidates: pool info, members, user pools
   */
  afterJoinPool: (queryClient: QueryClient, poolId: number, userAddress: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.cooperativePool.poolInfo(poolId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.cooperativePool.poolMembers(poolId) }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.cooperativePool.memberInfo(poolId, userAddress),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.cooperativePool.userPools(userAddress) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tokens.musdBalance(userAddress) }),
    ]),

  /**
   * After leaving a cooperative pool
   * Invalidates: pool info, members, user pools
   */
  afterLeavePool: (queryClient: QueryClient, poolId: number, userAddress: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.cooperativePool.poolInfo(poolId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.cooperativePool.poolMembers(poolId) }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.cooperativePool.memberInfo(poolId, userAddress),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.cooperativePool.userPools(userAddress) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tokens.musdBalance(userAddress) }),
    ]),

  /**
   * After buying lottery tickets
   * Invalidates: round info, user tickets, token balances
   */
  afterBuyTickets: (queryClient: QueryClient, roundId: number, userAddress: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.lotteryPool.roundInfo(roundId) }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.lotteryPool.userTickets(roundId, userAddress),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tokens.musdBalance(userAddress) }),
    ]),

  /**
   * After claiming yield
   * Invalidates: user info, yields, token balances
   */
  afterClaimYield: (queryClient: QueryClient, userAddress: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.individualPool.userInfo(userAddress) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.individualPool.yields(userAddress) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tokens.musdBalance(userAddress) }),
    ]),

  /**
   * After any transaction (general)
   * Refetches all active queries
   */
  afterTransaction: (queryClient: QueryClient) =>
    queryClient.refetchQueries({ queryKey: [], type: "active" }),
} as const;

/**
 * Smart invalidation based on transaction type
 *
 * @example
 * ```ts
 * await smartInvalidate(queryClient, "deposit", { userAddress, poolId });
 * ```
 */
export async function smartInvalidate(
  queryClient: QueryClient,
  txType: "deposit" | "withdraw" | "joinPool" | "leavePool" | "buyTickets" | "claimYield",
  context: { userAddress: string; poolId?: number; roundId?: number }
): Promise<void> {
  const { userAddress, poolId, roundId } = context;

  switch (txType) {
    case "deposit":
    case "withdraw":
      await invalidationPresets.afterDeposit(queryClient, userAddress);
      break;
    case "joinPool":
      if (poolId !== undefined) {
        await invalidationPresets.afterJoinPool(queryClient, poolId, userAddress);
      }
      break;
    case "leavePool":
      if (poolId !== undefined) {
        await invalidationPresets.afterLeavePool(queryClient, poolId, userAddress);
      }
      break;
    case "buyTickets":
      if (roundId !== undefined) {
        await invalidationPresets.afterBuyTickets(queryClient, roundId, userAddress);
      }
      break;
    case "claimYield":
      await invalidationPresets.afterClaimYield(queryClient, userAddress);
      break;
  }
}

/**
 * Clear all cached data for a user (e.g., on disconnect)
 */
export function clearUserCache(queryClient: QueryClient, userAddress: string): void {
  queryClient.removeQueries({ queryKey: queryKeys.individualPool.userInfo(userAddress) });
  queryClient.removeQueries({ queryKey: queryKeys.individualPool.yields(userAddress) });
  queryClient.removeQueries({ queryKey: queryKeys.cooperativePool.userPools(userAddress) });
  queryClient.removeQueries({ queryKey: queryKeys.rotatingPool.userPools(userAddress) });
  queryClient.removeQueries({ queryKey: queryKeys.tokens.musdBalance(userAddress) });
  queryClient.removeQueries({ queryKey: queryKeys.tokens.btcBalance(userAddress) });
  queryClient.removeQueries({ queryKey: queryKeys.user.profile(userAddress) });
  queryClient.removeQueries({ queryKey: queryKeys.user.portfolio(userAddress) });
}
