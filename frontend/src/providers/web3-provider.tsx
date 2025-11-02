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

'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/web3/config'

/**
 * Query client configuration
 * Optimized for Web3 operations with proper caching and retry logic
 */
const queryClient = new QueryClient({
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
})

/**
 * Props for Web3Provider component
 */
interface Web3ProviderProps {
  /** Child components to wrap */
  children: ReactNode
  
  /** Optional: Custom query client */
  customQueryClient?: QueryClient
}

/**
 * Web3Provider Component
 * 
 * Provides Web3 context to the entire application
 * Wraps children with WagmiProvider and QueryClientProvider
 * 
 * Provider order:
 * 1. WagmiProvider (outermost)
 * 2. QueryClientProvider (innermost)
 * 
 * Usage:
 * ```tsx
 * <Web3Provider>
 *   <App />
 * </Web3Provider>
 * ```
 */
export function Web3Provider({ 
  children, 
  customQueryClient,
}: Web3ProviderProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setIsMounted(true)
    
    // Log initialization
    console.log('🔌 Web3Provider Initialized')
    console.log('   Network: Mezo Testnet (Chain ID: 31611)')
    console.log('   Currency: BTC (native)')
    console.log('   Wallet Support: MetaMask + Unisat')
    console.log('   No WalletConnect Project ID required')
    
    return () => {
      console.log('🔌 Web3Provider Unmounted')
      setIsMounted(false)
    }
  }, [])

  const finalQueryClient = customQueryClient || queryClient

  // Show loading until mounted (prevents SSR hydration issues)
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Inicializando Web3...</p>
        </div>
      </div>
    )
  }

  // Render providers with config
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={finalQueryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

/**
 * Web3ErrorBoundary Component
 * 
 * Catches and handles errors from Web3 components
 * Prevents entire app from crashing due to wallet/contract errors
 * Production-ready with user-friendly error messages
 */
interface Web3ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class Web3ErrorBoundary extends React.Component<
  Web3ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: Web3ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Web3 Error Caught by Boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    })

    // Store error info for display
    this.setState({
      errorInfo,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development'
      const errorMessage = this.state.error?.message || 'Error desconocido'
      
      // Check if it's a Wagmi provider error
      const isWagmiError = errorMessage.includes('WagmiProvider') || 
                          errorMessage.includes('useConfig')

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-2xl w-full bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-bold text-destructive mb-2">
                  Error en Web3
                </h2>
                
                <p className="text-foreground/80 mb-4">
                  {isWagmiError ? (
                    <>
                      Ocurrió un error en la configuración de wallet. 
                      El componente está intentando usar hooks de Wagmi fuera del contexto del provider.
                    </>
                  ) : (
                    <>
                      Ocurrió un error en la conexión de wallet. 
                      Por favor recarga la página para intentar nuevamente.
                    </>
                  )}
                </p>

                <div className="flex gap-3 mb-4">
                  <button
                    onClick={this.handleReload}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Recargar Página
                  </button>
                  
                  {isDev && (
                    <button
                      onClick={this.handleReset}
                      className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
                    >
                      Intentar Recuperar
                    </button>
                  )}
                </div>

                {isDev && (
                  <details className="mt-4 text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground mb-2">
                      Detalles técnicos (solo en desarrollo)
                    </summary>
                    <div className="bg-background/50 border border-border rounded p-4 overflow-auto">
                      <div className="mb-3">
                        <strong className="text-destructive">Error:</strong>
                        <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                          {errorMessage}
                        </pre>
                      </div>
                      
                      {this.state.error?.stack && (
                        <div className="mb-3">
                          <strong className="text-destructive">Stack:</strong>
                          <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}

                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <strong className="text-destructive">Component Stack:</strong>
                          <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
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
      )
    }

    return this.props.children
  }
}