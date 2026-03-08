/**
 * @fileoverview API Endpoint Constants
 * @module lib/api/endpoints
 *
 * Centralized API endpoint definitions.
 * Single source of truth for all backend routes.
 */

/**
 * Base API configuration
 */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api",
  TIMEOUT: 15000, // 15 seconds
  RETRIES: 2,
  RETRY_DELAY: 1000, // 1 second base delay (exponential backoff)
} as const;

/**
 * User-related endpoints
 */
export const USER_ENDPOINTS = {
  portfolio: (address: string) => `/users/${address}/portfolio` as const,
  transactions: (address: string) => `/users/${address}/transactions` as const,
  profile: (address: string) => `/users/${address}` as const,
  stats: (address: string) => `/users/${address}/stats` as const,
} as const;

/**
 * Pool-related endpoints
 */
export const POOL_ENDPOINTS = {
  list: "/pools" as const,
  detail: (poolId: string) => `/pools/${poolId}` as const,
  analytics: (poolId: string) => `/pools/${poolId}/analytics` as const,
  stats: (poolAddress: string) => `/pools/address/${poolAddress}/stats` as const,
  participants: (poolId: string) => `/pools/${poolId}/participants` as const,
  history: (poolId: string) => `/pools/${poolId}/history` as const,
} as const;

/**
 * Transaction-related endpoints
 */
export const TRANSACTION_ENDPOINTS = {
  list: "/transactions" as const,
  detail: (txId: string) => `/transactions/${txId}` as const,
  byHash: (txHash: string) => `/transactions/hash/${txHash}` as const,
  pending: "/transactions/pending" as const,
} as const;

/**
 * Analytics-related endpoints
 */
export const ANALYTICS_ENDPOINTS = {
  global: "/analytics/global" as const,
  platform: "/analytics/platform" as const,
  pool: (poolId: string) => `/analytics/pools/${poolId}` as const,
  user: (address: string) => `/analytics/users/${address}` as const,
  yields: "/analytics/yields" as const,
} as const;

/**
 * Lottery-related endpoints
 */
export const LOTTERY_ENDPOINTS = {
  active: "/lottery/active" as const,
  history: "/lottery/history" as const,
  tickets: (lotteryId: string) => `/lottery/${lotteryId}/tickets` as const,
  winners: (lotteryId: string) => `/lottery/${lotteryId}/winners` as const,
  userTickets: (address: string) => `/lottery/user/${address}/tickets` as const,
} as const;

/**
 * Rotating pool (ROSCA) endpoints
 */
export const ROSCA_ENDPOINTS = {
  list: "/rosca" as const,
  detail: (roscaId: string) => `/rosca/${roscaId}` as const,
  participants: (roscaId: string) => `/rosca/${roscaId}/participants` as const,
  rounds: (roscaId: string) => `/rosca/${roscaId}/rounds` as const,
  userPools: (address: string) => `/rosca/user/${address}` as const,
} as const;

/**
 * Mezo protocol endpoints
 */
export const MEZO_ENDPOINTS = {
  troveStats: (userAddress: string) => `/mezo/troves/${userAddress}` as const,
  stabilityPoolStats: (userAddress: string) => `/mezo/stability/${userAddress}` as const,
  systemStats: "/mezo/system" as const,
} as const;

/**
 * All endpoints combined
 */
export const ENDPOINTS = {
  users: USER_ENDPOINTS,
  pools: POOL_ENDPOINTS,
  transactions: TRANSACTION_ENDPOINTS,
  analytics: ANALYTICS_ENDPOINTS,
  lottery: LOTTERY_ENDPOINTS,
  rosca: ROSCA_ENDPOINTS,
  mezo: MEZO_ENDPOINTS,
} as const;

/**
 * Helper to build URL with query params
 */
export function buildUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  if (!params) return endpoint;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}
