"use client";

/**
 * @fileoverview Simplified Web3Provider with Pure Wagmi
 * @module providers/web3-provider
 *
 * Production-ready Web3 provider for KhipuVault
 * Pure Wagmi + React Query, no RainbowKit, no WalletConnect
 *
 * Features:
 * - Mezo Testnet wallet connection
 * - MetaMask + Unisat wallet support
 * - Automatic wallet reconnection
 * - Transaction state management
 * - Network validation
 * - Error handling and recovery
 */

import { QueryClient, QueryClientProvider, QueryErrorResetBoundary } from "@tanstack/react-query";
import React, { ReactNode, Suspense, useEffect, useState } from "react";
import { WagmiProvider } from "wagmi";

import { captureError } from "@/lib/error-tracking";
import { getWagmiConfig } from "@/lib/web3/config";

/**
 * Create QueryClient with optimized settings for Web3 operations
 * Factory function ensures fresh client per component instance
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 1 minute
        staleTime: 60 * 1000,

        // Retry failed queries up to 3 times
        retry: 3,

        // Exponential backoff for retries
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Don't refetch on window focus (too aggressive for blockchain data)
        refetchOnWindowFocus: false,

        // Refetch on reconnect (network came back)
        refetchOnReconnect: true,

        // Keep data in cache for 5 minutes after component unmount
        gcTime: 5 * 60 * 1000,
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,

        // Longer retry delay for mutations (transactions)
        retryDelay: 3000,
      },
    },
  });
}

/**
 * Props for Web3Provider component
 */
interface Web3ProviderProps {
  /** Child components to wrap */
  children: ReactNode;

  /** Optional: Custom query client */
  customQueryClient?: QueryClient;

  /** Optional: Theme (ignored, kept for backward compatibility) */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  theme?: string;

  /** Optional: Initial state from cookies for SSR hydration */
  initialState?: Parameters<typeof WagmiProvider>[0]["initialState"];
}

/**
 * Web3Provider Component
 *
 * Provides Web3 context to the entire application
 * Wraps children with WagmiProvider and QueryClientProvider
 *
 * SSR-Compatible Pattern:
 * - Accepts initialState from parent (hydrated from cookies)
 * - No hydration check needed with cookieStorage
 * - Proper SSR/CSR consistency
 *
 * Provider order:
 * 1. WagmiProvider (outermost)
 * 2. QueryClientProvider (innermost)
 *
 * Usage:
 * ```tsx
 * <Web3Provider initialState={initialState}>
 *   <App />
 * </Web3Provider>
 * ```
 */
export function Web3Provider({
  children,
  customQueryClient,
  theme: _theme,
  initialState,
}: Web3ProviderProps) {
  // Get wagmi config
  const [config] = useState(() => getWagmiConfig());

  // Create QueryClient inside component for proper SSR/lifecycle management
  const [defaultQueryClient] = useState(() => createQueryClient());
  const finalQueryClient = customQueryClient ?? defaultQueryClient;

  // Log initialization on mount (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }
    // eslint-disable-next-line no-console
    console.log("🔌 Web3Provider Initialized | Network: Mezo Testnet (31611) | EIP-6963: ✓");
  }, []);

  // Render providers with config and initialState for SSR hydration
  // QueryErrorResetBoundary enables proper error recovery for React Query errors
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={finalQueryClient}>
        <QueryErrorResetBoundary>
          {({ reset }) => <QueryErrorHandler onReset={reset}>{children}</QueryErrorHandler>}
        </QueryErrorResetBoundary>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

/**
 * Internal component to handle query errors with reset capability
 */
function QueryErrorHandler({ children, onReset }: { children: ReactNode; onReset: () => void }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-lavanda" />
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        </div>
      }
    >
      <QueryErrorResetContext.Provider value={onReset}>{children}</QueryErrorResetContext.Provider>
    </Suspense>
  );
}

/**
 * Context to expose query reset function to error boundaries
 */
const QueryErrorResetContext = React.createContext<(() => void) | null>(null);

