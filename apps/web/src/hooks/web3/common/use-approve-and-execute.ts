/**
 * @fileoverview Generic Approve and Execute Hook Factory
 * @module hooks/web3/common/use-approve-and-execute
 *
 * Provides a reusable hook for any workflow that requires:
 * 1. Network switching (automatic)
 * 2. ERC20 approval check
 * 3. Approval transaction if needed
 * 4. Execute transaction
 *
 * Used by: useDepositWithApprove, useBuyTicketsWithApprove, etc.
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useState, useRef } from "react";
import { maxUint256 } from "viem";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useConfig,
  useSwitchChain,
} from "wagmi";
import { readContract } from "wagmi/actions";

import { ERC20_FRAGMENTS } from "@/contracts/abis/fragments";
import { mezoTestnet } from "@/lib/web3/chains";
import { MEZO_TESTNET_ADDRESSES } from "@/lib/web3/contracts-v3";

const MUSD_ADDRESS = MEZO_TESTNET_ADDRESSES.musd as `0x${string}`;

// ============================================================================
// TYPES
// ============================================================================

export type ApproveExecuteStep =
  | "idle"
  | "switching-network"
  | "checking"
  | "approving"
  | "awaiting-approval"
  | "verifying-allowance"
  | "executing";

export interface ApproveExecuteState {
  isProcessing: boolean;
  executeHash: string | null;
  approveHash: string | null;
  step: ApproveExecuteStep;
  error: string | null;
  operationId: number;
}

export interface ExecuteConfig<TArgs> {
  /** Target contract address for the main operation */
  contractAddress: `0x${string}`;
  /** ABI for the execute function */
  abi: readonly unknown[];
  /** Function name to call */
  functionName: string;
  /** Arguments for the function */
  args: TArgs;
  /** Amount that needs approval (in wei) */
  requiredAllowance: bigint;
  /** Query keys to invalidate on success */
  invalidateKeys: readonly unknown[][];
}

export interface UseApproveAndExecuteResult<TArgs> {
  execute: (config: ExecuteConfig<TArgs>) => Promise<void>;
  reset: () => void;
  isApproving: boolean;
  isExecuting: boolean;
  isProcessing: boolean;
  isSuccess: boolean;
  approveHash: `0x${string}` | undefined;
  executeHash: `0x${string}` | undefined;
  step: ApproveExecuteStep;
  error: string | null;
}

// ============================================================================
// HOOK FACTORY
// ============================================================================

/**
 * Generic hook for approve + execute workflows
 *
 * @example
 * ```ts
 * const { execute, isProcessing, step, error } = useApproveAndExecute();
 *
 * await execute({
 *   contractAddress: POOL_ADDRESS,
 *   abi: INDIVIDUAL_POOL_ABI,
 *   functionName: "deposit",
 *   args: [amountWei],
 *   requiredAllowance: amountWei,
 *   invalidateKeys: [["individual-pool-v3"]],
 * });
 * ```
 */
export function useApproveAndExecute<
  TArgs extends readonly unknown[],
