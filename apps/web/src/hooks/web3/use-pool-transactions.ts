/**
 * @fileoverview V3 Pool Transactions Hook - Production Ready
 * @module hooks/web3/use-pool-transactions
 *
 * Handles all V3 pool transactions with new features:
 * - Auto-compound toggle
 * - Referral system
 * - Incremental deposits
 * - Partial withdrawals
 * - Emergency mode support
 *
 * V3 Features:
 * ✅ UUPS Upgradeable Pattern
 * ✅ Storage Packing (~40-60k gas saved)
 * ✅ Flash Loan Protection
 * ✅ Emergency Mode
 * ✅ Auto-Compound
 * ✅ Referral System
 * ✅ Incremental Deposits
 * ✅ Partial Withdrawals
 *
 * NOTE: This file has been refactored into smaller modules in the ./individual directory.
 * The exports below maintain backward compatibility with existing code.
 */

'use client'

// Re-export everything from the refactored modules
export * from './individual'

// Import and re-export individual hooks for backward compatibility
export {
  useDeposit,
  usePartialWithdraw,
  useFullWithdraw,
} from './individual/use-deposit-hooks'

export {
  useClaimYield,
  useClaimReferralRewards,
  useToggleAutoCompound,
} from './individual/use-yield-hooks'

// useCompoundYields is exported from use-aggregator-hooks
export { useCompoundYields } from './individual/use-aggregator-hooks'

export {
  useYieldAggregatorDeposit,
  useYieldAggregatorWithdraw,
} from './individual/use-aggregator-hooks'

// Import and re-export combined hooks
export {
  useIndividualPoolTransactions,
  useYieldAggregatorTransactions,
} from './individual'
