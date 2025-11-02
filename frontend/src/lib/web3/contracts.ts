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
  // KhipuVault Pools - VERIFIED WORKING on Mezo Testnet Chain ID 31611
  individualPool: '0x6028E4452e6059e797832578D70dBdf63317538a',
  cooperativePool: '0x92eCA935773b71efB655cc7d3aB77ee23c088A7a',
  lotteryPool: '0x0000000000000000000000000000000000000000',
  rotatingPool: '0x0000000000000000000000000000000000000000',
  
  // Core Integration - VERIFIED WORKING
  mezoIntegration: '0xa19B54b8b3f36F047E1f755c16F423143585cc6B',
  yieldAggregator: '0x5BDac57B68f2Bc215340e4Dc2240f30154f4A007',

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
// INDIVIDUAL POOL ABI - MUSD-ONLY VERSION
// ============================================================================
// Updated: Oct 24, 2025 - MUSD-only deposit model
// Users deposit MUSD (obtained at mezo.org first)
// All amounts are in MUSD, yields in MUSD

export const INDIVIDUAL_POOL_ABI = [
  // Read Functions
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'userDeposits',
    outputs: [
      { internalType: 'uint256', name: 'musdAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'yieldAccrued', type: 'uint256' },
      { internalType: 'uint256', name: 'depositTimestamp', type: 'uint256' },
      { internalType: 'uint256', name: 'lastYieldUpdate', type: 'uint256' },
      { internalType: 'bool', name: 'active', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalMusdDeposited',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalYieldsGenerated',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'calculateYield',
    outputs: [{ internalType: 'uint256', name: 'totalYield', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'performanceFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Write Functions - ERC20 MUSD (Non-Payable)
  {
    inputs: [{ internalType: 'uint256', name: 'musdAmount', type: 'uint256' }],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimYield',
    outputs: [{ internalType: 'uint256', name: 'yieldAmount', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'musdAmount', type: 'uint256' }],
    name: 'withdraw',
    outputs: [
      { internalType: 'uint256', name: 'musdAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'yieldAmount', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'musdAmount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'Deposited',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'yieldAmount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'feeAmount', type: 'uint256' },
    ],
    name: 'YieldClaimed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'musdAmount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'yieldAmount', type: 'uint256' },
    ],
    name: 'Withdrawn',
    type: 'event',
  },
] as const

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
