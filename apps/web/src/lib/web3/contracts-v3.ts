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
  PERFORMANCE_FEE_BPS,
  REFERRAL_BONUS_BPS,
} from "@khipu/shared";

import type { Address } from "viem";

// ============================================================================
// V3 CONTRACT ABIS
// ============================================================================

// V3 Pool ABIs
import CooperativePoolV3ABI from "@/contracts/abis/CooperativePoolV3.json";
import IndividualPoolV3ABI from "@/contracts/abis/IndividualPoolV3.json";
import YieldAggregatorV3ABI from "@/contracts/abis/YieldAggregatorV3.json";
import LotteryPoolV3ABI from "@/contracts/abis/LotteryPoolV3.json";
import RotatingPoolABI from "@/contracts/abis/RotatingPool.json";

// Token ABIs
import MUSDABI from "@/contracts/mezo-abis/MUSD.json";

// Mezo Protocol ABIs (Liquity-based)
import BorrowerOperationsABI from "@/contracts/mezo-abis/BorrowerOperations.json";
import TroveManagerABI from "@/contracts/mezo-abis/TroveManager.json";
import PriceFeedABI from "@/contracts/mezo-abis/PriceFeed.json";
import HintHelpersABI from "@/contracts/mezo-abis/HintHelpers.json";
import SortedTrovesABI from "@/contracts/mezo-abis/SortedTroves.json";
import StabilityPoolABI from "@/contracts/mezo-abis/StabilityPool.json";

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

// V3 Pool ABIs
export const INDIVIDUAL_POOL_V3_ABI = extractABI(IndividualPoolV3ABI);
export const YIELD_AGGREGATOR_V3_ABI = extractABI(YieldAggregatorV3ABI);
export const COOPERATIVE_POOL_V3_ABI = extractABI(CooperativePoolV3ABI);
export const LOTTERY_POOL_V3_ABI = extractABI(LotteryPoolV3ABI);
export const ROTATING_POOL_ABI = extractABI(RotatingPoolABI);

// Token ABIs
export const ERC20_ABI = extractABI(MUSDABI);
export const MUSD_ABI = ERC20_ABI;

// Mezo Protocol ABIs (Liquity-based system for MUSD)
export const MEZO_BORROWER_OPERATIONS_ABI = extractABI(BorrowerOperationsABI);
export const MEZO_TROVE_MANAGER_ABI = extractABI(TroveManagerABI);
export const MEZO_PRICE_FEED_ABI = extractABI(PriceFeedABI);
export const MEZO_HINT_HELPERS_ABI = extractABI(HintHelpersABI);
export const MEZO_SORTED_TROVES_ABI = extractABI(SortedTrovesABI);
export const MEZO_STABILITY_POOL_ABI = extractABI(StabilityPoolABI);

// ============================================================================
// V3 CONTRACT ADDRESSES (from @khipu/shared)
// ============================================================================

// Get addresses from shared package
const addresses = getAddresses();

