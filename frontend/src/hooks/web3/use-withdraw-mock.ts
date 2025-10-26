'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'

interface WithdrawState {
  amount: string
  isProcessing: boolean
  isSuccess: boolean
  isError: boolean
  error: string | null
  txHash: string | null
}

/**
 * MOCK Hook - Simulates BTC withdrawal from Individual Savings Pool
 * 
 * MOCK BEHAVIOR:
 * - Simulates 3-second "transaction" delay
 * - Returns fake transaction hash
 * - Validates amount
 * - Shows success/error messages
 * 
 * REAL BEHAVIOR (when testnet is ready):
 * - Replace with useWriteContract from wagmi
 * - Connect to actual IndividualPool contract
 * - Real blockchain transactions
 */
export function useWithdrawMock() {
  const { address, isConnected } = useAccount()
  const [state, setState] = useState<WithdrawState>({
    amount: '',
    isProcessing: false,
    isSuccess: false,
    isError: false,
    error: null,
    txHash: null,
  })

  const withdraw = async (btcAmount: string) => {
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

    // In real scenario, would check user's actual balance
    // For now, assume user has 0.5 BTC (from mock data)
    const maxWithdraw = 0.5
    if (parseFloat(btcAmount) > maxWithdraw) {
      setState((prev) => ({
        ...prev,
        isError: true,
        error: `Insufficient balance. You have: ${maxWithdraw} BTC`,
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
    withdraw,
    reset,
    isMock: true,
  }
}
