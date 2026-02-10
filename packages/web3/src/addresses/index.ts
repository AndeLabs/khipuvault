/**
 * @fileoverview Contract Address Management (Re-export from @khipu/shared)
 * @module web3/addresses
 *
 * This module re-exports addresses from @khipu/shared for backwards compatibility.
 * All new code should import directly from @khipu/shared.
 *
 * @deprecated Import from "@khipu/shared" instead
 */

// Re-export everything from the single source of truth
export {
  // Address maps
  TESTNET_ADDRESSES,
  MAINNET_ADDRESSES,
  TESTNET_POOLS,
  TESTNET_INFRASTRUCTURE,
  TESTNET_MEZO_PROTOCOL,
  MAINNET_POOLS,
  MAINNET_INFRASTRUCTURE,
  MAINNET_MEZO_PROTOCOL,
  // Types
  type ContractName,
  type TestnetContractName,
  type MainnetContractName,
  // Functions
  getAddresses,
  getAddress,
  getAddressOrUndefined,
  isAddressConfigured,
  isZeroAddress,
  addressesEqual,
  getPoolAddresses,
  getConfiguredAddresses,
  getMissingAddresses,
  validateRequiredAddresses,
  getAddressesSummary,
  logAddresses,
  ZERO_ADDRESS,
} from "@khipu/shared";

// Re-export network utilities from shared
export { getCurrentNetwork, type Network } from "@khipu/shared";

// Re-export address utilities from shared/utils
export { formatAddress, isValidAddress } from "@khipu/shared";

// Legacy aliases for backwards compatibility
import { getAddresses, isAddressConfigured, getAddress } from "@khipu/shared";
import type { ContractName, Network } from "@khipu/shared";

/**
 * @deprecated Use getAddress() from @khipu/shared instead
 */
export function getContractAddress(network: Network, contractName: ContractName): string {
  return getAddress(contractName, network);
}

/**
 * @deprecated Use getAddress() from @khipu/shared instead
 */
export function getActiveContractAddress(contractName: ContractName): string {
  return getAddress(contractName);
}

/**
 * @deprecated Use getAddresses() from @khipu/shared instead
 */
export function getNetworkAddresses(network: Network) {
  return getAddresses(network);
}

/**
 * @deprecated Use getAddresses() from @khipu/shared instead
 */
export function getActiveAddresses() {
  return getAddresses();
}

/**
 * @deprecated Use isAddressConfigured() from @khipu/shared instead
 */
export function isDeployed(address: string): boolean {
  return address !== "" && address !== "0x0000000000000000000000000000000000000000";
}

/**
 * @deprecated Use isAddressConfigured() from @khipu/shared instead
 */
export function isContractDeployed(contractName: ContractName): boolean {
  return isAddressConfigured(contractName);
}

/**
 * @deprecated Use getConfiguredAddresses() from @khipu/shared instead
 */
export function getDeployedAddresses(): Record<string, string> {
  const addresses = getAddresses();
  const deployed: Record<string, string> = {};

  for (const [key, address] of Object.entries(addresses)) {
    if (isDeployed(address)) {
      deployed[key] = address;
    }
  }

  return deployed;
}
