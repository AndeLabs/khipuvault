/**
 * @fileoverview Mezo Trove Manager Hooks
 * @module hooks/web3/mezo/use-mezo-trove-manager
 *
 * Hooks for querying Trove (CDP) data from Mezo Protocol.
 * Troves are Collateralized Debt Positions where users lock BTC to borrow MUSD.
 */

"use client";

import { formatUnits } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";

import { MEZO_V3_ADDRESSES, MEZO_TROVE_MANAGER_ABI } from "@/lib/web3/contracts-v3";

const TROVE_MANAGER_ADDRESS = MEZO_V3_ADDRESSES.troveManager;

// Trove status enum
export const TroveStatus = {
  NonExistent: 0,
  Active: 1,
  ClosedByOwner: 2,
  ClosedByLiquidation: 3,
  ClosedByRedemption: 4,
} as const;

export type TroveStatusType = (typeof TroveStatus)[keyof typeof TroveStatus];

/**
 * Hook to get global Trove Manager statistics
 */
export function useTroveManagerStats() {
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: TROVE_MANAGER_ADDRESS,
        abi: MEZO_TROVE_MANAGER_ABI,
        functionName: "getTroveOwnersCount",
      },
      {
        address: TROVE_MANAGER_ADDRESS,
        abi: MEZO_TROVE_MANAGER_ABI,
        functionName: "totalStakes",
      },
      {
        address: TROVE_MANAGER_ADDRESS,
        abi: MEZO_TROVE_MANAGER_ABI,
        functionName: "baseRate",
      },
      {
        address: TROVE_MANAGER_ADDRESS,
        abi: MEZO_TROVE_MANAGER_ABI,
        functionName: "getBorrowingRate",
      },
      {
        address: TROVE_MANAGER_ADDRESS,
        abi: MEZO_TROVE_MANAGER_ABI,
        functionName: "getRedemptionRate",
      },
      {
        address: TROVE_MANAGER_ADDRESS,
        abi: MEZO_TROVE_MANAGER_ABI,
        functionName: "MCR",
      },
      {
        address: TROVE_MANAGER_ADDRESS,
        abi: MEZO_TROVE_MANAGER_ABI,
        functionName: "CCR",
      },
    ],
    query: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  });

  const troveCount = (data?.[0]?.result as bigint) ?? 0n;
  const totalStakes = (data?.[1]?.result as bigint) ?? 0n;
  const baseRate = (data?.[2]?.result as bigint) ?? 0n;
  const borrowingRate = (data?.[3]?.result as bigint) ?? 0n;
  const redemptionRate = (data?.[4]?.result as bigint) ?? 0n;
  const mcr = (data?.[5]?.result as bigint) ?? 0n;
  const ccr = (data?.[6]?.result as bigint) ?? 0n;

  // Convert rates to percentages
  const borrowingRatePercent = Number(formatUnits(borrowingRate, 18)) * 100;
  const redemptionRatePercent = Number(formatUnits(redemptionRate, 18)) * 100;
  const mcrPercent = Number(formatUnits(mcr, 18)) * 100;
  const ccrPercent = Number(formatUnits(ccr, 18)) * 100;

  return {
    /** Total number of active Troves */
    troveCount: Number(troveCount),
    /** Total BTC staked across all Troves */
    totalStakes,
    totalStakesFormatted: formatUnits(totalStakes, 18),
    /** Base rate for borrowing/redemption fees */
    baseRate,
    baseRateFormatted: formatUnits(baseRate, 18),
    /** Current borrowing rate (percentage) */
    borrowingRate: borrowingRatePercent,
    borrowingRateFormatted: `${borrowingRatePercent.toFixed(2)}%`,
    /** Current redemption rate (percentage) */
    redemptionRate: redemptionRatePercent,
    redemptionRateFormatted: `${redemptionRatePercent.toFixed(2)}%`,
    /** Minimum Collateral Ratio (typically 110%) */
    mcr: mcrPercent,
    mcrFormatted: `${mcrPercent.toFixed(0)}%`,
    /** Critical Collateral Ratio (typically 150%) */
    ccr: ccrPercent,
    ccrFormatted: `${ccrPercent.toFixed(0)}%`,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get user's Trove data
 */
export function useUserTrove(userAddress?: `0x${string}`) {
  const { address: connectedAddress, isConnected } = useAccount();
  const address = userAddress ?? connectedAddress;

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: TROVE_MANAGER_ADDRESS,
        abi: MEZO_TROVE_MANAGER_ABI,
        functionName: "getTroveStatus",
        args: address ? [address] : undefined,
      },
      {
        address: TROVE_MANAGER_ADDRESS,
        abi: MEZO_TROVE_MANAGER_ABI,
        functionName: "getTroveDebt",
        args: address ? [address] : undefined,
      },
      {
        address: TROVE_MANAGER_ADDRESS,
        abi: MEZO_TROVE_MANAGER_ABI,
        functionName: "getTroveColl",
        args: address ? [address] : undefined,
      },
      {
        address: TROVE_MANAGER_ADDRESS,
        abi: MEZO_TROVE_MANAGER_ABI,
        functionName: "getTroveStake",
        args: address ? [address] : undefined,
      },
      {
        address: TROVE_MANAGER_ADDRESS,
        abi: MEZO_TROVE_MANAGER_ABI,
        functionName: "getNominalICR",
        args: address ? [address] : undefined,
      },
      {
        address: TROVE_MANAGER_ADDRESS,
        abi: MEZO_TROVE_MANAGER_ABI,
        functionName: "hasPendingRewards",
        args: address ? [address] : undefined,
      },
      {
        address: TROVE_MANAGER_ADDRESS,
        abi: MEZO_TROVE_MANAGER_ABI,
        functionName: "getPendingCollateralReward",
        args: address ? [address] : undefined,
      },
      {
        address: TROVE_MANAGER_ADDRESS,
        abi: MEZO_TROVE_MANAGER_ABI,
        functionName: "getPendingMUSDDebtReward",
        args: address ? [address] : undefined,
      },
    ],
    query: {
      enabled: !!address && isConnected,
      staleTime: 15 * 1000,
    },
  });

  const status = (data?.[0]?.result as number) ?? TroveStatus.NonExistent;
  const debt = (data?.[1]?.result as bigint) ?? 0n;
  const coll = (data?.[2]?.result as bigint) ?? 0n;
  const stake = (data?.[3]?.result as bigint) ?? 0n;
  const nominalICR = (data?.[4]?.result as bigint) ?? 0n;
  const hasPendingRewards = (data?.[5]?.result as boolean) ?? false;
  const pendingCollateral = (data?.[6]?.result as bigint) ?? 0n;
  const pendingDebt = (data?.[7]?.result as bigint) ?? 0n;

  // Calculate collateral ratio
  const collateralRatio = Number(formatUnits(nominalICR, 18)) * 100;

  // Status label
  const statusLabel =
    status === TroveStatus.Active
      ? "Active"
      : status === TroveStatus.ClosedByOwner
        ? "Closed"
        : status === TroveStatus.ClosedByLiquidation
          ? "Liquidated"
          : status === TroveStatus.ClosedByRedemption
            ? "Redeemed"
            : "None";

  return {
    /** Trove status (0=none, 1=active, 2=closed, 3=liquidated, 4=redeemed) */
    status,
    statusLabel,
    /** Whether user has an active Trove */
    hasActiveTrove: status === TroveStatus.Active,
    /** Total MUSD debt */
    debt,
    debtFormatted: formatUnits(debt, 18),
    /** Total BTC collateral */
    collateral: coll,
    collateralFormatted: formatUnits(coll, 18),
    /** Stake in the system */
    stake,
    stakeFormatted: formatUnits(stake, 18),
    /** Nominal Individual Collateral Ratio (percentage) */
    collateralRatio,
    collateralRatioFormatted: `${collateralRatio.toFixed(2)}%`,
    /** Whether Trove has pending rewards from liquidations */
    hasPendingRewards,
    /** Pending collateral reward */
    pendingCollateral,
    pendingCollateralFormatted: formatUnits(pendingCollateral, 18),
    /** Pending debt reward (redistribution) */
    pendingDebt,
    pendingDebtFormatted: formatUnits(pendingDebt, 18),
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get Total Collateral Ratio (TCR) of the system
 */
export function useSystemTCR(btcPrice: bigint) {
  const { data, isLoading, error } = useReadContract({
    address: TROVE_MANAGER_ADDRESS,
    abi: MEZO_TROVE_MANAGER_ABI,
    functionName: "getTCR",
    args: [btcPrice],
    query: {
      enabled: btcPrice > 0n,
      staleTime: 30 * 1000,
    },
  });

  const tcr = (data as bigint) ?? 0n;
  const tcrPercent = Number(formatUnits(tcr, 18)) * 100;

  return {
    /** Total Collateral Ratio (raw, 18 decimals) */
    tcr,
    /** Total Collateral Ratio (percentage) */
    tcrPercent,
    tcrFormatted: `${tcrPercent.toFixed(2)}%`,
    isLoading,
    error,
  };
}

/**
 * Hook to check if system is in Recovery Mode
 */
export function useRecoveryMode(btcPrice: bigint) {
  const { data, isLoading, error } = useReadContract({
    address: TROVE_MANAGER_ADDRESS,
    abi: MEZO_TROVE_MANAGER_ABI,
    functionName: "checkRecoveryMode",
    args: [btcPrice],
    query: {
      enabled: btcPrice > 0n,
      staleTime: 30 * 1000,
    },
  });

  return {
    /** Whether system is in Recovery Mode (TCR < CCR) */
    isRecoveryMode: (data as boolean) ?? false,
    isLoading,
    error,
  };
}

/**
 * Hook to calculate borrowing fee for a given debt amount
 */
export function useBorrowingFee(debtAmount: bigint) {
  const { data, isLoading, error } = useReadContract({
    address: TROVE_MANAGER_ADDRESS,
    abi: MEZO_TROVE_MANAGER_ABI,
    functionName: "getBorrowingFee",
    args: [debtAmount],
    query: {
      enabled: debtAmount > 0n,
      staleTime: 60 * 1000,
    },
  });

  const fee = (data as bigint) ?? 0n;

  return {
    /** Borrowing fee (raw, 18 decimals) */
    fee,
    feeFormatted: formatUnits(fee, 18),
    isLoading,
    error,
  };
}
