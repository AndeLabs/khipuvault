/**
 * @fileoverview Smart contract addresses and ABIs for KhipuVault on Mezo Testnet
 * @module lib/web3/contracts
 * 
 * IMPORTANT: On Mezo, BTC is NATIVE (like ETH on Ethereum)
 * - No WBTC needed
 * - BTC is sent via msg.value (payable functions)
 * - BTC has 18 decimals on Mezo
 * 
 * UPDATED: Oct 26, 2024 - Importing ABIs from @mezo-org/musd-contracts
 * This ensures automatic compatibility when Mezo updates their contracts
 */

// ============================================================================
// MEZO OFFICIAL ABIS (Local ABIs generated from Forge interfaces)
// ============================================================================
// These ABIs are generated from the Mezo protocol interfaces in contracts/src/interfaces

import BorrowerOperationsABI from '@/contracts/mezo-abis/BorrowerOperations.json'
import TroveManagerABI from '@/contracts/mezo-abis/TroveManager.json'
import PriceFeedABI from '@/contracts/mezo-abis/PriceFeed.json'
import HintHelpersABI from '@/contracts/mezo-abis/HintHelpers.json'
import SortedTrovesABI from '@/contracts/mezo-abis/SortedTroves.json'
import MUSDABI from '@/contracts/mezo-abis/MUSD.json'
import StabilityPoolABI from '@/contracts/mezo-abis/StabilityPool.json'

// Ensure ABIs are arrays (some bundlers might wrap them in {default: ...})
export const MEZO_BORROWER_OPERATIONS_ABI = Array.isArray(BorrowerOperationsABI) ? BorrowerOperationsABI : (BorrowerOperationsABI as any).default || BorrowerOperationsABI
export const MEZO_TROVE_MANAGER_ABI = Array.isArray(TroveManagerABI) ? TroveManagerABI : (TroveManagerABI as any).default || TroveManagerABI
export const MEZO_PRICE_FEED_ABI = Array.isArray(PriceFeedABI) ? PriceFeedABI : (PriceFeedABI as any).default || PriceFeedABI
export const MEZO_HINT_HELPERS_ABI = Array.isArray(HintHelpersABI) ? HintHelpersABI : (HintHelpersABI as any).default || HintHelpersABI
export const MEZO_SORTED_TROVES_ABI = Array.isArray(SortedTrovesABI) ? SortedTrovesABI : (SortedTrovesABI as any).default || SortedTrovesABI
export const MEZO_MUSD_ABI = Array.isArray(MUSDABI) ? MUSDABI : (MUSDABI as any).default || MUSDABI
export const MEZO_STABILITY_POOL_ABI = Array.isArray(StabilityPoolABI) ? StabilityPoolABI : (StabilityPoolABI as any).default || StabilityPoolABI

// ============================================================================
// MEZO TESTNET CONTRACT ADDRESSES
// ============================================================================

export const MEZO_TESTNET_ADDRESSES = {
  // KhipuVault Pools (UUPS Upgradeable) - PRODUCTION
  individualPool: '0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393',
  cooperativePool: '0x9629B9Cddc4234850FE4CEfa3232aD000f5D7E65',
  lotteryPool: '0x0000000000000000000000000000000000000000',
  rotatingPool: '0x0000000000000000000000000000000000000000',

  // Core Integration - PRODUCTION
  mezoIntegration: '0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6',
  yieldAggregator: '0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6',

  // Mezo Protocol - Official Mezo Testnet Addresses
  musd: '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503',
  mezoBorrowerOperations: '0xCdF7028ceAB81fA0C6971208e83fa7872994beE5',
  mezoTroveManager: '0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0',
  mezoHintHelpers: '0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6',
  mezoPriceFeed: '0x86bCF0841622a5dAC14A313a15f96A95421b9366',
  mezoSortedTroves: '0x722E4D24FD6Ff8b0AC679450F3D91294607268fA',
} as const

/**
 * Get contract address for a given key
 */
export function getContractAddress(key: keyof typeof MEZO_TESTNET_ADDRESSES): string {
  const address = MEZO_TESTNET_ADDRESSES[key]
  if (address === '0x0000000000000000000000000000000000000000') {
    console.warn(`⚠️ Contract "${key}" not deployed yet on Mezo Testnet`)
  }
  return address
}

// ============================================================================
// ERC20 ABI (Standard Token Interface - using MEZO_MUSD_ABI)
// ============================================================================
// MUSD is the standard ERC20 token on Mezo testnet
// Using the official ABI from @mezo-org/musd-contracts ensures compatibility

