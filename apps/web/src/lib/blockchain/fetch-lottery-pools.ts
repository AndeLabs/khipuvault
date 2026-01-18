/**
 * @fileoverview Fetch functions for LotteryPoolV3 data
 * @module lib/blockchain/fetch-lottery-pools
 *
 * Updated for LotteryPoolV3 contract with:
 * - Commit/Reveal randomness scheme
 * - mUSD-based lottery
 * - UUPS Upgradeable pattern
 */

import { MEZO_TESTNET_ADDRESSES } from "@/lib/web3/contracts";
import {
  LOTTERY_POOL_ABI,
  LotteryRoundStatus,
  type LotteryRoundV3,
  type LotteryParticipantV3,
} from "@/lib/web3/lottery-pool-abi";

import type { PublicClient } from "viem";

// Development-only logging
const isDev = process.env.NODE_ENV === "development";
// eslint-disable-next-line no-console
const devLog = isDev ? console.log.bind(console) : () => {};
// eslint-disable-next-line no-console
const devWarn = isDev ? console.warn.bind(console) : () => {};
// eslint-disable-next-line no-console
const devError = isDev ? console.error.bind(console) : () => {};

// Use centralized contract addresses
const LOTTERY_POOL_ADDRESS = MEZO_TESTNET_ADDRESSES.lotteryPool as `0x${string}`;

// Re-export types for consumers
export type { LotteryRoundV3, LotteryParticipantV3 };
export { LotteryRoundStatus };

// Parsed round with computed fields
export interface LotteryRound {
  roundId: number;
  ticketPrice: bigint;
  totalMusd: bigint;
  totalPrize: bigint; // Alias for totalMusd (V3 compatibility)
  maxTickets: number;
  totalTicketsSold: number;
  startTime: bigint; // Unix timestamp
  endTime: bigint; // Unix timestamp
  commitDeadline: bigint; // Unix timestamp
  revealDeadline: bigint; // Unix timestamp
  winner: string;
  winnerPrize: bigint;
  totalYield: bigint;
  status: number;
  statusLabel: string;
  isActive: boolean;
}

export interface UserLotteryStats {
  totalInvested: bigint;
  roundsPlayed: number;
  totalTickets: number;
  totalWinnings: bigint;
}

/**
 * Get status label for round status
 */
function getStatusLabel(status: number): string {
  switch (status) {
    case LotteryRoundStatus.OPEN:
      return "Open";
    case LotteryRoundStatus.COMMIT:
      return "Commit Phase";
    case LotteryRoundStatus.REVEAL:
      return "Reveal Phase";
    case LotteryRoundStatus.COMPLETED:
      return "Completed";
    case LotteryRoundStatus.CANCELLED:
      return "Cancelled";
    default:
      return "Unknown";
  }
}

/**
 * Parse raw round data from contract
 */
function parseRoundData(roundId: number, rawRound: LotteryRoundV3): LotteryRound {
  const status = Number(rawRound.status);
  const totalMusd = BigInt(rawRound.totalMusd);
  return {
    roundId,
    ticketPrice: BigInt(rawRound.ticketPrice),
    totalMusd,
    totalPrize: totalMusd, // Alias for backward compatibility
    maxTickets: Number(rawRound.maxTickets),
    totalTicketsSold: Number(rawRound.totalTicketsSold),
    startTime: BigInt(rawRound.startTime),
    endTime: BigInt(rawRound.endTime),
    commitDeadline: BigInt(rawRound.commitDeadline),
    revealDeadline: BigInt(rawRound.revealDeadline),
    winner: rawRound.winner,
    winnerPrize: BigInt(rawRound.winnerPrize),
    totalYield: BigInt(rawRound.totalYield),
    status,
    statusLabel: getStatusLabel(status),
    isActive:
      status === LotteryRoundStatus.OPEN ||
      status === LotteryRoundStatus.COMMIT ||
      status === LotteryRoundStatus.REVEAL,
  };
}

/**
 * Fetch current round ID
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @returns Current round ID
 */
export async function fetchCurrentRoundId(publicClient: PublicClient): Promise<number> {
  if (!publicClient) {
    return 0;
  }

  try {
    const currentRoundId = await publicClient.readContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "currentRoundId",
      args: [],
    });

    return Number(currentRoundId || 0);
  } catch (error) {
    devError("Error fetching current round ID:", error);
    return 0;
  }
}

/**
 * Fetch active round ID (if any)
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @returns Active round ID or 0 if no active round
 */
export async function fetchActiveRoundId(publicClient: PublicClient): Promise<number> {
  if (!publicClient) {
    return 0;
  }

  try {
    const activeRoundId = await publicClient.readContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "getActiveRound",
      args: [],
    });

    return Number(activeRoundId || 0);
  } catch (error) {
    devError("Error fetching active round ID:", error);
    return 0;
  }
}

/**
 * Fetch round counter (total number of rounds)
 * V3 uses currentRoundId as the counter
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @returns Total number of rounds
 */
