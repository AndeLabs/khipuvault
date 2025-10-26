'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

export interface PoolStats {
  totalBtc: bigint
  totalMusd: bigint
  totalYields: bigint
  poolAPR: number
  memberCount: number
  isRecoveryMode: boolean
}

export interface UserDeposit {
  btcAmount: bigint
  musdMinted: bigint
  yieldAccrued: bigint
  depositTimestamp: number
  lastYieldUpdate: number
  active: boolean
}

/**
 * MOCK Hook - Use while Mezo testnet is in recovery mode
 * This simulates real contract data with realistic values
 * 
 * When testnet recovers:
 * 1. Replace with real useReadContract from wagmi
 * 2. Change contract addresses from mock to real
 * 3. Data will auto-sync from blockchain
 */
export function useIndividualPoolData() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(true)
  const [userDeposit, setUserDeposit] = useState<UserDeposit | null>(null)

  // Mock pool statistics - Realistic numbers
  const mockPoolStats: PoolStats = {
    totalBtc: BigInt('5000000000000000000'), // 5 BTC
    totalMusd: BigInt('200000000000000000000000'), // 200,000 MUSD
    totalYields: BigInt('31250000000000000'), // 0.03125 BTC
    poolAPR: 6.2, // 6.2% APR from Mezo
    memberCount: 42, // 42 members
    isRecoveryMode: true, // Testnet is in recovery mode
  }

  // Mock user deposit - Simulates user's position
  const mockUserDeposit: UserDeposit = {
    btcAmount: BigInt('0500000000000000000'), // 0.5 BTC
    musdMinted: BigInt('20000000000000000000000'), // 20,000 MUSD
    yieldAccrued: BigInt('312500000000000'), // 0.0003125 BTC (small amount)
    depositTimestamp: Math.floor(Date.now() / 1000) - 45 * 24 * 60 * 60, // 45 days ago
    lastYieldUpdate: Math.floor(Date.now() / 1000) - 60 * 60, // 1 hour ago
    active: true,
  }

  // Simulate async loading
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      if (address) {
        // If user is connected, show mock user data
        setUserDeposit(mockUserDeposit)
      }
      setIsLoading(false)
    }, 500) // Simulate network delay

    return () => clearTimeout(timer)
  }, [address])

  return {
    poolStats: mockPoolStats,
    userDeposit,
    isLoading,
    isMockData: true, // Flag indicating this is mock data
  }
}

/**
 * Format BTC with proper decimals
 */
export function formatBTC(value: bigint | undefined): string {
  if (!value) return '0.000000'
  return (Number(value) / 1e18).toFixed(6)
}

/**
 * Format MUSD with comma separators
 */
export function formatMUSD(value: bigint | undefined): string {
  if (!value) return '0'
  const num = Number(value) / 1e18
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
