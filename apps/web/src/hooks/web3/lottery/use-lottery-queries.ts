/**
 * @fileoverview Lottery Pool Read Queries
 * @module hooks/web3/lottery/use-lottery-queries
 *
 * TanStack Query hooks for reading lottery pool data
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { zeroAddress, type Address } from "viem";
import { useAccount, usePublicClient } from "wagmi";

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
import { LOTTERY_QUERY_PRESETS } from "@/lib/query-config";
import { queryKeys } from "@/lib/query-keys";
import { MEZO_TESTNET_ADDRESSES, LOTTERY_POOL_ABI } from "@/lib/web3/contracts-v3";

const LOTTERY_POOL_ADDRESS = MEZO_TESTNET_ADDRESSES.lotteryPool as Address;

/**
 * Hook to get current round
 */
export function useCurrentRound() {
  const publicClient = usePublicClient();

  const { data: currentRoundId, isLoading: isLoadingId } = useQuery({
    queryKey: queryKeys.lotteryPool.currentRound(),
    queryFn: () => fetchCurrentRoundId(publicClient!),
    enabled: !!publicClient,
    ...LOTTERY_QUERY_PRESETS.CURRENT_ROUND,
  });

  const {
    data: roundInfo,
    isLoading: isLoadingInfo,
    error,
  } = useQuery({
    queryKey: currentRoundId
      ? queryKeys.lotteryPool.roundInfo(Number(currentRoundId))
      : [...queryKeys.lotteryPool.all, "round-info", "none"],
    queryFn: () => {
      if (!publicClient || !currentRoundId) {
        return Promise.resolve(null);
      }
      return fetchRoundInfo(publicClient, currentRoundId);
    },
    enabled: !!publicClient && !!currentRoundId,
    ...LOTTERY_QUERY_PRESETS.CURRENT_ROUND,
  });

  return {
    currentRoundId: currentRoundId as bigint | null | undefined,
    roundInfo: roundInfo as LotteryRound | null | undefined,
    isLoading: isLoadingId || isLoadingInfo,
    error,
  };
}

/**
 * Hook to get all lottery rounds
 */
export function useAllRounds() {
  const publicClient = usePublicClient();

  const { data: roundCounter = 0, isLoading: isLoadingCounter } = useQuery({
    queryKey: [...queryKeys.lotteryPool.all, "round-counter"],
    queryFn: () => fetchRoundCounter(publicClient!),
    enabled: !!publicClient,
    ...LOTTERY_QUERY_PRESETS.ROUND_HISTORY,
  });

  const {
    data: rounds = [],
    isLoading: isLoadingRounds,
    error,
  } = useQuery({
    queryKey: queryKeys.lotteryPool.history(),
    queryFn: () => {
      if (!publicClient) {
        return Promise.resolve([]);
      }
      return fetchAllRounds(publicClient, roundCounter);
    },
    enabled: !!publicClient && roundCounter > 0,
    ...LOTTERY_QUERY_PRESETS.ROUND_HISTORY,
  });

  return {
    rounds,
    isLoading: isLoadingCounter || isLoadingRounds,
    error,
    roundCounter,
  };
}

/**
 * Hook to get user tickets for a round
 */
