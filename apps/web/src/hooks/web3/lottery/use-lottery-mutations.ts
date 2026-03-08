/**
 * @fileoverview Lottery Pool Write Mutations
 * @module hooks/web3/lottery/use-lottery-mutations
 *
 * Hooks for lottery pool write operations (buy tickets, claim, withdraw, admin)
 */

"use client";

import { type Address } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

import { MEZO_TESTNET_ADDRESSES } from "@/lib/web3/contracts-v3";
import { LOTTERY_POOL_ABI } from "@/lib/web3/contracts-v3";

const LOTTERY_POOL_ADDRESS = MEZO_TESTNET_ADDRESSES.lotteryPool as Address;

/**
 * Hook to buy tickets using mUSD
 * LotteryPoolV3 uses mUSD (ERC20) not native BTC
 */
export function useBuyTickets() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buyTickets = async (roundId: number, ticketCount: number, _ticketPrice: bigint) => {
    writeContract({
      address: LOTTERY_POOL_ADDRESS,
      abi: LOTTERY_POOL_ABI,
      functionName: "buyTickets",
      args: [BigInt(roundId), BigInt(ticketCount)],
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
   * @param ticketPrice - Price per ticket in wei
   * @param maxTickets - Maximum number of tickets for the round
   * @param durationInSeconds - Duration of the round in seconds
   */
  const createRound = async (
    ticketPrice: bigint,
    maxTickets: number,
    durationInSeconds: number
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
