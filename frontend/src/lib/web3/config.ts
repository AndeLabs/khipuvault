/**
 * @fileoverview Wagmi and RainbowKit configuration for KhipuVault with Mezo Passport
 * @module lib/web3/config
 * 
 * Production-ready Web3 configuration with Mezo Network support
 * Implements best practices for wallet connection and state management
 * Configured for Mezo Testnet with Bitcoin native currency
 * 
 * IMPORTANT: Uses Mezo Passport's getConfig for dual wallet support:
 * - Ethereum wallets (MetaMask, WalletConnect, etc.)
 * - Bitcoin wallets (Unisat, Xverse, Leather via custom connectors)
 * 
 * This is REQUIRED for Mezo Hackathon compliance.
 * 
 * NOTE: We only import getConfig from @mezo-org/passport (not components)
 * to avoid React context issues. RainbowKit handles the UI.
 */

// Import ONLY config functions and constants, NOT components to avoid React context issues
import { getConfig } from '@mezo-org/passport/dist/src/config'
import { mezoTestnet } from '@mezo-org/passport/dist/src/constants'

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
 * Wagmi configuration for Mezo Testnet with Mezo Passport
 * 
 * This configuration includes:
 * - Mezo Testnet as the primary chain (Bitcoin-backed DeFi)
 * - Mezo Passport integration for dual wallet support
 * - Ethereum wallets: MetaMask, WalletConnect, Rainbow, Coinbase
 * - Bitcoin wallets: Unisat, Xverse, Leather
 * - Bitcoin as native currency (18 decimals)
 * - Lazy loaded to avoid SSR issues
 * - Connection persistence across page reloads
 * 
 * @see https://docs.mezo.org/developers/passport
 */

// Lazy load config to avoid SSR issues with window object
let _wagmiConfig: ReturnType<typeof getConfig> | null = null

export function getWagmiConfig() {
  if (_wagmiConfig) return _wagmiConfig
  
  // Only create config in browser environment
  if (typeof window === 'undefined') {
    throw new Error('Wagmi config can only be accessed in browser')
  }
  
  _wagmiConfig = getConfig({
    appName: 'KhipuVault - Bitcoin Savings for Latin America',
    walletConnectProjectId: WALLETCONNECT_PROJECT_ID || 'khipuvault-default',
    mezoNetwork: 'testnet',
    appDescription: 'Ahorro Bitcoin para Latinoamérica con MUSD de Mezo',
    appUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
  })
  
  return _wagmiConfig
}

// Export a getter instead of the config directly for SSR safety
export const wagmiConfig = typeof window !== 'undefined' ? getWagmiConfig() : null as any



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
 * Environment Configuration
 * Warnings for missing required environment variables
 */
export function validateEnvironment(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []

  if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    warnings.push(
      'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. ' +
      'Get one at https://cloud.walletconnect.com'
    )
  }

  return {
    valid: warnings.length === 0,
    warnings,
  }
}
