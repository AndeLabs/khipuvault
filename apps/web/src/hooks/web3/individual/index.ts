/**
 * @fileoverview Individual Pool V3 and Yield Aggregator - Main Export Module
 * @module hooks/web3/individual
 *
 * Central export point for all individual pool and yield aggregator functionality
 */

"use client";

// Re-export constants
export { QUERY_KEYS, INITIAL_TX_STATE } from "./constants";
export type { TransactionState } from "./constants";

// Re-export deposit hooks
export {
  useDeposit,
  usePartialWithdraw,
  useFullWithdraw,
} from "./use-deposit-hooks";

// Re-export yield hooks
export {
  useClaimYield,
  useClaimReferralRewards,
  useToggleAutoCompound,
} from "./use-yield-hooks";

// Re-export aggregator hooks
export {
  useYieldAggregatorDeposit,
  useYieldAggregatorWithdraw,
  useCompoundYields,
} from "./use-aggregator-hooks";

// ============================================================================
// COMBINED HOOKS - Defined in separate file to avoid import/export conflicts
// ============================================================================

export {
  useIndividualPoolTransactions,
  useYieldAggregatorTransactions,
} from "./use-combined-hooks";
