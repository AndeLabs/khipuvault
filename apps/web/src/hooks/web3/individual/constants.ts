/**
 * @fileoverview Individual Pool V3 and Yield Aggregator Constants
 * @module hooks/web3/individual/constants
 */

// ============================================================================
// QUERY KEYS
// ============================================================================

export const QUERY_KEYS = {
  INDIVIDUAL_POOL: ['individual-pool-v3'] as const,
  YIELD_AGGREGATOR: ['yield-aggregator-v3'] as const,
  BALANCE: ['balance'] as const,
} as const

// ============================================================================
// TRANSACTION STATE
// ============================================================================

export interface TransactionState {
  isProcessing: boolean
  hash: string | null
}

export const INITIAL_TX_STATE: TransactionState = {
  isProcessing: false,
  hash: null,
}