export const ERC20_ABI = MEZO_MUSD_ABI

// For backwards compatibility and explicit reference
export const MUSD_ABI = MEZO_MUSD_ABI

// ============================================================================
// KHIPUVAULT POOL ABIs (UUPS Upgradeable)
// ============================================================================
// Import ABIs from contracts/abis

import IndividualPoolABI from '@/contracts/abis/IndividualPool.json'
import CooperativePoolABI from '@/contracts/abis/CooperativePool.json'
import YieldAggregatorABI from '@/contracts/abis/YieldAggregator.json'

export const INDIVIDUAL_POOL_ABI = (IndividualPoolABI as any).abi as const
export const COOPERATIVE_POOL_ABI = (CooperativePoolABI as any).abi as const
export const YIELD_AGGREGATOR_ABI = (YieldAggregatorABI as any).abi as const

// ============================================================================
// TYPE DEFINITIONS FOR POOLS
// ============================================================================

/**
 * User information from Individual Pool
 */
export interface UserInfo {
  deposit: bigint
  yields: bigint
  netYields: bigint
  daysActive: bigint
  estimatedAPR: bigint
  autoCompoundEnabled: boolean
}

/**
 * Referral statistics for a user
 */
export interface ReferralStats {
  count: bigint
  rewards: bigint
  referrer: string
}

/**
 * Features and Configuration
 */
export const FEATURES = {
  // Global feature flags
  AUTO_COMPOUND: true,
  REFERRALS: true,
  INCREMENTAL_DEPOSITS: true,
  PARTIAL_WITHDRAWALS: true,
  ENHANCED_VIEWS: true,

  // Individual Pool Configuration
  individualPool: {
    // Contract constants (from IndividualPool.sol)
    minDeposit: '10000000000000000000',        // 10 MUSD (10 ether in wei)
    maxDeposit: '100000000000000000000000',    // 100,000 MUSD (100_000 ether in wei)
    minWithdrawal: '1000000000000000000',      // 1 MUSD (1 ether in wei)
    autoCompoundThreshold: '1000000000000000000', // 1 MUSD (1 ether in wei)

    // Configurable parameters (initialized values)
    performanceFee: 100,    // 1% (100 basis points)
    referralBonus: 50,      // 0.5% (50 basis points)
  },

  // Yield Aggregator Configuration
  yieldAggregator: {
    // Contract constants (from YieldAggregator.sol)
    minDeposit: '1000000000000000000',         // 1 MUSD (1 ether in wei)
    maxVaults: 10,                             // Maximum number of vaults
  },
} as const

// Export aliases for backward compatibility
export const MEZO_V3_ADDRESSES = MEZO_TESTNET_ADDRESSES
export const V3_FEATURES = FEATURES
export type UserInfoV3 = UserInfo

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate if contract address is configured
 */
export function isContractConfigured(address: string): boolean {
  return address !== '0x0000000000000000000000000000000000000000'
}

/**
 * Get all missing contract addresses
 */
export function getMissingAddresses(): string[] {
  const missing: string[] = []
  const addresses = MEZO_TESTNET_ADDRESSES

  for (const [key, value] of Object.entries(addresses)) {
    if (!isContractConfigured(value as string)) {
      missing.push(key)
    }
  }

  return missing
}

/**
 * Check if all critical contracts are configured
 * NOTE: BTC is native, so no WBTC check needed
 */
export function areAllContractsConfigured(): boolean {
  const criticalContracts = [
    'individualPool',
    'musd', // Only MUSD needed (BTC is native)
  ]

  for (const contract of criticalContracts) {
    const key = contract as keyof typeof MEZO_TESTNET_ADDRESSES
    if (!isContractConfigured(MEZO_TESTNET_ADDRESSES[key])) {
      return false
    }
  }

  return true
}

/**
 * Format BTC amount (18 decimals on Mezo)
 */
export function formatBTC(amount: bigint): string {
  // BTC has 18 decimals on Mezo (not 8 like real BTC)
  const btc = Number(amount) / 1e18
  return btc.toFixed(6)
}

/**
 * Format MUSD amount (18 decimals)
 */
export function formatMUSD(amount: bigint): string {
  const musd = Number(amount) / 1e18
  return musd.toFixed(2)
}

/**
 * Parse BTC amount to wei (18 decimals)
 */
export function parseBTC(amount: string): bigint {
  const btcFloat = parseFloat(amount)
  if (isNaN(btcFloat)) return 0n
  return BigInt(Math.floor(btcFloat * 1e18))
}
