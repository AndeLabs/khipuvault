"use client";

import { ReactNode, useEffect, useState, Suspense } from "react";

import { Toaster } from "@/components/ui/toaster";
import { NetworkSwitcher } from "@/components/web3/network-switcher";

import { Web3Provider, Web3ErrorBoundary } from "./web3-provider";

interface ClientProvidersProps {
  children: ReactNode;
  /** Initial Wagmi state from cookies for SSR hydration */
  initialState?: any;
}

/**
 * Loading skeleton that matches the app layout
 */
function LoadingSkeleton() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--background, #0a0a0f)",
        color: "var(--foreground, #ffffff)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "3rem",
            height: "3rem",
            margin: "0 auto 1rem",
            border: "3px solid rgba(139, 92, 246, 0.3)",
            borderTopColor: "var(--primary, #8b5cf6)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ color: "var(--muted-foreground, #a1a1aa)", fontSize: "0.875rem" }}>
          Cargando...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

/**
 * Client-only providers wrapper
 *
 * Delayed Web3 initialization to avoid wallet extension conflicts.
 * Wallet extensions (MetaMask, Yoroi, Core, Rabby) fight over window.ethereum
 * during page load. This delay gives them time to settle.
 */
export function ClientProviders({ children, initialState }: ClientProvidersProps) {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Wait for wallet extensions to finish fighting over window.ethereum
    // The 150ms delay allows extensions to settle before we initialize Web3
    const timer = setTimeout(() => {
      try {
        setIsReady(true);
      } catch {
        setHasError(true);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  // Show loading skeleton while waiting for wallet extensions to settle
  if (!isReady && !hasError) {
    return <LoadingSkeleton />;
  }

  // If there was an error during initialization, show content without Web3
  if (hasError) {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        {children}
        <Toaster />
      </Suspense>
    );
  }

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
