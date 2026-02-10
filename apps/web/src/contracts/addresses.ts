/**
 * @fileoverview Smart Contract Address Configuration
 * @module contracts/addresses
 *
 * Re-exports addresses from @khipu/shared (single source of truth).
 * This file provides backwards compatibility for existing imports.
 *
 * @deprecated Import from "@khipu/shared" instead
 */

import type { Address } from "viem";
import {
  getAddresses,
  getAddress as sharedGetAddress,
  isAddressConfigured,
  ZERO_ADDRESS,
  formatAddress,
  addressesEqual,
  isValidAddress,
  type ContractName as SharedContractName,
} from "@khipu/shared";

// Get addresses from shared package
const addresses = getAddresses();

/**
 * Contract addresses for all deployed contracts (V3 - Production-Ready)
 *
 * Uses UPPER_CASE keys for backwards compatibility with existing code.
 * New code should import from "@khipu/shared" directly.
 */
export const CONTRACT_ADDRESSES = {
  WBTC: ZERO_ADDRESS as Address, // Not used on Mezo (BTC is native)
  MUSD: addresses.MUSD as Address,
  MEZO_INTEGRATION: addresses.MEZO_INTEGRATION as Address,
  YIELD_AGGREGATOR: addresses.YIELD_AGGREGATOR as Address,
  STABILITY_POOL_STRATEGY: ZERO_ADDRESS as Address, // Not deployed yet
  INDIVIDUAL_POOL: addresses.INDIVIDUAL_POOL as Address,
  COOPERATIVE_POOL: addresses.COOPERATIVE_POOL as Address,
  LOTTERY_POOL: addresses.LOTTERY_POOL as Address,
  ROTATING_POOL: addresses.ROTATING_POOL as Address,
} as const;

/**
 * Type for contract names
 */
export type ContractName = keyof typeof CONTRACT_ADDRESSES;

/**
 * Type for contract addresses object
 */
export type ContractAddresses = typeof CONTRACT_ADDRESSES;

/**
 * Zero address constant (re-exported from shared)
 */
export { ZERO_ADDRESS };

/**
 * Check if address is zero address
 * @param address - Address to check
 */
export function isZeroAddress(address: string): boolean {
  return address.toLowerCase() === (ZERO_ADDRESS as string).toLowerCase();
}

/**
 * Get contract address by name
 * @param contractName - Name of the contract
 */
export function getContractAddress(contractName: ContractName): Address {
  const address = CONTRACT_ADDRESSES[contractName];
  if (!address || isZeroAddress(address)) {
    throw new Error(
      `Contract address not configured for: ${contractName}. ` +
        `Please deploy contracts and update environment variables.`
    );
  }
  return address;
}

/**
 * Validate all contract addresses are configured
 */
export function validateContractAddresses(): {
  valid: boolean;
  missing: string[];
  invalid: string[];
} {
  const missing: string[] = [];
  const invalid: string[] = [];

  Object.entries(CONTRACT_ADDRESSES).forEach(([name, address]) => {
    if (!address || isZeroAddress(address)) {
      missing.push(name);
    } else if (!isValidAddress(address)) {
      invalid.push(name);
    }
  });

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
  };
}

/**
 * Get all pool addresses
 */
export function getPoolAddresses(): Address[] {
  return [
    CONTRACT_ADDRESSES.INDIVIDUAL_POOL,
    CONTRACT_ADDRESSES.COOPERATIVE_POOL,
    CONTRACT_ADDRESSES.LOTTERY_POOL,
    CONTRACT_ADDRESSES.ROTATING_POOL,
  ];
}

/**
 * Get all token addresses
 */
export function getTokenAddresses(): Address[] {
  return [CONTRACT_ADDRESSES.WBTC, CONTRACT_ADDRESSES.MUSD];
}

/**
 * Get all integration addresses
 */
export function getIntegrationAddresses(): Address[] {
  return [
    CONTRACT_ADDRESSES.MEZO_INTEGRATION,
    CONTRACT_ADDRESSES.YIELD_AGGREGATOR,
    CONTRACT_ADDRESSES.STABILITY_POOL_STRATEGY,
  ];
}

/**
 * Re-export utilities from shared
 */
export { formatAddress, addressesEqual, isValidAddress };

/**
 * Development mode helper
 */
export function isDevelopmentMode(): boolean {
  if (typeof process === "undefined") return false;
  return process.env.NODE_ENV === "development";
}

/**
 * Get contract addresses summary for debugging
 */
export function getAddressesSummary(): string {
  const validation = validateContractAddresses();

  let summary = "=== Contract Addresses ===\n\n";

  Object.entries(CONTRACT_ADDRESSES).forEach(([name, address]) => {
    const status = isZeroAddress(address) ? "[NOT SET]" : "[OK]";
    summary += `${status} ${name}: ${address}\n`;
  });

  summary += "\n=== Validation ===\n";
  summary += `Valid: ${validation.valid ? "[OK]" : "[FAIL]"}\n`;

  if (validation.missing.length > 0) {
    summary += `\nMissing: ${validation.missing.join(", ")}\n`;
  }

  if (validation.invalid.length > 0) {
    summary += `\nInvalid: ${validation.invalid.join(", ")}\n`;
  }

  return summary;
}

/**
 * Log contract addresses to console (development only)
 */
export function logContractAddresses(): void {
  if (isDevelopmentMode()) {
    // eslint-disable-next-line no-console
    console.group("KhipuVault Contract Addresses");
    // eslint-disable-next-line no-console
    console.log(getAddressesSummary());
    // eslint-disable-next-line no-console
    console.groupEnd();
  }
}
