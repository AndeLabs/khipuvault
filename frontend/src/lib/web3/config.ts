/**
 * @fileoverview Pure Wagmi configuration for KhipuVault
 * @module lib/web3/config
 * 
 * Production-ready Web3 configuration with MetaMask + Unisat only
 * No WalletConnect, no RainbowKit, no external dependencies
 * Configured for Mezo Testnet with Bitcoin native currency
 */

import { createConfig, http } from 'wagmi'
import { metaMask } from 'wagmi/connectors'
import { mezoTestnet } from 'wagmi/chains'

/**
 * Mezo Testnet configuration
 * Bitcoin-backed DeFi network with native BTC currency
 */
const mezoTestnetConfig = {
  id: 31611,
  name: 'Mezo Testnet',
  nativeCurrency: {
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.mezo.org'],
    },
    public: {
      http: ['https://rpc.testnet.mezo.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mezo Explorer',
      url: 'https://explorer.testnet.mezo.org',
    },
  },
  testnet: true,
} as const

/**
 * Custom Unisat connector for Bitcoin wallet support
 * Uses window.unisat global object when available
 */
function unisatConnector() {
  return {
    id: 'unisat',
    name: 'Unisat',
    type: 'injected' as const,
    async connect() {
      if (typeof window === 'undefined' || !window.unisat) {
        throw new Error('Unisat wallet not found. Please install Unisat extension.')
      }
      
      try {
        const accounts = await window.unisat.requestAccounts()
        return { account: accounts[0] as `0x${string}` }
      } catch (error) {
        throw new Error('Failed to connect Unisat wallet')
      }
    },
    async disconnect() {
      if (window.unisat) {
        // Unisat doesn't have a disconnect method, but we can clean up state
        console.log('Unisat wallet disconnected')
      }
    },
    async getAccounts() {
      if (!window.unisat) return []
      try {
        const accounts = await window.unisat.requestAccounts()
        return accounts as `0x${string}`[]
      } catch {
        return []
      }
    },
    async getChainId() {
      // Unisat works with Bitcoin networks, return Mezo Testnet ID
      return 31611
    },
    async isAuthorized() {
      if (!window.unisat) return false
      try {
        const accounts = await window.unisat.requestAccounts()
        return accounts.length > 0
      } catch {
        return false
      }
    },
    onAccountsChanged(accounts: string[]) {
      console.log('Unisat accounts changed:', accounts)
    },
    onChainChanged(chainId: string | number) {
      console.log('Unisat chain changed:', chainId)
    },
    onDisconnect(error: Error) {
      console.log('Unisat disconnected:', error)
    },
  }
}

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
 */
export const wagmiConfig = createConfig({
  chains: [mezoTestnetConfig],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'KhipuVault',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://khipuvault.vercel.app',
      },
    }),
    unisatConnector(),
  ],
  transports: {
    [mezoTestnetConfig.id]: http(),
  },
  ssr: false, // Disable SSR for Web3
})

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
  return chainId === mezoTestnetConfig.id
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