/**
 * @fileoverview Fetch functions for Lottery Pool data
 * @module lib/blockchain/fetch-lottery-pools
 *
 * Separated from hooks for:
 * - Testability and reusability
 * - Type safety with explicit return types
 * - Easy integration with TanStack Query
 */

import { PublicClient } from "viem";
import { LOTTERY_POOL_ABI } from "@/lib/web3/lottery-pool-abi";
import { MEZO_TESTNET_ADDRESSES } from "@/lib/web3/contracts";

// Use centralized contract addresses - falls back to zero address if not deployed
const LOTTERY_POOL_ADDRESS =
  MEZO_TESTNET_ADDRESSES.lotteryPool as `0x${string}`;

// Types matching SimpleLotteryPool contract
export interface LotteryRound {
  roundId: bigint;
  ticketPrice: bigint;
  maxTickets: bigint;
  totalTicketsSold: bigint;
  totalPrize: bigint;
  startTime: bigint;
  endTime: bigint;
  winner: string;
  status: number; // 0=OPEN, 1=COMPLETED, 2=CANCELLED
}

export interface UserLotteryStats {
  totalInvested: bigint;
  roundsPlayed: number;
  totalTickets: number;
  totalWinnings: bigint;
}

/**
 * Fetch current round ID
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @returns Current round ID
 */
export async function fetchCurrentRoundId(
  publicClient: PublicClient,
): Promise<bigint | null> {
  if (!publicClient) {
    return null;
  }

  try {
    const currentRoundId = await publicClient.readContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "currentRoundId",
    });

    return currentRoundId as bigint;
  } catch (error) {
    console.error("Error fetching current round ID:", error);
    return null;
  }
}

/**
 * Fetch round counter (total number of rounds)
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @returns Total number of rounds
 */
export async function fetchRoundCounter(
  publicClient: PublicClient,
): Promise<number> {
  if (!publicClient) {
    return 0;
  }

  try {
    const roundCounter = await publicClient.readContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "roundCounter",
    });

    return Number(roundCounter || 0);
  } catch (error) {
    console.error("Error fetching round counter:", error);
    return 0;
  }
}

/**
 * Fetch specific round info
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @param roundId - ID of the round to fetch
 * @returns LotteryRound object
 */
export async function fetchRoundInfo(
  publicClient: PublicClient,
  roundId: bigint | number,
): Promise<LotteryRound | null> {
  if (!publicClient) {
    return null;
  }

  try {
    const roundInfo = await publicClient.readContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "getRoundInfo",
      args: [BigInt(roundId)],
    });

    return roundInfo as LotteryRound;
  } catch (error) {
    console.error(`Error fetching round ${roundId}:`, error);
    return null;
  }
}

/**
 * Fetch all lottery rounds from contract
 *
 * Optimized with Promise.allSettled for parallel fetching
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @param roundCounter - Total number of rounds to fetch
 * @returns Array of LotteryRound objects
 */
export async function fetchAllRounds(
  publicClient: PublicClient,
  roundCounter: number,
): Promise<LotteryRound[]> {
  if (!publicClient || roundCounter <= 0) {
    return [];
  }

  console.log(`🔄 Fetching ${roundCounter} lottery rounds`);

  try {
    const roundsData: LotteryRound[] = [];

    // Fetch each round in parallel using Promise.allSettled
    const roundPromises = Array.from({ length: roundCounter }, (_, i) =>
      publicClient.readContract({
        address: LOTTERY_POOL_ADDRESS,
        abi: LOTTERY_POOL_ABI,
        functionName: "getRoundInfo",
        args: [BigInt(i + 1)],
      }),
    );

    const results = await Promise.allSettled(roundPromises);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        try {
          roundsData.push(result.value as LotteryRound);
        } catch (error) {
          console.warn(`⚠️ Failed to parse round ${i + 1}:`, error);
        }
      } else {
        console.warn(`⚠️ Failed to fetch round ${i + 1}:`, result.reason);
      }
    }

    console.log(`✅ Fetched ${roundsData.length} lottery rounds`);
    return roundsData;
  } catch (error) {
    console.error("Error fetching all rounds:", error);
    return [];
  }
}

/**
 * Fetch user tickets for a specific round
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @param roundId - ID of the round
 * @param userAddress - Address of the user
 * @returns Number of tickets owned by user
 */
export async function fetchUserTickets(
  publicClient: PublicClient,
  roundId: bigint | number,
  userAddress: `0x${string}`,
): Promise<bigint | null> {
  if (!publicClient || !userAddress) {
    return null;
  }

  try {
    const ticketCount = await publicClient.readContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "getUserTickets",
      args: [BigInt(roundId), userAddress],
    });

    return ticketCount as bigint;
  } catch (error) {
    console.error(`Error fetching user tickets for round ${roundId}:`, error);
    return null;
  }
}

/**
 * Fetch user investment for a specific round
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @param roundId - ID of the round
 * @param userAddress - Address of the user
 * @returns Amount invested by user
 */
