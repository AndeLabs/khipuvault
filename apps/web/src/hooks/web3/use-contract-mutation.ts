/**
 * @fileoverview Reusable Contract Mutation Hook Factory
 * @module web3/hooks/use-contract-mutation
 *
 * Provides a standardized pattern for creating write contract hooks.
 * Reduces boilerplate across cooperative, individual, and other pool types.
 *
 * @example
 * ```tsx
 * const useDeposit = createContractMutation({
 *   contractAddress: POOL_ADDRESS,
 *   abi: POOL_ABI,
 *   functionName: 'deposit',
 *   queryKeysToInvalidate: [['pool', 'balance'], ['pool', 'stats']],
 * });
 *
 * // In component:
 * const { mutate, state, error, reset } = useDeposit();
 * await mutate({ args: [amount], value: btcValue });
 * ```
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { Abi, Address } from "viem";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";

// ============================================================================
// TYPES
// ============================================================================

/**
 * State of a contract mutation
 */
export type MutationState =
  | "idle"
  | "executing" // Waiting for wallet signature
  | "processing" // Transaction submitted, waiting for confirmation
  | "success"
  | "error";

/**
 * Configuration for creating a contract mutation hook
 */
export interface ContractMutationConfig {
  /** Contract address */
  contractAddress: Address;
  /** Contract ABI */
  abi: Abi | readonly unknown[];
  /** Function name to call */
  functionName: string;
  /** Query keys to invalidate on success */
  queryKeysToInvalidate?: readonly (readonly unknown[])[];
  /** Custom error parser */
  errorParser?: (error: unknown) => string;
}

/**
 * Parameters for executing a mutation
 */
export interface MutationParams {
  /** Function arguments */
  args?: readonly unknown[];
  /** ETH/BTC value to send (for payable functions) */
  value?: bigint;
}

/**
 * Return type of the mutation hook
 */
export interface ContractMutationResult {
  /** Execute the mutation */
  mutate: (params?: MutationParams) => Promise<void>;
  /** Current state */
  state: MutationState;
  /** Error message if any */
  error: string;
  /** Reset state to idle */
  reset: () => void;
  /** Transaction hash if available */
  txHash: `0x${string}` | undefined;
  /** Whether mutation is in progress */
  isProcessing: boolean;
  /** Connected wallet address */
  address: Address | undefined;
  /** Whether wallet is connected */
  isConnected: boolean;
}

// ============================================================================
// DEFAULT ERROR PARSER
// ============================================================================

/**
 * Parse contract errors into user-friendly messages
 */
function defaultErrorParser(error: unknown): string {
  if (!error) return "Unknown error";

  const errorString = String(error);

  // Common contract errors
  if (errorString.includes("user rejected")) {
    return "Transaction rejected by user";
  }
  if (errorString.includes("insufficient funds")) {
    return "Insufficient funds for transaction";
  }
  if (errorString.includes("ContributionTooLow")) {
    return "Contribution is below minimum required";
  }
  if (errorString.includes("ContributionTooHigh")) {
    return "Contribution exceeds maximum allowed";
  }
  if (errorString.includes("PoolFull")) {
    return "Pool is at maximum capacity";
  }
  if (errorString.includes("NotMember")) {
    return "You are not a member of this pool";
  }
  if (errorString.includes("AlreadyMember")) {
    return "You are already a member of this pool";
  }
  if (errorString.includes("InvalidAmount")) {
    return "Invalid amount specified";
  }
  if (errorString.includes("NoYieldToClaim")) {
    return "No yield available to claim";
  }
  if (errorString.includes("SameBlockWithdrawal")) {
    return "Cannot withdraw in the same block as deposit (flash loan protection)";
  }
  if (errorString.includes("Unauthorized")) {
    return "You are not authorized to perform this action";
  }

  // Return original message if no match
  if (error instanceof Error) {
    return error.message;
  }

  return "Transaction failed. Please try again.";
}

// ============================================================================
// HOOK FACTORY
// ============================================================================

/**
 * Create a reusable contract mutation hook
 *
 * @param config - Configuration for the mutation
 * @returns A hook function that can be used in components
 */
export function createContractMutation(
  config: ContractMutationConfig,
): () => ContractMutationResult {
  const {
    contractAddress,
    abi,
    functionName,
    queryKeysToInvalidate = [],
    errorParser = defaultErrorParser,
  } = config;

  return function useContractMutation(): ContractMutationResult {
    const { address, isConnected } = useAccount();
    const queryClient = useQueryClient();

    const [state, setState] = useState<MutationState>("idle");
    const [error, setError] = useState<string>("");

    const {
      writeContract,
      data: txHash,
      error: writeError,
      reset: resetWrite,
    } = useWriteContract();

    const {
      isLoading: isConfirming,
      isSuccess,
      data: receipt,
    } = useWaitForTransactionReceipt({
      hash: txHash,
    });

    // Handle transaction success
    useEffect(() => {
      if (isSuccess && state === "processing") {
        // Invalidate all specified query keys
        for (const queryKey of queryKeysToInvalidate) {
          void queryClient.invalidateQueries({ queryKey: [...queryKey] });
        }
        setState("success");
      }
    }, [isSuccess, state, queryClient]);

    // Handle state transitions
    useEffect(() => {
      if (isConfirming && state === "executing") {
        setState("processing");
      }
    }, [isConfirming, state]);

    // Handle errors
    useEffect(() => {
      if (writeError) {
        setState("error");
        setError(errorParser(writeError));
      }
    }, [writeError]);

    const reset = useCallback(() => {
      setState("idle");
      setError("");
      resetWrite();
    }, [resetWrite]);

    const mutate = useCallback(
      async (params?: MutationParams) => {
        if (!address) {
          setError("Please connect your wallet");
          setState("error");
          return;
        }

        try {
          // Reset state
          setState("idle");
          setError("");
          resetWrite();

          setState("executing");

          // Build transaction request
          const request: Parameters<typeof writeContract>[0] = {
            address: contractAddress,
            abi: abi as Abi,
            functionName,
            args: params?.args as readonly unknown[],
          };

          // Add value for payable functions
          if (params?.value !== undefined) {
            (request as Record<string, unknown>).value = params.value;
          }

          writeContract(request);
        } catch (err) {
          setState("error");
          setError(errorParser(err));
        }
      },
      [address, resetWrite, writeContract],
    );

    return {
      mutate,
      state,
      error,
      reset,
      txHash: receipt?.transactionHash ?? txHash,
      isProcessing:
        state !== "idle" && state !== "success" && state !== "error",
      address,
      isConnected,
    };
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Base hook for mutations - can be used directly for custom implementations
 */
export function useBaseMutation() {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  const [state, setState] = useState<MutationState>("idle");
  const [error, setError] = useState<string>("");

  const {
    writeContract,
    data: txHash,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const reset = useCallback(() => {
    setState("idle");
    setError("");
    resetWrite();
  }, [resetWrite]);

  return {
    // Account
    address,
    isConnected,
    // State
    state,
    setState,
    error,
    setError,
    // Transaction
    writeContract,
    txHash: receipt?.transactionHash ?? txHash,
    isConfirming,
    isSuccess,
    // Utilities
    reset,
    queryClient,
    isProcessing: state !== "idle" && state !== "success" && state !== "error",
  };
}

/**
 * Parse common pool errors
 */
export { defaultErrorParser as parsePoolError };
