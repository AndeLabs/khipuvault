/**
 * @fileoverview V3 Smart Contract ABIs and Addresses (Production-Ready)
 * @module lib/web3/contracts-v3
 * 
 * V3 Features:
 * ✅ UUPS Upgradeable Pattern
 * ✅ Storage Packing (~40-60k gas saved)
 * ✅ Flash Loan Protection
 * ✅ Emergency Mode
 * ✅ Auto-Compound (IndividualPool)
 * ✅ Referral System (IndividualPool)
 * ✅ Incremental Deposits
 * ✅ Partial Withdrawals
 * 
 * Network: Mezo Testnet (Chain ID: 31611)
 * Deployed: November 2, 2025
 */

// ============================================================================
// V3 CONTRACT ABIS
// ============================================================================

import IndividualPoolV3ABI from '@/contracts/abis/IndividualPoolV3.json'
import YieldAggregatorV3ABI from '@/contracts/abis/YieldAggregatorV3.json'
import CooperativePoolV3ABI from '@/contracts/abis/CooperativePoolV3.json'
import MUSDABI from '@/contracts/mezo-abis/MUSD.json'

// Extract ABIs safely - Foundry exports as {"abi": [...], "bytecode": {...}}
function extractABI(abiModule: any): any[] {
  // If it's already an array, return it
  if (Array.isArray(abiModule)) {
    return abiModule
  }
  
  // If it has an 'abi' property, extract it
  if (abiModule && typeof abiModule === 'object' && 'abi' in abiModule) {
    return Array.isArray(abiModule.abi) ? abiModule.abi : []
  }
  
  // Check for .default (webpack/vite bundling)
  if (abiModule && typeof abiModule === 'object' && 'default' in abiModule) {
    return extractABI(abiModule.default)
  }
  
  console.error('❌ Invalid ABI module:', abiModule)
  return []
}

export const INDIVIDUAL_POOL_V3_ABI = extractABI(IndividualPoolV3ABI)
export const YIELD_AGGREGATOR_V3_ABI = extractABI(YieldAggregatorV3ABI)
export const COOPERATIVE_POOL_V3_ABI = extractABI(CooperativePoolV3ABI)
export const ERC20_ABI = extractABI(MUSDABI)

// ============================================================================
// V3 CONTRACT ADDRESSES (MEZO TESTNET)
// ============================================================================

export const MEZO_V3_ADDRESSES = {
  // V3 Pools (Upgradeable Proxies) ⭐ USE THESE ⭐
  individualPoolV3: process.env.NEXT_PUBLIC_INDIVIDUAL_POOL_ADDRESS || '0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393',
  yieldAggregatorV3: process.env.NEXT_PUBLIC_YIELD_AGGREGATOR_ADDRESS || '0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6',
  cooperativePoolV3: process.env.NEXT_PUBLIC_COOPERATIVE_POOL_ADDRESS || '0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88',
  
  // Tokens
  musd: process.env.NEXT_PUBLIC_MUSD_ADDRESS || '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503',
  
  // Mezo Integration V3 (Upgradeable Proxy)
  mezoIntegrationV3: process.env.NEXT_PUBLIC_MEZO_INTEGRATION_ADDRESS || '0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6',
  
  // Mezo Protocol (External)
  borrowerOperations: '0xCdF7028ceAB81fA0C6971208e83fa7872994beE5',
  troveManager: '0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0',
  priceFeed: '0x86bCF0841622a5dAC14A313a15f96A95421b9366',
  hintHelpers: '0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6',
} as const

// ============================================================================
// V3 CONTRACT FEATURES
// ============================================================================

export const V3_FEATURES = {
  individualPool: {
    autoCompound: true,
    referralSystem: true,
    incrementalDeposits: true,
    partialWithdrawals: true,
    minWithdrawal: '1000000000000000000', // 1 MUSD
    minDeposit: '10000000000000000000', // 10 MUSD
    maxDeposit: '100000000000000000000000', // 100k MUSD
    autoCompoundThreshold: '1000000000000000000', // 1 MUSD
    referralBonus: 50, // 0.5% in basis points
    performanceFee: 100, // 1% in basis points
  },
  yieldAggregator: {
    multiVault: true,
    authorizedCallers: true,
    emergencyMode: true,
    minDeposit: '1000000000000000000', // 1 MUSD
    maxVaults: 10,
  },
  cooperativePool: {
    flashLoanProtection: true,
    emergencyMode: true,
    minContribution: '1000000000000000', // 0.001 BTC
    maxMembers: 100,
  },
} as const

// ============================================================================
// V3 TYPE DEFINITIONS
// ============================================================================

export type UserInfoV3 = {
  deposit: bigint
  yields: bigint
  netYields: bigint
  daysActive: bigint
  estimatedAPR: bigint
  autoCompoundEnabled: boolean
}

export type ReferralStats = {
  count: bigint
  rewards: bigint
  referrer: string
}

// ============================================================================
// V3 HELPER FUNCTIONS
// ============================================================================

/**
 * Check if address is V3 contract
 */
export function isV3Contract(address: string): boolean {
  return Object.values(MEZO_V3_ADDRESSES).includes(address.toLowerCase() as any)
}

/**
 * Get contract version
 */
export function getContractVersion(address: string): 'v1' | 'v3' | 'unknown' {
  if (isV3Contract(address)) return 'v3'
  // Add V1 check here if needed
  return 'unknown'
}

/**
 * Format referral bonus
 */
export function formatReferralBonus(bonus: number): string {
  return `${(bonus / 100).toFixed(2)}%`
}

/**
 * Calculate net yield after fee
 */
export function calculateNetYield(grossYield: bigint, performanceFee: number): bigint {
  const feeAmount = (grossYield * BigInt(performanceFee)) / BigInt(10000)
  return grossYield - feeAmount
}

/**
 * Check if auto-compound threshold met
 */
export function shouldAutoCompound(yieldAmount: bigint, threshold: string): boolean {
  return yieldAmount >= BigInt(threshold)
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  INDIVIDUAL_POOL_V3_ABI as INDIVIDUAL_POOL_ABI,
  YIELD_AGGREGATOR_V3_ABI as YIELD_AGGREGATOR_ABI,
  COOPERATIVE_POOL_V3_ABI as COOPERATIVE_POOL_ABI,
  MEZO_V3_ADDRESSES as MEZO_TESTNET_ADDRESSES,
}

// Legacy exports for backward compatibility
export const MUSD_ABI = ERC20_ABI
