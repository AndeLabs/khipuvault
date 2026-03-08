/**
 * @fileoverview Cooperative Pool V3 Mutations (Write Operations)
 * @module hooks/web3/cooperative/use-pool-mutations
 *
 * All write operations for cooperative pools
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { parseEther } from "viem";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";

import { queryKeys } from "@/lib/query-keys";
import { MEZO_TESTNET_ADDRESSES } from "@/lib/web3/contracts-v3";
import { COOPERATIVE_POOL_FRAGMENTS } from "@/contracts/abis/fragments";

import { ActionState } from "./constants";
import { parsePoolError } from "./use-pool-helpers";

const poolAddress = MEZO_TESTNET_ADDRESSES.cooperativePoolV3;

// ============================================================================
// BASE MUTATION HOOK
// ============================================================================

/**
 * Base hook for pool mutations - handles common transaction logic
 */
function usePoolMutation() {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  const [state, setState] = useState<ActionState>("idle");
  const [error, setError] = useState<string>("");

  const {
    writeContract: write,
    data: txHash,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isPending,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && state === "processing") {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cooperativePool.v3 });
      setState("success");
    }
  }, [isSuccess, state, queryClient]);

  // Handle state transitions
  useEffect(() => {
    if (isPending && state === "executing") {
      setState("processing");
    }
  }, [isPending, state]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      setState("error");
      setError(parsePoolError(writeError));
    }
  }, [writeError]);

  const reset = useCallback(() => {
    setState("idle");
    setError("");
    resetWrite();
  }, [resetWrite]);

  return {
    address,
    isConnected,
    state,
    setState,
    error,
    setError,
    write,
    reset,
    txHash: receipt?.transactionHash ?? txHash,
    isProcessing: state !== "idle" && state !== "success" && state !== "error",
  };
}

// ============================================================================
// CREATE POOL
// ============================================================================

/**
 * Create a new cooperative pool
 */
export function useCreatePool() {
  const mutation = usePoolMutation();

  const createPool = useCallback(
    async (name: string, minContribution: string, maxContribution: string, maxMembers: number) => {
      if (!mutation.address) {
        mutation.setError("Please connect your wallet");
        mutation.setState("error");
        return;
      }

      try {
        mutation.setState("idle");
        mutation.setError("");
        mutation.reset();

        const min = parseEther(minContribution);
        const max = parseEther(maxContribution);

        mutation.setState("executing");

        mutation.write({
          address: poolAddress,
          abi: COOPERATIVE_POOL_FRAGMENTS.createPool,
          functionName: "createPool",
          args: [name, min, max, BigInt(maxMembers)],
        });
      } catch (err) {
        mutation.setState("error");
        mutation.setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [mutation]
  );

  return {
    createPool,
    ...mutation,
  };
}

// ============================================================================
// JOIN POOL
// ============================================================================

/**
 * Join an existing cooperative pool
 */
export function useJoinPool() {
  const mutation = usePoolMutation();

  const joinPool = useCallback(
    async (poolId: number, btcAmount: string) => {
      if (!mutation.address) {
        mutation.setError("Please connect your wallet");
        mutation.setState("error");
        return;
      }

      try {
        mutation.setState("idle");
        mutation.setError("");
        mutation.reset();

        const amount = parseEther(btcAmount);

        mutation.setState("executing");

        mutation.write({
          address: poolAddress,
          abi: COOPERATIVE_POOL_FRAGMENTS.joinPool,
          functionName: "joinPool",
          args: [BigInt(poolId)],
          value: amount,
        });
      } catch (err) {
        mutation.setState("error");
        mutation.setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [mutation]
  );

  return {
    joinPool,
    ...mutation,
  };
}

// ============================================================================
// LEAVE POOL
// ============================================================================

/**
 * Leave a cooperative pool
 */
export function useLeavePool() {
  const mutation = usePoolMutation();

  const leavePool = useCallback(
    async (poolId: number) => {
      if (!mutation.address) {
        mutation.setError("Please connect your wallet");
        mutation.setState("error");
        return;
      }

      try {
        mutation.setState("idle");
        mutation.setError("");
        mutation.reset();

        mutation.setState("executing");

        mutation.write({
          address: poolAddress,
          abi: COOPERATIVE_POOL_FRAGMENTS.leavePool,
          functionName: "leavePool",
          args: [BigInt(poolId)],
        });
      } catch (err) {
        mutation.setState("error");
        mutation.setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [mutation]
  );

  return {
    leavePool,
    ...mutation,
  };
}

// ============================================================================
// CLAIM YIELD
// ============================================================================

/**
 * Claim yields from a cooperative pool
 */
export function useClaimYield() {
  const mutation = usePoolMutation();

  const claimYield = useCallback(
    async (poolId: number) => {
      if (!mutation.address) {
        mutation.setError("Please connect your wallet");
        mutation.setState("error");
        return;
      }

      try {
        mutation.setState("idle");
        mutation.setError("");
        mutation.reset();

        mutation.setState("executing");

        mutation.write({
          address: poolAddress,
          abi: COOPERATIVE_POOL_FRAGMENTS.claimYield,
          functionName: "claimYield",
          args: [BigInt(poolId)],
        });
      } catch (err) {
        mutation.setState("error");
        mutation.setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [mutation]
  );

  return {
    claimYield,
    ...mutation,
  };
}

// ============================================================================
// CLOSE POOL
// ============================================================================

/**
 * Close a cooperative pool (creator only)
 */
export function useClosePool() {
  const mutation = usePoolMutation();

  const closePool = useCallback(
    async (poolId: number) => {
      if (!mutation.address) {
        mutation.setError("Please connect your wallet");
        mutation.setState("error");
        return;
      }

      try {
        mutation.setState("idle");
        mutation.setError("");
        mutation.reset();

        mutation.setState("executing");

        mutation.write({
          address: poolAddress,
          abi: COOPERATIVE_POOL_FRAGMENTS.closePool,
          functionName: "closePool",
          args: [BigInt(poolId)],
        });
      } catch (err) {
        mutation.setState("error");
        mutation.setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [mutation]
  );

  return {
    closePool,
    ...mutation,
  };
}

// ============================================================================
// WITHDRAW PARTIAL
// ============================================================================

/**
 * Withdraw a partial amount from a cooperative pool
 *
 * @description
 * Allows members to withdraw a portion of their contribution while remaining
 * in the pool. The remaining contribution must be >= pool's minContribution.
 *
 * @example
 * ```tsx
 * const { withdrawPartial, state, error } = useWithdrawPartial();
 *
 * // Withdraw 0.5 BTC from pool 1
 * await withdrawPartial(1, "0.5");
 * ```
 */
export function useWithdrawPartial() {
  const mutation = usePoolMutation();

  const withdrawPartial = useCallback(
    async (poolId: number, btcAmount: string) => {
      if (!mutation.address) {
        mutation.setError("Please connect your wallet");
        mutation.setState("error");
        return;
      }

      try {
        mutation.setState("idle");
        mutation.setError("");
        mutation.reset();

        const amount = parseEther(btcAmount);

        if (amount <= BigInt(0)) {
          mutation.setError("Amount must be greater than 0");
          mutation.setState("error");
          return;
        }

        mutation.setState("executing");

        mutation.write({
          address: poolAddress,
          abi: COOPERATIVE_POOL_FRAGMENTS.withdrawPartial,
          functionName: "withdrawPartial",
          args: [BigInt(poolId), amount],
        });
      } catch (err) {
        mutation.setState("error");
        mutation.setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [mutation]
  );

  return {
    withdrawPartial,
    ...mutation,
  };
}
