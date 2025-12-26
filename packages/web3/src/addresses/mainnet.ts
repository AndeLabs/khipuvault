/**
 * Mezo Mainnet Contract Addresses
 * Chain ID: 31612
 * Last Updated: Official Mezo Mainnet Launch
 */

export const MAINNET_ADDRESSES = {
  // KhipuVault Contracts (not yet deployed to mainnet)
  // These will be updated after mainnet deployment
  INDIVIDUAL_POOL: "0x0000000000000000000000000000000000000000" as const,
  COOPERATIVE_POOL: "0x0000000000000000000000000000000000000000" as const,
  YIELD_AGGREGATOR: "0x0000000000000000000000000000000000000000" as const,
  MEZO_INTEGRATION: "0x0000000000000000000000000000000000000000" as const,

  // Official Mezo Mainnet Contracts
  MUSD: "0xdD468A1DDc392dcdbEf6db6d34E89AA338F9F186" as const,
  BORROWER_OPERATIONS: "0x0000000000000000000000000000000000000000" as const, // To be updated
  TROVE_MANAGER: "0x0000000000000000000000000000000000000000" as const, // To be updated
  PRICE_FEED: "0x0000000000000000000000000000000000000000" as const, // To be updated
  HINT_HELPERS: "0x0000000000000000000000000000000000000000" as const, // To be updated
  SORTED_TROVES: "0x0000000000000000000000000000000000000000" as const, // To be updated

  // Additional Mainnet Info (from official docs)
  // Pool Factory: 0x83FE469C636C4081b87bA5b3Ae9991c6Ed104248
} as const;

export type ContractName = keyof typeof MAINNET_ADDRESSES;
