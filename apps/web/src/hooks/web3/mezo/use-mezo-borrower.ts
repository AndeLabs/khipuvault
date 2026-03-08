/**
 * @fileoverview Mezo Borrower Operations Hooks
 * @module hooks/web3/mezo/use-mezo-borrower
 *
 * Hooks for Trove (CDP) operations: open, close, adjust, add/remove collateral.
 * These operations interact with the BorrowerOperations contract.
 *
 * Security Features:
 * - Input validation before all transactions
 * - Safe BigInt parsing with error handling
 * - User-friendly error messages
 */

"use client";

import { useCallback, useState } from "react";
import { formatUnits, parseUnits, zeroAddress } from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

import { validateAmount, parseTxError, TxErrorType } from "./utils/validation";

import {
  MEZO_V3_ADDRESSES,
  MEZO_BORROWER_OPERATIONS_ABI,
  MEZO_HINT_HELPERS_ABI,
} from "@/lib/web3/contracts-v3";
import { MEZO_BORROWER_FRAGMENTS } from "@/contracts/abis/fragments";

const BORROWER_OPERATIONS_ADDRESS = MEZO_V3_ADDRESSES.borrowerOperations;
const HINT_HELPERS_ADDRESS = MEZO_V3_ADDRESSES.hintHelpers;

/**
 * Hook to get minimum net debt required for a Trove
 */
export function useMinNetDebt() {
  const { data, isLoading, error } = useReadContract({
    address: BORROWER_OPERATIONS_ADDRESS,
    abi: MEZO_BORROWER_OPERATIONS_ABI,
    functionName: "minNetDebt",
    query: {
      staleTime: 5 * 60 * 1000, // 5 minutes (rarely changes)
    },
  });

  const minDebt = (data as bigint) ?? 0n;

  return {
    /** Minimum net debt (raw, 18 decimals) */
    minNetDebt: minDebt,
    /** Minimum net debt formatted */
    minNetDebtFormatted: formatUnits(minDebt, 18),
    isLoading,
    error,
  };
}

/**
 * Hook to get borrowing fee for a given debt amount
 *
 * Security: Safely parses input with validation
 */
export function useCalculateBorrowingFee(debtAmount: string) {
  // Safe parsing with validation
  const validation = validateAmount(debtAmount || "0", 18, { minAmount: 0n });
  const amountWei = validation.isValid && validation.value ? validation.value : 0n;

  const { data, isLoading, error } = useReadContract({
    address: BORROWER_OPERATIONS_ADDRESS,
    abi: MEZO_BORROWER_OPERATIONS_ABI,
    functionName: "getBorrowingFee",
    args: [amountWei],
    query: {
      enabled: amountWei > 0n,
      staleTime: 30 * 1000,
    },
  });

  const fee = (data as bigint) ?? 0n;

  return {
    /** Borrowing fee (raw) */
    fee,
    /** Borrowing fee formatted */
    feeFormatted: formatUnits(fee, 18),
    /** Total debt (principal + fee) */
    totalDebt: amountWei + fee,
    totalDebtFormatted: formatUnits(amountWei + fee, 18),
    isLoading,
    error,
    /** Input validation error (if any) */
    validationError: validation.error,
  };
}

/**
 * Hook to get user's BTC balance (native token on Mezo)
 */
export function useUserBtcBalance() {
  const { address, isConnected } = useAccount();

  const { data, isLoading, error, refetch } = useBalance({
    address,
    query: {
      enabled: !!address && isConnected,
      staleTime: 15 * 1000,
    },
  });

  return {
    /** BTC balance (raw, 18 decimals) */
    balance: data?.value ?? 0n,
    /** BTC balance formatted */
    balanceFormatted: data?.formatted ?? "0",
    /** Symbol (BTC) */
    symbol: data?.symbol ?? "BTC",
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to open a new Trove (CDP)
 *
 * @description Opens a new Trove by depositing BTC collateral and borrowing MUSD.
 * Requires the user to send BTC (msg.value) along with the transaction.
 *
 * Security: Validates inputs before transaction submission
 */
export function useOpenTrove() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      meta: {
        onSuccess: () => {
          // Invalidate trove-related queries after successful transaction
          queryClient.invalidateQueries({ queryKey: ["readContract", "getTroveStatus"] });
          queryClient.invalidateQueries({ queryKey: ["readContract", "getTroveColl"] });
          queryClient.invalidateQueries({ queryKey: ["readContract", "getTroveDebt"] });
        },
      },
    },
  });

  // Parse error for better UX
  const parsedError = error ? parseTxError(error) : null;

  /**
   * Open a new Trove
   * @param collateralBtc - Amount of BTC to deposit as collateral
   * @param borrowAmount - Amount of MUSD to borrow
   * @param maxBtcBalance - Optional: user's max BTC balance for validation
   * @param upperHint - Upper hint for sorted list insertion (use zeroAddress if unknown)
   * @param lowerHint - Lower hint for sorted list insertion (use zeroAddress if unknown)
   * @returns Success status or validation error message
   */
  const openTrove = useCallback(
    async (
      collateralBtc: string,
      borrowAmount: string,
      maxBtcBalance?: bigint,
      upperHint: `0x${string}` = zeroAddress,
      lowerHint: `0x${string}` = zeroAddress
    ): Promise<{ success: boolean; error?: string }> => {
      setValidationError(null);

      // Validate collateral amount
      const collateralValidation = validateAmount(collateralBtc, 18, {
        fieldName: "Collateral",
        minAmount: 1n, // Minimum 1 wei
        maxAmount: maxBtcBalance,
      });

      if (!collateralValidation.isValid) {
        setValidationError(collateralValidation.error ?? "Invalid collateral");
        return { success: false, error: collateralValidation.error };
      }

      // Validate borrow amount
      const borrowValidation = validateAmount(borrowAmount, 18, {
        fieldName: "Borrow amount",
        minAmount: 1n,
      });

      if (!borrowValidation.isValid) {
        setValidationError(borrowValidation.error ?? "Invalid borrow amount");
        return { success: false, error: borrowValidation.error };
      }

      try {
        writeContract({
          address: BORROWER_OPERATIONS_ADDRESS,
          abi: MEZO_BORROWER_FRAGMENTS.openTrove,
          functionName: "openTrove",
          args: [borrowValidation.value!, upperHint, lowerHint],
          value: collateralValidation.value!,
        });
        return { success: true };
      } catch (e) {
        const parsed = parseTxError(e);
        setValidationError(parsed.message);
        return { success: false, error: parsed.message };
      }
    },
    [writeContract, queryClient]
  );

  return {
    openTrove,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    parsedError,
    validationError,
    /** True if user rejected the transaction */
    isUserRejected: parsedError?.type === TxErrorType.USER_REJECTED,
  };
}

