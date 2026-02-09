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
  private retryCount = 0;
  private maxRetries = 2;
  private hasAttemptedReload = false;

  constructor(props: Web3ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorMessage = error.message || "";

    // Check if this is a recoverable wallet-related error
    const isWalletConflictError =
      errorMessage.includes("React.Children.only") ||
      errorMessage.includes("Cannot redefine property") ||
      errorMessage.includes("Cannot set property") ||
      errorMessage.includes("ethereum");

    // Log errors in development only
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("❌ Web3 Error Caught by Boundary:", {
        error: errorMessage,
        isWalletConflict: isWalletConflictError,
        retryCount: this.retryCount,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }

    // For wallet conflict errors, attempt auto-recovery
    if (isWalletConflictError && this.retryCount < this.maxRetries) {
      this.retryCount++;
      // eslint-disable-next-line no-console
      console.log(`🔄 Attempting auto-recovery (${this.retryCount}/${this.maxRetries})...`);

      // Small delay then retry
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
      }, 500 * this.retryCount);
      return;
    }

    // If we've exhausted retries and it's a wallet conflict, auto-reload once
    if (isWalletConflictError && !this.hasAttemptedReload && typeof window !== "undefined") {
      this.hasAttemptedReload = true;
      const hasReloadedKey = "khipu_wallet_error_reload";
      const hasReloaded = sessionStorage.getItem(hasReloadedKey);

      if (!hasReloaded) {
        // eslint-disable-next-line no-console
        console.log("🔄 Auto-reloading to recover from wallet conflict...");
        sessionStorage.setItem(hasReloadedKey, "true");
        setTimeout(() => window.location.reload(), 100);
        return;
      } else {
        // Clear the flag for next session
        sessionStorage.removeItem(hasReloadedKey);
      }
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

      const isWalletConflict =
        errorMessage.includes("React.Children.only") ||
        errorMessage.includes("ethereum") ||
        errorMessage.includes("Cannot redefine property") ||
        errorMessage.includes("Cannot set property");

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <span className="text-3xl">🔌</span>
              </div>

              <h2 className="mb-2 text-xl font-bold">
                {isWalletConflict ? "Conflicto de Wallets" : "Error de Conexión"}
              </h2>

              <p className="mb-6 text-sm text-muted-foreground">
                {getErrorMessage(isWagmiError, isWalletConflict)}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={this.handleReload}
                  className="w-full rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Recargar Página
                </button>

                <button
                  onClick={this.handleReset}
                  className="w-full rounded-md bg-muted px-4 py-3 font-medium text-foreground transition-colors hover:bg-muted/80"
                >
                  Intentar Nuevamente
                </button>
              </div>

              {isWalletConflict && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Tip: Si el problema persiste, intenta desactivar temporalmente otras extensiones
                  de wallet excepto MetaMask.
                </p>
              )}

              {isDev && (
                <details className="mt-6 text-left text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Detalles técnicos
                  </summary>
                  <div className="mt-2 overflow-auto rounded border border-border bg-background/50 p-3">
                    <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                      {errorMessage}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function getErrorMessage(isWagmiError: boolean, isWalletConflict: boolean): React.ReactNode {
  if (isWagmiError) {
    return "Error de configuración de wallet. Recarga la página para continuar.";
  }
  if (isWalletConflict) {
    return (
      <>
        Detectamos un conflicto entre extensiones de wallet en tu navegador. Esto es común cuando
        tienes múltiples wallets instaladas (MetaMask, Rabby, Core, etc.).
      </>
    );
  }
  return "Ocurrió un error inesperado. Recarga la página para intentar nuevamente.";
}