export const MEZO_V3_ADDRESSES = {
  // V3 Pools (Upgradeable Proxies)
  individualPool: addresses.INDIVIDUAL_POOL as Address,
  individualPoolV3: addresses.INDIVIDUAL_POOL as Address, // alias
  cooperativePool: addresses.COOPERATIVE_POOL as Address,
  cooperativePoolV3: addresses.COOPERATIVE_POOL as Address, // alias
  lotteryPool: addresses.LOTTERY_POOL as Address,
  rotatingPool: addresses.ROTATING_POOL as Address,
  yieldAggregator: addresses.YIELD_AGGREGATOR as Address,
  yieldAggregatorV3: addresses.YIELD_AGGREGATOR as Address, // alias
  mezoIntegration: addresses.MEZO_INTEGRATION as Address,
  mezoIntegrationV3: addresses.MEZO_INTEGRATION as Address, // alias

  // Tokens
  musd: addresses.MUSD as Address,

  // Mezo Protocol (External)
  borrowerOperations: addresses.BORROWER_OPERATIONS as Address,
  mezoBorrowerOperations: addresses.BORROWER_OPERATIONS as Address, // alias
  troveManager: addresses.TROVE_MANAGER as Address,
  mezoTroveManager: addresses.TROVE_MANAGER as Address, // alias
  priceFeed: addresses.PRICE_FEED as Address,
  mezoPriceFeed: addresses.PRICE_FEED as Address, // alias
  hintHelpers: addresses.HINT_HELPERS as Address,
  mezoHintHelpers: addresses.HINT_HELPERS as Address, // alias
  sortedTroves: addresses.SORTED_TROVES as Address,
  mezoSortedTroves: addresses.SORTED_TROVES as Address, // alias
  stabilityPool: addresses.STABILITY_POOL as Address,
  mezoStabilityPool: addresses.STABILITY_POOL as Address, // alias
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
    referralBonus: REFERRAL_BONUS_BPS,
    performanceFee: PERFORMANCE_FEE_BPS,
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
    /** Minimum contribution in wei (0.001 BTC) */
    minContribution: "1000000000000000",
    /** Minimum contribution as BTC string for forms */
    minContributionBtc: "0.001",
    /** Maximum members per pool */
    maxMembers: 100,
    /** Minimum members required */
    minMembers: 2,
    /** Default max members for new pools */
    defaultMaxMembers: 10,
    /** Default max contribution in BTC */
    defaultMaxContributionBtc: "0.1",
  },
  lotteryPool: {
    /** Default ticket price in wei (0.001 BTC = 1e15 wei) */
    defaultTicketPrice: "1000000000000000",
    /** Default maximum tickets per round */
    defaultMaxTickets: 1000,
    /** Default round duration in seconds (7 days) */
    defaultDuration: 7 * 24 * 60 * 60,
    /** Maximum tickets per user per round */
    maxTicketsPerUser: 10,
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
// HELPER FUNCTIONS
// ============================================================================

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

/**
 * Get contract address for a given key
 */
export function getContractAddress(key: keyof typeof MEZO_V3_ADDRESSES): Address {
  return MEZO_V3_ADDRESSES[key];
}

/**
 * Validate if contract address is configured (not zero)
 */
export function isContractConfigured(address: string): boolean {
  return address !== ZERO_ADDRESS;
}

/**
 * Get all missing contract addresses
 */
export function getMissingAddresses(): string[] {
  const missing: string[] = [];
  const checked = new Set<string>(); // Avoid duplicates from aliases

  for (const [key, value] of Object.entries(MEZO_V3_ADDRESSES)) {
    if (!checked.has(value) && !isContractConfigured(value)) {
      missing.push(key);
      checked.add(value);
    }
  }

  return missing;
}

/**
 * Check if all critical contracts are configured
 */
export function areAllContractsConfigured(): boolean {
  return (
    isContractConfigured(MEZO_V3_ADDRESSES.individualPool) &&
    isContractConfigured(MEZO_V3_ADDRESSES.musd)
  );
}

// ============================================================================
// EXPORTS (Legacy aliases for backward compatibility)
// ============================================================================

export {
  INDIVIDUAL_POOL_V3_ABI as INDIVIDUAL_POOL_ABI,
  YIELD_AGGREGATOR_V3_ABI as YIELD_AGGREGATOR_ABI,
  COOPERATIVE_POOL_V3_ABI as COOPERATIVE_POOL_ABI,
  LOTTERY_POOL_V3_ABI as LOTTERY_POOL_ABI,
  MEZO_V3_ADDRESSES as MEZO_TESTNET_ADDRESSES,
};

// Re-export from shared for convenience
export {
  getAddresses,
  getAddress,
  TESTNET_ADDRESSES,
  ZERO_ADDRESS,
  type ContractName,
} from "@khipu/shared";

// Re-export lottery types for convenience
export {
  LotteryRoundStatus,
  type LotteryRoundStatusType,
  type LotteryRoundV3,
  type LotteryParticipantV3,
  getLotteryRoundStatusName,
} from "@/lib/web3/lottery-types";
