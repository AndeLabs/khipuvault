/**
 * @fileoverview Query options for Individual Pool
 * @module lib/query-options/individual-pool-queries
 * 
 * This file defines reusable query options using TanStack Query's queryOptions helper.
 * This is a best practice that allows:
 * - Type-safe query options
 * - Reuse across useQuery, useSuspenseQuery, useQueries, prefetchQuery, etc.
 * - Co-location of queryKey, queryFn, and options
 * - Easier testing and maintenance
 */

import { queryOptions } from '@tanstack/react-query'
import { PublicClient } from 'viem'
import { fetchUserTransactions, type Transaction } from '@/lib/blockchain/fetch-user-transactions'

/**
 * Query options for user transactions in Individual Pool
 * 
 * Usage:
 * ```tsx
 * const { data: transactions } = useQuery(
 *   individualPoolQueries.userTransactions(publicClient, address)
 * )
 * ```
 */
export const individualPoolQueries = {
  /**
   * User transactions query options
   * 
   * @param publicClient - Viem PublicClient
   * @param address - User wallet address
   * @returns Query options object
   */
  userTransactions: (publicClient: PublicClient | null, address: `0x${string}` | undefined) =>
    queryOptions({
      queryKey: ['individual-pool', 'user-transactions', address],
      queryFn: async () => {
        if (!publicClient || !address) {
          return []
        }
        return fetchUserTransactions(publicClient, address)
      },
      enabled: !!address && !!publicClient,
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    }),
}
