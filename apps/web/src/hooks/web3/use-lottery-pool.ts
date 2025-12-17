/**
 * @fileoverview Hooks for Lottery Pool (Prize Pool) interactions
 * @module hooks/web3/use-lottery-pool
 *
 * Production-ready hooks for Prize Pool where users never lose capital
 * Yield-based lottery system on Mezo Testnet
 * Uses TanStack Query for optimal state management and real-time updates
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { formatEther, type Address } from "viem";
import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";

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
import { normalizeBigInt } from "@/lib/query-utils";
import { MEZO_TESTNET_ADDRESSES } from "@/lib/web3/contracts";
import { LOTTERY_POOL_ABI } from "@/lib/web3/lottery-pool-abi";

// Use centralized contract address config
const LOTTERY_POOL_ADDRESS = MEZO_TESTNET_ADDRESSES.lotteryPool as Address;

/**
 * Hook to get current round
 *
 * Uses TanStack Query for:
 * - Automatic caching of round info
 * - Real-time updates via refetchQueries()
 * - Consistent error handling
 *
 * @returns Object with currentRoundId, roundInfo, and loading state
 */
export function useCurrentRound() {
  const publicClient = usePublicClient();

  // Get current round ID (minimal fetch)
  const { data: currentRoundId, isLoading: isLoadingId } = useQuery({
    queryKey: ["lottery-pool", "current-round-id"],
    queryFn: () => fetchCurrentRoundId(publicClient!),
    enabled: !!publicClient,
    staleTime: 10000, // 10 seconds for current round
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get round info based on current round ID
  const {
    data: roundInfo,
    isLoading: isLoadingInfo,
    error,
  } = useQuery({
    queryKey: ["lottery-pool", "round-info", normalizeBigInt(currentRoundId)],
    queryFn: () => {
      if (!publicClient || !currentRoundId) {
        return Promise.resolve(null);
      }
      return fetchRoundInfo(publicClient, currentRoundId);
    },
    enabled: !!publicClient && !!currentRoundId,
    staleTime: 10000,
    gcTime: 2 * 60 * 1000,
  });

  return {
    currentRoundId: currentRoundId as bigint | null | undefined,
    roundInfo: roundInfo as LotteryRound | null | undefined,
    isLoading: isLoadingId || isLoadingInfo,
    error,
  };
}

/**
 * Hook to get all lottery rounds using TanStack Query
 *
 * Benefits:
 * - Automatic caching of all rounds
 * - Real-time updates via refetchQueries()
 * - Parallel fetching for optimal performance
 * - Better error handling
 *
 * @returns Object with rounds array, loading state, and error
 */
export function useAllRounds() {
  const publicClient = usePublicClient();

  // Get round counter first
  const { data: roundCounter = 0, isLoading: isLoadingCounter } = useQuery({
    queryKey: ["lottery-pool", "round-counter"],
    queryFn: () => fetchRoundCounter(publicClient!),
    enabled: !!publicClient,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch all rounds based on counter
  const {
    data: rounds = [],
    isLoading: isLoadingRounds,
    error,
  } = useQuery({
    queryKey: ["lottery-pool", "all-rounds", normalizeBigInt(roundCounter)],
    queryFn: () => {
      if (!publicClient) {
        return Promise.resolve([]);
      }
      return fetchAllRounds(publicClient, roundCounter);
    },
    enabled: !!publicClient && roundCounter > 0,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    rounds,
    isLoading: isLoadingCounter || isLoadingRounds,
    error,
    roundCounter,
  };
}

/**
 * Hook to get user tickets for a round using TanStack Query
 *
 * @param roundId - ID of the round
 * @param userAddress - Address of the user (optional, uses connected account if not provided)
 * @returns Object with tickets array, ticket count, and loading state
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
    queryKey: [
      "lottery-pool",
      "user-tickets",
      roundId,
      targetAddress ?? "none",
    ],
    queryFn: () => {
      if (!publicClient || !roundId || !targetAddress) {
        return Promise.resolve(null);
      }
      return fetchUserTickets(publicClient, roundId, targetAddress);
    },
    enabled: !!publicClient && !!roundId && !!targetAddress,
    staleTime: 20000, // 20 seconds
    gcTime: 5 * 60 * 1000,
  });

  // Mock return array of ticket IDs for now
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
 * Hook to get user investment for a round using TanStack Query
 *
 * @param roundId - ID of the round
 * @returns Object with investment amount and loading state
 */
export function useUserInvestment(roundId?: number) {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const {
    data: investment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["lottery-pool", "user-investment", roundId, address ?? "none"],
    queryFn: () => {
      if (!publicClient || !roundId || !address) {
        return Promise.resolve(null);
      }
      return fetchUserInvestment(publicClient, roundId, address);
    },
    enabled: !!publicClient && !!roundId && !!address,
    staleTime: 20000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    investment: investment as bigint | null | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to calculate user probability using TanStack Query
 *
 * @param roundId - ID of the round
 * @returns Object with probability in basis points and loading state
 */
export function useUserProbability(roundId?: number) {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const {
    data: probability,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["lottery-pool", "user-probability", roundId, address ?? "none"],
    queryFn: () => {
      if (!publicClient || !roundId || !address) {
        return Promise.resolve(null);
      }
      return fetchUserProbability(publicClient, roundId, address);
    },
    enabled: !!publicClient && !!roundId && !!address,
    staleTime: 20000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    probability: probability as bigint | null | undefined, // Returns basis points (10000 = 100%)
    isLoading,
    error,
  };
}

/**
 * Hook to get user lottery statistics across all rounds using TanStack Query
 *
 * Uses parallel fetching for optimal performance
 *
 * @param userAddress - Address of the user (optional, uses connected account if not provided)
 * @returns Object with stats and loading state
 */
export function useUserLotteryStats(userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const targetAddress = userAddress ?? address;

  // Get round counter first
  const { data: roundCounter = 0, isLoading: isLoadingCounter } = useQuery({
    queryKey: ["lottery-pool", "round-counter"],
    queryFn: () => fetchRoundCounter(publicClient!),
    enabled: !!publicClient,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  // Fetch user stats based on round counter
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
    queryKey: [
      "lottery-pool",
      "user-stats",
      targetAddress ?? "none",
      normalizeBigInt(roundCounter),
    ],
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
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    stats: stats as UserLotteryStats,
    isLoading: isLoadingCounter || isLoadingStats,
    error,
  };
}

/**
 * Hook to buy tickets
 *
 * @returns Object with buyTickets function and transaction states
 */
export function useBuyTickets() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buyTickets = async (
    roundId: number,
    ticketCount: number,
    ticketPrice: bigint,
  ) => {
    const totalCost = ticketPrice * BigInt(ticketCount);

    writeContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "buyTickets",
      args: [BigInt(roundId), BigInt(ticketCount)],
      value: totalCost, // BTC is native on Mezo
    });
  };

  return {
    buyTickets,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to claim prize
 *
 * @returns Object with claimPrize function and transaction states
 */
export function useClaimPrize() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimPrize = async (roundId: number) => {
    writeContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "claimPrize",
      args: [BigInt(roundId)],
    });
  };

  return {
    claimPrize,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to withdraw capital (for non-winners)
 *
 * @returns Object with withdrawCapital function and transaction states
 */
export function useWithdrawCapital() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdrawCapital = async (roundId: number) => {
    writeContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "withdrawCapital",
      args: [BigInt(roundId)],
    });
  };

  return {
    withdrawCapital,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

// ============================================================================
// ADMIN HOOKS
// ============================================================================

/**
 * Hook to check if current user is lottery pool owner
 */
export function useLotteryPoolOwner() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const { data: owner, isLoading } = useQuery({
    queryKey: ["lottery-pool", "owner"],
    queryFn: async () => {
      if (!publicClient) {
        return null;
      }
      try {
        const result = await publicClient.readContract({
          address: LOTTERY_POOL_ADDRESS,
          abi: LOTTERY_POOL_ABI,
          functionName: "owner",
        });
        return result as `0x${string}`;
      } catch {
        return null;
      }
    },
    enabled: !!publicClient,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isOwner =
    address && owner ? address.toLowerCase() === owner.toLowerCase() : false;

  return { owner, isOwner, isLoading };
}

/**
 * Hook to draw winner (admin only)
 */
export function useDrawWinner() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const drawWinner = async (roundId: number) => {
    writeContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "drawWinner",
      args: [BigInt(roundId)],
    });
  };

  return {
    drawWinner,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to create a new lottery round (admin only)
 */
export function useCreateRound() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Create a new lottery round
   * @param ticketPrice - Price per ticket in wei (e.g., parseEther("0.001"))
   * @param maxTickets - Maximum number of tickets for the round
   * @param durationInSeconds - Duration of the round in seconds (e.g., 7 * 24 * 60 * 60 for 7 days)
   */
  const createRound = async (
    ticketPrice: bigint,
    maxTickets: number,
    durationInSeconds: number,
  ) => {
    writeContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "createRound",
      args: [ticketPrice, BigInt(maxTickets), BigInt(durationInSeconds)],
    });
  };

  return {
    createRound,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper: Format BTC amount
 */
export function formatBTC(amount: bigint): string {
  return formatEther(amount);
}

/**
 * Helper: Get lottery type text
 */
export function getLotteryTypeText(type: number): string {
  switch (type) {
    case 0:
      return "Semanal";
    case 1:
      return "Mensual";
    case 2:
      return "Personalizado";
    default:
      return "Desconocido";
  }
}

/**
 * Helper: Get status text
 */
export function getStatusText(status: number): string {
  switch (status) {
    case 0:
      return "Abierto";
    case 1:
      return "Sorteando";
    case 2:
      return "Completado";
    case 3:
      return "Cancelado";
    default:
      return "Desconocido";
  }
}

/**
 * Helper: Get status color
 */
export function getStatusColor(status: number): string {
  switch (status) {
    case 0:
      return "green";
    case 1:
      return "yellow";
    case 2:
      return "blue";
    case 3:
      return "red";
    default:
      return "gray";
  }
}

/**
 * Helper: Calculate time remaining
 */
export function getTimeRemaining(endTime: bigint): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const now = Math.floor(Date.now() / 1000);
  const end = Number(endTime);
  const total = Math.max(0, end - now);

  return {
    total,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Helper: Format probability as percentage
 */
export function formatProbability(basisPoints: bigint): string {
  // Basis points: 10000 = 100%
  const percentage = (Number(basisPoints) / 100).toFixed(2);
  return `${percentage}%`;
}

/**
 * Hook to check if lottery pool is deployed
 */
export function useLotteryPoolDeployed(): boolean {
  return LOTTERY_POOL_ADDRESS !== "0x0000000000000000000000000000000000000000";
}

/**
 * Helper: Format USD amount
 */
export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
}

/**
 * Helper: Format Ethereum address
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Helper: Get round status text (SimpleLotteryPool enum)
 */
export function getRoundStatus(status: number): string {
  switch (status) {
    case 0:
      return "Activo"; // OPEN
    case 1:
      return "Completado"; // COMPLETED
    case 2:
      return "Cancelado"; // CANCELLED
    default:
      return "Desconocido";
  }
}

/**
 * Re-export types for consumers
 */
export type { LotteryRound, UserLotteryStats };