/**
 * Hook to close an existing Trove
 *
 * @description Closes the user's Trove by repaying all debt and withdrawing all collateral.
 * User must have enough MUSD to repay the full debt.
 */
export function useCloseTrove() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const closeTrove = async () => {
    writeContract({
      address: BORROWER_OPERATIONS_ADDRESS,
      abi: MEZO_BORROWER_FRAGMENTS.closeTrove,
      functionName: "closeTrove",
    });
  };

  return {
    closeTrove,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to add collateral to existing Trove
 *
 * Security: Validates input amount before transaction
 */
export function useAddCollateral() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      meta: {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["readContract", "getTroveColl"] });
        },
      },
    },
  });

  const parsedError = error ? parseTxError(error) : null;

  const addCollateral = useCallback(
    async (
      amount: string,
      maxBalance?: bigint,
      upperHint: `0x${string}` = zeroAddress,
      lowerHint: `0x${string}` = zeroAddress
    ): Promise<{ success: boolean; error?: string }> => {
      setValidationError(null);

      const validation = validateAmount(amount, 18, {
        fieldName: "Collateral",
        minAmount: 1n,
        maxAmount: maxBalance,
      });

      if (!validation.isValid) {
        setValidationError(validation.error ?? "Invalid amount");
        return { success: false, error: validation.error };
      }

      try {
        writeContract({
          address: BORROWER_OPERATIONS_ADDRESS,
          abi: MEZO_BORROWER_FRAGMENTS.addColl,
          functionName: "addColl",
          args: [upperHint, lowerHint],
          value: validation.value!,
        });
        return { success: true };
      } catch (e) {
        const parsed = parseTxError(e);
        setValidationError(parsed.message);
        return { success: false, error: parsed.message };
      }
    },
    [writeContract, queryClient]
  );

  return {
    addCollateral,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    parsedError,
    validationError,
    isUserRejected: parsedError?.type === TxErrorType.USER_REJECTED,
  };
}

/**
 * Hook to withdraw collateral from Trove
 *
 * Security: Validates withdrawal amount against available collateral
 */
export function useWithdrawCollateral() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      meta: {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["readContract", "getTroveColl"] });
        },
      },
    },
  });

  const parsedError = error ? parseTxError(error) : null;

  const withdrawCollateral = useCallback(
    async (
      amount: string,
      maxWithdrawable?: bigint,
      upperHint: `0x${string}` = zeroAddress,
      lowerHint: `0x${string}` = zeroAddress
    ): Promise<{ success: boolean; error?: string }> => {
      setValidationError(null);

      const validation = validateAmount(amount, 18, {
        fieldName: "Withdrawal amount",
        minAmount: 1n,
        maxAmount: maxWithdrawable,
      });

      if (!validation.isValid) {
        setValidationError(validation.error ?? "Invalid amount");
        return { success: false, error: validation.error };
      }

      try {
        writeContract({
          address: BORROWER_OPERATIONS_ADDRESS,
          abi: MEZO_BORROWER_FRAGMENTS.withdrawColl,
          functionName: "withdrawColl",
          args: [validation.value!, upperHint, lowerHint],
        });
        return { success: true };
      } catch (e) {
        const parsed = parseTxError(e);
        setValidationError(parsed.message);
        return { success: false, error: parsed.message };
      }
    },
    [writeContract, queryClient]
  );

  return {
    withdrawCollateral,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    parsedError,
    validationError,
    isUserRejected: parsedError?.type === TxErrorType.USER_REJECTED,
  };
}

