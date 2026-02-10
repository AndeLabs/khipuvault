/**
 * @fileoverview Smart contract addresses and ABIs for KhipuVault on Mezo
 * @module lib/web3/contracts
 *
 * IMPORTANT: On Mezo, BTC is NATIVE (like ETH on Ethereum)
 * - No WBTC needed
 * - BTC is sent via msg.value (payable functions)
 * - BTC has 18 decimals on Mezo
 *
 * This module re-exports addresses from @khipu/shared (single source of truth)
 * and provides ABIs for contract interactions.
 */

// ============================================================================
// CONTRACT ADDRESSES (from @khipu/shared - Single Source of Truth)
// ============================================================================

import {
  getAddresses,
  getAddress,
  isAddressConfigured,
  TESTNET_ADDRESSES,
  ZERO_ADDRESS,
  type ContractName,
} from "@khipu/shared";

// Re-export for backwards compatibility
export {
  getAddresses,
  getAddress,
  isAddressConfigured,
  TESTNET_ADDRESSES,
  ZERO_ADDRESS,
  type ContractName,
};

// Mapped format for legacy code that uses camelCase keys
const addresses = getAddresses();
export const MEZO_TESTNET_ADDRESSES = {
  // KhipuVault V3 Pools
  individualPool: addresses.INDIVIDUAL_POOL,
  cooperativePool: addresses.COOPERATIVE_POOL,
  lotteryPool: addresses.LOTTERY_POOL,
  rotatingPool: addresses.ROTATING_POOL,

  // Infrastructure
  mezoIntegration: addresses.MEZO_INTEGRATION,
  yieldAggregator: addresses.YIELD_AGGREGATOR,

  // Mezo Protocol
  musd: addresses.MUSD,
  mezoBorrowerOperations: addresses.BORROWER_OPERATIONS,
  mezoTroveManager: addresses.TROVE_MANAGER,
  mezoHintHelpers: addresses.HINT_HELPERS,
  mezoPriceFeed: addresses.PRICE_FEED,
  mezoSortedTroves: addresses.SORTED_TROVES,
} as const;

// ============================================================================
// MEZO OFFICIAL ABIS (Local ABIs generated from Forge interfaces)
// ============================================================================

import IndividualPoolV3ABI from "@/contracts/abis/IndividualPoolV3.json";
import BorrowerOperationsABI from "@/contracts/mezo-abis/BorrowerOperations.json";
import HintHelpersABI from "@/contracts/mezo-abis/HintHelpers.json";
import MUSDABI from "@/contracts/mezo-abis/MUSD.json";
import PriceFeedABI from "@/contracts/mezo-abis/PriceFeed.json";
import SortedTrovesABI from "@/contracts/mezo-abis/SortedTroves.json";
import StabilityPoolABI from "@/contracts/mezo-abis/StabilityPool.json";
import TroveManagerABI from "@/contracts/mezo-abis/TroveManager.json";

// Type for ABI module that may have default/abi wrapper
type AbiModule = readonly unknown[] | { default?: readonly unknown[]; abi?: readonly unknown[] };

// Helper to safely extract ABI
function extractAbi(abiModule: AbiModule): readonly unknown[] {
  if (Array.isArray(abiModule)) return abiModule;
  if (abiModule && typeof abiModule === "object") {
    if ("abi" in abiModule && Array.isArray(abiModule.abi)) return abiModule.abi;
    if ("default" in abiModule && Array.isArray(abiModule.default)) return abiModule.default;
  }
  throw new Error("Invalid ABI module format");
}

export const MEZO_BORROWER_OPERATIONS_ABI = extractAbi(BorrowerOperationsABI as AbiModule);
export const MEZO_TROVE_MANAGER_ABI = extractAbi(TroveManagerABI as AbiModule);
export const MEZO_PRICE_FEED_ABI = extractAbi(PriceFeedABI as AbiModule);
export const MEZO_HINT_HELPERS_ABI = extractAbi(HintHelpersABI as AbiModule);
export const MEZO_SORTED_TROVES_ABI = extractAbi(SortedTrovesABI as AbiModule);
export const MEZO_MUSD_ABI = extractAbi(MUSDABI as AbiModule);
export const MEZO_STABILITY_POOL_ABI = extractAbi(StabilityPoolABI as AbiModule);

// ============================================================================
// ERC20 ABI (Standard Token Interface - using MEZO_MUSD_ABI)
// ============================================================================

export const ERC20_ABI = MEZO_MUSD_ABI;
export const MUSD_ABI = MEZO_MUSD_ABI;

// ============================================================================
// INDIVIDUAL POOL ABI - V3 (UUPS Upgradeable)
// ============================================================================

export const INDIVIDUAL_POOL_ABI = extractAbi(IndividualPoolV3ABI as AbiModule);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get contract address for a given key (legacy camelCase API)
 */
export function getContractAddress(key: keyof typeof MEZO_TESTNET_ADDRESSES): string {
  return MEZO_TESTNET_ADDRESSES[key];
}

/**
 * Validate if contract address is configured
 */
export function isContractConfigured(address: string): boolean {
  return address !== ZERO_ADDRESS;
}

/**
 * Get all missing contract addresses
 */
export function getMissingAddresses(): string[] {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(MEZO_TESTNET_ADDRESSES)) {
    if (!isContractConfigured(value as string)) {
      missing.push(key);
    }
  }

  return missing;
}

/**
 * Check if all critical contracts are configured
 */
export function areAllContractsConfigured(): boolean {
  return (
    isContractConfigured(MEZO_TESTNET_ADDRESSES.individualPool) &&
    isContractConfigured(MEZO_TESTNET_ADDRESSES.musd)
  );
}

/**
 * Format BTC amount (18 decimals on Mezo)
 */
export function formatBTC(amount: bigint): string {
  const btc = Number(amount) / 1e18;
  return btc.toFixed(6);
}

/**
 * Format MUSD amount (18 decimals)
 */
export function formatMUSD(amount: bigint): string {
  const musd = Number(amount) / 1e18;
  return musd.toFixed(2);
}

/**
 * Parse BTC amount to wei (18 decimals)
 */
export function parseBTC(amount: string): bigint {
  const btcFloat = parseFloat(amount);
  if (isNaN(btcFloat)) {
    return 0n;
  }
  return BigInt(Math.floor(btcFloat * 1e18));
}
