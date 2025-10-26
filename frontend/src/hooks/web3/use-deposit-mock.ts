'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'

interface DepositState {
  amount: string
  isProcessing: boolean
  isSuccess: boolean
  isError: boolean
  error: string | null
  txHash: string | null
}

/**
 * MOCK Hook - Simulates BTC deposit to Individual Savings Pool
 * 
 * MOCK BEHAVIOR:
 * - Simulates 3-second "transaction" delay
 * - Returns fake transaction hash
 * - Updates local state
 * - Shows success/error messages
 * 
 * REAL BEHAVIOR (when testnet is ready):
 * - Replace with useWriteContract from wagmi
 * - Connect to actual IndividualPool contract
 * - Real blockchain transactions
 */
export function useDepositMock() {
  const { address, isConnected } = useAccount()
  const [state, setState] = useState<DepositState>({
    amount: '',
    isProcessing: false,
    isSuccess: false,
    isError: false,
    error: null,
    txHash: null,
  })

  const deposit = async (btcAmount: string) => {
    if (!isConnected || !address) {
      setState((prev) => ({
        ...prev,
        isError: true,
        error: 'Wallet not connected',
      }))
      return
    }

    if (!btcAmount || parseFloat(btcAmount) <= 0) {
      setState((prev) => ({
        ...prev,
        isError: true,
        error: 'Invalid amount',
      }))
      return
    }

    if (parseFloat(btcAmount) < 0.001) {
      setState((prev) => ({
        ...prev,
        isError: true,
        error: 'Minimum deposit: 0.001 BTC',
      }))
      return
    }

    if (parseFloat(btcAmount) > 10) {
      setState((prev) => ({
        ...prev,
        isError: true,
        error: 'Maximum deposit: 10 BTC',
      }))
      return
    }

    // Simulate transaction
    setState((prev) => ({
      ...prev,
      amount: btcAmount,
      isProcessing: true,
      isError: false,
      error: null,
      isSuccess: false,
    }))

    try {
      // Simulate 3-second network delay
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Generate fake but realistic-looking tx hash
      const fakeTxHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        isSuccess: true,
        txHash: fakeTxHash,
      }))

      // Auto-reset after 5 seconds
      setTimeout(() => {
        setState({
          amount: '',
          isProcessing: false,
          isSuccess: false,
          isError: false,
          error: null,
          txHash: null,
        })
      }, 5000)
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        isError: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }

  const reset = () => {
    setState({
      amount: '',
      isProcessing: false,
      isSuccess: false,
      isError: false,
      error: null,
      txHash: null,
    })
  }

  return {
    ...state,
    deposit,
    reset,
    isMock: true,
  }
}
