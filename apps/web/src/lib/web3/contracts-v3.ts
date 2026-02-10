/**
 * @fileoverview V3 Smart Contract ABIs and Addresses (Production-Ready)
 * @module lib/web3/contracts-v3
 *
 * V3 Features:
 * - UUPS Upgradeable Pattern
 * - Storage Packing (~40-60k gas saved)
 * - Flash Loan Protection
 * - Emergency Mode
 * - Auto-Compound (IndividualPool)
 * - Referral System (IndividualPool)
 * - Incremental Deposits
 * - Partial Withdrawals
 *
 * Network: Mezo Testnet (Chain ID: 31611)
 *
 * This module re-exports addresses from @khipu/shared (single source of truth)
 */

// ============================================================================
// CONTRACT ADDRESSES (from @khipu/shared - Single Source of Truth)
// ============================================================================

import {
  getAddresses,
  getAddress,
  TESTNET_ADDRESSES,
  ZERO_ADDRESS,
  getCurrentNetwork,
} from "@khipu/shared";

import type { Address } from "viem";

// ============================================================================
// V3 CONTRACT ABIS
// ============================================================================

import CooperativePoolV3ABI from "@/contracts/abis/CooperativePoolV3.json";
import IndividualPoolV3ABI from "@/contracts/abis/IndividualPoolV3.json";
import YieldAggregatorV3ABI from "@/contracts/abis/YieldAggregatorV3.json";
import MUSDABI from "@/contracts/mezo-abis/MUSD.json";

// Type for ABI module that may have default/abi wrapper
type AbiModule = readonly unknown[] | { default?: readonly unknown[]; abi?: readonly unknown[] };

// Extract ABIs safely - Foundry exports as {"abi": [...], "bytecode": {...}}
function extractABI(abiModule: unknown): readonly unknown[] {
  if (Array.isArray(abiModule)) {
    if (abiModule.length === 0) {
      throw new Error("ABI module is an empty array - contract ABI may not be generated");
    }
    return abiModule;
  }

  if (abiModule && typeof abiModule === "object" && "abi" in abiModule) {
    const abi = (abiModule as { abi: unknown }).abi;
    if (Array.isArray(abi)) {
      if (abi.length === 0) {
        throw new Error("ABI property is an empty array - contract ABI may not be generated");
      }
      return abi;
    }
    throw new Error("ABI property is not an array");
  }

  if (abiModule && typeof abiModule === "object" && "default" in abiModule) {
    return extractABI((abiModule as { default: unknown }).default);
  }

  throw new Error(
    `Invalid ABI module: expected array or object with 'abi' property, got ${typeof abiModule}`
  );
}

export const INDIVIDUAL_POOL_V3_ABI = extractABI(IndividualPoolV3ABI);
export const YIELD_AGGREGATOR_V3_ABI = extractABI(YieldAggregatorV3ABI);
export const COOPERATIVE_POOL_V3_ABI = extractABI(CooperativePoolV3ABI);
export const ERC20_ABI = extractABI(MUSDABI);

// ============================================================================
// V3 CONTRACT ADDRESSES (from @khipu/shared)
// ============================================================================

// Get addresses from shared package
const addresses = getAddresses();

export const MEZO_V3_ADDRESSES = {
  // V3 Pools (Upgradeable Proxies)
  individualPoolV3: addresses.INDIVIDUAL_POOL as Address,
  yieldAggregatorV3: addresses.YIELD_AGGREGATOR as Address,
  cooperativePoolV3: addresses.COOPERATIVE_POOL as Address,

  // Tokens
  musd: addresses.MUSD as Address,

  // Mezo Integration V3
  mezoIntegrationV3: addresses.MEZO_INTEGRATION as Address,

  // Mezo Protocol (External)
  borrowerOperations: addresses.BORROWER_OPERATIONS as Address,
  troveManager: addresses.TROVE_MANAGER as Address,
  priceFeed: addresses.PRICE_FEED as Address,
  hintHelpers: addresses.HINT_HELPERS as Address,
} as const;

// ============================================================================
// V3 CONTRACT FEATURES
// ============================================================================

export const V3_FEATURES = {
  individualPool: {
    autoCompound: true,
    referralSystem: true,
    incrementalDeposits: true,
    partialWithdrawals: true,
    minWithdrawal: "1000000000000000000", // 1 MUSD
    minDeposit: "10000000000000000000", // 10 MUSD
    maxDeposit: "100000000000000000000000", // 100k MUSD
    autoCompoundThreshold: "1000000000000000000", // 1 MUSD
    referralBonus: 50, // 0.5% in basis points
    performanceFee: 100, // 1% in basis points
  },
  yieldAggregator: {
    multiVault: true,
    authorizedCallers: true,
    emergencyMode: true,
    minDeposit: "1000000000000000000", // 1 MUSD
    maxVaults: 10,
  },
  cooperativePool: {
    flashLoanProtection: true,
    emergencyMode: true,
    minContribution: "1000000000000000", // 0.001 BTC
    maxMembers: 100,
  },
} as const;

// ============================================================================
// V3 TYPE DEFINITIONS
// ============================================================================

export type UserInfoV3 = {
  deposit: bigint;
  yields: bigint;
  netYields: bigint;
  daysActive: bigint;
  estimatedAPR: bigint;
  autoCompoundEnabled: boolean;
};

export type ReferralStats = {
  count: bigint;
  rewards: bigint;
  referrer: string;
};

// ============================================================================
// V3 HELPER FUNCTIONS
// ============================================================================

/**
 * Check if address is V3 contract
 */
export function isV3Contract(address: string): boolean {
  return Object.values(MEZO_V3_ADDRESSES).some(
    (v3Addr) => v3Addr.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Get contract version
 */
export function getContractVersion(address: string): "v1" | "v3" | "unknown" {
  if (isV3Contract(address)) {
    return "v3";
  }
  return "unknown";
}

/**
 * Format referral bonus
 */
export function formatReferralBonus(bonus: number): string {
  return `${(bonus / 100).toFixed(2)}%`;
}

/**
 * Calculate net yield after fee
 */
export function calculateNetYield(grossYield: bigint, performanceFee: number): bigint {
  const feeAmount = (grossYield * BigInt(performanceFee)) / BigInt(10000);
  return grossYield - feeAmount;
}

/**
 * Check if auto-compound threshold met
 */
export function shouldAutoCompound(yieldAmount: bigint, threshold: string): boolean {
  return yieldAmount >= BigInt(threshold);
}

// ============================================================================
// EXPORTS (Legacy aliases for backward compatibility)
// ============================================================================

export {
  INDIVIDUAL_POOL_V3_ABI as INDIVIDUAL_POOL_ABI,
  YIELD_AGGREGATOR_V3_ABI as YIELD_AGGREGATOR_ABI,
  COOPERATIVE_POOL_V3_ABI as COOPERATIVE_POOL_ABI,
  MEZO_V3_ADDRESSES as MEZO_TESTNET_ADDRESSES,
};

// Legacy exports for backward compatibility
export const MUSD_ABI = ERC20_ABI;
