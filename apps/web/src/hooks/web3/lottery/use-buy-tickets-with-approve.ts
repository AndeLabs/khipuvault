/**
 * @fileoverview Buy Tickets Hook with Auto Approve and Network Switching
 * @module hooks/web3/lottery/use-buy-tickets-with-approve
 *
 * Simplified version using useApproveAndExecute base hook.
 */

"use client";

import { useCallback } from "react";

import { MEZO_TESTNET_ADDRESSES } from "@/lib/web3/contracts-v3";
import { LOTTERY_POOL_ABI } from "@/lib/web3/contracts-v3";

import { useApproveAndExecute } from "../common/use-approve-and-execute";

const LOTTERY_POOL_ADDRESS = MEZO_TESTNET_ADDRESSES.lotteryPool as `0x${string}`;

/**
 * Hook for buying lottery tickets with automatic approval
 *
 * @example
 * ```tsx
 * const { buyTickets, isProcessing, step, error } = useBuyTicketsWithApprove();
 *
 * // Buy 5 tickets for round 1 at 10 MUSD each
 * await buyTickets(1, 5, parseEther("10"));
 * ```
 */
export function useBuyTicketsWithApprove() {
  const {
    execute,
    reset,
    isApproving,
    isExecuting,
    isProcessing,
    isSuccess,
    approveHash,
    executeHash,
    step,
    error,
  } = useApproveAndExecute<[bigint, bigint]>();

  const buyTickets = useCallback(
    async (roundId: number, ticketCount: number, ticketPrice: bigint) => {
      const totalCost = ticketPrice * BigInt(ticketCount);

      await execute({
        contractAddress: LOTTERY_POOL_ADDRESS,
        abi: LOTTERY_POOL_ABI,
        functionName: "buyTickets",
        args: [BigInt(roundId), BigInt(ticketCount)],
        requiredAllowance: totalCost,
        invalidateKeys: [["lottery-pool"], ["lotteryPool"]],
      });
    },
    [execute]
  );

  return {
    buyTickets,
    reset,
    isApproving,
    isBuying: isExecuting,
    isProcessing,
    isSuccess,
    approveHash,
    buyHash: executeHash,
    step,
    error,
  };
}
