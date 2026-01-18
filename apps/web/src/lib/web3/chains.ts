/**
 * @fileoverview Chain configurations for KhipuVault
 * @module lib/web3/chains
 *
 * Production-ready chain definitions for Mezo Testnet and Mainnet
 * Following viem Chain interface standards
 * Uses NEXT_PUBLIC_NETWORK env var to switch between networks
 */

import { defineChain } from "viem";

import { MEZO_TESTNET, MEZO_MAINNET, getCurrentNetwork } from "@khipu/shared";

// Chain type is inferred from defineChain
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Chain = ReturnType<typeof defineChain>;

/**
 * Mezo Testnet Chain Configuration
 *
 * Official Mezo testnet for Bitcoin-backed DeFi applications
 * Chain ID: 31611
 *
 * @see https://docs.mezo.org/developers/network-details
 */
export const mezoTestnet = {
  id: MEZO_TESTNET.id,
  name: MEZO_TESTNET.name,
  nativeCurrency: MEZO_TESTNET.nativeCurrency,
  rpcUrls: {
    default: {
      http: MEZO_TESTNET.rpcUrls.default.http,
      webSocket: ["wss://rpc.test.mezo.org"],
    },
    public: {
      http: MEZO_TESTNET.rpcUrls.public.http,
      webSocket: ["wss://rpc.test.mezo.org"],
    },
  },
  blockExplorers: {
    default: {
      name: MEZO_TESTNET.blockExplorers.default.name,
      url: MEZO_TESTNET.blockExplorers.default.url,
      apiUrl: "https://explorer.test.mezo.org/api",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 1,
    },
  },
  testnet: true,
} as const satisfies Chain;

/**
 * Mezo Mainnet Chain Configuration
 *
 * Official Mezo mainnet for Bitcoin-backed DeFi applications
 * Chain ID: 31612
 *
 * @see https://docs.mezo.org/developers/network-details
 */
export const mezoMainnet = {
  id: MEZO_MAINNET.id,
  name: MEZO_MAINNET.name,
  nativeCurrency: MEZO_MAINNET.nativeCurrency,
  rpcUrls: {
    default: {
      http: MEZO_MAINNET.rpcUrls.default.http,
      webSocket: ["wss://rpc.mezo.org"],
    },
    public: {
      http: MEZO_MAINNET.rpcUrls.public.http,
      webSocket: ["wss://rpc.mezo.org"],
    },
  },
  blockExplorers: {
    default: {
      name: MEZO_MAINNET.blockExplorers.default.name,
      url: MEZO_MAINNET.blockExplorers.default.url,
      apiUrl: "https://explorer.mezo.org/api",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 1,
    },
  },
  testnet: false,
} as const satisfies Chain;

/**
 * Array of all supported chains
 * Used for wallet configuration
 * Dynamically includes mainnet based on NEXT_PUBLIC_NETWORK env var
 */
export const supportedChains = [mezoTestnet, mezoMainnet] as const;

/**
 * Type helper for supported chain IDs
 */
export type SupportedChainId = typeof mezoTestnet.id | typeof mezoMainnet.id;

/**
 * Get active chain based on environment
 */
export function getActiveChain(): Chain {
  const network = getCurrentNetwork();
  return network === "mainnet" ? mezoMainnet : mezoTestnet;
}

/**
 * Chain configuration map for easy lookup
 */
export const chainConfig: Record<number, Chain> = {
  [mezoTestnet.id]: mezoTestnet,
  [mezoMainnet.id]: mezoMainnet,
} as const;

/**
 * Get chain configuration by chain ID
 * @param chainId - The chain ID to lookup
 * @returns Chain configuration or undefined
 */
export function getChainConfig(chainId: number): Chain | undefined {
  // eslint-disable-next-line security/detect-object-injection -- safe: chainId is number key
  return chainConfig[chainId];
}

/**
 * Validate if chain ID is supported
 * @param chainId - The chain ID to validate
 * @returns True if chain is supported
 */
export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return chainId in chainConfig;
}

/**
 * Get block explorer URL for address
 * @param chainId - Chain ID
 * @param address - Address to view
 * @returns Explorer URL or null
 */
export function getExplorerAddressUrl(chainId: number, address: string): string | null {
  const chain = getChainConfig(chainId);
  if (!chain?.blockExplorers?.default) {
    return null;
  }
  return `${chain.blockExplorers.default.url}/address/${address}`;
}

/**
 * Get block explorer URL for transaction
 * @param chainId - Chain ID
 * @param txHash - Transaction hash
 * @returns Explorer URL or null
 */
export function getExplorerTxUrl(chainId: number, txHash: string): string | null {
  const chain = getChainConfig(chainId);
  if (!chain?.blockExplorers?.default) {
    return null;
  }
  return `${chain.blockExplorers.default.url}/tx/${txHash}`;
}

/**
 * Format chain name for display
 * @param chainId - Chain ID
 * @returns Formatted chain name
 */
export function getChainName(chainId: number): string {
  const chain = getChainConfig(chainId);
  return chain?.name ?? `Unknown Chain (${chainId})`;
}
