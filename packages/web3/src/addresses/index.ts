import { TESTNET_ADDRESSES } from "./testnet";
import { MAINNET_ADDRESSES } from "./mainnet";

export { TESTNET_ADDRESSES, MAINNET_ADDRESSES };

export type Network = "testnet" | "mainnet";
export type ContractName = keyof typeof TESTNET_ADDRESSES;

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
 * Get all addresses for a network
 */
export function getNetworkAddresses(network: Network) {
  return network === "testnet" ? TESTNET_ADDRESSES : MAINNET_ADDRESSES;
}

/**
 * Check if address is deployed
 */
export function isDeployed(address: string): boolean {
  return (
    address !== "" && address !== "0x0000000000000000000000000000000000000000"
  );
}
