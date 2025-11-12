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
import {
  isMobile,
  isMetaMaskMobile,
  isInAppBrowser,
  waitForWallet,
  logDeviceInfo,
  getDeviceMessage
} from '@/lib/web3/mobile-utils'

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
  
  /** Optional: Theme (ignored, kept for backward compatibility) */
  theme?: string
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
  theme,
}: Web3ProviderProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [walletReady, setWalletReady] = useState(false)
  const [mobileError, setMobileError] = useState<string | null>(null)

  // Handle hydration and mobile wallet injection
  useEffect(() => {
    const initializeProvider = async () => {
      // Log device info for debugging
      logDeviceInfo()

      console.log('🔌 Web3Provider Initializing...')
      console.log('   Network: Mezo Testnet (Chain ID: 31611)')
      console.log('   Currency: BTC (native)')
      console.log('   Wallet Support: MetaMask + Unisat')
      console.log('   No WalletConnect Project ID required')
      console.log('   Device:', getDeviceMessage())

      // For mobile devices, wait for wallet injection
      if (isMobile() || isInAppBrowser()) {
        console.log('📱 Mobile/In-app browser detected, waiting for wallet injection...')

        // Give mobile browsers more time (3-5 seconds)
        const walletAvailable = await waitForWallet(5000)

        if (walletAvailable) {
          console.log('✅ Wallet injection detected on mobile')
          setWalletReady(true)
          setIsMounted(true)
        } else {
          console.warn('⚠️ Wallet not detected after 5 seconds on mobile')
          // Still mount but show warning
          setMobileError('No se detectó wallet después de 5 segundos')
          setWalletReady(false)
          setIsMounted(true)
        }
      } else {
        // Desktop - no waiting needed
        console.log('💻 Desktop browser detected')
        setWalletReady(true)
        setIsMounted(true)
      }
    }

    initializeProvider()

    return () => {
      console.log('🔌 Web3Provider Unmounted')
      setIsMounted(false)
      setWalletReady(false)
    }
  }, [])

  const finalQueryClient = customQueryClient || queryClient

  // Show loading until mounted (prevents SSR hydration issues)
  if (!isMounted) {
    const deviceMsg = typeof window !== 'undefined' ? getDeviceMessage() : '💻 Navegador desktop'
    const isMobileDevice = typeof window !== 'undefined' ? (isMobile() || isInAppBrowser()) : false

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground mb-2">Inicializando Web3...</p>
          <p className="text-xs text-muted-foreground/60">{deviceMsg}</p>
          {isMobileDevice && (
            <p className="text-xs text-yellow-500 mt-3">
              ⏳ Esperando a que MetaMask se active (esto puede tomar unos segundos en mobile)
            </p>
          )}
        </div>
      </div>
    )
  }

  // Show warning if mobile wallet not detected
  if (isMounted && mobileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="text-center">
            <span className="text-4xl mb-4 block">⚠️</span>
            <h3 className="text-lg font-semibold text-yellow-500 mb-2">
              Wallet No Detectada en Mobile
            </h3>
            <p className="text-sm text-foreground/80 mb-4">
              {mobileError}
            </p>
            <div className="text-left text-sm text-foreground/70 space-y-2 mb-4">
              <p className="font-semibold">💡 Sugerencias:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Asegúrate de estar usando MetaMask Mobile Browser</li>
                <li>Abre esta URL desde la app de MetaMask</li>
                <li>Verifica que tengas la última versión de MetaMask</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Reintentar
            </button>
          </div>
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
    // Log device info if on mobile
    if (typeof window !== 'undefined') {
      const deviceInfo = {
        isMobile: isMobile(),
        isMetaMaskMobile: isMetaMaskMobile(),
        isInAppBrowser: isInAppBrowser(),
      }

      console.error('❌ Web3 Error Caught by Boundary:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        deviceInfo,
      })
    } else {
      console.error('❌ Web3 Error Caught by Boundary:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      })
    }

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

      // Check device type
      const isMobileDevice = typeof window !== 'undefined' ? isMobile() : false
      const isInAppBrowserDevice = typeof window !== 'undefined' ? isInAppBrowser() : false
      const isMobileMetaMask = typeof window !== 'undefined' ? isMetaMaskMobile() : false

      // Check error types
      const isWagmiError = errorMessage.includes('WagmiProvider') ||
                          errorMessage.includes('useConfig')

      const isMultiWalletConflict = errorMessage.includes('Cannot redefine property: ethereum') ||
                                    errorMessage.includes('Cannot set property ethereum') ||
                                    errorMessage.toLowerCase().includes('allowance is not defined')

      const isHydrationError = errorMessage.toLowerCase().includes('hydration') ||
                              errorMessage.toLowerCase().includes('text content does not match') ||
                              errorMessage.toLowerCase().includes('server-rendered html')

      const isMobileWalletError = (isMobileDevice || isInAppBrowserDevice) &&
                                  (errorMessage.toLowerCase().includes('ethereum') ||
                                   errorMessage.toLowerCase().includes('wallet') ||
                                   errorMessage.toLowerCase().includes('provider'))

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
                  {isMobileWalletError ? (
                    <>
                      <strong className="text-destructive">Error de Web3 en Mobile detectado.</strong><br/>
                      {isMobileMetaMask ? (
                        <>
                          Estás usando MetaMask Mobile, pero la wallet no se inicializó correctamente.
                          Esto puede pasar cuando la página carga muy rápido y MetaMask no tuvo tiempo de inyectar Web3.
                        </>
                      ) : isInAppBrowserDevice ? (
                        <>
                          Estás usando un navegador in-app. Los navegadores dentro de apps de wallets
                          a veces tienen problemas de inicialización. Intenta abrir desde el navegador de MetaMask.
                        </>
                      ) : (
                        <>
                          Estás en un dispositivo móvil. Para usar esta dapp necesitas
                          acceder desde el navegador interno de MetaMask Mobile.
                        </>
                      )}
                    </>
                  ) : isHydrationError ? (
                    <>
                      <strong className="text-destructive">Error de hidratación detectado.</strong><br/>
                      El contenido generado en el servidor no coincide con el renderizado en el cliente.
                      Esto es común en mobile. Recarga la página para resolverlo.
                    </>
                  ) : isMultiWalletConflict ? (
                    <>
                      <strong className="text-destructive">Conflicto de múltiples wallets detectado.</strong><br/>
                      Tienes varias extensiones de wallet activas (MetaMask, OKX, Yoroi, etc.)
                      que están compitiendo por el control de la conexión Web3.
                    </>
                  ) : isWagmiError ? (
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
                
                {isMobileWalletError && (
                  <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm font-semibold text-blue-500 mb-2">
                      📱 Solución para Mobile:
                    </p>
                    <ol className="text-sm text-foreground/80 space-y-2 list-decimal list-inside">
                      <li>
                        <strong>Abre MetaMask Mobile</strong> en tu teléfono
                      </li>
                      <li>
                        Toca el ícono del <strong>navegador</strong> (🔍 Search) en la parte inferior
                      </li>
                      <li>
                        Ingresa la URL: <code className="text-xs bg-background/50 px-2 py-1 rounded">khipuvault.vercel.app</code>
                      </li>
                      <li>
                        <strong>NO</strong> uses el navegador Safari/Chrome del teléfono, usa el de MetaMask
                      </li>
                      <li>
                        Si ya estás en MetaMask Browser, <strong>recarga la página</strong> (pull down para refrescar)
                      </li>
                    </ol>
                  </div>
                )}

                {isMultiWalletConflict && (
                  <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm font-semibold text-yellow-500 mb-2">
                      🔧 Solución Recomendada:
                    </p>
                    <ol className="text-sm text-foreground/80 space-y-2 list-decimal list-inside">
                      <li>
                        <strong>Desactiva todas las wallets excepto una</strong> en las extensiones de tu navegador
                      </li>
                      <li>
                        Recomendamos usar <strong>solo MetaMask</strong> o <strong>solo OKX Wallet</strong>
                      </li>
                      <li>
                        Ve a <code className="text-xs bg-background/50 px-2 py-1 rounded">chrome://extensions/</code>
                      </li>
                      <li>
                        Desactiva las wallets que no uses (Yoroi, Phantom, etc.)
                      </li>
                      <li>
                        Recarga esta página
                      </li>
                    </ol>
                  </div>
                )}

                {isHydrationError && (
                  <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <p className="text-sm font-semibold text-orange-500 mb-2">
                      🔄 Solución para Hydration Error:
                    </p>
                    <ol className="text-sm text-foreground/80 space-y-2 list-decimal list-inside">
                      <li>
                        <strong>Recarga la página</strong> (pull down en mobile)
                      </li>
                      <li>
                        Si persiste, <strong>limpia el cache</strong> de la app
                      </li>
                      <li>
                        En MetaMask: Settings → Advanced → Clear Browser Cache
                      </li>
                      <li>
                        Intenta nuevamente
                      </li>
                    </ol>
                  </div>
                )}

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