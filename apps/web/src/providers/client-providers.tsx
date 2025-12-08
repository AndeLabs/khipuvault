"use client";

import { ReactNode } from "react";
import { Web3Provider, Web3ErrorBoundary } from "./web3-provider";
import { NetworkSwitcher } from "@/components/web3/network-switcher";
import { Toaster } from "@/components/ui/toaster";

interface ClientProvidersProps {
  children: ReactNode;
  /** Initial Wagmi state from cookies for SSR hydration */
  initialState?: any;
}

/**
 * Client-only providers wrapper
 * Accepts initialState from parent Server Component for SSR hydration
 * This component ensures all client-side providers are only rendered on the client
 */
export function ClientProviders({
  children,
  initialState,
}: ClientProvidersProps) {
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
