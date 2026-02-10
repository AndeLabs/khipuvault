/**
 * @fileoverview Mezo Testnet Contract Addresses
 * @module addresses/testnet
 *
 * Single source of truth for all testnet contract addresses.
 * Chain ID: 31611
 *
 * Last Updated: 2026-02-10 - V3 Production Deployment
 */

import type { Address } from "viem";

/**
 * KhipuVault V3 Pool Addresses (UUPS Upgradeable Proxies)
 */
export const TESTNET_POOLS = {
  INDIVIDUAL_POOL: "0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393" as Address,
  COOPERATIVE_POOL: "0xA39EE76DfC5106E78ABcB31e7dF5bcd4EfD3Cd1F" as Address,
  LOTTERY_POOL: "0x8c9cc22f5184bB4E485dbb51531959A8Cf0624b4" as Address,
  ROTATING_POOL: "0x1b7AB2aF7d58Fb8a137c237d93068A24808a7B04" as Address,
} as const;

/**
 * KhipuVault V3 Infrastructure Addresses
 */
export const TESTNET_INFRASTRUCTURE = {
  YIELD_AGGREGATOR: "0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6" as Address,
  MEZO_INTEGRATION: "0xab91e387F8faF1FEBF7FF7E019e2968F19c177fD" as Address,
} as const;

/**
 * Official Mezo Protocol Addresses (External - Do not modify)
 */
export const TESTNET_MEZO_PROTOCOL = {
  MUSD: "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503" as Address,
  BORROWER_OPERATIONS: "0xCdF7028ceAB81fA0C6971208e83fa7872994beE5" as Address,
  TROVE_MANAGER: "0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0" as Address,
  PRICE_FEED: "0x86bCF0841622a5dAC14A313a15f96A95421b9366" as Address,
  HINT_HELPERS: "0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6" as Address,
  SORTED_TROVES: "0x722E4D24FD6Ff8b0AC679450F3D91294607268fA" as Address,
} as const;

/**
 * Complete testnet addresses (flat structure for convenience)
 */
export const TESTNET_ADDRESSES = {
  // Pools
  ...TESTNET_POOLS,
  // Infrastructure
  ...TESTNET_INFRASTRUCTURE,
  // Mezo Protocol
  ...TESTNET_MEZO_PROTOCOL,
} as const;

export type TestnetContractName = keyof typeof TESTNET_ADDRESSES;
