/**
 * @fileoverview Wallet Connection Components for KhipuVault
 * @module components/wallet/connect-button
 * 
 * Production-ready wallet connection components with proper error handling
 * Uses RainbowKit for wallet connection UI
 * Safe client-side rendering with hydration protection
 */

'use client'

import { ConnectButton as RainbowKitConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance } from 'wagmi'
import { useEffect, useState } from 'react'
import { useIndividualPoolData } from '@/hooks/web3/use-individual-pool-data-mock'

/**
 * Enhanced Connect Button with Mezo Passport
 * 
 * Features:
 * - One-click wallet connection with RainbowKit
 * - Shows BTC balance when connected
 * - Shows connected wallet status
 * - Responsive design
 * - SSR-safe with proper hydration
 * 
 * Usage:
 * ```tsx
 * <ConnectButton />
 * ```
 */
export function ConnectButton() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration errors by not rendering until mounted
  if (!mounted) {
    return (
      <div className="h-10 w-40 animate-pulse bg-muted rounded-lg" />
    )
  }

  return (
    <RainbowKitConnectButton 
      label="Conectar Wallet"
      showBalance={{
        smallScreen: true,
        largeScreen: true,
      }}
      chainStatus="full"
      accountStatus="full"
    />
  )
}

/**
 * Wallet Info Display Component
 * Shows connected wallet details and balances
 * 
 * Safe to use in any component wrapped by Web3Provider
 * Handles hydration and loading states gracefully
 */
export function WalletInfo() {
  const { address, isConnected } = useAccount()
  const { data: btcBalance } = useBalance({ 
    address: address as `0x${string}` | undefined 
  })
  const { userDeposit } = useIndividualPoolData()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render on server or before hydration
  if (!mounted) {
    return (
      <div className="flex items-center gap-4">
        <div className="h-12 w-32 animate-pulse bg-muted rounded" />
      </div>
    )
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="flex items-center gap-4">
      {/* BTC Balance */}
      {btcBalance && (
        <div className="flex flex-col items-end">
          <div className="text-sm text-muted-foreground">Balance BTC</div>
          <div className="text-lg font-semibold font-code">
            {Number(btcBalance.formatted).toFixed(6)} BTC
          </div>
        </div>
      )}

      {/* MUSD Minted */}
      {userDeposit?.musdMinted && (
        <div className="flex flex-col items-end border-l border-primary/20 pl-4">
          <div className="text-sm text-muted-foreground">MUSD Generado</div>
          <div className="text-lg font-semibold font-code text-primary">
            {Number(userDeposit.musdMinted / BigInt(1e18)).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Wallet Status Badge
 * Shows connection status and chain info
 * 
 * Displays a colored indicator and text showing wallet connection status
 * Safe for SSR and hydration
 */
export function WalletStatus() {
  const { isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Render placeholder during SSR and initial hydration
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
        <span className="text-sm font-medium text-muted-foreground">
          Cargando...
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`h-2 w-2 rounded-full transition-colors ${
          isConnected ? 'bg-green-500' : 'bg-yellow-500'
        }`} 
      />
      <span className="text-sm font-medium text-muted-foreground">
        {isConnected ? 'Conectado' : 'Desconectado'}
      </span>
    </div>
  )
}
