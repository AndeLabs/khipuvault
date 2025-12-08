/**
 * @fileoverview Individual Pool V3 and Yield Aggregator - Main Export Module
 * @module hooks/web3/individual
 *
 * Central export point for all individual pool and yield aggregator functionality
 */

"use client";

// Re-export everything from submodules
export * from "./constants";
export * from "./use-deposit-hooks";
export * from "./use-yield-hooks";
export * from "./use-aggregator-hooks";

// Import what we need for combined hooks
import {
  useDeposit,
  usePartialWithdraw,
  useFullWithdraw,
} from "./use-deposit-hooks";

import {
  useClaimYield,
  useClaimReferralRewards,
  useToggleAutoCompound,
} from "./use-yield-hooks";

import {
  useYieldAggregatorDeposit,
  useYieldAggregatorWithdraw,
  useCompoundYields,
} from "./use-aggregator-hooks";

// ============================================================================
// COMBINED HOOKS
// ============================================================================

/**
 * Combined hook for all V3 individual pool transactions
 */
export function useIndividualPoolTransactions() {
  const deposit = useDeposit();
  const partialWithdraw = usePartialWithdraw();
  const fullWithdraw = useFullWithdraw();
  const toggleAutoCompound = useToggleAutoCompound();
  const claimYield = useClaimYield();
  const claimReferralRewards = useClaimReferralRewards();

  return {
    deposit,
    partialWithdraw,
    fullWithdraw,
    toggleAutoCompound,
    claimYield,
    claimReferralRewards,

    // Combined loading states
    isAnyTransactionPending:
      deposit.isDepositing ||
      partialWithdraw.isWithdrawing ||
      fullWithdraw.isWithdrawing ||
      toggleAutoCompound.isToggling ||
      claimYield.isClaiming ||
      claimReferralRewards.isClaiming,
  };
}

/**
 * Combined hook for all V3 yield aggregator transactions
 */
export function useYieldAggregatorTransactions() {
  const deposit = useYieldAggregatorDeposit();
  const withdraw = useYieldAggregatorWithdraw();
  const compoundYields = useCompoundYields();

  return {
    deposit,
    withdraw,
    compoundYields,

    // Combined loading states
    isAnyTransactionPending:
      deposit.isDepositing ||
      withdraw.isWithdrawing ||
      compoundYields.isCompounding,
  };
}
