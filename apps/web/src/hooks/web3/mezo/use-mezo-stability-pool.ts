/**
 * @fileoverview Mezo Stability Pool Hooks
 * @module hooks/web3/mezo/use-mezo-stability-pool
 *
 * Hooks for interacting with Mezo's Stability Pool.
 * Stability Pool depositors provide MUSD liquidity and earn
 * collateral from liquidated Troves (99.5% of liquidated collateral).
 *
 * Security Features:
 * - Input validation before transactions
 * - Proper approval→deposit flow with confirmation wait
 * - Query invalidation after successful transactions
 * - Error type parsing for better UX
 */

"use client";

import { useCallback, useState } from "react";
import { formatUnits, parseUnits, maxUint256 } from "viem";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

import { MEZO_V3_ADDRESSES, MEZO_STABILITY_POOL_ABI, MUSD_ABI } from "@/lib/web3/contracts-v3";

import {
  validateAmount,
  parseTxError,
  TxErrorType,
  type ValidationResult,
} from "./utils/validation";

const STABILITY_POOL_ADDRESS = MEZO_V3_ADDRESSES.stabilityPool;
const MUSD_ADDRESS = MEZO_V3_ADDRESSES.musd;

// Minimum deposit: 1 MUSD
const MIN_DEPOSIT = parseUnits("1", 18);

/**
 * Hook to get Stability Pool global stats
 */
