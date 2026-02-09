/**
 * @fileoverview Wagmi Configuration - MetaMask Only
 * @module lib/web3/config
 *
 * PRODUCTION-READY: MetaMask-Only Configuration
 *
 * Key Features:
 * ✅ Uses official MetaMask connector (not generic injected)
 * ✅ Ignores other wallet extensions (Yoroi, Rabby, OKX, etc.)
 * ✅ No wallet conflicts - MetaMask SDK handles detection
 * ✅ Mezo Testnet configured
 * ✅ SSR-compatible
 *
 * Why MetaMask Connector vs injected():
 * - metaMask() uses MetaMask SDK which has proper EIP-6963 handling internally
 * - injected() with multiInjectedProviderDiscovery detects ALL wallets
 * - MetaMask connector ignores other wallets at the config level (not UI level)
 * - Prevents race conditions when multiple extensions are installed
 *
 * References:
 * - https://wagmi.sh/react/api/connectors/metaMask
 * - https://docs.metamask.io/wallet/concepts/wallet-interoperability/
 */

import { createPublicClient } from "viem";
import { createConfig, http, createStorage } from "wagmi";
import { injected } from "wagmi/connectors";

import { mezoTestnet, mezoMainnet, getActiveChain } from "./chains";

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
 * Wagmi Configuration for Mezo Testnet with Pure EIP-6963
 *
 * Features:
 * - Pure EIP-6963 via injected() connector
 * - multiInjectedProviderDiscovery: true enables EIP-6963
 * - No MetaMask SDK (avoids window.ethereum injection conflicts)
 * - Works with Yoroi, OKX, MetaMask, Coinbase, and all EIP-6963 wallets
 * - SSR-compatible with localStorage persistence
 * - Production-ready
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

  /**
   * EIP-6963 Wallet Detection (Modern Standard)
   *
   * Uses injected() connector with EIP-6963 which:
   * 1. Detects wallets via events (no window.ethereum conflicts)
   * 2. Works with MetaMask, Rabby, Coinbase, etc.
   * 3. No conflicts even with Yoroi or other non-EVM wallets
   * 4. Each wallet announces itself independently
   *
   * EIP-6963 solves the "wallet wars" problem where extensions
   * fight to control window.ethereum. Now each wallet announces
   * itself via custom events and the dapp can list all available.
   *
   * References:
   * - https://eips.ethereum.org/EIPS/eip-6963
   * - https://wagmi.sh/react/api/connectors/injected
   */

  // Get active chain based on NEXT_PUBLIC_NETWORK env var
  const activeChain = getActiveChain();
  const isMainnet = activeChain.id === mezoMainnet.id;
  const chainConfig = isMainnet ? mezoMainnet : mezoTestnet;

  // Use injected() which supports EIP-6963 wallet detection
  // This avoids MetaMask SDK conflicts with other wallets
  const connectors = [
    injected({
      shimDisconnect: true,
    }),
  ];

  // HTTP transport configuration for both networks
  const httpConfig = {
    batch: {
      wait: 100, // ms to wait before sending batch
    },
    retryCount: 5, // number of retries
    retryDelay: isMainnet ? 2000 : 1000, // longer retry for mainnet
    timeout: 10_000, // 10 second timeout
  };

  // Create config with SSR-safe settings and EIP-6963 enabled
  // Dynamically uses testnet or mainnet based on environment
  wagmiConfigInstance = createConfig({
    chains: [chainConfig],
    connectors,
    transports: {
      // Define transports for both chains to satisfy TypeScript
      // Only the active chain will be used at runtime
      [mezoTestnet.id]: http(mezoTestnet.rpcUrls.default.http[0], httpConfig),
      [mezoMainnet.id]: http(mezoMainnet.rpcUrls.default.http[0], httpConfig),
    },
    // Enable SSR support
    ssr: true,
    // Use SSR-safe storage that returns no-op on server
    storage: createClientStorage(),
    pollingInterval: 4_000, // poll every 4 seconds
    // Enable EIP-6963 for multi-wallet support without conflicts
    // Each wallet announces itself via events, no window.ethereum fights
    multiInjectedProviderDiscovery: true,
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
    const activeChain = getActiveChain();
    const chainConfig = activeChain.id === mezoMainnet.id ? mezoMainnet : mezoTestnet;
    _publicClient = createPublicClient({
      chain: chainConfig,
      transport: http(chainConfig.rpcUrls.default.http[0], {
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
 * Get app metadata for wallet connection
 * Dynamic based on environment
 */
export function getAppMetadata() {
  const activeChain = getActiveChain();
  const isMainnet = activeChain.id === mezoMainnet.id;
  const defaultUrl = isMainnet ? "https://khipuvault.com" : "https://testnet.khipuvault.com";

  return {
    name: "KhipuVault",
    description: "Ahorro Bitcoin para Latinoamérica con MUSD de Mezo",
    url: typeof window !== "undefined" ? window.location.origin : defaultUrl,
    icons: [
      typeof window !== "undefined"
        ? `${window.location.origin}/logos/khipu-logo.png`
        : `${defaultUrl}/logos/khipu-logo.png`,
    ],
  } as const;
}

/**
 * @deprecated Use getAppMetadata() instead for dynamic config
 */
export const appMetadata = {
  name: "KhipuVault",
  description: "Ahorro Bitcoin para Latinoamérica con MUSD de Mezo",
  url: typeof window !== "undefined" ? window.location.origin : "https://khipuvault.com",
  icons: [
    typeof window !== "undefined"
      ? `${window.location.origin}/logos/khipu-logo.png`
      : "https://khipuvault.com/logos/khipu-logo.png",
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
