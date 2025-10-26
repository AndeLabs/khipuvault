'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'

interface ClaimYieldsState {
  isProcessing: boolean
  isSuccess: boolean
  isError: boolean
  error: string | null
  txHash: string | null
  yieldsClaimed: string | null
  feePaid: string | null
}

/**
 * MOCK Hook - Simulates claiming MUSD yields from Individual Savings Pool
 * 
 * MOCK BEHAVIOR:
 * - Simulates 3-second "transaction" delay
 * - Returns fake transaction hash
 * - Calculates mock yields (based on APR)
 * - Deducts 1% performance fee
 * - Shows success message
 * 
 * REAL BEHAVIOR (when testnet is ready):
 * - Replace with useWriteContract from wagmi
 * - Connect to actual IndividualPool contract
 * - Real blockchain yield claims
 */
export function useClaimYieldsMock() {
  const { address, isConnected } = useAccount()
  const [state, setState] = useState<ClaimYieldsState>({
    isProcessing: false,
    isSuccess: false,
    isError: false,
    error: null,
    txHash: null,
    yieldsClaimed: null,
    feePaid: null,
  })

  const claimYields = async () => {
    if (!isConnected || !address) {
      setState((prev) => ({
        ...prev,
        isError: true,
        error: 'Wallet not connected',
      }))
      return
    }

    // Simulate transaction
    setState((prev) => ({
      ...prev,
      isProcessing: true,
      isError: false,
      error: null,
      isSuccess: false,
    }))

    try {
      // Simulate 3-second network delay
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Mock yield calculation
      // Based on: 0.5 BTC deposited, 6.2% APR, accrued for ~1 hour
      const mockYieldsAccrued = 0.000035 // MUSD earned
      const performanceFee = 0.01 // 1%
      const feePaid = mockYieldsAccrued * performanceFee
      const yieldsAfterFee = mockYieldsAccrued - feePaid

      // Generate fake but realistic-looking tx hash
      const fakeTxHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        isSuccess: true,
        txHash: fakeTxHash,
        yieldsClaimed: yieldsAfterFee.toFixed(6),
        feePaid: feePaid.toFixed(6),
      }))

      // Auto-reset after 8 seconds
      setTimeout(() => {
        setState({
          isProcessing: false,
          isSuccess: false,
          isError: false,
          error: null,
          txHash: null,
          yieldsClaimed: null,
          feePaid: null,
        })
      }, 8000)
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
      isProcessing: false,
      isSuccess: false,
      isError: false,
      error: null,
      txHash: null,
      yieldsClaimed: null,
      feePaid: null,
    })
  }

  return {
    ...state,
    claimYields,
    reset,
    isMock: true,
  }
}
