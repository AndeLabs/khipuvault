/**
 * Hook to create new Rotating Pool (ROSCA)
 * @module hooks/web3/rotating/use-create-rotating-pool
 *
 * Best Practices 2026:
 * - Wagmi 2.x useWriteContract with isPending
 * - Proper error handling
 * - Transaction waiting and verification
 * - Type safety with Viem
 */

import { useQueryClient } from "@tanstack/react-query";
import { Address, parseEther } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

import RotatingPoolABI from "@/contracts/abis/RotatingPool.json";

// Contract address - Deployed on Mezo Testnet
const ROTATING_POOL_ADDRESS = "0x0Bac59e87Af0D2e95711846BaDb124164382aafC" as Address;

export interface CreatePoolParams {
  name: string;
  memberCount: bigint;
  contributionAmount: bigint; // in wei
  periodDuration: bigint; // in seconds
  autoAdvance: boolean;
}

/**
 * Hook to create a new rotating pool
 */
export function useCreateRotatingPool() {
  const queryClient = useQueryClient();

  // Write contract mutation
  const {
    data: hash,
    isPending: isWritePending,
    writeContract,
    error: writeError,
  } = useWriteContract();

  // Wait for transaction
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Create pool function
   */
  const createPool = ({
    name,
    memberCount,
    contributionAmount,
    periodDuration,
    autoAdvance,
  }: CreatePoolParams) => {
    writeContract({
      address: ROTATING_POOL_ADDRESS,
      abi: RotatingPoolABI.abi,
      functionName: "createPool",
      args: [name, memberCount, contributionAmount, periodDuration, autoAdvance],
    });
  };

  // Invalidate queries on success
  if (isConfirmed) {
    // Invalidate pool counter and lists
    void queryClient.invalidateQueries({ queryKey: ["rotating-pool-counter"] });
    void queryClient.invalidateQueries({ queryKey: ["rotating-pools"] });
  }

  return {
    createPool,
    hash,
    isPending: isWritePending || isConfirming,
    isWritePending,
    isConfirming,
    isConfirmed,
    isSuccess: isConfirmed,
    error: writeError ?? confirmError,
  };
}

/**
 * Utility to convert ETH string to wei
 */
export function parseContribution(ethAmount: string): bigint {
  return parseEther(ethAmount);
}

/**
 * Utility to convert days to seconds
 */
export function daysToSeconds(days: number): bigint {
  return BigInt(days * 24 * 60 * 60);
}

/**
 * Utility to convert weeks to seconds
 */
export function weeksToSeconds(weeks: number): bigint {
  return BigInt(weeks * 7 * 24 * 60 * 60);
}

/**
 * Utility to convert months to seconds (approximation: 30 days)
 */
export function monthsToSeconds(months: number): bigint {
  return BigInt(months * 30 * 24 * 60 * 60);
}
