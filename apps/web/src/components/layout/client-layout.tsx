"use client";

import dynamic from "next/dynamic";
import { ReactNode, useEffect } from "react";

import { ErrorBoundary } from "@/components/error-boundary";
import { NetworkGate } from "@/components/network-gate";
import { OnboardingModal } from "@/components/onboarding";
import { TestnetBanner } from "@/components/testnet-banner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Announcer } from "@/lib/accessibility/announcer";
import { captureError } from "@/lib/error-tracking";
import { analytics } from "@/lib/monitoring";

import type { State } from "wagmi";

// Dynamically import ClientProviders with ssr: false to avoid MetaMask SDK localStorage issues
const ClientProviders = dynamic(
  () =>
    import("@/providers/client-providers").then((mod) => ({
      default: mod.ClientProviders,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-lavanda" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    ),
  }
);

interface ClientLayoutProps {
  children: ReactNode;
  /** Initial Wagmi state from cookies for SSR hydration */
  initialState?: State;
}

/**
 * Client-side layout wrapper
 * Uses dynamic import with ssr:false to completely avoid SSR for Web3 providers
 * This prevents MetaMask SDK from trying to access localStorage during SSR
 *
 * Includes:
 * - ErrorBoundary for graceful error handling
 * - Announcer for screen reader accessibility
 * - Analytics initialization
 */
export function ClientLayout({ children, initialState }: ClientLayoutProps) {
  // Initialize analytics on mount
  useEffect(() => {
    analytics.init();
  }, []);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Capture error for tracking
        void captureError(error, {
          tags: { source: "error-boundary" },
          extra: { componentStack: errorInfo?.componentStack },
        });
      }}
    >
      <ClientProviders initialState={initialState}>
        <Announcer>
          <TooltipProvider delayDuration={300}>
            <NetworkGate>
              <TestnetBanner />
              {children}
              <OnboardingModal />
            </NetworkGate>
          </TooltipProvider>
        </Announcer>
      </ClientProviders>
    </ErrorBoundary>
  );
}
