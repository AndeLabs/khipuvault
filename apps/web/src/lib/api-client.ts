/**
 * @fileoverview Centralized API Client with Error Tracking
 * @module lib/api-client
 *
 * Provides a configured API client instance with:
 * - Automatic error tracking/logging
 * - Request/response interceptors
 * - Type-safe methods
 *
 * @example
 * ```ts
 * import { apiClient, withErrorTracking } from "@/lib/api-client";
 *
 * // Direct usage
 * const portfolio = await apiClient.getUserPortfolio(address);
 *
 * // With error tracking context
 * const pools = await withErrorTracking(
 *   () => apiClient.getPools(),
 *   { operation: "getPools", feature: "dashboard" }
 * );
 * ```
 */

import { KhipuApiClient, ApiError } from "@khipu/web3";

import { captureError } from "./error-tracking";

// API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
const API_TIMEOUT = 15000; // 15 seconds
const API_RETRIES = 2;

/**
 * Centralized API client instance
 * Pre-configured with production settings
 */
export const apiClient = new KhipuApiClient(API_URL, {
  timeout: API_TIMEOUT,
  retries: API_RETRIES,
});

/**
 * Error tracking context for API calls
 */
export interface ErrorTrackingContext {
  operation: string;
  feature?: string;
  extra?: Record<string, unknown>;
}

/**
 * Wrapper function that adds error tracking to any API call
 *
 * @example
 * ```ts
 * const result = await withErrorTracking(
 *   () => apiClient.getUserPortfolio(address),
 *   { operation: "getUserPortfolio", feature: "portfolio", extra: { address } }
 * );
 * ```
 */
export async function withErrorTracking<T>(
  apiCall: () => Promise<T>,
  context: ErrorTrackingContext
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    await captureError(error, {
      tags: {
        api: context.feature ?? "unknown",
        operation: context.operation,
      },
      extra: context.extra,
    });
    throw error; // Re-throw for React Query error handling
  }
}

/**
 * Type-safe API methods with built-in error tracking
 * Use these for common operations with automatic tracking
 */
export const trackedApi = {
  // User operations
  async getUserPortfolio(address: string) {
    return withErrorTracking(() => apiClient.getUserPortfolio(address), {
      operation: "getUserPortfolio",
      feature: "portfolio",
      extra: { address },
    });
  },

  async getUserTransactions(address: string) {
    return withErrorTracking(() => apiClient.getUserTransactions(address), {
      operation: "getUserTransactions",
      feature: "portfolio",
      extra: { address },
    });
  },

  // Pool operations
  async getPools() {
    return withErrorTracking(() => apiClient.getPools(), {
      operation: "getPools",
      feature: "pools",
    });
  },

  async getPool(poolId: string) {
    return withErrorTracking(() => apiClient.getPool(poolId), {
      operation: "getPool",
      feature: "pools",
      extra: { poolId },
    });
  },

  async getPoolAnalytics(poolId: string) {
    return withErrorTracking(() => apiClient.getPoolAnalytics(poolId), {
      operation: "getPoolAnalytics",
      feature: "analytics",
      extra: { poolId },
    });
  },

  async getPoolStats(poolAddress: string) {
    return withErrorTracking(() => apiClient.getPoolStats(poolAddress), {
      operation: "getPoolStats",
      feature: "pools",
      extra: { poolAddress },
    });
  },

  // Analytics operations
  async getGlobalAnalytics() {
    return withErrorTracking(() => apiClient.getGlobalAnalytics(), {
      operation: "getGlobalAnalytics",
      feature: "analytics",
    });
  },
};

// Re-export types and error class for convenience
export { ApiError } from "@khipu/web3";
export type {
  UserPortfolio,
  UserPortfolioPosition,
  Pool,
  PoolType,
  PoolStatus,
  Transaction,
  TransactionType,
  TransactionStatus,
} from "@khipu/web3";

export default apiClient;
