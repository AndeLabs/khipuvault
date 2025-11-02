/**
 * @fileoverview Smart Contract Address Configuration
 * @module contracts/addresses
 * 
 * Centralized contract addresses for all deployed KhipuVault contracts
 * Type-safe configuration with runtime validation
 * 
 * Production-ready with:
 * - Environment variable validation
 * - Type safety for addresses
 * - Helper functions for address operations
 * - Support for multiple environments
 */

import { Address } from 'viem'

/**
 * Contract address type with validation
 */
type ContractAddress = Address | `0x${string}`

/**
 * Environment variable keys for contract addresses
 */
const ENV_KEYS = {
  WBTC: 'NEXT_PUBLIC_WBTC_ADDRESS',
  MUSD: 'NEXT_PUBLIC_MUSD_ADDRESS',
  MEZO_INTEGRATION: 'NEXT_PUBLIC_MEZO_INTEGRATION_ADDRESS',
  YIELD_AGGREGATOR: 'NEXT_PUBLIC_YIELD_AGGREGATOR_ADDRESS',
  INDIVIDUAL_POOL: 'NEXT_PUBLIC_INDIVIDUAL_POOL_ADDRESS',
  COOPERATIVE_POOL: 'NEXT_PUBLIC_COOPERATIVE_POOL_ADDRESS',
  LOTTERY_POOL: 'NEXT_PUBLIC_LOTTERY_POOL_ADDRESS',
  ROTATING_POOL: 'NEXT_PUBLIC_ROTATING_POOL_ADDRESS',
} as const

/**
 * Get environment variable with optional fallback
 * @param key - Environment variable key
 * @param fallback - Optional fallback value
 * @returns Environment variable value or fallback
 */
function getEnvAddress(key: string, fallback?: string): ContractAddress {
  const value = process.env[key]
  if (!value) {
    if (fallback) return fallback as ContractAddress
    throw new Error(
      `Contract address not configured: ${key}. ` +
      `Please set it in your .env.local file.`
    )
  }
  return value as ContractAddress
}

/**
 * Validate Ethereum address format
 * @param address - Address to validate
 * @returns True if valid Ethereum address
 */
export function isValidAddress(address: string | undefined): address is Address {
  if (!address) return false
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Contract addresses for all deployed contracts (V3 - Production-Ready)
 * 
 * V3 Features:
 * - UUPS Upgradeable Pattern
 * - Storage Packing (~40-60k gas saved)
 * - Flash Loan Protection
 * - Emergency Mode
 * - Auto-Compound (Individual Pool)
 * - Referral System (Individual Pool)
 * 
 * These addresses are loaded from environment variables and validated at runtime
 * Set them in .env.local for local development or in Vercel for production
 */
export const CONTRACT_ADDRESSES = {
  /**
   * WBTC Token (Wrapped Bitcoin)
   * ERC20 token used as collateral
   * NOTE: On Mezo testnet, BTC is native, not WBTC
   */
  WBTC: getEnvAddress(ENV_KEYS.WBTC, '0x0000000000000000000000000000000000000000'),

  /**
   * MUSD Token (Mezo USD Stablecoin)
   * Bitcoin-backed stablecoin from Mezo
   */
  MUSD: getEnvAddress(ENV_KEYS.MUSD, '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503'),

  /**
   * Mezo Integration Contract (V3)
   * Manages BTC deposits and MUSD minting
   * Implementation: 0x3E1B2f96ED2359B1F32620cBef161108b15712c3
   */
  MEZO_INTEGRATION: getEnvAddress(ENV_KEYS.MEZO_INTEGRATION, '0x0000000000000000000000000000000000000000'),

  /**
   * Yield Aggregator Contract (V3)
   * Routes deposits to yield strategies
   * Proxy: 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6
   */
  YIELD_AGGREGATOR: getEnvAddress(ENV_KEYS.YIELD_AGGREGATOR, '0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6'),

  /**
   * Individual Savings Pool (V3)
   * Personal savings with auto-yield optimization
   * ✅ Proxy (USE THIS): 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393
   * Features: Auto-compound, Referrals, Incremental deposits
   */
  INDIVIDUAL_POOL: getEnvAddress(ENV_KEYS.INDIVIDUAL_POOL, '0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393'),

  /**
   * Cooperative Savings Pool (V3)
   * Community pooled savings
   * Implementation: 0x59D0c53365A34D565BF53f9734d32Ca23e01106f
   */
  COOPERATIVE_POOL: getEnvAddress(ENV_KEYS.COOPERATIVE_POOL, '0x0000000000000000000000000000000000000000'),

  /**
   * Lottery Pool (Prize Savings)
   * No-loss lottery with Chainlink VRF
   * ⚠️ Not deployed yet
   */
  LOTTERY_POOL: getEnvAddress(ENV_KEYS.LOTTERY_POOL, '0x0000000000000000000000000000000000000000'),

  /**
   * Rotating Pool (ROSCA/Pasanaku)
   * Turn-based distribution system
   * ⚠️ Not deployed yet
   */
  ROTATING_POOL: getEnvAddress(ENV_KEYS.ROTATING_POOL, '0x0000000000000000000000000000000000000000'),
} as const

/**
 * Type for contract names
 */
export type ContractName = keyof typeof CONTRACT_ADDRESSES

/**
 * Type for contract addresses object
 */
export type ContractAddresses = typeof CONTRACT_ADDRESSES

/**
 * Zero address constant
 */
export const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000'

/**
 * Check if address is zero address
 * @param address - Address to check
 * @returns True if zero address
 */
export function isZeroAddress(address: string): boolean {
  return address.toLowerCase() === ZERO_ADDRESS.toLowerCase()
}

/**
 * Get contract address by name
 * @param contractName - Name of the contract
 * @returns Contract address
 */
export function getContractAddress(contractName: ContractName): ContractAddress {
  const address = CONTRACT_ADDRESSES[contractName]
  if (!address || isZeroAddress(address)) {
    throw new Error(
      `Contract address not configured for: ${contractName}. ` +
      `Please deploy contracts and update environment variables.`
    )
  }
  return address
}

/**
 * Validate all contract addresses are configured
 * @returns Object with validation results
 */
export function validateContractAddresses(): {
  valid: boolean
  missing: string[]
  invalid: string[]
} {
  const missing: string[] = []
  const invalid: string[] = []

  Object.entries(CONTRACT_ADDRESSES).forEach(([name, address]) => {
    if (!address || isZeroAddress(address)) {
      missing.push(name)
    } else if (!isValidAddress(address)) {
      invalid.push(name)
    }
  })

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
  }
}

