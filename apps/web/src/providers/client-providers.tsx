"use client";

import { ReactNode } from "react";

import { Toaster } from "@/components/ui/toaster";
import { NetworkSwitcher } from "@/components/web3/network-switcher";

import { Web3Provider, Web3ErrorBoundary } from "./web3-provider";

interface ClientProvidersProps {
  children: ReactNode;
  /** Initial Wagmi state from cookies for SSR hydration */
  initialState?: any;
}

/**
 * Client-only providers wrapper
 *
 * Simplified version - ONLY MetaMask
 *
 * Features:
 * - Pure Wagmi + MetaMask
 * - No Privy, no WalletConnect, no complexity
 * - Production-ready and scalable
 * - Fast and simple
 */
export function ClientProviders({ children, initialState }: ClientProvidersProps) {
  // Always use simple Web3Provider with ONLY MetaMask
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
