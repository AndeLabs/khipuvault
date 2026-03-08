/**
 * @fileoverview Query Factory Patterns
 * @module lib/query-factories
 *
 * Factory functions for creating consistent React Query options.
 * These patterns ensure queries are created with proper typing,
 * caching configuration, and error handling.
 *
 * @example
 * ```ts
 * import { createContractQuery } from "@/lib/query-factories";
 *
 * const poolQuery = createContractQuery({
 *   queryKey: queryKeys.pools.detail(poolId),
 *   contractAddress: POOL_ADDRESS,
 *   abi: POOL_ABI,
 *   functionName: "getPool",
 *   args: [poolId],
 *   preset: "BLOCKCHAIN_READ",
 * });
 *
 * const { data } = useQuery(poolQuery);
 * ```
 */

import { QUERY_PRESETS, type QueryPreset } from "./query-config";

import type { UseQueryOptions } from "@tanstack/react-query";
import type { Abi, Address } from "viem";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for creating a contract read query
 */
export interface ContractQueryOptions<TData = unknown> {
  /** Unique query key */
  queryKey: readonly unknown[];
  /** Contract address */
  contractAddress: Address;
  /** Contract ABI */
  abi: Abi | readonly unknown[];
  /** Function name to call */
  functionName: string;
  /** Function arguments */
  args?: readonly unknown[];
  /** Query preset to use */
  preset?: QueryPreset;
  /** Whether query is enabled */
  enabled?: boolean;
  /** Transform the raw contract result */
  select?: (data: unknown) => TData;
}

/**
 * Options for creating a fetch-based query
 */
export interface FetchQueryOptions<TData = unknown> {
  /** Unique query key */
  queryKey: readonly unknown[];
  /** Fetch function */
  fetcher: () => Promise<TData>;
  /** Query preset to use */
  preset?: QueryPreset;
  /** Whether query is enabled */
  enabled?: boolean;
  /** Placeholder data while loading */
  placeholderData?: TData;
}

/**
 * Options for creating a dependent query
 */
