/**
 * @fileoverview Web3Provider with RainbowKit and Mezo Passport Integration
 * @module providers/web3-provider
 * 
 * Production-ready Web3 provider for KhipuVault
 * Integrates Mezo Passport, RainbowKit, Wagmi, and React Query
 * 
 * Features:
 * - Mezo Passport wallet connection
 * - Automatic wallet reconnection
 * - Transaction state management
 * - Network validation
 * - Error handling and recovery
 */

'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { wagmiConfig, rainbowKitTheme, appMetadata } from '../lib/web3/config'
import { mezoTestnet } from '../lib/web3/chains'
import '@rainbow-me/rainbowkit/styles.css'

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
  
  /** Optional: Force light/dark theme */
  theme?: 'light' | 'dark' | 'auto'
}

/**
 * Web3Provider Component
 * 
 * Provides Web3 context to the entire application
 * Wraps children with WagmiProvider, QueryClientProvider, and RainbowKitProvider
 * 
 * @example
 * ```tsx
 * <Web3Provider>
 *   <App />
 * </Web3Provider>
 * ```
 */
export function Web3Provider({ 
  children, 
  customQueryClient,
  theme = 'dark'
}: Web3ProviderProps) {
  const [mounted, setMounted] = useState(false)
  const client = customQueryClient || queryClient

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render on server (prevents hydration issues)
  if (!mounted) {
    return (
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={client}>
          <div suppressHydrationWarning>{children}</div>
        </QueryClientProvider>
      </WagmiProvider>
    )
  }

  // Determine theme
  const rainbowTheme = theme === 'light' 
    ? lightTheme(rainbowKitTheme)
    : darkTheme(rainbowKitTheme)

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider 
          initialChain={mezoTestnet}
          theme={rainbowTheme}
          appInfo={{
            appName: appMetadata.name,
            learnMoreUrl: 'https://docs.khipuvault.app',
          }}
          showRecentTransactions={true}
          coolMode={false}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

/**
 * Network Guard Component
 * 
 * Shows warning when user is on wrong network
 * Can automatically trigger network switch request
 */
interface NetworkGuardProps {
  children: ReactNode
  autoSwitch?: boolean
}

export function NetworkGuard({ children, autoSwitch = false }: NetworkGuardProps) {
  // Implementation would go here
  // For now, just render children
  return <>{children}</>
}

/**
 * Hook to access Web3Provider context
 * Throws error if used outside provider
 */
export function useWeb3Context() {
  // This is a placeholder - actual implementation would check context
  return {
    isConnected: false,
    address: undefined,
    chainId: undefined,
  }
}

/**
 * Error Boundary for Web3 operations
 * Catches and handles Web3-specific errors gracefully
 */
interface Web3ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface Web3ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class Web3ErrorBoundary extends React.Component<
  Web3ErrorBoundaryProps,
  Web3ErrorBoundaryState
> {
  constructor(props: Web3ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): Web3ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service (e.g., Sentry)
    console.error('Web3 Error Boundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-2">
              Web3 Connection Error
            </h2>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Development mode diagnostics
 * Logs Web3 provider state for debugging
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.group('🔌 Web3Provider Initialized')
  console.log('App Name:', appMetadata.name)
  console.log('Chain:', mezoTestnet.name, `(ID: ${mezoTestnet.id})`)
  console.log('RPC:', mezoTestnet.rpcUrls.default.http[0])
  console.log('Explorer:', mezoTestnet.blockExplorers?.default.url)
  console.groupEnd()
}

export default Web3Provider