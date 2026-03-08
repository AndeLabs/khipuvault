/**
 * @fileoverview Individual Pool V3 and Yield Aggregator Types
 * @module hooks/web3/individual/constants
 *
 * NOTE: Query keys are centralized in @/lib/query-keys
 * NOTE: Query config (staleTime, etc.) is in @/lib/query-config
 */

// Re-export centralized query keys for backwards compatibility
export { queryKeys } from "@/lib/query-keys";
export { QUERY_PRESETS } from "@/lib/query-config";

// ============================================================================
// TRANSACTION STATE
// ============================================================================

export interface TransactionState {
  isProcessing: boolean;
  hash: string | null;
}

export const INITIAL_TX_STATE: TransactionState = {
  isProcessing: false,
  hash: null,
};