export interface DependentQueryOptions<TData = unknown, TDep = unknown> {
  /** Unique query key (can include dependency value) */
  queryKey: readonly unknown[];
  /** Fetch function receiving dependency value */
  fetcher: (dependency: TDep) => Promise<TData>;
  /** Dependency value - query is disabled if null/undefined */
  dependency: TDep | null | undefined;
  /** Query preset to use */
  preset?: QueryPreset;
  /** Placeholder data while loading */
  placeholderData?: TData;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create query options for a contract read call
 *
 * @example
 * ```ts
 * const balanceQuery = createContractQuery({
 *   queryKey: ["balance", address],
 *   contractAddress: MUSD_ADDRESS,
 *   abi: ERC20_ABI,
 *   functionName: "balanceOf",
 *   args: [address],
 *   preset: "REALTIME",
 * });
 * ```
 */
export function createContractQueryOptions<TData = unknown>(
  options: ContractQueryOptions<TData>,
  publicClient: unknown
): UseQueryOptions<TData, Error> {
  const {
    queryKey,
    contractAddress,
    abi,
    functionName,
    args = [],
    preset = "BLOCKCHAIN_READ",
    enabled = true,
    select,
  } = options;

  const presetConfig = QUERY_PRESETS[preset];

  return {
    queryKey,
    queryFn: async () => {
      if (!publicClient) {
        throw new Error("Public client not available");
      }
      // Type assertion needed since publicClient type varies
      const client = publicClient as {
        readContract: (params: {
          address: Address;
          abi: Abi | readonly unknown[];
          functionName: string;
          args: readonly unknown[];
        }) => Promise<unknown>;
      };

      const result = await client.readContract({
        address: contractAddress,
        abi,
        functionName,
        args,
      });

      return (select ? select(result) : result) as TData;
    },
    enabled: enabled && !!publicClient,
    ...presetConfig,
  };
}

/**
 * Create query options for a fetch-based query
 *
 * @example
 * ```ts
 * const priceQuery = createFetchQuery({
 *   queryKey: ["btc-price"],
 *   fetcher: () => fetchBTCPrice(),
 *   preset: "NORMAL",
 * });
 * ```
 */
export function createFetchQueryOptions<TData = unknown>(
  options: FetchQueryOptions<TData>
): Omit<UseQueryOptions<TData, Error>, "placeholderData"> & { placeholderData?: TData } {
  const { queryKey, fetcher, preset = "NORMAL", enabled = true, placeholderData } = options;

  const presetConfig = QUERY_PRESETS[preset];

  return {
    queryKey,
    queryFn: fetcher,
    enabled,
    ...(placeholderData !== undefined && { placeholderData }),
    ...presetConfig,
  };
}

/**
 * Create query options for a dependent query
 * Query is only enabled when dependency is available
 *
 * @example
 * ```ts
 * const userPoolQuery = createDependentQuery({
 *   queryKey: ["user-pool", address],
 *   dependency: address,
 *   fetcher: (addr) => fetchUserPool(addr),
 *   preset: "BLOCKCHAIN_READ",
 * });
 * ```
 */
export function createDependentQueryOptions<TData = unknown, TDep = unknown>(
  options: DependentQueryOptions<TData, TDep>
): Omit<UseQueryOptions<TData, Error>, "placeholderData"> & { placeholderData?: TData } {
  const { queryKey, fetcher, dependency, preset = "BLOCKCHAIN_READ", placeholderData } = options;

  const presetConfig = QUERY_PRESETS[preset];
  const isEnabled = dependency !== null && dependency !== undefined;

  return {
    queryKey,
    queryFn: () => {
      if (!isEnabled) {
        throw new Error("Dependency not available");
      }
      return fetcher(dependency as TDep);
    },
    enabled: isEnabled,
    ...(placeholderData !== undefined && { placeholderData }),
    ...presetConfig,
  };
}

// ============================================================================
// UTILITY FACTORIES
// ============================================================================

/**
 * Create a disabled query that returns placeholder data
 * Useful for conditional rendering without breaking hooks rules
 */
export function createDisabledQuery<TData>(
  queryKey: readonly unknown[],
  placeholderData: TData
): Omit<UseQueryOptions<TData, Error>, "placeholderData"> & { placeholderData: TData } {
  return {
    queryKey,
    queryFn: () => Promise.resolve(placeholderData),
    enabled: false,
    placeholderData,
    staleTime: Infinity,
  };
}

/**
 * Create query options that never refetch (static data)
 */
export function createStaticQueryOptions<TData>(
  queryKey: readonly unknown[],
  fetcher: () => Promise<TData>
): UseQueryOptions<TData, Error> {
  return {
    queryKey,
    queryFn: fetcher,
    ...QUERY_PRESETS.STATIC,
  };
}

/**
 * Create query options with manual refetch only
 */
export function createManualQueryOptions<TData>(
  queryKey: readonly unknown[],
  fetcher: () => Promise<TData>,
  enabled = true
): UseQueryOptions<TData, Error> {
  return {
    queryKey,
    queryFn: fetcher,
    enabled,
    ...QUERY_PRESETS.MANUAL,
  };
}

// ============================================================================
// QUERY KEY HELPERS
// ============================================================================

/**
 * Create a scoped query key factory
 *
 * @example
 * ```ts
 * const poolKeys = createQueryKeyFactory("pools");
 * poolKeys.all // ["pools"]
 * poolKeys.lists() // ["pools", "list"]
 * poolKeys.detail(1) // ["pools", "detail", 1]
 * ```
 */
export function createQueryKeyFactory(scope: string) {
  return {
    all: [scope] as const,
    lists: () => [scope, "list"] as const,
    list: (filters: Record<string, unknown>) => [scope, "list", filters] as const,
    details: () => [scope, "detail"] as const,
    detail: (id: string | number) => [scope, "detail", id] as const,
    user: (address: string) => [scope, "user", address] as const,
  };
}
