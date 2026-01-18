"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

import { ErrorBoundary } from "@/components/error-boundary";
import { OnboardingModal } from "@/components/onboarding";

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
  initialState?: unknown;
}

/**
 * Client-side layout wrapper
 * Uses dynamic import with ssr:false to completely avoid SSR for Web3 providers
 * This prevents MetaMask SDK from trying to access localStorage during SSR
 *
 * Includes ErrorBoundary to catch and display errors gracefully
 */
export function ClientLayout({ children, initialState }: ClientLayoutProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to error reporting service in production
        if (process.env.NODE_ENV === "production") {
          // eslint-disable-next-line no-console
          console.error("Application Error:", error, errorInfo);
        }
      }}
    >
      <ClientProviders initialState={initialState}>
        {children}
        <OnboardingModal />
      </ClientProviders>
    </ErrorBoundary>
  );
}
