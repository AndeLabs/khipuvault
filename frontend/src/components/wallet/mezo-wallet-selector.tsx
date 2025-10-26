/**
 * @fileoverview Mezo Wallet Selector Component
 * @module components/wallet/mezo-wallet-selector
 * 
 * Production-ready wallet selector for Mezo Platform
 * Supports both Ethereum (MetaMask) and Bitcoin (Unisat) wallets
 * Integrates with Mezo Passport for authentication
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/icons'
import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { Wallet, Bitcoin } from 'lucide-react'

/**
 * Wallet type enum
 */
export type WalletType = 'ethereum' | 'bitcoin'

/**
 * Mezo Wallet Selector Component
 * 
 * Provides a clean interface for users to choose between:
 * - Continue with Ethereum (MetaMask)
 * - Continue with Bitcoin (Unisat)
 * 
 * Matches Mezo's official design and authentication flow
 */
export function MezoWalletSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [bitcoinWallet, setBitcoinWallet] = useState<{
    address: string
    publicKey: string
  } | null>(null)

  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectors } = useConnect()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Connect with Ethereum (MetaMask)
  const connectEthereum = async () => {
    const metamaskConnector = connectors.find(
      (connector) => connector.name.toLowerCase().includes('metamask') || 
                     connector.name.toLowerCase().includes('injected')
    )

    if (metamaskConnector) {
      try {
        connect({ connector: metamaskConnector })
        setIsOpen(false)
      } catch (error) {
        console.error('Error connecting with Ethereum:', error)
      }
    } else {
      // Open MetaMask installation page
      window.open('https://metamask.io/download/', '_blank')
    }
  }

  // Connect with Bitcoin (Unisat)
  const connectBitcoin = async () => {
    try {
      // Check if Unisat is installed
      if (typeof window !== 'undefined' && (window as any).unisat) {
        const unisat = (window as any).unisat
        
        // Request accounts
        const accounts = await unisat.requestAccounts()
        
        if (accounts && accounts.length > 0) {
          // Get public key
          const publicKey = await unisat.getPublicKey()
          
          setBitcoinWallet({
            address: accounts[0],
            publicKey: publicKey,
          })
          
          setIsOpen(false)
          
          console.log('✅ Bitcoin wallet connected:', {
            address: accounts[0],
            publicKey: publicKey,
          })
        }
      } else {
        // Open Unisat installation page
        window.open('https://unisat.io/', '_blank')
      }
    } catch (error) {
      console.error('Error connecting with Bitcoin:', error)
    }
  }

  // Disconnect wallet
  const handleDisconnect = () => {
    if (isConnected) {
      disconnect()
    }
    if (bitcoinWallet) {
      setBitcoinWallet(null)
    }
  }

  if (!mounted) {
    return (
      <Button disabled className="animate-pulse">
        Cargando...
      </Button>
    )
  }

  // If already connected, show disconnect button
  if (isConnected || bitcoinWallet) {
    return (
      <div className="flex items-center gap-3">
        {/* Display connected wallet info */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
          {isConnected ? (
            <>
              <Wallet className="h-4 w-4 text-primary" />
              <span className="font-code text-sm">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </>
          ) : (
            <>
              <Bitcoin className="h-4 w-4 text-orange-500" />
              <span className="font-code text-sm">
                {bitcoinWallet?.address.slice(0, 6)}...{bitcoinWallet?.address.slice(-4)}
              </span>
            </>
          )}
        </div>
        
        <Button variant="outline" size="sm" onClick={handleDisconnect}>
          Desconectar
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="font-semibold">
          <Wallet className="mr-2 h-5 w-5" />
          Conectar Wallet
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Bienvenido a KhipuVault
          </DialogTitle>
          <DialogDescription className="text-center">
            Usa tu wallet existente para iniciar sesión
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Ethereum / MetaMask Option */}
          <Card 
            className="cursor-pointer hover:bg-primary/5 transition-colors border-2 hover:border-primary/50"
            onClick={connectEthereum}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">
                  Continuar con Ethereum
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Conecta con MetaMask o cualquier wallet compatible con Ethereum
              </CardDescription>
            </CardContent>
          </Card>

          {/* Bitcoin / Unisat Option */}
          <Card 
            className="cursor-pointer hover:bg-orange-500/5 transition-colors border-2 hover:border-orange-500/50"
            onClick={connectBitcoin}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                  <Bitcoin className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">
                  Continuar con Bitcoin
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Conecta con Unisat para usar tu Bitcoin wallet
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          ¿No tienes una cuenta?{' '}
          <a 
            href="https://mezo.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Crear cuenta en Mezo
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Compact version for header/navbar
 */
export function MezoWalletButton() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-10 w-32 animate-pulse bg-muted rounded" />
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="font-code text-sm">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
      </div>
    )
  }

  return <MezoWalletSelector />
}
