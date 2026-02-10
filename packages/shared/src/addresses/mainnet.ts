/**
 * @fileoverview Mezo Mainnet Contract Addresses
 * @module addresses/mainnet
 *
 * Single source of truth for all mainnet contract addresses.
 * Chain ID: 31612
 *
 * IMPORTANT: Mainnet addresses are placeholders (0x0) until deployment.
 * Update these addresses after mainnet deployment.
 *
 * Last Updated: 2026-02-10 - Pre-mainnet (placeholders)
 */

import type { Address } from "viem";

/** Zero address placeholder for undeployed contracts */
const ZERO = "0x0000000000000000000000000000000000000000" as Address;

/**
 * KhipuVault V3 Pool Addresses (UUPS Upgradeable Proxies)
 * TODO: Update after mainnet deployment
 */
export const MAINNET_POOLS = {
  INDIVIDUAL_POOL: ZERO,
  COOPERATIVE_POOL: ZERO,
  LOTTERY_POOL: ZERO,
  ROTATING_POOL: ZERO,
} as const;

/**
 * KhipuVault V3 Infrastructure Addresses
 * TODO: Update after mainnet deployment
 */
export const MAINNET_INFRASTRUCTURE = {
  YIELD_AGGREGATOR: ZERO,
  MEZO_INTEGRATION: ZERO,
} as const;

/**
 * Official Mezo Protocol Mainnet Addresses (External)
 * Source: https://mezo.org/docs
 * TODO: Verify these addresses before mainnet launch
 */
export const MAINNET_MEZO_PROTOCOL = {
  MUSD: ZERO, // TODO: Get from Mezo mainnet docs
  BORROWER_OPERATIONS: ZERO,
  TROVE_MANAGER: ZERO,
  PRICE_FEED: ZERO,
  HINT_HELPERS: ZERO,
  SORTED_TROVES: ZERO,
} as const;

/**
 * Complete mainnet addresses (flat structure for convenience)
 */
export const MAINNET_ADDRESSES = {
  // Pools
  ...MAINNET_POOLS,
  // Infrastructure
  ...MAINNET_INFRASTRUCTURE,
  // Mezo Protocol
  ...MAINNET_MEZO_PROTOCOL,
} as const;

export type MainnetContractName = keyof typeof MAINNET_ADDRESSES;