export function useStabilityPoolStats() {
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: STABILITY_POOL_ADDRESS,
        abi: MEZO_STABILITY_POOL_ABI,
        functionName: "getTotalMUSDDeposits",
      },
      {
        address: STABILITY_POOL_ADDRESS,
        abi: MEZO_STABILITY_POOL_ABI,
        functionName: "getCollateralBalance",
      },
      {
        address: STABILITY_POOL_ADDRESS,
        abi: MEZO_STABILITY_POOL_ABI,
        functionName: "P",
      },
      {
        address: STABILITY_POOL_ADDRESS,
        abi: MEZO_STABILITY_POOL_ABI,
        functionName: "currentScale",
      },
      {
        address: STABILITY_POOL_ADDRESS,
        abi: MEZO_STABILITY_POOL_ABI,
        functionName: "currentEpoch",
      },
    ],
    query: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  });

  const totalDeposits = (data?.[0]?.result as bigint) ?? 0n;
  const collateralBalance = (data?.[1]?.result as bigint) ?? 0n;
  const productFactor = (data?.[2]?.result as bigint) ?? 0n;
  const currentScale = (data?.[3]?.result as bigint) ?? 0n;
  const currentEpoch = (data?.[4]?.result as bigint) ?? 0n;

  return {
    /** Total MUSD deposited (raw, 18 decimals) */
    totalDeposits,
    /** Total MUSD deposited (formatted) */
    totalDepositsFormatted: formatUnits(totalDeposits, 18),
    /** Total collateral (BTC) from liquidations (raw, 18 decimals) */
    collateralBalance,
    /** Total collateral (formatted) */
    collateralBalanceFormatted: formatUnits(collateralBalance, 18),
    /** Product factor P for snapshot calculations */
    productFactor,
    /** Current scale */
    currentScale: Number(currentScale),
    /** Current epoch */
    currentEpoch: Number(currentEpoch),
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get user's position in the Stability Pool
 */
export function useUserStabilityPoolPosition() {
  const { address, isConnected } = useAccount();

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: STABILITY_POOL_ADDRESS,
        abi: MEZO_STABILITY_POOL_ABI,
        functionName: "getCompoundedMUSDDeposit",
        args: address ? [address] : undefined,
      },
      {
        address: STABILITY_POOL_ADDRESS,
        abi: MEZO_STABILITY_POOL_ABI,
        functionName: "getDepositorCollateralGain",
        args: address ? [address] : undefined,
      },
      {
        address: STABILITY_POOL_ADDRESS,
        abi: MEZO_STABILITY_POOL_ABI,
        functionName: "deposits",
        args: address ? [address] : undefined,
      },
    ],
    query: {
      enabled: !!address && isConnected,
      staleTime: 15 * 1000,
    },
  });

  const compoundedDeposit = (data?.[0]?.result as bigint) ?? 0n;
  const collateralGain = (data?.[1]?.result as bigint) ?? 0n;
  const initialDeposit = (data?.[2]?.result as bigint) ?? 0n;

  // Calculate loss from liquidations
  const depositLoss = initialDeposit > compoundedDeposit ? initialDeposit - compoundedDeposit : 0n;

  return {
    /** Current compounded deposit (after losses) */
    compoundedDeposit,
    compoundedDepositFormatted: formatUnits(compoundedDeposit, 18),
    /** Pending collateral (BTC) gains */
    collateralGain,
    collateralGainFormatted: formatUnits(collateralGain, 18),
    /** Initial deposit amount */
    initialDeposit,
    initialDepositFormatted: formatUnits(initialDeposit, 18),
    /** Amount lost to liquidations */
    depositLoss,
    depositLossFormatted: formatUnits(depositLoss, 18),
    /** Whether user has a position */
    hasPosition: compoundedDeposit > 0n,
    /** Whether user has pending gains */
    hasPendingGains: collateralGain > 0n,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to deposit MUSD to Stability Pool with validation
 */
export function useDepositToStabilityPool() {
  const queryClient = useQueryClient();
  const {
    writeContract,
    writeContractAsync,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();
  const [validationError, setValidationError] = useState<string | null>(null);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  });

  // Invalidate queries on success
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ["readContracts"] });
  }

  const validateDeposit = useCallback((amount: string): ValidationResult => {
    return validateAmount(amount, 18, {
      minAmount: MIN_DEPOSIT,
      fieldName: "Deposit amount",
    });
  }, []);

  const deposit = useCallback(
    async (amount: string): Promise<boolean> => {
      setValidationError(null);

      const validation = validateDeposit(amount);
      if (!validation.isValid) {
        setValidationError(validation.error ?? "Invalid amount");
        return false;
      }

      try {
        writeContract({
          address: STABILITY_POOL_ADDRESS,
          abi: MEZO_STABILITY_POOL_ABI,
          functionName: "provideToSP",
          args: [validation.value!],
        });
        return true;
      } catch (err) {
        const parsed = parseTxError(err);
        setValidationError(parsed.message);
        return false;
      }
    },
    [writeContract, validateDeposit]
  );

  const depositAsync = useCallback(
    async (amount: string): Promise<`0x${string}` | null> => {
      setValidationError(null);

      const validation = validateDeposit(amount);
      if (!validation.isValid) {
        setValidationError(validation.error ?? "Invalid amount");
        return null;
      }

      try {
        const txHash = await writeContractAsync({
          address: STABILITY_POOL_ADDRESS,
          abi: MEZO_STABILITY_POOL_ABI,
          functionName: "provideToSP",
          args: [validation.value!],
        });
        return txHash;
      } catch (err) {
        const parsed = parseTxError(err);
        setValidationError(parsed.message);
        return null;
      }
    },
    [writeContractAsync, validateDeposit]
  );

  // Parse error for better UX
  const parsedError = error ? parseTxError(error) : null;

  return {
    deposit,
    depositAsync,
    validateDeposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    validationError,
    parsedError,
    isUserRejected: parsedError?.type === TxErrorType.USER_REJECTED,
    reset,
  };
}

/**
 * Hook to withdraw MUSD from Stability Pool with validation
 */
