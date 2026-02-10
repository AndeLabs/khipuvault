/**
 * @fileoverview Centralized Contract Address Management
 * @module addresses
 *
 * This is the SINGLE SOURCE OF TRUTH for all contract addresses.
 * All packages should import addresses from here, not maintain local copies.
 *
 * Usage:
 * ```typescript
 * import { getAddresses, getAddress } from "@khipu/shared";
 *
 * // Get all addresses for current network
 * const addresses = getAddresses();
 *
 * // Get a specific address
 * const musd = getAddress("MUSD");
 *
 * // Check if address is configured
 * if (isAddressConfigured("INDIVIDUAL_POOL")) { ... }
 * ```
 */

import type { Address } from "viem";
import { getCurrentNetwork, type Network } from "../config/network";
import { TESTNET_ADDRESSES, type TestnetContractName } from "./testnet";
import { MAINNET_ADDRESSES, type MainnetContractName } from "./mainnet";

// Re-export for direct access when needed
export * from "./testnet";
export * from "./mainnet";

/**
 * Union of all contract names across networks
 */
export type ContractName = TestnetContractName | MainnetContractName;

/**
 * Address map type
 */
export type AddressMap = Record<ContractName, Address>;

/**
 * Zero address constant
 */
export const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000";

/**
 * Get all contract addresses for a specific network
 * @param network - Network to get addresses for (defaults to current network)
 */
export function getAddresses(network?: Network): AddressMap {
  const targetNetwork = network ?? getCurrentNetwork();
  return targetNetwork === "mainnet" ? MAINNET_ADDRESSES : TESTNET_ADDRESSES;
}

/**
 * Get a specific contract address
 * @param contractName - Name of the contract
 * @param network - Network to get address for (defaults to current network)
 * @throws Error if contract is not configured (zero address)
 */
export function getAddress(contractName: ContractName, network?: Network): Address {
  const addresses = getAddresses(network);
  const address = addresses[contractName];

  if (!address || address === ZERO_ADDRESS) {
    const targetNetwork = network ?? getCurrentNetwork();
    throw new Error(
      `Contract "${contractName}" not configured for ${targetNetwork}. ` +
        `Please deploy the contract and update addresses.`
    );
  }

  return address;
}

/**
 * Get a specific contract address, returning undefined if not configured
 * @param contractName - Name of the contract
 * @param network - Network to get address for (defaults to current network)
 */
export function getAddressOrUndefined(
  contractName: ContractName,
  network?: Network
): Address | undefined {
  const addresses = getAddresses(network);
  const address = addresses[contractName];
  return address === ZERO_ADDRESS ? undefined : address;
}

/**
 * Check if an address is configured (not zero address)
 */
export function isAddressConfigured(contractName: ContractName, network?: Network): boolean {
  const addresses = getAddresses(network);
  const address = addresses[contractName];
  return address !== undefined && address !== ZERO_ADDRESS;
}

/**
 * Check if address is zero address
 */
export function isZeroAddress(address: string): boolean {
  return address.toLowerCase() === ZERO_ADDRESS.toLowerCase();
}

// Note: isValidAddress and formatAddress are exported from ../utils
// Use those for validation and formatting

/**
 * Compare two addresses (case-insensitive)
 */
export function addressesEqual(
  address1: string | undefined,
  address2: string | undefined
): boolean {
  if (!address1 || !address2) return false;
  return address1.toLowerCase() === address2.toLowerCase();
}

/**
 * Get all pool addresses for current network
 */
export function getPoolAddresses(network?: Network): Address[] {
  const addresses = getAddresses(network);
  return [
    addresses.INDIVIDUAL_POOL,
    addresses.COOPERATIVE_POOL,
    addresses.LOTTERY_POOL,
    addresses.ROTATING_POOL,
  ].filter((addr) => addr !== ZERO_ADDRESS);
}

/**
 * Get all configured addresses (excluding zero addresses)
 */
export function getConfiguredAddresses(network?: Network): Partial<AddressMap> {
  const addresses = getAddresses(network);
  const configured: Partial<AddressMap> = {};

  for (const [name, address] of Object.entries(addresses)) {
    if (address !== ZERO_ADDRESS) {
      configured[name as ContractName] = address;
    }
  }

  return configured;
}

/**
 * Get list of missing (unconfigured) contract names
 */
export function getMissingAddresses(network?: Network): ContractName[] {
  const addresses = getAddresses(network);
  return Object.entries(addresses)
    .filter(([_, address]) => address === ZERO_ADDRESS)
    .map(([name]) => name as ContractName);
}

/**
 * Validate all required addresses are configured
 * @param requiredContracts - List of contract names that must be configured
 */
export function validateRequiredAddresses(
  requiredContracts: ContractName[],
  network?: Network
): { valid: boolean; missing: ContractName[] } {
  const missing = requiredContracts.filter((name) => !isAddressConfigured(name, network));
  return { valid: missing.length === 0, missing };
}

/**
 * Get address summary for debugging
 */
export function getAddressesSummary(network?: Network): string {
  const targetNetwork = network ?? getCurrentNetwork();
  const addresses = getAddresses(network);

  let summary = `=== ${targetNetwork.toUpperCase()} Contract Addresses ===\n\n`;

  for (const [name, address] of Object.entries(addresses)) {
    const status = address === ZERO_ADDRESS ? "[NOT SET]" : "[OK]";
    summary += `${status} ${name}: ${address}\n`;
  }

  const missing = getMissingAddresses(network);
  if (missing.length > 0) {
    summary += `\nMissing: ${missing.join(", ")}\n`;
  }

  return summary;
}

/**
 * Log addresses to console (development only)
 */
export function logAddresses(network?: Network): void {
  if (process.env.NODE_ENV !== "development") return;
  // eslint-disable-next-line no-console
  console.log(getAddressesSummary(network));
}
