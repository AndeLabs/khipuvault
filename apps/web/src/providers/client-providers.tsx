"use client";

import { ReactNode } from "react";

import { Toaster } from "@/components/ui/toaster";
import { NetworkSwitcher } from "@/components/web3/network-switcher";
import { isPrivyConfigured } from "@/lib/privy/config";

import { PrivyWeb3Provider } from "./privy-provider";
import { Web3Provider, Web3ErrorBoundary } from "./web3-provider";

interface ClientProvidersProps {
  children: ReactNode;
  /** Initial Wagmi state from cookies for SSR hydration */
  initialState?: any;
}

/**
 * Client-only providers wrapper
 *
 * Uses Privy provider when configured (NEXT_PUBLIC_PRIVY_APP_ID set)
 * Falls back to basic Web3Provider otherwise
 *
 * Privy provides:
 * - Email/Social/Passkey login
 * - Embedded wallets for mobile users
 * - Better mobile UX
 *
 * Basic Web3Provider provides:
 * - MetaMask connection only
 * - Development fallback
 */
export function ClientProviders({
  children,
  initialState,
}: ClientProvidersProps) {
  // Use Privy when configured, otherwise fall back to basic Web3Provider
  const usePrivy = isPrivyConfigured();

  if (usePrivy) {
    return (
      <Web3ErrorBoundary>
        <PrivyWeb3Provider>
          <NetworkSwitcher />
          {children}
          <Toaster />
        </PrivyWeb3Provider>
      </Web3ErrorBoundary>
    );
  }

  // Fallback to basic Web3Provider for development without Privy
  return (
    <Web3ErrorBoundary>
      <Web3Provider theme="dark" initialState={initialState}>
        <NetworkSwitcher />
        {children}
        <Toaster />
      </Web3Provider>
    </Web3ErrorBoundary>
  );
}
