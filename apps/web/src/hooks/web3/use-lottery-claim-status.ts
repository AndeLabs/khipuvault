/**
 * @fileoverview Hook to check if user has claimed prize or withdrawn capital from lottery
 * @module hooks/web3/use-lottery-claim-status
 *
 * Reads PrizeClaimed events from blockchain to determine claim status
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";

import { MEZO_TESTNET_ADDRESSES } from "@/lib/web3/contracts";
import { LOTTERY_POOL_ABI } from "@/lib/web3/lottery-pool-abi";

/**
 * Hook to check if user has claimed their prize/capital for a specific round
 *
 * Reads PrizeClaimed events from blockchain to verify claim status
 *
 * @param roundId - Lottery round ID to check
 * @returns Object with hasClaimed status and loading state
 */
export function useLotteryClaimStatus(roundId?: number) {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const {
    data: hasClaimed = false,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["lottery-pool", "claim-status", roundId, address ?? "none"],
    queryFn: async (): Promise<boolean> => {
      if (!publicClient || !roundId || !address) {
        return false;
      }

      try {
        // Get current block number
        const latestBlock = await publicClient.getBlockNumber();

        // Query PrizeClaimed events for this user and round
        // Look back up to 10,000 blocks (roughly 1-2 weeks on most chains)
        const fromBlock =
          latestBlock > BigInt(10000) ? latestBlock - BigInt(10000) : BigInt(0);

        const events = await publicClient.getLogs({
          address: MEZO_TESTNET_ADDRESSES.lotteryPool as `0x${string}`,
          event: {
            type: "event",
            name: "PrizeClaimed",
            inputs: [
              { type: "uint256", indexed: true, name: "roundId" },
              { type: "address", indexed: true, name: "participant" },
              { type: "uint256", indexed: false, name: "amount" },
              { type: "bool", indexed: false, name: "isWinner" },
            ],
          },
          args: {
            roundId: BigInt(roundId),
            participant: address,
          },
          fromBlock,
          toBlock: "latest",
        });

        // If we found any PrizeClaimed events for this user/round, they've claimed
        return events.length > 0;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error checking lottery claim status:", err);
        return false;
      }
    },
    enabled: !!publicClient && !!roundId && !!address,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    hasClaimed,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Batch hook to check claim status for multiple rounds
 *
 * @param roundIds - Array of round IDs to check
 * @returns Map of roundId -> hasClaimed status
 */
export function useBatchLotteryClaimStatus(roundIds: number[]) {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const {
    data: claimStatusMap = {},
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "lottery-pool",
      "batch-claim-status",
      roundIds.join(","),
      address ?? "none",
    ],
    queryFn: async (): Promise<Record<number, boolean>> => {
      if (!publicClient || roundIds.length === 0 || !address) {
        return {};
      }

      try {
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock =
          latestBlock > BigInt(10000) ? latestBlock - BigInt(10000) : BigInt(0);

        // Fetch all PrizeClaimed events for this user
        const events = await publicClient.getLogs({
          address: MEZO_TESTNET_ADDRESSES.lotteryPool as `0x${string}`,
          event: {
            type: "event",
            name: "PrizeClaimed",
            inputs: [
              { type: "uint256", indexed: true, name: "roundId" },
              { type: "address", indexed: true, name: "participant" },
              { type: "uint256", indexed: false, name: "amount" },
              { type: "bool", indexed: false, name: "isWinner" },
            ],
          },
          args: {
            participant: address,
          },
          fromBlock,
          toBlock: "latest",
        });

        // Build map of roundId -> hasClaimed
        const statusMap: Record<number, boolean> = {};
        roundIds.forEach((roundId) => {
          statusMap[roundId] = events.some(
            (event) => event.args.roundId === BigInt(roundId),
          );
        });

        return statusMap;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error checking batch lottery claim status:", err);
        return {};
      }
    },
    enabled: !!publicClient && roundIds.length > 0 && !!address,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    claimStatusMap,
    isLoading,
    error,
  };
}