>(): UseApproveAndExecuteResult<TArgs> {
  const { address, chain } = useAccount();
  const config = useConfig();
  const queryClient = useQueryClient();
  const { switchChainAsync } = useSwitchChain();

  // Operation mutex
  const operationLockRef = useRef(false);
  const currentOperationIdRef = useRef(0);
  const pendingConfigRef = useRef<ExecuteConfig<TArgs> | null>(null);

  const [localState, setLocalState] = useState<ApproveExecuteState>({
    isProcessing: false,
    executeHash: null,
    approveHash: null,
    step: "idle",
    error: null,
    operationId: 0,
  });

  const {
    writeContract: writeApprove,
    data: approveHash,
    reset: resetApprove,
  } = useWriteContract();

  const {
    writeContract: writeExecute,
    data: executeHash,
    reset: resetExecute,
  } = useWriteContract();

  const { isLoading: isApproving, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
    pollingInterval: 3000,
  });

  const { isLoading: isExecuting, isSuccess: isExecuteSuccess } = useWaitForTransactionReceipt({
    hash: executeHash,
    pollingInterval: 3000,
  });

  // After approve succeeds, verify allowance and execute
  useEffect(() => {
    if (isApproveSuccess && pendingConfigRef.current && localState.step === "awaiting-approval") {
      const operationId = localState.operationId;
      const pendingConfig = pendingConfigRef.current;

      setLocalState((prev) => ({ ...prev, step: "verifying-allowance" }));

      const verifyAndExecute = async () => {
        try {
          if (currentOperationIdRef.current !== operationId) {
            return;
          }

          if (!address) {
            throw new Error("Wallet disconnected");
          }

          // Verify allowance
          const allowance = (await readContract(config, {
            address: MUSD_ADDRESS,
            abi: ERC20_FRAGMENTS.allowance,
            functionName: "allowance",
            args: [address, pendingConfig.contractAddress],
          })) as bigint;

          if (allowance < pendingConfig.requiredAllowance) {
            throw new Error("Allowance verification failed");
          }

          setLocalState((prev) => ({ ...prev, step: "executing" }));

          writeExecute(
            {
              address: pendingConfig.contractAddress,
              abi: pendingConfig.abi,
              functionName: pendingConfig.functionName,
              args: pendingConfig.args as readonly unknown[],
            },
            {
              onSuccess: (hash) => {
                setLocalState((prev) => ({ ...prev, executeHash: hash }));
              },
              onError: (error) => {
                operationLockRef.current = false;
                setLocalState((prev) => ({
                  ...prev,
                  step: "idle",
                  isProcessing: false,
                  error: error.message,
                }));
              },
            }
          );
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Verification failed";
          operationLockRef.current = false;
          setLocalState((prev) => ({
            ...prev,
            step: "idle",
            isProcessing: false,
            error: errorMsg,
          }));
        }
      };

      void verifyAndExecute();
    }
  }, [isApproveSuccess, localState.step, localState.operationId, address, config, writeExecute]);

  // After execute succeeds, cleanup and invalidate queries
  useEffect(() => {
    if (isExecuteSuccess && executeHash && pendingConfigRef.current) {
      const keysToInvalidate = pendingConfigRef.current.invalidateKeys;

      for (const queryKey of keysToInvalidate) {
        void queryClient.invalidateQueries({ queryKey });
      }

      operationLockRef.current = false;
      setLocalState((prev) => ({
        ...prev,
        isProcessing: false,
        step: "idle",
      }));
      pendingConfigRef.current = null;
    }
  }, [isExecuteSuccess, executeHash, queryClient]);

  const execute = useCallback(
    async (executeConfig: ExecuteConfig<TArgs>) => {
      if (operationLockRef.current) {
        throw new Error("An operation is already in progress. Please wait.");
      }

      try {
        if (!address) {
          throw new Error("Wallet not connected");
        }

        // Acquire lock
        operationLockRef.current = true;
        const operationId = ++currentOperationIdRef.current;
        pendingConfigRef.current = executeConfig;

        // Reset previous states
        resetApprove();
        resetExecute();

        // Network switch if needed
        if (chain?.id !== mezoTestnet.id) {
          setLocalState({
            step: "switching-network",
            isProcessing: true,
            executeHash: null,
            approveHash: null,
            error: null,
            operationId,
          });

          try {
            await switchChainAsync({ chainId: mezoTestnet.id });
          } catch {
            operationLockRef.current = false;
            setLocalState((prev) => ({
              ...prev,
              step: "idle",
              isProcessing: false,
              error: "Please switch to Mezo Testnet",
            }));
            throw new Error("Network switch required");
          }
        }

        setLocalState({
          step: "checking",
          isProcessing: true,
          executeHash: null,
          approveHash: null,
          error: null,
          operationId,
        });

        // Check allowance
        const allowance = (await readContract(config, {
          address: MUSD_ADDRESS,
          abi: ERC20_FRAGMENTS.allowance,
          functionName: "allowance",
          args: [address, executeConfig.contractAddress],
        })) as bigint;

        if (allowance >= executeConfig.requiredAllowance) {
          // Already approved, execute directly
          setLocalState((prev) => ({ ...prev, step: "executing" }));

          writeExecute(
            {
              address: executeConfig.contractAddress,
              abi: executeConfig.abi,
              functionName: executeConfig.functionName,
              args: executeConfig.args as readonly unknown[],
            },
            {
              onSuccess: (hash) => {
                setLocalState((prev) => ({ ...prev, executeHash: hash }));
              },
              onError: (error) => {
                operationLockRef.current = false;
                setLocalState((prev) => ({
                  ...prev,
                  step: "idle",
                  isProcessing: false,
                  error: error.message,
                }));
              },
            }
          );
        } else {
          // Need approval first
          setLocalState((prev) => ({ ...prev, step: "approving" }));

          writeApprove(
            {
              address: MUSD_ADDRESS,
              abi: ERC20_FRAGMENTS.approve,
              functionName: "approve",
              args: [executeConfig.contractAddress, maxUint256],
            },
            {
              onSuccess: (hash) => {
                setLocalState((prev) => ({
                  ...prev,
                  step: "awaiting-approval",
                  approveHash: hash,
                }));
              },
              onError: (error) => {
                operationLockRef.current = false;
                setLocalState((prev) => ({
                  ...prev,
                  step: "idle",
                  isProcessing: false,
                  error: error.message,
                }));
              },
            }
          );
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        operationLockRef.current = false;
        setLocalState((prev) => ({
          ...prev,
          isProcessing: false,
          step: "idle",
          error: errorMsg,
        }));
        throw error;
      }
    },
    [
      address,
      chain,
      config,
      switchChainAsync,
      writeApprove,
      writeExecute,
      resetApprove,
      resetExecute,
    ]
  );

  const reset = useCallback(() => {
    operationLockRef.current = false;
    pendingConfigRef.current = null;
    resetApprove();
    resetExecute();
    setLocalState({
      isProcessing: false,
      executeHash: null,
      approveHash: null,
      step: "idle",
      error: null,
      operationId: 0,
    });
  }, [resetApprove, resetExecute]);

  return {
    execute,
    reset,
    isApproving,
    isExecuting,
    isProcessing: localState.isProcessing,
    isSuccess: isExecuteSuccess,
    approveHash,
    executeHash,
    step: localState.step,
    error: localState.error,
  };
}