/**
 * Get all pool addresses
 * @returns Array of pool contract addresses
 */
export function getPoolAddresses(): ContractAddress[] {
  return [
    CONTRACT_ADDRESSES.INDIVIDUAL_POOL,
    CONTRACT_ADDRESSES.COOPERATIVE_POOL,
    CONTRACT_ADDRESSES.LOTTERY_POOL,
    CONTRACT_ADDRESSES.ROTATING_POOL,
  ]
}

/**
 * Get all token addresses
 * @returns Array of token contract addresses
 */
export function getTokenAddresses(): ContractAddress[] {
  return [
    CONTRACT_ADDRESSES.WBTC,
    CONTRACT_ADDRESSES.MUSD,
  ]
}

/**
 * Get all integration addresses
 * @returns Array of integration contract addresses
 */
export function getIntegrationAddresses(): ContractAddress[] {
  return [
    CONTRACT_ADDRESSES.MEZO_INTEGRATION,
    CONTRACT_ADDRESSES.YIELD_AGGREGATOR,
  ]
}

/**
 * Format address for display (shortened)
 * @param address - Address to format
 * @param chars - Number of characters to show on each side
 * @returns Formatted address (e.g., "0x1234...5678")
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!isValidAddress(address)) return address
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Compare two addresses (case-insensitive)
 * @param address1 - First address
 * @param address2 - Second address
 * @returns True if addresses are equal
 */
export function addressesEqual(
  address1: string | undefined,
  address2: string | undefined
): boolean {
  if (!address1 || !address2) return false
  return address1.toLowerCase() === address2.toLowerCase()
}

/**
 * Development mode helper
 * Returns true if running in development and addresses are not configured
 */
export function isDevelopmentMode(): boolean {
  if (typeof process === 'undefined') return false
  return process.env.NODE_ENV === 'development'
}

/**
 * Get contract addresses summary for debugging
 * @returns Formatted string with all addresses
 */
export function getAddressesSummary(): string {
  const validation = validateContractAddresses()
  
  let summary = '=== Contract Addresses ===\n\n'
  
  Object.entries(CONTRACT_ADDRESSES).forEach(([name, address]) => {
    const status = isZeroAddress(address) ? '❌ NOT SET' : '✅'
    summary += `${status} ${name}: ${address}\n`
  })
  
  summary += '\n=== Validation ===\n'
  summary += `Valid: ${validation.valid ? '✅' : '❌'}\n`
  
  if (validation.missing.length > 0) {
    summary += `\nMissing: ${validation.missing.join(', ')}\n`
  }
  
  if (validation.invalid.length > 0) {
    summary += `\nInvalid: ${validation.invalid.join(', ')}\n`
  }
  
  return summary
}

/**
 * Log contract addresses to console (development only)
 */
export function logContractAddresses(): void {
  if (isDevelopmentMode()) {
    console.group('🏗️ KhipuVault Contract Addresses')
    console.log(getAddressesSummary())
    console.groupEnd()
  }
}

// Auto-log addresses in development mode
if (typeof window !== 'undefined' && isDevelopmentMode()) {
  logContractAddresses()
}