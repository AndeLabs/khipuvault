/**
 * @fileoverview Custom Wallet Connection Components for KhipuVault
 * @module components/wallet/connect-button
 * 
 * Production-ready wallet connection components without RainbowKit
 * Pure Wagmi with MetaMask + Unisat support
 * Safe client-side rendering with hydration protection
 */

'use client'

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useIndividualPoolData } from '@/hooks/web3/use-individual-pool'
import { getWalletAvailability } from '@/lib/web3/config'
import { Wallet, ChevronDown, Copy, ExternalLink } from 'lucide-react'

/**
 * Custom Connect Button Component
 * 
 * Features:
 * - MetaMask + Unisat wallet connection
 * - Shows BTC balance when connected
 * - Wallet selection dropdown
 * - Responsive design
 * - SSR-safe with proper hydration
 * - No external dependencies
 */
export function ConnectButton() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: btcBalance } = useBalance({ 
    address: address as `0x${string}` | undefined 
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration errors
  if (!mounted) {
    return (
      <div className="h-10 w-40 animate-pulse bg-muted rounded-lg" />
    )
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {/* Balance Display */}
        {btcBalance && (
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-semibold font-code">
              {Number(btcBalance.formatted).toFixed(6)} BTC
            </span>
          </div>
        )}

        {/* Connected Wallet Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm">
              <div className="font-medium">Wallet Conectada</div>
              <div className="text-muted-foreground font-mono text-xs">
                {address}
              </div>
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(address)}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Dirección
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <a
                href={`https://explorer.test.mezo.org/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver en Explorer
              </a>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => disconnect()}
              className="text-destructive focus:text-destructive"
            >
              Desconectar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // Wallet Selection Dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isPending} className="gap-2">
          <Wallet className="h-4 w-4" />
          {isPending ? 'Conectando...' : 'Conectar Wallet'}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-medium">
          Selecciona tu wallet
        </div>
        
        <DropdownMenuSeparator />
        
        {connectors.map((connector) => {
          const isAvailable = connector.id === 'metaMask' 
            ? getWalletAvailability().metaMask
            : connector.id === 'unisat' 
            ? getWalletAvailability().unisat
            : true

          return (
            <DropdownMenuItem
              key={connector.id}
              onClick={() => connect({ connector })}
              disabled={!isAvailable || isPending}
              className="gap-2"
            >
              <Wallet className="h-4 w-4" />
              <div className="flex-1">
                <div>{connector.name}</div>
                {!isAvailable && (
                  <div className="text-xs text-muted-foreground">
                    No detectada - Instala la extensión
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
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