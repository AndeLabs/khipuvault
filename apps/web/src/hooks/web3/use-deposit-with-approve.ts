/**
 * @fileoverview Deposit Hook with Auto Approve
 * @module hooks/web3/use-deposit-with-approve
 *
 * Handles deposit with automatic MUSD approval
 * Uses atomic state management to prevent race conditions
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useState, useRef } from "react";
import { parseEther, maxUint256 } from "viem";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useConfig,
} from "wagmi";
import { readContract } from "wagmi/actions";

import {
  MEZO_TESTNET_ADDRESSES,
  INDIVIDUAL_POOL_ABI,
} from "@/lib/web3/contracts";

const POOL_ADDRESS = MEZO_TESTNET_ADDRESSES.individualPool as `0x${string}`;
const MUSD_ADDRESS = MEZO_TESTNET_ADDRESSES.musd as `0x${string}`;

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

type DepositStep =
  | "idle"
  | "checking"
  | "approving"
  | "awaiting-approval"
  | "verifying-allowance"
  | "depositing";

interface DepositState {
  isProcessing: boolean;
  depositHash: string | null;
  approveHash: string | null;
  step: DepositStep;
  error: string | null;
  operationId: number; // Unique ID to track each deposit operation
}

export function useDepositWithApprove() {
  const { address } = useAccount();
  const config = useConfig();
  const queryClient = useQueryClient();

  // Use ref for operation mutex to prevent concurrent deposits
  const operationLockRef = useRef(false);
  const currentOperationIdRef = useRef(0);

  const [localState, setLocalState] = useState<DepositState>({
    isProcessing: false,
    depositHash: null,
    approveHash: null,
    step: "idle",
    error: null,
    operationId: 0,
  });

  const [pendingAmount, setPendingAmount] = useState<bigint | null>(null);

  const {
    writeContract: writeApprove,
    data: approveHash,
    reset: resetApprove,
  } = useWriteContract();
  const {
    writeContract: writeDeposit,
    data: depositHash,
    reset: resetDeposit,
  } = useWriteContract();

  const { isLoading: isApproving, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
      pollingInterval: 3000,
    });

  const { isLoading: isDepositing, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({
      hash: depositHash,
      pollingInterval: 3000,
    });

  // After approve succeeds, verify allowance and do deposit
  // This prevents the race condition by re-checking allowance after approval
  useEffect(() => {
    if (
      isApproveSuccess &&
      pendingAmount &&
      localState.step === "awaiting-approval"
    ) {
      const operationId = localState.operationId;
      setLocalState((prev) => ({ ...prev, step: "verifying-allowance" }));

      // Verify the allowance is actually set before depositing
      const verifyAndDeposit = async () => {
        try {
          // Check this is still the current operation
          if (currentOperationIdRef.current !== operationId) {
            return;
          }

          if (!address) {
            throw new Error("Wallet disconnected");
          }

          // Re-read allowance to ensure it's set
          const allowance = (await readContract(config, {
            address: MUSD_ADDRESS,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [address, POOL_ADDRESS],
          })) as bigint;

          if (allowance < pendingAmount) {
            throw new Error(
              "Allowance verification failed - approval may not have been processed correctly",
            );
          }

          setLocalState((prev) => ({ ...prev, step: "depositing" }));

          writeDeposit(
            {
              address: POOL_ADDRESS,
              abi: INDIVIDUAL_POOL_ABI,
              functionName: "deposit",
              args: [pendingAmount],
            },
            {
              onSuccess: (hash) => {
                setLocalState((prev) => ({ ...prev, depositHash: hash }));
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
            },
          );
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Verification failed";
          operationLockRef.current = false;
          setLocalState((prev) => ({
            ...prev,
            step: "idle",
            isProcessing: false,
            error: errorMsg,
          }));
        }
      };

      void verifyAndDeposit();
    }
  }, [
    isApproveSuccess,
    pendingAmount,
    localState.step,
    localState.operationId,
    address,
    config,
    writeDeposit,
  ]);

  // After deposit succeeds, cleanup and refetch
  useEffect(() => {
    if (isDepositSuccess && depositHash) {
      void queryClient.invalidateQueries({ queryKey: ["individual-pool-v3"] });
      void queryClient.invalidateQueries({ queryKey: ["individual-pool"] });
      operationLockRef.current = false;
      setLocalState((prev) => ({
        ...prev,
        isProcessing: false,
        step: "idle",
      }));
      setPendingAmount(null);
    }
  }, [isDepositSuccess, depositHash, queryClient]);

  const deposit = useCallback(
    async (amount: string | bigint) => {
      // Mutex: prevent concurrent deposit operations
      if (operationLockRef.current) {
        throw new Error(
          "A deposit operation is already in progress. Please wait.",
        );
      }

      try {
        if (!address) {
          throw new Error("Wallet not connected");
        }

        // Acquire lock and assign new operation ID
        operationLockRef.current = true;
        const operationId = ++currentOperationIdRef.current;

        // Reset previous transaction states
        resetApprove();
        resetDeposit();

        const amountWei =
          typeof amount === "string" ? parseEther(amount) : amount;
        setPendingAmount(amountWei);

        setLocalState({
          step: "checking",
          isProcessing: true,
          depositHash: null,
          approveHash: null,
          error: null,
          operationId,
        });

        const allowance = (await readContract(config, {
          address: MUSD_ADDRESS,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, POOL_ADDRESS],
        })) as bigint;

        if (allowance >= amountWei) {
          // Already approved, just deposit
          setLocalState((prev) => ({ ...prev, step: "depositing" }));

          writeDeposit(
            {
              address: POOL_ADDRESS,
              abi: INDIVIDUAL_POOL_ABI,
              functionName: "deposit",
              args: [amountWei],
            },
            {
              onSuccess: (hash) => {
                setLocalState((prev) => ({ ...prev, depositHash: hash }));
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
            },
          );
        } else {
          // Need to approve first
          setLocalState((prev) => ({ ...prev, step: "approving" }));

          writeApprove(
            {
              address: MUSD_ADDRESS,
              abi: ERC20_ABI,
              functionName: "approve",
              args: [POOL_ADDRESS, maxUint256],
            },
            {
              onSuccess: (hash) => {
                // Move to awaiting-approval state to wait for confirmation
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
            },
          );
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
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
    [address, config, writeApprove, writeDeposit, resetApprove, resetDeposit],
  );

  // Reset function to clear state and release lock
  const reset = useCallback(() => {
    operationLockRef.current = false;
    resetApprove();
    resetDeposit();
    setPendingAmount(null);
    setLocalState({
      isProcessing: false,
      depositHash: null,
      approveHash: null,
      step: "idle",
      error: null,
      operationId: 0,
    });
  }, [resetApprove, resetDeposit]);

  return {
    deposit,
    reset,
    isApproving,
    isDepositing,
    isProcessing: localState.isProcessing,
    isSuccess: isDepositSuccess,
    approveHash,
    depositHash,
    step: localState.step,
    error: localState.error,
  };
}
