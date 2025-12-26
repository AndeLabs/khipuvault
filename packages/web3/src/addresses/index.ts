/**
 * @fileoverview Contract Address Management
 * @module web3/addresses
 *
 * Dynamically exports contract addresses based on NEXT_PUBLIC_NETWORK
 * environment variable (testnet | mainnet)
 */

import { TESTNET_ADDRESSES } from "./testnet";
import { MAINNET_ADDRESSES } from "./mainnet";

export { TESTNET_ADDRESSES, MAINNET_ADDRESSES };

export type Network = "testnet" | "mainnet";
export type ContractName = keyof typeof TESTNET_ADDRESSES;

/**
 * Get current network from environment
 * Defaults to testnet for safety
 */
function getCurrentNetwork(): Network {
  const envNetwork =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_NETWORK || process.env.NETWORK
      : undefined;

  if (envNetwork === "mainnet") {
    return "mainnet";
  }

  return "testnet";
}

/**
 * Get contract address for specific network
 */
export function getContractAddress(
  network: Network,
  contractName: ContractName,
): string {
  const addresses =
    network === "testnet" ? TESTNET_ADDRESSES : MAINNET_ADDRESSES;
  return addresses[contractName];
}

/**
 * Get contract address for current active network (from env)
 */
export function getActiveContractAddress(contractName: ContractName): string {
  const network = getCurrentNetwork();
  return getContractAddress(network, contractName);
}

/**
 * Get all addresses for a specific network
 */
export function getNetworkAddresses(network: Network) {
  return network === "testnet" ? TESTNET_ADDRESSES : MAINNET_ADDRESSES;
}

/**
 * Get all addresses for current active network (from env)
 */
export function getActiveAddresses() {
  const network = getCurrentNetwork();
  return getNetworkAddresses(network);
}

/**
 * Check if address is deployed (not zero address or empty)
 */
export function isDeployed(address: string): boolean {
  return (
    address !== "" && address !== "0x0000000000000000000000000000000000000000"
  );
}

/**
 * Check if contract is deployed on current network
 */
export function isContractDeployed(contractName: ContractName): boolean {
  const address = getActiveContractAddress(contractName);
  return isDeployed(address);
}

/**
 * Get deployed addresses only for current network
 */
export function getDeployedAddresses(): Record<string, string> {
  const addresses = getActiveAddresses();
  const deployed: Record<string, string> = {};

  for (const [key, address] of Object.entries(addresses)) {
    if (isDeployed(address)) {
      deployed[key] = address;
    }
  }

  return deployed;
}
