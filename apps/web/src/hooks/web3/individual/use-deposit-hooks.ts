/**
 * @fileoverview Individual Pool V3 Deposit and Withdrawal Hooks
 * @module hooks/web3/individual/use-deposit-hooks
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

import { MEZO_V3_ADDRESSES, INDIVIDUAL_POOL_V3_ABI, V3_FEATURES } from "@/lib/web3/contracts-v3";

import { QUERY_KEYS, INITIAL_TX_STATE, TransactionState } from "./constants";

const INDIVIDUAL_POOL_ADDRESS = MEZO_V3_ADDRESSES.individualPoolV3 as `0x${string}`;

// ============================================================================
// DEPOSIT HOOKS
// ============================================================================

/**
 * Hook to handle V3 pool deposit with referral support
 */
export function useDeposit() {
  const queryClient = useQueryClient();
  const [localState, setLocalState] = useState<TransactionState>(INITIAL_TX_STATE);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = useCallback(
    async (amount: bigint, referrer?: string) => {
      try {
        setLocalState({ isProcessing: true, hash: null });

        // Validate minimum deposit
        if (amount < BigInt(V3_FEATURES.individualPool.minDeposit)) {
          throw new Error(`Minimum deposit is ${V3_FEATURES.individualPool.minDeposit} MUSD`);
        }

        // Validate maximum deposit
        if (amount > BigInt(V3_FEATURES.individualPool.maxDeposit)) {
          throw new Error(`Maximum deposit is ${V3_FEATURES.individualPool.maxDeposit} MUSD`);
        }

        // Use depositWithReferral if referrer is provided, otherwise use simple deposit
        if (referrer && referrer !== "0x0000000000000000000000000000000000000000") {
          writeContract({
            address: INDIVIDUAL_POOL_ADDRESS,
            abi: INDIVIDUAL_POOL_V3_ABI,
            functionName: "depositWithReferral",
            args: [amount, referrer],
          });
        } else {
          writeContract({
            address: INDIVIDUAL_POOL_ADDRESS,
            abi: INDIVIDUAL_POOL_V3_ABI,
            functionName: "deposit",
            args: [amount],
          });
        }
      } catch (err) {
        setLocalState({ isProcessing: false, hash: null });
        throw err;
      }
    },
    [writeContract]
  );

  // Update local state when hash changes
  useEffect(() => {
    if (hash) {
      setLocalState({ isProcessing: false, hash });
    }
  }, [hash]);

  // Refetch data on success
  useEffect(() => {
    if (isSuccess) {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.INDIVIDUAL_POOL,
      });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BALANCE });
    }
  }, [isSuccess, queryClient]);

  return {
    deposit,
    isDepositing: isPending || localState.isProcessing,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// ============================================================================
// WITHDRAWAL HOOKS
// ============================================================================

/**
 * Hook to handle V3 partial withdrawal
 */
export function usePartialWithdraw() {
  const queryClient = useQueryClient();
  const [localState, setLocalState] = useState<TransactionState>(INITIAL_TX_STATE);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const partialWithdraw = useCallback(
    async (amount: bigint) => {
      try {
        setLocalState({ isProcessing: true, hash: null });

        // Validate minimum withdrawal
        if (amount < BigInt(V3_FEATURES.individualPool.minWithdrawal)) {
          throw new Error(`Minimum withdrawal is ${V3_FEATURES.individualPool.minWithdrawal} MUSD`);
        }

        writeContract({
          address: INDIVIDUAL_POOL_ADDRESS,
          abi: INDIVIDUAL_POOL_V3_ABI,
          functionName: "partialWithdraw",
          args: [amount],
        });
      } catch (err) {
        setLocalState({ isProcessing: false, hash: null });
        throw err;
      }
    },
    [writeContract]
  );

  // Update local state when hash changes
  useEffect(() => {
    if (hash) {
      setLocalState({ isProcessing: false, hash });
    }
  }, [hash]);

  // Refetch data on success
  useEffect(() => {
    if (isSuccess) {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.INDIVIDUAL_POOL,
      });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BALANCE });
    }
  }, [isSuccess, queryClient]);

  return {
    partialWithdraw,
    isWithdrawing: isPending || localState.isProcessing,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Hook to handle V3 full withdrawal
 */
export function useFullWithdraw() {
  const queryClient = useQueryClient();
  const [localState, setLocalState] = useState<TransactionState>(INITIAL_TX_STATE);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const fullWithdraw = useCallback(async () => {
    try {
      setLocalState({ isProcessing: true, hash: null });

      writeContract({
        address: INDIVIDUAL_POOL_ADDRESS,
        abi: INDIVIDUAL_POOL_V3_ABI,
        functionName: "fullWithdraw",
        args: [],
      });
    } catch (err) {
      setLocalState({ isProcessing: false, hash: null });
      throw err;
    }
  }, [writeContract]);

  // Update local state when hash changes
  useEffect(() => {
    if (hash) {
      setLocalState({ isProcessing: false, hash });
    }
  }, [hash]);

  // Refetch data on success
  useEffect(() => {
    if (isSuccess) {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.INDIVIDUAL_POOL,
      });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BALANCE });
    }
  }, [isSuccess, queryClient]);

  return {
    fullWithdraw,
    isWithdrawing: isPending || localState.isProcessing,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}