export async function fetchUserInvestment(
  publicClient: PublicClient,
  roundId: bigint | number,
  userAddress: `0x${string}`,
): Promise<bigint | null> {
  if (!publicClient || !userAddress) {
    return null;
  }

  try {
    const investment = await publicClient.readContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "getUserInvestment",
      args: [BigInt(roundId), userAddress],
    });

    return investment as bigint;
  } catch (error) {
    console.error(
      `Error fetching user investment for round ${roundId}:`,
      error,
    );
    return null;
  }
}

/**
 * Calculate user winning probability for a round
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @param roundId - ID of the round
 * @param userAddress - Address of the user
 * @returns Probability in basis points (10000 = 100%)
 */
export async function fetchUserProbability(
  publicClient: PublicClient,
  roundId: bigint | number,
  userAddress: `0x${string}`,
): Promise<bigint | null> {
  if (!publicClient || !userAddress) {
    return null;
  }

  try {
    const probability = await publicClient.readContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "calculateUserProbability",
      args: [BigInt(roundId), userAddress],
    });

    return probability as bigint;
  } catch (error) {
    console.error(
      `Error fetching user probability for round ${roundId}:`,
      error,
    );
    return null;
  }
}

/**
 * Fetch user lottery statistics across all rounds
 *
 * This function iterates through all rounds and aggregates user statistics.
 * Uses Promise.allSettled for parallel fetching of round and investment data.
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @param roundCounter - Total number of rounds
 * @param userAddress - Address of the user
 * @returns UserLotteryStats object
 */
export async function fetchUserLotteryStats(
  publicClient: PublicClient,
  roundCounter: number,
  userAddress: `0x${string}`,
): Promise<UserLotteryStats> {
  if (!publicClient || !userAddress || roundCounter <= 0) {
    return {
      totalInvested: 0n,
      roundsPlayed: 0,
      totalTickets: 0,
      totalWinnings: 0n,
    };
  }

  console.log(
    `🔄 Fetching lottery stats for ${userAddress} across ${roundCounter} rounds`,
  );

  try {
    let totalInvested = 0n;
    let roundsPlayed = 0;
    let totalTickets = 0;
    let totalWinnings = 0n;

    // Fetch all investments and round info in parallel
    const investmentPromises = Array.from({ length: roundCounter }, (_, i) =>
      publicClient.readContract({
        address: LOTTERY_POOL_ADDRESS,
        abi: LOTTERY_POOL_ABI,
        functionName: "getUserInvestment",
        args: [BigInt(i + 1), userAddress],
      }),
    );

    const roundInfoPromises = Array.from({ length: roundCounter }, (_, i) =>
      publicClient.readContract({
        address: LOTTERY_POOL_ADDRESS,
        abi: LOTTERY_POOL_ABI,
        functionName: "getRoundInfo",
        args: [BigInt(i + 1)],
      }),
    );

    const investmentResults = await Promise.allSettled(investmentPromises);
    const roundResults = await Promise.allSettled(roundInfoPromises);

    // Process results
    for (let i = 0; i < investmentResults.length; i++) {
      const investmentResult = investmentResults[i];

      if (investmentResult.status === "fulfilled") {
        const investment = investmentResult.value as bigint;

        if (investment > 0n) {
          totalInvested += investment;
          roundsPlayed++;

          // Fetch ticket count for this round
          try {
            const ticketCount = (await publicClient.readContract({
              address: LOTTERY_POOL_ADDRESS,
              abi: LOTTERY_POOL_ABI,
              functionName: "getUserTickets",
              args: [BigInt(i + 1), userAddress],
            })) as bigint;

            totalTickets += Number(ticketCount || 0n);
          } catch (error) {
            console.warn(
              `⚠️ Failed to fetch tickets for round ${i + 1}:`,
              error,
            );
          }

          // Check if user won this round
          const roundResult = roundResults[i];
          if (roundResult.status === "fulfilled") {
            try {
              const roundInfo = roundResult.value as LotteryRound;

              if (
                roundInfo.winner.toLowerCase() === userAddress.toLowerCase()
              ) {
                // Get the prize amount - check if it exists in the round info
                const prize =
                  (roundInfo as any).winnerPrize || roundInfo.totalPrize;
                totalWinnings += prize;
              }
            } catch (error) {
              console.warn(
                `⚠️ Failed to check winner for round ${i + 1}:`,
                error,
              );
            }
          }
        }
      }
    }

    console.log(
      `✅ Fetched lottery stats: ${roundsPlayed} rounds, ${totalTickets} tickets`,
    );

    return {
      totalInvested,
      roundsPlayed,
      totalTickets,
      totalWinnings,
    };
  } catch (error) {
    console.error("Error fetching user lottery stats:", error);
    return {
      totalInvested: 0n,
      roundsPlayed: 0,
      totalTickets: 0,
      totalWinnings: 0n,
    };
  }
}