/**
 * Hook to get the query reset function
 * Use this in error boundaries to properly reset React Query state
 */
export function useQueryErrorReset() {
  return React.useContext(QueryErrorResetContext);
}

/**
 * Web3ErrorBoundary Component
 *
 * Catches and handles errors from Web3 components
 * Prevents entire app from crashing due to wallet/contract errors
 * Production-ready with user-friendly error messages
 */
interface Web3ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class Web3ErrorBoundary extends React.Component<Web3ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: Web3ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log errors in development only
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("❌ Web3 Error Caught by Boundary:", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }

    // Capture error for monitoring (Sentry when enabled)
    captureError(error, {
      tags: { boundary: "web3", component: "Web3ErrorBoundary" },
      extra: { componentStack: errorInfo.componentStack },
    });

    // Store error info for display
    this.setState({
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === "development";
      const errorMessage = this.state.error?.message ?? "Error desconocido";

      // Check error types
      const isWagmiError =
        errorMessage.includes("WagmiProvider") || errorMessage.includes("useConfig");

      // Multi-wallet conflicts from browser extensions - these are NOT app errors
      // We should NOT show a full-page error for these, just log and recover
      const isMultiWalletConflict =
        errorMessage.includes("Cannot redefine property: ethereum") ||
        errorMessage.includes("Cannot set property ethereum");

      // For multi-wallet conflicts, try to recover gracefully instead of showing error
      // EIP-6963 should work even when window.ethereum has conflicts
      if (isMultiWalletConflict) {
        // Log the error but render children - the app should still work with EIP-6963
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.warn(
            "⚠️ Multi-wallet conflict detected (window.ethereum). " +
              "App will use EIP-6963 for wallet detection. " +
              "This error comes from browser extensions, not the app."
          );
        }
        // Reset error state asynchronously to allow React to continue
        // This prevents showing the error UI for recoverable wallet conflicts
        setTimeout(() => {
          this.setState({ hasError: false, error: undefined, errorInfo: undefined });
        }, 0);
        // Render children - the app should still work with EIP-6963
        return this.props.children;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-2xl rounded-lg border border-destructive/20 bg-destructive/10 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-destructive/20">
                <span className="text-2xl">⚠️</span>
              </div>

              <div className="flex-1">
                <h2 className="mb-2 text-xl font-bold text-destructive">Error en Web3</h2>

                <p className="mb-4 text-foreground/80">{getErrorMessage(isWagmiError)}</p>

                <div className="mb-4 flex gap-3">
                  <button
                    onClick={this.handleReload}
                    className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Recargar Página
                  </button>

                  {isDev && (
                    <button
                      onClick={this.handleReset}
                      className="rounded-md bg-muted px-4 py-2 text-foreground transition-colors hover:bg-muted/80"
                    >
                      Intentar Recuperar
                    </button>
                  )}
                </div>

                {isDev && (
                  <details className="mt-4 text-sm">
                    <summary className="mb-2 cursor-pointer text-muted-foreground hover:text-foreground">
                      Detalles técnicos (solo en desarrollo)
                    </summary>
                    <div className="overflow-auto rounded border border-border bg-background/50 p-4">
                      <div className="mb-3">
                        <strong className="text-destructive">Error:</strong>
                        <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-xs">
                          {errorMessage}
                        </pre>
                      </div>

                      {this.state.error?.stack && (
                        <div className="mb-3">
                          <strong className="text-destructive">Stack:</strong>
                          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-xs">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}

                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <strong className="text-destructive">Component Stack:</strong>
                          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-xs">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function getErrorMessage(isWagmiError: boolean): React.ReactNode {
  if (isWagmiError) {
    return (
      <>
        Ocurrió un error en la configuración de wallet. El componente está intentando usar hooks de
        Wagmi fuera del contexto del provider.
      </>
    );
  }
  return (
    <>
      Ocurrió un error inesperado. Por favor recarga la página para intentar nuevamente. Si el
      problema persiste, contacta a soporte.
    </>
  );
}
