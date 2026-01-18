/**
 * @fileoverview Privy Web3 Provider for KhipuVault
 * @module providers/privy-provider
 *
 * Production-ready Web3 provider with:
 * - Privy authentication (email, social, passkeys)
 * - Embedded wallets for mobile users
 * - External wallet support (MetaMask, etc.)
 * - Wagmi integration for contract interactions
 * - React Query for data fetching
 *
 * This replaces the basic Web3Provider with a more
 * mobile-friendly and user-friendly solution.
 */

"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode, useEffect, useState } from "react";
import { createConfig, http } from "wagmi";

import { PRIVY_APP_ID, privyConfig, isPrivyConfigured } from "@/lib/privy/config";
import { mezoTestnet } from "@/lib/web3/chains";

/**
 * Wagmi configuration for use with Privy
 *
 * Note: When using Privy, connectors are managed by Privy
 * We only need to configure chains and transports
 */
const wagmiConfig = createConfig({
  chains: [mezoTestnet],
  transports: {
    [mezoTestnet.id]: http("https://rpc.test.mezo.org", {
      batch: { wait: 100 },
      retryCount: 5,
      retryDelay: 1000,
      timeout: 10_000,
    }),
  },
  ssr: true,
});

/**
 * Create QueryClient with optimized settings for Web3 operations
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        gcTime: 5 * 60 * 1000, // 5 minutes
      },
      mutations: {
        retry: 1,
        retryDelay: 3000,
      },
    },
  });
}

interface PrivyWeb3ProviderProps {
  children: ReactNode;
}

/**
 * Privy Web3 Provider Component
 *
 * Wraps the application with:
 * 1. PrivyProvider - Authentication & wallet management
 * 2. QueryClientProvider - React Query for data fetching
 * 3. WagmiProvider - Blockchain interactions
 *
 * Provider order is important:
 * PrivyProvider > QueryClientProvider > WagmiProvider
 */
export function PrivyWeb3Provider({ children }: PrivyWeb3ProviderProps) {
  // Create QueryClient inside component for proper SSR/lifecycle management
  const [queryClient] = useState(() => createQueryClient());

  // Log initialization only in development
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    if (isPrivyConfigured()) {
      // eslint-disable-next-line no-console
      console.log(
        "🔐 Privy Web3 Provider Initialized | Network: Mezo Testnet (31611) | Auth: Email, Social, Passkeys, Wallets"
      );
    }
  }, []);

  // If Privy is not configured, show a warning but still render children
  // This allows the app to work in development without Privy
  if (!isPrivyConfigured()) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen">
          {/* Warning banner for development */}
          {process.env.NODE_ENV === "development" && (
            <div className="border-b border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-center text-sm text-yellow-500">
              <strong>Privy not configured.</strong> Set{" "}
              <code className="rounded bg-yellow-500/20 px-1">NEXT_PUBLIC_PRIVY_APP_ID</code> in
              your .env.local file.{" "}
              <a
                href="https://dashboard.privy.io"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Get your App ID
              </a>
            </div>
          )}
          {children}
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

/**
 * Export wagmi config for use in other parts of the app
 */
export { wagmiConfig };

/**
 * Re-export Privy hooks for convenience
 */
export {
  usePrivy,
  useLogin,
  useLogout,
  useWallets,
  useFundWallet,
  useSendTransaction,
  useConnectWallet,
} from "@privy-io/react-auth";
