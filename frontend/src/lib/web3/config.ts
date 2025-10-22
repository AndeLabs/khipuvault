/**
 * @fileoverview Wagmi and RainbowKit configuration for KhipuVault
 * @module lib/web3/config
 * 
 * Production-ready Web3 configuration with Mezo Passport integration
 * Implements best practices for wallet connection and state management
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { mezoTestnet } from './chains'

/**
 * Environment variables validation
 * Ensures required configuration is present
 */
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!WALLETCONNECT_PROJECT_ID) {
  console.warn(
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. ' +
    'Get your project ID at https://cloud.walletconnect.com'
  )
}

/**
 * Wagmi configuration with RainbowKit defaults
 * 
 * This configuration includes:
 * - Mezo Testnet as the primary chain
 * - WalletConnect integration
 * - Optimized for production with SSR support
 * - Connection persistence across page reloads
 * 
 * @see https://www.rainbowkit.com/docs/installation
 */
export const wagmiConfig = getDefaultConfig({
  appName: 'KhipuVault',
  projectId: WALLETCONNECT_PROJECT_ID || 'khipuvault-default',
  chains: [mezoTestnet],
  transports: {
    [mezoTestnet.id]: http('https://rpc.test.mezo.org', {
      batch: {
        batchSize: 1024,
        wait: 16,
      },
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30_000,
    }),
  },
  ssr: true,
  multiInjectedProviderDiscovery: true,
})

/**
 * App metadata for wallet connection
 * Displayed in wallet connection modals
 */
export const appMetadata = {
  name: 'KhipuVault',
  description: 'Ahorro Bitcoin para Latinoamérica con MUSD de Mezo',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://khipuvault.app',
  icons: [
    typeof window !== 'undefined' 
      ? `${window.location.origin}/logo.png` 
      : 'https://khipuvault.app/logo.png'
  ],
} as const

/**
 * RainbowKit theme configuration
 * Matches KhipuVault brand colors
 */
export const rainbowKitTheme = {
  accentColor: '#0EA5E9', // Sky blue - primary brand color
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
} as const

/**
 * Connection options
 * Configure wallet connection behavior
 */
export const connectionConfig = {
  // Auto-connect if previously connected
  autoConnect: true,
  
  // Show recent transactions in wallet modal
  showRecentTransactions: true,
  
  // Cool mode for fun animations (can be disabled for performance)
  coolMode: false,
} as const

/**
 * Network validation helper
 * Ensures user is on correct network
 */
export function isCorrectNetwork(chainId: number | undefined): boolean {
  return chainId === mezoTestnet.id
}

/**
 * Get network name for error messages
 */
export function getRequiredNetworkName(): string {
  return mezoTestnet.name
}

/**
 * Format network mismatch error message
 */
export function getNetworkMismatchMessage(currentChainId?: number): string {
  if (!currentChainId) {
    return `Please connect to ${mezoTestnet.name}`
  }
  return `Please switch to ${mezoTestnet.name} (Chain ID: ${mezoTestnet.id}). You are currently on Chain ID: ${currentChainId}`
}