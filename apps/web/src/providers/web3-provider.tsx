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
/**
 * Detect if there's a wallet extension conflict
 * Some wallets define window.ethereum as a getter-only property
 */
function detectWalletConflict(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    // Check if ethereum is defined as getter-only (causes MetaMask SDK to fail)
    const descriptor = Object.getOwnPropertyDescriptor(window, "ethereum");
    if (descriptor?.get && !descriptor.set && !descriptor.writable) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function Web3Provider({
  children,
  customQueryClient,
  theme: _theme,
  initialState,
}: Web3ProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [walletConflict, setWalletConflict] = useState(false);

  // Check for wallet conflicts on mount
  useEffect(() => {
    setMounted(true);
    if (detectWalletConflict()) {
      setWalletConflict(true);
    }
  }, []);

  // Get wagmi config - only after checking for conflicts
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
    console.log("🔌 Web3Provider Initialized | Network: Mezo | EIP-6963: ✓");
  }, []);

  // Render providers with config and initialState for SSR hydration
  // QueryErrorResetBoundary enables proper error recovery for React Query errors
  // Show wallet conflict warning banner if detected, but keep providers working
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={finalQueryClient}>
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <QueryErrorHandler onReset={reset}>
              {mounted && walletConflict && (
                <WalletConflictWarning onRetry={() => window.location.reload()} />
              )}
              {children}
            </QueryErrorHandler>
          )}
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
 * WalletConflictWarning Component
 *
 * Shows a non-blocking warning banner when wallet conflicts are detected
 * App continues to work, just wallet connection may not work
 */
function WalletConflictWarning({ onRetry }: { onRetry: () => void }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: "0.75rem 1rem",
        backgroundColor: "rgba(234, 179, 8, 0.95)",
        color: "#1a1a1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        flexWrap: "wrap",
        fontSize: "0.875rem",
      }}
    >
      <span>
        <strong>Conflicto de Wallets:</strong> Desactiva otras wallets excepto MetaMask.
      </span>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={onRetry}
          style={{
            padding: "0.375rem 0.75rem",
            borderRadius: "0.25rem",
            backgroundColor: "#1a1a1a",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "0.75rem",
            fontWeight: 500,
          }}
        >
          Recargar
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            padding: "0.375rem 0.75rem",
            borderRadius: "0.25rem",
            backgroundColor: "transparent",
            color: "#1a1a1a",
            border: "1px solid #1a1a1a",
            cursor: "pointer",
            fontSize: "0.75rem",
            fontWeight: 500,
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
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
    void captureError(error, {
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

      const isWalletConflict =
        errorMessage.includes("React.Children.only") ||
        errorMessage.includes("ethereum") ||
        errorMessage.includes("Cannot redefine property") ||
        errorMessage.includes("Cannot set property");

      // Use inline styles to avoid any component-related issues
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backgroundColor: "var(--background, #0a0a0f)",
            color: "var(--foreground, #ffffff)",
          }}
        >
          <div
            style={{
              maxWidth: "28rem",
              width: "100%",
              padding: "2rem",
              borderRadius: "0.75rem",
              backgroundColor: "var(--card, #131320)",
              border: "1px solid var(--border, #2a2a3c)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "4rem",
                height: "4rem",
                margin: "0 auto 1.5rem",
                borderRadius: "50%",
                backgroundColor: "rgba(139, 92, 246, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
              }}
            >
              🔌
            </div>

            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
              {isWalletConflict ? "Conflicto de Wallets" : "Error de Conexión"}
            </h2>

            <p
              style={{
                color: "var(--muted-foreground, #a1a1aa)",
                marginBottom: "1.5rem",
                fontSize: "0.875rem",
                lineHeight: "1.5",
              }}
            >
              {isWalletConflict
                ? "Detectamos un conflicto entre extensiones de wallet. Esto es común con múltiples wallets instaladas."
                : "Ocurrió un error inesperado. Recarga la página."}
            </p>

            <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
              <button
                onClick={this.handleReload}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "var(--primary, #8b5cf6)",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "0.875rem",
                }}
              >
                Recargar Página
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "transparent",
                  color: "var(--foreground, #ffffff)",
                  border: "1px solid var(--border, #2a2a3c)",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "0.875rem",
                }}
              >
                Intentar Nuevamente
              </button>
            </div>

            {isWalletConflict && (
              <p
                style={{
                  marginTop: "1rem",
                  fontSize: "0.75rem",
                  color: "var(--muted-foreground, #a1a1aa)",
                }}
              >
                Tip: Desactiva temporalmente otras extensiones de wallet excepto MetaMask.
              </p>
            )}

            {isDev && (
              <details style={{ marginTop: "1.5rem", textAlign: "left" }}>
                <summary
                  style={{
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    color: "var(--muted-foreground, #a1a1aa)",
                  }}
                >
                  Detalles técnicos
                </summary>
                <pre
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "rgba(0,0,0,0.3)",
                    fontSize: "0.625rem",
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                    color: "var(--muted-foreground, #a1a1aa)",
                  }}
                >
                  {errorMessage}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