export async function fetchRoundCounter(publicClient: PublicClient): Promise<number> {
  return fetchCurrentRoundId(publicClient);
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
  roundId: bigint | number
): Promise<LotteryRound | null> {
  if (!publicClient) {
    return null;
  }

  try {
    const roundInfo = await publicClient.readContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "getRound",
      args: [BigInt(roundId)],
    });

    return parseRoundData(Number(roundId), roundInfo as LotteryRoundV3);
  } catch (error) {
    devError(`Error fetching round ${roundId}:`, error);
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
  roundCounter: number
): Promise<LotteryRound[]> {
  if (!publicClient || roundCounter <= 0) {
    return [];
  }

  devLog(`🔄 Fetching ${roundCounter} lottery rounds`);

  try {
    const roundsData: LotteryRound[] = [];

    // Fetch each round in parallel using Promise.allSettled
    const roundPromises = Array.from({ length: roundCounter }, (_, i) =>
      publicClient.readContract({
        address: LOTTERY_POOL_ADDRESS,
        abi: LOTTERY_POOL_ABI,
        functionName: "getRound",
        args: [BigInt(i + 1)],
      })
    );

    const results = await Promise.allSettled(roundPromises);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        try {
          const parsed = parseRoundData(i + 1, result.value as LotteryRoundV3);
          roundsData.push(parsed);
        } catch (error) {
          devWarn(`⚠️ Failed to parse round ${i + 1}:`, error);
        }
      } else {
        devWarn(`⚠️ Failed to fetch round ${i + 1}:`, result.reason);
      }
    }

    devLog(`✅ Fetched ${roundsData.length} lottery rounds`);
    return roundsData;
  } catch (error) {
    devError("Error fetching all rounds:", error);
    return [];
  }
}

/**
 * Fetch user participation info for a specific round
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @param roundId - ID of the round
 * @param userAddress - Address of the user
 * @returns Participant info or null
 */
export async function fetchUserParticipation(
  publicClient: PublicClient,
  roundId: bigint | number,
  userAddress: `0x${string}`
): Promise<LotteryParticipantV3 | null> {
  if (!publicClient || !userAddress) {
    return null;
  }

  try {
    const participant = await publicClient.readContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "getParticipant",
      args: [BigInt(roundId), userAddress],
    });

    return participant as LotteryParticipantV3;
  } catch (error) {
    devError(`Error fetching participation for round ${roundId}:`, error);
    return null;
  }
}

/**
 * Fetch user tickets for a specific round (legacy compatibility)
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @param roundId - ID of the round
 * @param userAddress - Address of the user
 * @returns Number of tickets owned by user
 */
export async function fetchUserTickets(
  publicClient: PublicClient,
  roundId: bigint | number,
  userAddress: `0x${string}`
): Promise<bigint | null> {
  const participant = await fetchUserParticipation(publicClient, roundId, userAddress);
  return participant ? BigInt(participant.ticketCount) : null;
}

/**
 * Fetch user investment for a specific round (legacy compatibility)
 *
 * @param publicClient - Viem PublicClient for blockchain queries
 * @param roundId - ID of the round
 * @param userAddress - Address of the user
 * @returns Amount invested by user
 */
export async function fetchUserInvestment(
  publicClient: PublicClient,
  roundId: bigint | number,
  userAddress: `0x${string}`
): Promise<bigint | null> {
  const participant = await fetchUserParticipation(publicClient, roundId, userAddress);
  return participant ? BigInt(participant.musdContributed) : null;
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
  userAddress: `0x${string}`
): Promise<bigint | null> {
  if (!publicClient || !userAddress) {
    return null;
  }

  try {
    const probability = await publicClient.readContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "getWinProbability",
      args: [BigInt(roundId), userAddress],
    });

    return probability as bigint;
  } catch (error) {
    devError(`Error fetching user probability for round ${roundId}:`, error);
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
  userAddress: `0x${string}`
): Promise<UserLotteryStats> {
  if (!publicClient || !userAddress || roundCounter <= 0) {
    return {
      totalInvested: 0n,
      roundsPlayed: 0,
      totalTickets: 0,
      totalWinnings: 0n,
    };
  }

  devLog(`🔄 Fetching lottery stats for ${userAddress} across ${roundCounter} rounds`);

  try {
    let totalInvested = 0n;
    let roundsPlayed = 0;
    let totalTickets = 0;
    let totalWinnings = 0n;

    // Fetch all participant data and round info in parallel
    const participantPromises = Array.from({ length: roundCounter }, (_, i) =>
      publicClient.readContract({
        address: LOTTERY_POOL_ADDRESS,
        abi: LOTTERY_POOL_ABI,
        functionName: "getParticipant",
        args: [BigInt(i + 1), userAddress],
      })
    );

    const roundInfoPromises = Array.from({ length: roundCounter }, (_, i) =>
      publicClient.readContract({
        address: LOTTERY_POOL_ADDRESS,
        abi: LOTTERY_POOL_ABI,
        functionName: "getRound",
        args: [BigInt(i + 1)],
      })
    );

    const participantResults = await Promise.allSettled(participantPromises);
    const roundResults = await Promise.allSettled(roundInfoPromises);

    // Process results
    for (let i = 0; i < participantResults.length; i++) {
      const participantResult = participantResults[i];

      if (participantResult.status === "fulfilled") {
        const participant = participantResult.value as LotteryParticipantV3;
        const invested = BigInt(participant.musdContributed);
        const tickets = Number(participant.ticketCount);

        if (invested > 0n || tickets > 0) {
          totalInvested += invested;
          totalTickets += tickets;
          roundsPlayed++;

          // Check if user won this round
          const roundResult = roundResults[i];
          if (roundResult.status === "fulfilled") {
            try {
              const roundInfo = roundResult.value as LotteryRoundV3;

              if (roundInfo.winner.toLowerCase() === userAddress.toLowerCase()) {
                totalWinnings += BigInt(roundInfo.winnerPrize);
              }
            } catch (error) {
              devWarn(`⚠️ Failed to check winner for round ${i + 1}:`, error);
            }
          }
        }
      }
    }

    devLog(`✅ Fetched lottery stats: ${roundsPlayed} rounds, ${totalTickets} tickets`);

    return {
      totalInvested,
      roundsPlayed,
      totalTickets,
      totalWinnings,
    };
  } catch (error) {
    devError("Error fetching user lottery stats:", error);
    return {
      totalInvested: 0n,
      roundsPlayed: 0,
      totalTickets: 0,
      totalWinnings: 0n,
    };
  }
}
