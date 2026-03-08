/**
 * @fileoverview Deposit Hook with Auto Approve and Network Switching
 * @module hooks/web3/use-deposit-with-approve
 *
 * Simplified version using useApproveAndExecute base hook.
 */

"use client";

import { useCallback } from "react";
import { parseEther } from "viem";

import { MEZO_TESTNET_ADDRESSES, INDIVIDUAL_POOL_ABI } from "@/lib/web3/contracts-v3";

import { useApproveAndExecute } from "./common/use-approve-and-execute";

const POOL_ADDRESS = MEZO_TESTNET_ADDRESSES.individualPool as `0x${string}`;

/**
 * Hook for depositing MUSD with automatic approval
 *
 * @example
 * ```tsx
 * const { deposit, isProcessing, step, error } = useDepositWithApprove();
 *
 * // Deposit 100 MUSD
 * await deposit("100");
 * ```
 */
export function useDepositWithApprove() {
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
  } = useApproveAndExecute<[bigint]>();

  const deposit = useCallback(
    async (amount: string | bigint) => {
      const amountWei = typeof amount === "string" ? parseEther(amount) : amount;

      await execute({
        contractAddress: POOL_ADDRESS,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: "deposit",
        args: [amountWei],
        requiredAllowance: amountWei,
        invalidateKeys: [["individual-pool-v3"], ["individual-pool"]],
      });
    },
    [execute]
  );

  return {
    deposit,
    reset,
    isApproving,
    isDepositing: isExecuting,
    isProcessing,
    isSuccess,
    approveHash,
    depositHash: executeHash,
    step,
    error,
  };
}