/**
 * Hook to borrow more MUSD from existing Trove
 *
 * Security: Validates borrow amount before transaction
 */
export function useBorrowMusd() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      meta: {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["readContract", "getTroveDebt"] });
        },
      },
    },
  });

  const parsedError = error ? parseTxError(error) : null;

  const borrowMusd = useCallback(
    async (
      amount: string,
      maxBorrowable?: bigint,
      upperHint: `0x${string}` = zeroAddress,
      lowerHint: `0x${string}` = zeroAddress
    ): Promise<{ success: boolean; error?: string }> => {
      setValidationError(null);

      const validation = validateAmount(amount, 18, {
        fieldName: "Borrow amount",
        minAmount: 1n,
        maxAmount: maxBorrowable,
      });

      if (!validation.isValid) {
        setValidationError(validation.error ?? "Invalid amount");
        return { success: false, error: validation.error };
      }

      try {
        writeContract({
          address: BORROWER_OPERATIONS_ADDRESS,
          abi: MEZO_BORROWER_FRAGMENTS.withdrawMUSD,
          functionName: "withdrawMUSD",
          args: [validation.value!, upperHint, lowerHint],
        });
        return { success: true };
      } catch (e) {
        const parsed = parseTxError(e);
        setValidationError(parsed.message);
        return { success: false, error: parsed.message };
      }
    },
    [writeContract, queryClient]
  );

  return {
    borrowMusd,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    parsedError,
    validationError,
    isUserRejected: parsedError?.type === TxErrorType.USER_REJECTED,
  };
}

/**
 * Hook to repay MUSD debt
 *
 * Security: Validates repayment amount against MUSD balance and total debt
 */
export function useRepayMusd() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      meta: {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["readContract", "getTroveDebt"] });
        },
      },
    },
  });

  const parsedError = error ? parseTxError(error) : null;

  const repayMusd = useCallback(
    async (
      amount: string,
      maxRepayable?: bigint,
      upperHint: `0x${string}` = zeroAddress,
      lowerHint: `0x${string}` = zeroAddress
    ): Promise<{ success: boolean; error?: string }> => {
      setValidationError(null);

      const validation = validateAmount(amount, 18, {
        fieldName: "Repayment amount",
        minAmount: 1n,
        maxAmount: maxRepayable,
      });

      if (!validation.isValid) {
        setValidationError(validation.error ?? "Invalid amount");
        return { success: false, error: validation.error };
      }

      try {
        writeContract({
          address: BORROWER_OPERATIONS_ADDRESS,
          abi: MEZO_BORROWER_FRAGMENTS.repayMUSD,
          functionName: "repayMUSD",
          args: [validation.value!, upperHint, lowerHint],
        });
        return { success: true };
      } catch (e) {
        const parsed = parseTxError(e);
        setValidationError(parsed.message);
        return { success: false, error: parsed.message };
      }
    },
    [writeContract, queryClient]
  );

  return {
    repayMusd,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    parsedError,
    validationError,
    isUserRejected: parsedError?.type === TxErrorType.USER_REJECTED,
  };
}

/**
 * Hook to get hint for sorted list insertion
 *
 * @description Gets approximate hints for inserting/moving a Trove in the sorted list.
 * Hints help reduce gas costs by providing a starting point for the insertion search.
 */
export function useGetHints(targetCR: bigint, numTrials: number = 15) {
  const { data, isLoading, error } = useReadContract({
    address: HINT_HELPERS_ADDRESS,
    abi: MEZO_HINT_HELPERS_ABI,
    functionName: "getApproxHint",
    args: [targetCR, BigInt(numTrials), BigInt(42)], // 42 is a random seed
    query: {
      enabled: targetCR > 0n,
      staleTime: 60 * 1000,
    },
  });

  const result = data as [string, bigint, bigint] | undefined;

  return {
    /** Approximate hint address */
    hintAddress: (result?.[0] as `0x${string}`) ?? zeroAddress,
    /** Difference from target */
    diff: result?.[1] ?? 0n,
    /** Random seed used */
    latestRandomSeed: result?.[2] ?? 0n,
    isLoading,
    error,
  };
}

/**
 * Hook to compute collateral ratio
 */
export function useComputeCR(collateral: bigint, debt: bigint, price: bigint) {
  const { data, isLoading, error } = useReadContract({
    address: HINT_HELPERS_ADDRESS,
    abi: MEZO_HINT_HELPERS_ABI,
    functionName: "computeCR",
    args: [collateral, debt, price],
    query: {
      enabled: collateral > 0n && debt > 0n && price > 0n,
      staleTime: 30 * 1000,
    },
  });

  const cr = (data as bigint) ?? 0n;
  const crPercent = Number(formatUnits(cr, 18)) * 100;

  return {
    /** Collateral ratio (raw, 18 decimals) */
    cr,
    /** Collateral ratio (percentage) */
    crPercent,
    crFormatted: `${crPercent.toFixed(2)}%`,
    isLoading,
    error,
  };
}
