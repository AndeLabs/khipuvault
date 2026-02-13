"use client";

import { ReactNode } from "react";

import { Toaster } from "@/components/ui/toaster";

import { Web3Provider, Web3ErrorBoundary } from "./web3-provider";

import type { State } from "wagmi";

interface ClientProvidersProps {
  children: ReactNode;
  /** Initial Wagmi state from cookies for SSR hydration */
  initialState?: State;
}

/**
 * Client-only providers wrapper
 *
 * Uses metaMask() connector which handles wallet detection properly.
 * No delays needed - MetaMask SDK handles EIP-6963 internally.
 *
 * Network switching is handled automatically within transaction hooks
 * using useSwitchChain - no intrusive banners needed.
 */
export function ClientProviders({ children, initialState }: ClientProvidersProps) {
  return (
    <Web3ErrorBoundary>
      <Web3Provider theme="dark" initialState={initialState}>
        {children}
        <Toaster />
      </Web3Provider>
    </Web3ErrorBoundary>
  );
}
