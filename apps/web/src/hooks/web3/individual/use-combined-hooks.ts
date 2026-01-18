/**
 * @fileoverview Combined hooks for Individual Pool V3 and Yield Aggregator
 * @module hooks/web3/individual/use-combined-hooks
 *
 * These combined hooks aggregate multiple transaction hooks for convenience
 */

"use client";

import {
  useYieldAggregatorDeposit,
  useYieldAggregatorWithdraw,
  useCompoundYields,
} from "./use-aggregator-hooks";
import { useDeposit, usePartialWithdraw, useFullWithdraw } from "./use-deposit-hooks";
import { useClaimYield, useClaimReferralRewards, useToggleAutoCompound } from "./use-yield-hooks";

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
      deposit.isDepositing || withdraw.isWithdrawing || compoundYields.isCompounding,
  };
}
