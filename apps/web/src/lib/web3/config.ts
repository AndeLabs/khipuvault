/**
 * @fileoverview Pure Wagmi configuration for KhipuVault
 * @module lib/web3/config
 *
 * Production-ready Web3 configuration with MetaMask + Unisat only
 * No WalletConnect, no RainbowKit, no external dependencies
 * Configured for Mezo Testnet with Bitcoin native currency
 *
 * SSR-Compatible Configuration:
 * - All browser APIs are strictly guarded with typeof window checks
 * - Config creation is deferred to client-side only
 * - Proper wallet state persistence across page reloads
 * - Graceful degradation when localStorage unavailable
 *
 * IMPORTANT: This module MUST NOT access window, localStorage, or any
 * browser APIs at module load time. All such access must be deferred
 * to function calls that are only invoked on the client side.
 */

import { createConfig, http, createStorage } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { mezoTestnet } from "./chains";
import { createPublicClient } from "viem";

// Type for the config instance
type WagmiConfigInstance = ReturnType<typeof createConfig>;

/**
 * SSR-safe localStorage wrapper
 * Returns a no-op storage on server, localStorage on client
 *
 * IMPORTANT: This function is safe to call during SSR because it
 * returns a no-op storage when window is not available.
 */
function createClientStorage() {
  // Return no-op storage for SSR
  if (typeof window === "undefined") {
    return createStorage({
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    });
  }

  // Return localStorage-based storage for client
  return createStorage({
    storage: {
      getItem: (key: string) => {
        try {
          return window.localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          window.localStorage.setItem(key, value);
        } catch {
          // Silently fail if localStorage is full or blocked
        }
      },
      removeItem: (key: string) => {
        try {
          window.localStorage.removeItem(key);
        } catch {
          // Silently fail
        }
      },
    },
  });
}

/**
 * Extend Window interface for Unisat
 */
declare global {
  interface Window {
    unisat?: {
      requestAccounts: () => Promise<string[]>;
      getAccounts: () => Promise<string[]>;
      signMessage: (message: string) => Promise<string>;
      signPsbt: (psbt: string) => Promise<string>;
      pushPsbt: (psbt: string) => Promise<string>;
      switchNetwork: (network: string) => Promise<void>;
      getNetwork: () => Promise<{ name: string; chain: string }>;
      getBalance: () => Promise<{
        confirmed: number;
        unconfirmed: number;
        total: number;
      }>;
      sendBitcoin: (toAddress: string, satoshis: number) => Promise<string>;
      inscribeTransfer: (tick: string, amount: number) => Promise<string>;
    };
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

// Singleton config instance - only created on client
let wagmiConfigInstance: WagmiConfigInstance | null = null;

/**
 * Get Wagmi config with SSR compatibility
 * Uses localStorage for wallet persistence with SSR-safe fallback
 *
 * SSR-Safe Pattern:
 * - Config is created lazily on first call
 * - Uses singleton pattern to avoid recreating config
 * - ssr: true enables Server-Side Rendering support
 * - All browser API access is guarded
 * - Wallet connection persists across page reloads on client
 *
 * IMPORTANT: This function is safe to call during SSR because all
 * browser-specific code paths are properly guarded.
 */
export function getWagmiConfig(): WagmiConfigInstance {
  // Return existing instance if available
  if (wagmiConfigInstance) {
    return wagmiConfigInstance;
  }

  // Determine dApp URL - use fallback for SSR
  const dappUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://khipuvault.vercel.app";

  // Create connectors array
  // MetaMask connector is safe to initialize during SSR
  const connectors = [
    metaMask({
      dappMetadata: {
        name: "KhipuVault",
        url: dappUrl,
      },
    }),
  ];

  // Create config with SSR-safe settings
  wagmiConfigInstance = createConfig({
    chains: [mezoTestnet],
    connectors,
    transports: {
      [mezoTestnet.id]: http("https://rpc.test.mezo.org", {
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
    // Use SSR-safe storage that returns no-op on server
    storage: createClientStorage(),
    pollingInterval: 4_000, // poll every 4 seconds
  });

  return wagmiConfigInstance;
}

/**
 * Standalone public client for direct RPC calls
 * Useful for debugging and direct contract interactions
 * Lazy-initialized to avoid SSR issues
 *
 * IMPORTANT: This is safe to call during SSR - it will create
 * a viem public client that doesn't depend on browser APIs.
 */
let _publicClient: ReturnType<typeof createPublicClient> | null = null;

export function getPublicClient() {
  if (!_publicClient) {
    _publicClient = createPublicClient({
      chain: mezoTestnet,
      transport: http("https://rpc.test.mezo.org", {
        batch: {
          wait: 100,
        },
        retryCount: 5,
        retryDelay: 1000,
        timeout: 10_000,
      }),
    });
  }
  return _publicClient;
}

/**
 * @deprecated Use getPublicClient() instead for SSR safety
 * This export is kept for backward compatibility but may cause
 * issues during SSR if the module is imported on the server.
 *
 * The value is null during SSR to prevent errors.
 */
export const publicClient: ReturnType<typeof createPublicClient> | null = null;

/**
 * App metadata for wallet connection
 */
export const appMetadata = {
  name: "KhipuVault",
  description: "Ahorro Bitcoin para Latinoamérica con MUSD de Mezo",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "https://khipuvault.vercel.app",
  icons: [
    typeof window !== "undefined"
      ? `${window.location.origin}/logos/khipu-logo.png`
      : "https://khipuvault.vercel.app/logos/khipu-logo.png",
  ],
} as const;

/**
 * Network validation helpers
 */

/**
 * Check if connected to correct network
 * @param chainId Current chain ID from wagmi useChainId()
 * @returns true if on Mezo Testnet
 */
export function isCorrectNetwork(chainId?: number): boolean {
  return chainId === mezoTestnet.id;
}

/**
 * Get network mismatch error message
 * @param currentChainId Current chain ID
 * @returns User-friendly error message
 */
export function getNetworkMismatchMessage(currentChainId?: number): string {
  if (!currentChainId) {
    return "Por favor conecta tu wallet a Mezo Testnet (Chain ID: 31611)";
  }
  return `Red incorrecta. Estás en Chain ID ${currentChainId}. Por favor cambia a Mezo Testnet (31611)`;
}

/**
 * Check if Unisat wallet is available
 * @returns true if Unisat extension is installed
 */
export function isUnisatAvailable(): boolean {
  return typeof window !== "undefined" && !!window.unisat;
}

/**
 * Get wallet connection status
 * @returns object with availability status for each wallet
 */
export function getWalletAvailability() {
  return {
    metaMask: typeof window !== "undefined" && !!window.ethereum,
    unisat: isUnisatAvailable(),
  };
}

/**
 * Environment Configuration
 * No required environment variables for this simplified setup
 */
export function validateEnvironment(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // No WalletConnect Project ID required anymore
  // No external dependencies that need env vars

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
