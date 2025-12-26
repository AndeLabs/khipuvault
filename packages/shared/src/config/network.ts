/**
 * @fileoverview Central Network Configuration
 * @module config/network
 *
 * Provides runtime network configuration based on environment variables
 * Allows easy switching between testnet and mainnet
 */

import { MEZO_TESTNET, MEZO_MAINNET } from "../constants/chains";

export type Network = "testnet" | "mainnet";

/**
 * Get current network from environment variable
 * Defaults to testnet for safety
 */
export function getCurrentNetwork(): Network {
  // Check both browser and Node.js environments
  const envNetwork =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_NETWORK || process.env.NETWORK
      : undefined;

  // Validate and default to testnet
  if (envNetwork === "mainnet") {
    return "mainnet";
  }

  return "testnet";
}

/**
 * Get active chain configuration based on current network
 */
export function getActiveChain() {
  const network = getCurrentNetwork();
  return network === "mainnet" ? MEZO_MAINNET : MEZO_TESTNET;
}

/**
 * Get chain ID for current network
 */
export function getChainId(): number {
  return getActiveChain().id;
}

/**
 * Get RPC URL for current network
 * Returns the first (primary) RPC URL
 */
export function getRpcUrl(): string {
  const chain = getActiveChain();
  return chain.rpcUrls.default.http[0];
}

/**
 * Get all RPC URLs for current network (for fallback)
 */
export function getAllRpcUrls(): readonly string[] {
  const chain = getActiveChain();
  return chain.rpcUrls.default.http;
}

/**
 * Get block explorer URL for current network
 */
export function getBlockExplorerUrl(): string {
  const chain = getActiveChain();
  return chain.blockExplorers.default.url;
}

/**
 * Get block explorer address URL
 */
export function getExplorerAddressUrl(address: string): string {
  return `${getBlockExplorerUrl()}/address/${address}`;
}

/**
 * Get block explorer transaction URL
 */
export function getExplorerTxUrl(txHash: string): string {
  return `${getBlockExplorerUrl()}/tx/${txHash}`;
}

/**
 * Check if currently on mainnet
 */
export function isMainnet(): boolean {
  return getCurrentNetwork() === "mainnet";
}

/**
 * Check if currently on testnet
 */
export function isTestnet(): boolean {
  return getCurrentNetwork() === "testnet";
}

/**
 * Get network name for display
 */
export function getNetworkName(): string {
  return getActiveChain().name;
}

/**
 * Network configuration summary
 */
export interface NetworkConfig {
  network: Network;
  chainId: number;
  chainName: string;
  rpcUrl: string;
  rpcUrls: readonly string[];
  explorerUrl: string;
  isMainnet: boolean;
  isTestnet: boolean;
}

/**
 * Get complete network configuration
 */
export function getNetworkConfig(): NetworkConfig {
  const network = getCurrentNetwork();
  const chain = getActiveChain();

  return {
    network,
    chainId: chain.id,
    chainName: chain.name,
    rpcUrl: chain.rpcUrls.default.http[0],
    rpcUrls: chain.rpcUrls.default.http,
    explorerUrl: chain.blockExplorers.default.url,
    isMainnet: network === "mainnet",
    isTestnet: network === "testnet",
  };
}
