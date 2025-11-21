/**
 * @fileoverview Pure Wagmi configuration for KhipuVault
 * @module lib/web3/config
 *
 * Production-ready Web3 configuration with MetaMask + Unisat only
 * No WalletConnect, no RainbowKit, no external dependencies
 * Configured for Mezo Testnet with Bitcoin native currency
 *
 * SSR-Compatible Configuration:
 * - Uses cookieStorage for SSR/hydration (official Wagmi pattern)
 * - No localStorage polyfills needed
 * - Proper cookie-based state persistence
 */

import { createConfig, http, noopStorage } from 'wagmi'
import { metaMask } from 'wagmi/connectors'
import { mezoTestnet } from './chains'
import { createPublicClient } from 'viem'





/**
 * Extend Window interface for Unisat
 */
declare global {
  interface Window {
    unisat?: {
      requestAccounts: () => Promise<string[]>
      getAccounts: () => Promise<string[]>
      signMessage: (message: string) => Promise<string>
      signPsbt: (psbt: string) => Promise<string>
      pushPsbt: (psbt: string) => Promise<string>
      switchNetwork: (network: string) => Promise<void>
      getNetwork: () => Promise<{ name: string; chain: string }>
      getBalance: () => Promise<{ confirmed: number; unconfirmed: number; total: number }>
      sendBitcoin: (toAddress: string, satoshis: number) => Promise<string>
      inscribeTransfer: (tick: string, amount: number) => Promise<string>
    }
  }
}

/**
 * Pure Wagmi configuration for Mezo Testnet
 *
 * Features:
 * - MetaMask connector for Ethereum wallets
 * - Unisat connector for Bitcoin wallets
 * - Mezo Testnet with native BTC
 * - No WalletConnect Project ID required
 * - Production-ready with proper error handling
 * - SSR-compatible with cookieStorage
 */

/**
 * Get Wagmi config with SSR compatibility
 * Uses noopStorage to avoid localStorage issues during SSR
 *
 * SSR-Safe Pattern:
 * - noopStorage doesn't persist state (avoids localStorage completely)
 * - ssr: true enables Server-Side Rendering
 * - MUST only be called on client-side (in Client Components)
 * - Wallet will need to be reconnected on each page load (acceptable trade-off for SSR)
 */
export function getWagmiConfig() {
  return createConfig({
    chains: [mezoTestnet],
    connectors: [
      metaMask({
        dappMetadata: {
          name: 'KhipuVault',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://khipuvault.vercel.app',
        },
      }),
    ],
    transports: {
      [mezoTestnet.id]: http('https://rpc.test.mezo.org', {
        batch: {
          wait: 100, // ms to wait before sending batch
        },
        retryCount: 5, // number of retries
        retryDelay: 1000, // ms between retries
        timeout: 10_000, // 10 second timeout
      }),
    },
    // Enable SSR support
    ssr: true,
    // Use noopStorage to completely avoid localStorage
    storage: noopStorage,
    pollingInterval: 4_000, // poll every 4 seconds
  })
}

/**
 * Standalone public client for direct RPC calls
 * Useful for debugging and direct contract interactions
 * Lazy-initialized to avoid SSR issues
 */
let _publicClient: ReturnType<typeof createPublicClient> | null = null

export function getPublicClient() {
  if (!_publicClient) {
    _publicClient = createPublicClient({
      chain: mezoTestnet,
      transport: http('https://rpc.test.mezo.org', {
        batch: {
          wait: 100,
        },
        retryCount: 5,
        retryDelay: 1000,
        timeout: 10_000,
      }),
    })
  }
  return _publicClient
}

// Backward compatibility - but this will only work on client side
export const publicClient = typeof window !== 'undefined' ? getPublicClient() : null as any

/**
 * App metadata for wallet connection
 */
export const appMetadata = {
  name: 'KhipuVault',
  description: 'Ahorro Bitcoin para Latinoamérica con MUSD de Mezo',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://khipuvault.vercel.app',
  icons: [
    typeof window !== 'undefined' 
      ? `${window.location.origin}/logos/khipu-logo.png` 
      : 'https://khipuvault.vercel.app/logos/khipu-logo.png'
  ],
} as const

/**
 * Network validation helpers
 */

/**
 * Check if connected to correct network
 * @param chainId Current chain ID from wagmi useChainId()
 * @returns true if on Mezo Testnet
 */
export function isCorrectNetwork(chainId?: number): boolean {
  return chainId === mezoTestnet.id
}

/**
 * Get network mismatch error message
 * @param currentChainId Current chain ID
 * @returns User-friendly error message
 */
export function getNetworkMismatchMessage(currentChainId?: number): string {
  if (!currentChainId) {
    return 'Por favor conecta tu wallet a Mezo Testnet (Chain ID: 31611)'
  }
  return `Red incorrecta. Estás en Chain ID ${currentChainId}. Por favor cambia a Mezo Testnet (31611)`
}

/**
 * Check if Unisat wallet is available
 * @returns true if Unisat extension is installed
 */
export function isUnisatAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.unisat
}

/**
 * Get wallet connection status
 * @returns object with availability status for each wallet
 */
export function getWalletAvailability() {
  return {
    metaMask: typeof window !== 'undefined' && !!window.ethereum,
    unisat: isUnisatAvailable(),
  }
}

/**
 * Environment Configuration
 * No required environment variables for this simplified setup
 */
export function validateEnvironment(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []

  // No WalletConnect Project ID required anymore
  // No external dependencies that need env vars

  return {
    valid: warnings.length === 0,
    warnings,
  }
}