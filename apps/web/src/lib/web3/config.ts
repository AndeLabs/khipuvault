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
import { metaMask } from "wagmi/connectors";

import { mezoTestnet } from "./chains";

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
   * MetaMask-Only Connector Configuration
   *
   * Uses the official Wagmi metaMask() connector which:
   * 1. Uses MetaMask SDK for proper wallet detection
   * 2. Handles EIP-6963 internally (we disable global discovery)
   * 3. Ignores other wallet extensions (Yoroi, Rabby, OKX)
   * 4. Works even when other extensions hijack window.ethereum
   *
   * Why metaMask() instead of injected():
   * - injected() detects ALL wallets, causing UI filtering race conditions
   * - metaMask() only detects MetaMask at the connector level
   * - No conflicts, no race conditions, no complex UI logic needed
   *
   * References:
   * - https://wagmi.sh/react/api/connectors/metaMask
   * - https://docs.metamask.io/wallet/how-to/connect/
   */
  const connectors = [
    metaMask({
      dappMetadata: {
        name: "KhipuVault",
        url:
          typeof window !== "undefined" ? window.location.origin : "https://khipuvault.vercel.app",
        iconUrl:
          typeof window !== "undefined"
            ? `${window.location.origin}/logos/khipu-logo.png`
            : "https://khipuvault.vercel.app/logos/khipu-logo.png",
      },
    }),
  ];

  // Create config with SSR-safe settings and EIP-6963 enabled
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
    // CRITICAL: Disable EIP-6963 global discovery to prevent other wallets from appearing
    // MetaMask connector handles its own detection via MetaMask SDK
    multiInjectedProviderDiscovery: false,
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
  url: typeof window !== "undefined" ? window.location.origin : "https://khipuvault.vercel.app",
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
