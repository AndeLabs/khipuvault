/**
 * @fileoverview Clean Wagmi Configuration with Pure EIP-6963
 * @module lib/web3/config
 *
 * PRODUCTION-READY: Pure EIP-6963 Multi-Wallet Discovery
 *
 * Key Features:
 * ✅ Pure EIP-6963 implementation (no MetaMask SDK bloat)
 * ✅ Works with Yoroi, OKX, MetaMask, and all EIP-6963 wallets
 * ✅ No window.ethereum conflicts
 * ✅ Mezo Testnet configured
 * ✅ SSR-compatible
 *
 * How It Works:
 * - injected() connector with multiInjectedProviderDiscovery: true
 * - EIP-6963 uses browser events (eip6963:announceProvider)
 * - No dependency on window.ethereum
 * - Detects all installed wallets automatically
 *
 * References:
 * - https://wagmi.sh/react/api/connectors/injected
 * - https://wagmi.sh/react/api/createConfig#multiinjectedproviderdiscovery
 * - https://eips.ethereum.org/EIPS/eip-6963
 */

import { createPublicClient } from "viem";
import { createConfig, http, createStorage } from "wagmi";
import { injected } from "wagmi/connectors";

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
   * EIP-6963 CONFIGURATION FOR METAMASK
   *
   * Uses the EIP-6963 standard to detect MetaMask via browser events.
   * This works even when Yoroi/Rabby block window.ethereum.
   *
   * How it works:
   * 1. MetaMask emits 'eip6963:announceProvider' event on page load
   * 2. Wagmi listens for this event with multiInjectedProviderDiscovery: true
   * 3. We filter connectors to show ONLY MetaMask in the UI
   *
   * Why this works:
   * - EIP-6963 doesn't use window.ethereum at all
   * - MetaMask announces itself via events even if blocked
   * - Modern, standard approach (supported by all major wallets)
   *
   * References:
   * - https://wagmi.sh/react/api/createConfig#multiinjectedproviderdiscovery
   * - https://eips.ethereum.org/EIPS/eip-6963
   * - https://docs.metamask.io/wallet/concepts/wallet-interoperability/
   */
  const connectors = [
    // Use basic injected connector - EIP-6963 will detect all wallets
    // shimDisconnect: false to prevent auto-reconnect issues
    injected({
      shimDisconnect: false,
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
    // CRITICAL: Enable EIP-6963 to detect MetaMask via events (works when window.ethereum is blocked)
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