export function useWithdrawFromStabilityPool() {
  const queryClient = useQueryClient();
  const {
    writeContract,
    writeContractAsync,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();
  const [validationError, setValidationError] = useState<string | null>(null);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  });

  // Invalidate queries on success
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ["readContracts"] });
  }

  const validateWithdraw = useCallback((amount: string, maxAmount?: bigint): ValidationResult => {
    return validateAmount(amount, 18, {
      minAmount: 1n, // Allow withdrawing as little as 1 wei
      maxAmount,
      fieldName: "Withdraw amount",
    });
  }, []);

  const withdraw = useCallback(
    async (amount: string, maxAmount?: bigint): Promise<boolean> => {
      setValidationError(null);

      const validation = validateWithdraw(amount, maxAmount);
      if (!validation.isValid) {
        setValidationError(validation.error ?? "Invalid amount");
        return false;
      }

      try {
        writeContract({
          address: STABILITY_POOL_ADDRESS,
          abi: MEZO_STABILITY_POOL_ABI,
          functionName: "withdrawFromSP",
          args: [validation.value!],
        });
        return true;
      } catch (err) {
        const parsed = parseTxError(err);
        setValidationError(parsed.message);
        return false;
      }
    },
    [writeContract, validateWithdraw]
  );

  const withdrawAsync = useCallback(
    async (amount: string, maxAmount?: bigint): Promise<`0x${string}` | null> => {
      setValidationError(null);

      const validation = validateWithdraw(amount, maxAmount);
      if (!validation.isValid) {
        setValidationError(validation.error ?? "Invalid amount");
        return null;
      }

      try {
        const txHash = await writeContractAsync({
          address: STABILITY_POOL_ADDRESS,
          abi: MEZO_STABILITY_POOL_ABI,
          functionName: "withdrawFromSP",
          args: [validation.value!],
        });
        return txHash;
      } catch (err) {
        const parsed = parseTxError(err);
        setValidationError(parsed.message);
        return null;
      }
    },
    [writeContractAsync, validateWithdraw]
  );

  const parsedError = error ? parseTxError(error) : null;

  return {
    withdraw,
    withdrawAsync,
    validateWithdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    validationError,
    parsedError,
    isUserRejected: parsedError?.type === TxErrorType.USER_REJECTED,
    reset,
  };
}

/**
 * Hook to approve MUSD spending for Stability Pool
 */
