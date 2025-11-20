/**
 * @fileoverview Chain configurations for KhipuVault
 * @module lib/web3/chains
 * 
 * Production-ready chain definitions for Mezo Testnet
 * Following viem Chain interface standards
 */

import { Chain } from 'viem'

/**
 * Mezo Testnet Chain Configuration
 * 
 * Official Mezo testnet for Bitcoin-backed DeFi applications
 * Chain ID: 31611
 * 
 * @see https://docs.mezo.org/developers/network-details
 */
export const mezoTestnet = {
  id: 31611,
  name: 'Mezo Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Bitcoin',
    symbol: 'BTC',
  },
  rpcUrls: {
    default: { 
      http: ['https://rpc.test.mezo.org'],
      webSocket: ['wss://rpc.test.mezo.org'],
    },
    public: { 
      http: ['https://rpc.test.mezo.org'],
      webSocket: ['wss://rpc.test.mezo.org'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'Mezo Explorer', 
      url: 'https://explorer.test.mezo.org',
      apiUrl: 'https://explorer.test.mezo.org/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 1,
    },
  },
  testnet: true,
} as const satisfies Chain

/**
 * Array of all supported chains
 * Used for wallet configuration
 */
export const supportedChains = [mezoTestnet] as const

/**
 * Type helper for supported chain IDs
 */
export type SupportedChainId = typeof mezoTestnet.id

/**
 * Chain configuration map for easy lookup
 */
export const chainConfig: Record<number, Chain> = {
  [mezoTestnet.id]: mezoTestnet,
} as const

/**
 * Get chain configuration by chain ID
 * @param chainId - The chain ID to lookup
 * @returns Chain configuration or undefined
 */
export function getChainConfig(chainId: number): Chain | undefined {
  return chainConfig[chainId]
}

/**
 * Validate if chain ID is supported
 * @param chainId - The chain ID to validate
 * @returns True if chain is supported
 */
export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return chainId in chainConfig
}

/**
 * Get block explorer URL for address
 * @param chainId - Chain ID
 * @param address - Address to view
 * @returns Explorer URL or null
 */
export function getExplorerAddressUrl(
  chainId: number,
  address: string
): string | null {
  const chain = getChainConfig(chainId)
  if (!chain?.blockExplorers?.default) return null
  return `${chain.blockExplorers.default.url}/address/${address}`
}

/**
 * Get block explorer URL for transaction
 * @param chainId - Chain ID
 * @param txHash - Transaction hash
 * @returns Explorer URL or null
 */
export function getExplorerTxUrl(
  chainId: number,
  txHash: string
): string | null {
  const chain = getChainConfig(chainId)
  if (!chain?.blockExplorers?.default) return null
  return `${chain.blockExplorers.default.url}/tx/${txHash}`
}

/**
 * Format chain name for display
 * @param chainId - Chain ID
 * @returns Formatted chain name
 */
export function getChainName(chainId: number): string {
  const chain = getChainConfig(chainId)
  return chain?.name ?? `Unknown Chain (${chainId})`
}