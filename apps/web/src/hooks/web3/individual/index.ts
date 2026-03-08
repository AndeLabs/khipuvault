/**
 * @fileoverview Individual Pool V3 and Yield Aggregator - Main Export Module
 * @module hooks/web3/individual
 *
 * Central export point for all individual pool and yield aggregator functionality
 *
 * NEW in v3.1: Sub-hooks for selective data subscription
 * - usePoolStatistics()  - Pool TVL, yields, referral rewards
 * - useUserPoolInfo()    - User deposits, balances, permissions
 * - useReferralStats()   - Referral count, rewards, referrer
 * - usePoolConfig()      - Contract config (fees, emergency mode)
 */

"use client";

// Re-export constants
export { INITIAL_TX_STATE } from "./constants";
export type { TransactionState } from "./constants";

// Re-export centralized query keys for convenience
export { queryKeys } from "@/lib/query-keys";

// NEW: Specialized sub-hooks for minimal re-renders
export { usePoolStatistics } from "./use-pool-statistics";
export { useUserPoolInfo } from "./use-user-pool-info";
export { useReferralStats } from "./use-referral-stats";
export { usePoolConfig } from "./use-pool-config";

// Formatting utilities
export {
  formatMUSD,
  formatMUSDCompact,
  formatAPR,
  formatDays,
  formatReferralBonus,
  calculateFee,
  calculateNetAmount,
} from "./formatters";

// Re-export deposit hooks
export { useDeposit, usePartialWithdraw, useFullWithdraw } from "./use-deposit-hooks";

// Re-export yield hooks
export { useClaimYield, useClaimReferralRewards, useToggleAutoCompound } from "./use-yield-hooks";

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
