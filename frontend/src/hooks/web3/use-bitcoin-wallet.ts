/**
 * @fileoverview Bitcoin Wallet Hook (Unisat)
 * @module hooks/web3/use-bitcoin-wallet
 * 
 * Production-ready hook for Bitcoin wallet integration
 * Supports Unisat wallet for Bitcoin transactions on Mezo
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Bitcoin wallet state interface
 */
interface BitcoinWalletState {
  address: string | null
  publicKey: string | null
  isConnected: boolean
  isInstalled: boolean
  balance: string | null
}

/**
 * Unisat API interface
 */
interface UnisatAPI {
  requestAccounts: () => Promise<string[]>
  getAccounts: () => Promise<string[]>
  getPublicKey: () => Promise<string>
  getBalance: () => Promise<{ confirmed: number; unconfirmed: number; total: number }>
  signMessage: (message: string) => Promise<string>
  sendBitcoin: (address: string, amount: number) => Promise<string>
  on: (event: string, callback: (...args: any[]) => void) => void
  removeListener: (event: string, callback: (...args: any[]) => void) => void
}

declare global {
  interface Window {
    unisat?: UnisatAPI
  }
}

/**
 * Hook for Bitcoin wallet (Unisat) integration
 * 
 * Provides access to Bitcoin wallet functionality:
 * - Connect/disconnect wallet
 * - Get address and public key
 * - Check balance
 * - Sign messages
 * - Send transactions
 * 
 * @returns Bitcoin wallet state and methods
 */
export function useBitcoinWallet() {
  const [state, setState] = useState<BitcoinWalletState>({
    address: null,
    publicKey: null,
    isConnected: false,
    isInstalled: false,
    balance: null,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Check if Unisat is installed
  useEffect(() => {
    const checkInstalled = () => {
      if (typeof window !== 'undefined' && window.unisat) {
        setState(prev => ({ ...prev, isInstalled: true }))
        checkConnection()
      } else {
        setState(prev => ({ ...prev, isInstalled: false }))
      }
    }

    checkInstalled()

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setState(prev => ({
          ...prev,
          address: accounts[0],
          isConnected: true,
        }))
        getPublicKey()
        getBalance()
      } else {
        setState({
          address: null,
          publicKey: null,
          isConnected: false,
          isInstalled: prev.isInstalled,
          balance: null,
        })
      }
    }

    if (window.unisat) {
      window.unisat.on('accountsChanged', handleAccountsChanged)
    }

    return () => {
      if (window.unisat) {
        window.unisat.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [])

  // Check if already connected
  const checkConnection = useCallback(async () => {
    if (!window.unisat) return

    try {
      const accounts = await window.unisat.getAccounts()
      if (accounts && accounts.length > 0) {
        const publicKey = await window.unisat.getPublicKey()
        const balanceData = await window.unisat.getBalance()
        
        setState(prev => ({
          ...prev,
          address: accounts[0],
          publicKey: publicKey,
          isConnected: true,
          balance: (balanceData.total / 100000000).toFixed(8), // Convert satoshis to BTC
        }))
      }
    } catch (err) {
      console.error('Error checking Bitcoin wallet connection:', err)
    }
  }, [])

  // Connect wallet
  const connect = useCallback(async () => {
    if (!window.unisat) {
      setError(new Error('Unisat wallet not installed'))
      window.open('https://unisat.io/', '_blank')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const accounts = await window.unisat.requestAccounts()
      
      if (accounts && accounts.length > 0) {
        const publicKey = await window.unisat.getPublicKey()
        const balanceData = await window.unisat.getBalance()
        
        setState(prev => ({
          ...prev,
          address: accounts[0],
          publicKey: publicKey,
          isConnected: true,
          balance: (balanceData.total / 100000000).toFixed(8),
        }))

        console.log('✅ Bitcoin wallet connected:', {
          address: accounts[0],
          publicKey: publicKey,
          balance: (balanceData.total / 100000000).toFixed(8) + ' BTC',
        })
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      console.error('Error connecting Bitcoin wallet:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState({
      address: null,
      publicKey: null,
      isConnected: false,
      isInstalled: state.isInstalled,
      balance: null,
    })
    console.log('🔌 Bitcoin wallet disconnected')
  }, [state.isInstalled])

  // Get public key
  const getPublicKey = useCallback(async () => {
    if (!window.unisat || !state.isConnected) return null

    try {
      const publicKey = await window.unisat.getPublicKey()
      setState(prev => ({ ...prev, publicKey }))
      return publicKey
    } catch (err) {
      console.error('Error getting public key:', err)
      return null
    }
  }, [state.isConnected])

  // Get balance
  const getBalance = useCallback(async () => {
    if (!window.unisat || !state.isConnected) return null

    try {
      const balanceData = await window.unisat.getBalance()
      const btcBalance = (balanceData.total / 100000000).toFixed(8)
      setState(prev => ({ ...prev, balance: btcBalance }))
      return btcBalance
    } catch (err) {
      console.error('Error getting balance:', err)
      return null
    }
  }, [state.isConnected])

  // Sign message
  const signMessage = useCallback(async (message: string) => {
    if (!window.unisat || !state.isConnected) {
      throw new Error('Bitcoin wallet not connected')
    }

    try {
      const signature = await window.unisat.signMessage(message)
      return signature
    } catch (err) {
      console.error('Error signing message:', err)
      throw err
    }
  }, [state.isConnected])

  // Send Bitcoin
  const sendBitcoin = useCallback(async (toAddress: string, amount: number) => {
    if (!window.unisat || !state.isConnected) {
      throw new Error('Bitcoin wallet not connected')
    }

    try {
      const txid = await window.unisat.sendBitcoin(toAddress, amount)
      console.log('✅ Bitcoin sent. Transaction ID:', txid)
      
      // Refresh balance after send
      await getBalance()
      
      return txid
    } catch (err) {
      console.error('Error sending Bitcoin:', err)
      throw err
    }
  }, [state.isConnected, getBalance])

  return {
    // State
    ...state,
    isLoading,
    error,

    // Methods
    connect,
    disconnect,
    getPublicKey,
    getBalance,
    signMessage,
    sendBitcoin,
  }
}
