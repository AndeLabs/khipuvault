/**
 * Mezo Mainnet Contract Addresses
 * Chain ID: 31612
 * TO BE DEPLOYED
 */

export const MAINNET_ADDRESSES = {
  // V3 Production Contracts (to be deployed)
  INDIVIDUAL_POOL: '' as const,
  COOPERATIVE_POOL: '' as const,
  YIELD_AGGREGATOR: '' as const,
  MEZO_INTEGRATION: '' as const,

  // Official Mezo Contracts (to be updated)
  MUSD: '' as const,
  BORROWER_OPERATIONS: '' as const,
  TROVE_MANAGER: '' as const,
  PRICE_FEED: '' as const,
  HINT_HELPERS: '' as const,
  SORTED_TROVES: '' as const,
} as const

export type ContractName = keyof typeof MAINNET_ADDRESSES
