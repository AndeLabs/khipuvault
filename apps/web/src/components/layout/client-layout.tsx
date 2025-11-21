'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

// Dynamically import ClientProviders with ssr: false to avoid MetaMask SDK localStorage issues
const ClientProviders = dynamic(
  () => import('@/providers/client-providers').then(mod => ({ default: mod.ClientProviders })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavanda mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    ),
  }
)

interface ClientLayoutProps {
  children: ReactNode
  /** Initial Wagmi state from cookies for SSR hydration */
  initialState?: any
}

/**
 * Client-side layout wrapper
 * Uses dynamic import with ssr:false to completely avoid SSR for Web3 providers
 * This prevents MetaMask SDK from trying to access localStorage during SSR
 */
export function ClientLayout({ children, initialState }: ClientLayoutProps) {
  return <ClientProviders initialState={initialState}>{children}</ClientProviders>
}
