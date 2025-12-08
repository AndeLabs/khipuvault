/**
 * @fileoverview Query options for Lottery Pool
 * @module lib/query-options/lottery-pool-queries
 *
 * This file defines reusable query options using TanStack Query's queryOptions helper.
 * This is a best practice that allows:
 * - Type-safe query options
 * - Reuse across useQuery, useSuspenseQuery, useQueries, prefetchQuery, etc.
 * - Co-location of queryKey, queryFn, and options
 * - Easier testing and maintenance
 */

import { queryOptions } from "@tanstack/react-query";
import { normalizeBigInt } from "@/lib/query-utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PublicClient = any;
import {
  fetchCurrentRoundId,
  fetchRoundCounter,
  fetchRoundInfo,
  fetchAllRounds,
  fetchUserTickets,
  fetchUserInvestment,
  fetchUserProbability,
  fetchUserLotteryStats,
  type LotteryRound,
  type UserLotteryStats,
} from "@/lib/blockchain/fetch-lottery-pools";

/**
 * Query options for Lottery Pool
 *
 * Usage:
 * ```tsx
 * const { data: rounds } = useQuery(
 *   lotteryPoolQueries.allRounds(publicClient, roundCounter)
 * )
 * ```
 */
export const lotteryPoolQueries = {
  /**
   * Current round ID query options
   *
   * @param publicClient - Viem PublicClient
   * @returns Query options object
   */
  currentRoundId: (publicClient: PublicClient | null) =>
    queryOptions({
      queryKey: ["lottery-pool", "current-round-id"],
      queryFn: async () => {
        if (!publicClient) {
          return null;
        }
        return fetchCurrentRoundId(publicClient);
      },
      enabled: !!publicClient,
      staleTime: 10 * 1000, // 10 seconds for current round
      gcTime: 2 * 60 * 1000, // 2 minutes
    }),

  /**
   * Round counter query options
   *
   * @param publicClient - Viem PublicClient
   * @returns Query options object
   */
  roundCounter: (publicClient: PublicClient | null) =>
    queryOptions({
      queryKey: ["lottery-pool", "round-counter"],
      queryFn: async () => {
        if (!publicClient) {
          return 0;
        }
        return fetchRoundCounter(publicClient);
      },
      enabled: !!publicClient,
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
    }),

  /**
   * Specific round info query options
   *
   * @param publicClient - Viem PublicClient
   * @param roundId - ID of the round
   * @returns Query options object
   */
  roundInfo: (
    publicClient: PublicClient | null,
    roundId: bigint | number | undefined,
  ) =>
    queryOptions({
      queryKey: ["lottery-pool", "round-info", normalizeBigInt(roundId)],
      queryFn: async () => {
        if (!publicClient || !roundId) {
          return null;
        }
        return fetchRoundInfo(publicClient, roundId);
      },
      enabled: !!publicClient && !!roundId,
      staleTime: 10 * 1000,
      gcTime: 2 * 60 * 1000,
    }),

  /**
   * All rounds query options
   *
   * @param publicClient - Viem PublicClient
   * @param roundCounter - Total number of rounds
   * @returns Query options object
   */
  allRounds: (publicClient: PublicClient | null, roundCounter: number) =>
    queryOptions({
      queryKey: ["lottery-pool", "all-rounds", roundCounter],
      queryFn: async () => {
        if (!publicClient) {
          return [];
        }
        return fetchAllRounds(publicClient, roundCounter);
      },
      enabled: !!publicClient && roundCounter > 0,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    }),

  /**
   * User tickets query options
   *
   * @param publicClient - Viem PublicClient
   * @param roundId - ID of the round
   * @param userAddress - Address of the user
   * @returns Query options object
   */
  userTickets: (
    publicClient: PublicClient | null,
    roundId: number | undefined,
    userAddress: `0x${string}` | undefined,
  ) =>
    queryOptions({
      queryKey: [
        "lottery-pool",
        "user-tickets",
        roundId,
        userAddress || "none",
      ],
      queryFn: async () => {
        if (!publicClient || !roundId || !userAddress) {
          return null;
        }
        return fetchUserTickets(publicClient, roundId, userAddress);
      },
      enabled: !!publicClient && !!roundId && !!userAddress,
      staleTime: 20 * 1000,
      gcTime: 5 * 60 * 1000,
    }),

  /**
   * User investment query options
   *
   * @param publicClient - Viem PublicClient
   * @param roundId - ID of the round
   * @param userAddress - Address of the user
   * @returns Query options object
   */
  userInvestment: (
    publicClient: PublicClient | null,
    roundId: number | undefined,
    userAddress: `0x${string}` | undefined,
  ) =>
    queryOptions({
      queryKey: [
        "lottery-pool",
        "user-investment",
        roundId,
        userAddress || "none",
      ],
      queryFn: async () => {
        if (!publicClient || !roundId || !userAddress) {
          return null;
        }
        return fetchUserInvestment(publicClient, roundId, userAddress);
      },
      enabled: !!publicClient && !!roundId && !!userAddress,
      staleTime: 20 * 1000,
      gcTime: 5 * 60 * 1000,
    }),

  /**
   * User probability query options
   *
   * @param publicClient - Viem PublicClient
   * @param roundId - ID of the round
   * @param userAddress - Address of the user
   * @returns Query options object
   */
  userProbability: (
    publicClient: PublicClient | null,
    roundId: number | undefined,
    userAddress: `0x${string}` | undefined,
  ) =>
    queryOptions({
      queryKey: [
        "lottery-pool",
        "user-probability",
        roundId,
        userAddress || "none",
      ],
      queryFn: async () => {
        if (!publicClient || !roundId || !userAddress) {
          return null;
        }
        return fetchUserProbability(publicClient, roundId, userAddress);
      },
      enabled: !!publicClient && !!roundId && !!userAddress,
      staleTime: 20 * 1000,
      gcTime: 5 * 60 * 1000,
    }),

  /**
   * User lottery stats query options
   *
   * @param publicClient - Viem PublicClient
   * @param roundCounter - Total number of rounds
   * @param userAddress - Address of the user
   * @returns Query options object
   */
  userStats: (
    publicClient: PublicClient | null,
    roundCounter: number,
    userAddress: `0x${string}` | undefined,
  ) =>
    queryOptions({
      queryKey: [
        "lottery-pool",
        "user-stats",
        userAddress || "none",
        roundCounter,
      ],
      queryFn: async () => {
        if (!publicClient || !userAddress) {
          return {
            totalInvested: 0n,
            roundsPlayed: 0,
            totalTickets: 0,
            totalWinnings: 0n,
          };
        }
        return fetchUserLotteryStats(publicClient, roundCounter, userAddress);
      },
      enabled: !!publicClient && !!userAddress && roundCounter > 0,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    }),
};