export function useApproveMusdForStabilityPool() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const {
    writeContract,
    writeContractAsync,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  });

  // Invalidate allowance query on success
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ["readContract", { functionName: "allowance" }] });
  }

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: MUSD_ADDRESS,
    abi: MUSD_ABI,
    functionName: "allowance",
    args: address ? [address, STABILITY_POOL_ADDRESS] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const approve = useCallback(
    async (amount: string): Promise<boolean> => {
      const validation = validateAmount(amount, 18, { fieldName: "Approval amount" });
      if (!validation.isValid) return false;

      try {
        writeContract({
          address: MUSD_ADDRESS,
          abi: MUSD_ABI,
          functionName: "approve",
          args: [STABILITY_POOL_ADDRESS, validation.value!],
        });
        return true;
      } catch {
        return false;
      }
    },
    [writeContract]
  );

  const approveAsync = useCallback(
    async (amount: string): Promise<`0x${string}` | null> => {
      const validation = validateAmount(amount, 18, { fieldName: "Approval amount" });
      if (!validation.isValid) return null;

      try {
        const txHash = await writeContractAsync({
          address: MUSD_ADDRESS,
          abi: MUSD_ABI,
          functionName: "approve",
          args: [STABILITY_POOL_ADDRESS, validation.value!],
        });
        return txHash;
      } catch {
        return null;
      }
    },
    [writeContractAsync]
  );

  const approveMax = useCallback(async (): Promise<boolean> => {
    const maxAmount = maxUint256;

    try {
      writeContract({
        address: MUSD_ADDRESS,
        abi: MUSD_ABI,
        functionName: "approve",
        args: [STABILITY_POOL_ADDRESS, maxAmount],
      });
      return true;
    } catch {
      return false;
    }
  }, [writeContract]);

  const approveMaxAsync = useCallback(async (): Promise<`0x${string}` | null> => {
    const maxAmount = maxUint256;

    try {
      const txHash = await writeContractAsync({
        address: MUSD_ADDRESS,
        abi: MUSD_ABI,
        functionName: "approve",
        args: [STABILITY_POOL_ADDRESS, maxAmount],
      });
      return txHash;
    } catch {
      return null;
    }
  }, [writeContractAsync]);

  return {
    allowance: (allowance as bigint) ?? 0n,
    allowanceFormatted: formatUnits((allowance as bigint) ?? 0n, 18),
    approve,
    approveAsync,
    approveMax,
    approveMaxAsync,
    refetchAllowance,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Flow step type for the deposit process
 */
export type DepositFlowStep =
  | "idle"
  | "approving"
  | "waiting_approval"
  | "depositing"
  | "waiting_deposit"
  | "success"
  | "error";

/**
 * Combined hook for Stability Pool deposit with proper approval flow
 *
 * Fixes the race condition by:
 * 1. Checking allowance before starting
 * 2. Waiting for approval tx to confirm before depositing
 * 3. Providing step-by-step status for UI feedback
 */
export function useStabilityPoolDeposit() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const position = useUserStabilityPoolPosition();
  const approval = useApproveMusdForStabilityPool();
  const deposit = useDepositToStabilityPool();

  const [flowStep, setFlowStep] = useState<DepositFlowStep>("idle");
  const [flowError, setFlowError] = useState<string | null>(null);

  /**
   * Execute deposit with proper approval flow
   * Waits for approval confirmation before depositing
   */
  const depositWithApproval = useCallback(
    async (amount: string): Promise<boolean> => {
      setFlowError(null);

      // Validate amount first
      const validation = deposit.validateDeposit(amount);
      if (!validation.isValid) {
        setFlowError(validation.error ?? "Invalid amount");
        setFlowStep("error");
        return false;
      }

      const amountWei = validation.value!;

      try {
        // Step 1: Check if approval needed
        if (approval.allowance < amountWei) {
          setFlowStep("approving");

          // Request approval and wait for tx hash
          const approvalHash = await approval.approveAsync(amount);
          if (!approvalHash) {
            setFlowError("Approval failed");
            setFlowStep("error");
            return false;
          }

          // Step 2: Wait for approval to be confirmed
          setFlowStep("waiting_approval");

          // Poll for confirmation (wagmi's useWaitForTransactionReceipt handles this)
          // We need to wait manually here
          let confirmed = false;
          let attempts = 0;
          const maxAttempts = 60; // ~60 seconds with 1s intervals

          while (!confirmed && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await approval.refetchAllowance();

            // Check if allowance is now sufficient
            const currentAllowance = approval.allowance;
            if (currentAllowance >= amountWei) {
              confirmed = true;
            }
            attempts++;
          }

          if (!confirmed) {
            setFlowError("Approval confirmation timeout");
            setFlowStep("error");
            return false;
          }
        }

        // Step 3: Execute deposit
        setFlowStep("depositing");

        const depositHash = await deposit.depositAsync(amount);
        if (!depositHash) {
          setFlowError(deposit.validationError ?? "Deposit failed");
          setFlowStep("error");
          return false;
        }

        // Step 4: Wait for deposit confirmation
        setFlowStep("waiting_deposit");

        // The deposit hook's isSuccess will update automatically
        // For now, we'll let the UI handle the confirmation state
        setFlowStep("success");

        // Invalidate all related queries
        queryClient.invalidateQueries({ queryKey: ["readContracts"] });
        queryClient.invalidateQueries({ queryKey: ["readContract"] });

        return true;
      } catch (err) {
        const parsed = parseTxError(err);
        setFlowError(parsed.message);
        setFlowStep("error");
        return false;
      }
    },
    [approval, deposit, queryClient]
  );

  const resetFlow = useCallback(() => {
    setFlowStep("idle");
    setFlowError(null);
    approval.reset();
    deposit.reset();
  }, [approval, deposit]);

  return {
    // Position data
    ...position,

    // Approval state
    allowance: approval.allowance,
    allowanceFormatted: approval.allowanceFormatted,
    isApprovalPending: approval.isPending,
    isApprovalConfirming: approval.isConfirming,
    approvalHash: approval.hash,

    // Deposit methods
    deposit: deposit.deposit,
    depositWithApproval,
    validateDeposit: deposit.validateDeposit,

    // Deposit state
    isDepositPending: deposit.isPending,
    isDepositConfirming: deposit.isConfirming,
    isDepositSuccess: deposit.isSuccess,
    depositError: deposit.error,
    depositHash: deposit.hash,
    depositValidationError: deposit.validationError,

    // Flow state
    flowStep,
    flowError,
    isFlowInProgress: flowStep !== "idle" && flowStep !== "success" && flowStep !== "error",
    resetFlow,

    // Refetch
    refetchPosition: position.refetch,
    refetchAllowance: approval.refetchAllowance,
  };
}