export function useUserTickets(roundId?: number, userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const targetAddress = userAddress ?? address;

  const {
    data: ticketCount,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey:
      roundId && targetAddress
        ? queryKeys.lotteryPool.userTickets(roundId, targetAddress)
        : [
            ...queryKeys.lotteryPool.all,
            "user-tickets",
            roundId ?? "none",
            targetAddress ?? "none",
          ],
    queryFn: () => {
      if (!publicClient || !roundId || !targetAddress) {
        return Promise.resolve(null);
      }
      return fetchUserTickets(publicClient, roundId, targetAddress);
    },
    enabled: !!publicClient && !!roundId && !!targetAddress,
    ...LOTTERY_QUERY_PRESETS.USER_PARTICIPATION,
  });

  const ticketArray = ticketCount
    ? Array.from({ length: Number(ticketCount) }, (_, i) => i + 1)
    : [];

  return {
    tickets: ticketArray,
    ticketCount: ticketCount as bigint | null | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get user investment for a round
 */
export function useUserInvestment(roundId?: number) {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const {
    data: investment,
    isLoading,
    error,
  } = useQuery({
    queryKey:
      roundId && address
        ? [...queryKeys.lotteryPool.userTickets(roundId, address), "investment"]
        : [...queryKeys.lotteryPool.all, "user-investment", roundId ?? "none", address ?? "none"],
    queryFn: () => {
      if (!publicClient || !roundId || !address) {
        return Promise.resolve(null);
      }
      return fetchUserInvestment(publicClient, roundId, address);
    },
    enabled: !!publicClient && !!roundId && !!address,
    ...LOTTERY_QUERY_PRESETS.USER_PARTICIPATION,
  });

  return {
    investment: investment as bigint | null | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to calculate user probability
 */
export function useUserProbability(roundId?: number) {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const {
    data: probability,
    isLoading,
    error,
  } = useQuery({
    queryKey:
      roundId && address
        ? [...queryKeys.lotteryPool.userTickets(roundId, address), "probability"]
        : [...queryKeys.lotteryPool.all, "user-probability", roundId ?? "none", address ?? "none"],
    queryFn: () => {
      if (!publicClient || !roundId || !address) {
        return Promise.resolve(null);
      }
      return fetchUserProbability(publicClient, roundId, address);
    },
    enabled: !!publicClient && !!roundId && !!address,
    ...LOTTERY_QUERY_PRESETS.USER_PARTICIPATION,
  });

  return {
    probability: probability as bigint | null | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get user lottery statistics across all rounds
 */
export function useUserLotteryStats(userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const targetAddress = userAddress ?? address;

  const { data: roundCounter = 0, isLoading: isLoadingCounter } = useQuery({
    queryKey: [...queryKeys.lotteryPool.all, "round-counter"],
    queryFn: () => fetchRoundCounter(publicClient!),
    enabled: !!publicClient,
    ...LOTTERY_QUERY_PRESETS.ROUND_HISTORY,
  });

  const {
    data: stats = {
      totalInvested: 0n,
      roundsPlayed: 0,
      totalTickets: 0,
      totalWinnings: 0n,
    },
    isLoading: isLoadingStats,
    error,
  } = useQuery({
    queryKey: targetAddress
      ? [...queryKeys.lotteryPool.all, "user-stats", targetAddress]
      : [...queryKeys.lotteryPool.all, "user-stats", "none"],
    queryFn: () => {
      if (!publicClient || !targetAddress) {
        return Promise.resolve({
          totalInvested: 0n,
          roundsPlayed: 0,
          totalTickets: 0,
          totalWinnings: 0n,
        });
      }
      return fetchUserLotteryStats(publicClient, roundCounter, targetAddress);
    },
    enabled: !!publicClient && !!targetAddress && roundCounter > 0,
    ...LOTTERY_QUERY_PRESETS.ROUND_HISTORY,
  });

  return {
    stats: stats as UserLotteryStats,
    isLoading: isLoadingCounter || isLoadingStats,
    error,
  };
}

/**
 * Hook to check if current user is lottery pool owner
 */
export function useLotteryPoolOwner() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const { data: owner, isLoading } = useQuery({
    queryKey: [...queryKeys.lotteryPool.all, "owner"],
    queryFn: async () => {
      if (!publicClient) {
        return null;
      }
      try {
        const result = await publicClient.readContract({
          address: LOTTERY_POOL_ADDRESS,
          abi: LOTTERY_POOL_ABI,
          functionName: "owner",
          args: [],
        });
        return result as `0x${string}`;
      } catch {
        return null;
      }
    },
    enabled: !!publicClient,
    ...LOTTERY_QUERY_PRESETS.OWNER,
  });

  const isOwner = address && owner ? address.toLowerCase() === owner.toLowerCase() : false;

  return { owner, isOwner, isLoading };
}

/**
 * Hook to check if lottery pool is deployed
 */
export function useLotteryPoolDeployed(): boolean {
  return LOTTERY_POOL_ADDRESS !== zeroAddress;
}

// Re-export types
export type { LotteryRound, UserLotteryStats };
