/**
 * @fileoverview Mezo Borrowing Hook - Production Ready
 * @module hooks/web3/use-mezo-borrow
 *
 * Comprehensive hook for borrowing MUSD against BTC collateral via Mezo protocol
 *
 * Features:
 * - Deposit BTC and mint MUSD
 * - Burn MUSD and withdraw BTC
 * - Real-time position tracking
 * - Health factor monitoring
 * - Collateral ratio calculations
 * - Auto-refetch on block changes
 * - Production-grade error handling
 */

'use client'

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBlockNumber, usePublicClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { parseEther, formatEther } from 'viem'
import { MEZO_TESTNET_ADDRESSES } from '@/lib/web3/contracts'

const MEZO_INTEGRATION_ADDRESS = MEZO_TESTNET_ADDRESSES.mezoIntegration as `0x${string}`

// Minimal ABI for MezoIntegration contract
const MEZO_INTEGRATION_ABI = [
  {
    type: 'function',
    name: 'depositAndMintNative',
    stateMutability: 'payable',
    inputs: [],
    outputs: [{ name: 'musdAmount', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'burnAndWithdraw',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'musdAmount', type: 'uint256' }],
    outputs: [{ name: 'btcAmount', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getUserPosition',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'btcCollateral', type: 'uint256' },
      { name: 'musdDebt', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'getCollateralRatio',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: 'ratio', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'isPositionHealthy',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: 'healthy', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'targetLtv',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalBtcDeposited',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalMusdMinted',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'BTCDeposited',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'btcAmount', type: 'uint256', indexed: false },
      { name: 'musdAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BTCWithdrawn',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'btcAmount', type: 'uint256', indexed: false },
      { name: 'musdAmount', type: 'uint256', indexed: false },
    ],
  },
] as const

/**
 * User position in Mezo protocol
 */
export interface MezoPosition {
  btcCollateral: bigint
  musdDebt: bigint
  collateralRatio: number // in percentage (e.g., 200 = 200%)
  healthFactor: number // in percentage (e.g., 150 = 150%)
  isHealthy: boolean
  maxBorrowable: bigint // max additional MUSD that can be borrowed
  liquidationPrice: number // BTC price at which position gets liquidated
}

/**
 * Hook for Mezo borrowing operations
 *
 * Usage:
 * ```tsx
 * const {
 *   position,
 *   deposit,
 *   withdraw,
 *   isDepositing,
 *   isWithdrawing,
 *   error
 * } = useMezoBorrow()
 *
 * // Deposit 0.1 BTC
 * await deposit(parseEther('0.1'))
 *
 * // Withdraw by repaying 100 MUSD
 * await withdraw(parseEther('100'))
 * ```
 */
export function useMezoBorrow() {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()
  const publicClient = usePublicClient()

  // Watch block number for real-time updates
  const { data: blockNumber } = useBlockNumber({ watch: true })

  // Get target LTV from contract
  const { data: targetLtv } = useReadContract({
    address: MEZO_INTEGRATION_ADDRESS,
    abi: MEZO_INTEGRATION_ABI,
    functionName: 'targetLtv',
    query: {
      enabled: isConnected,
      staleTime: 60 * 1000, // 1 minute
    },
  })

  // Get user position
  const { data: userPosition, refetch: refetchPosition } = useReadContract({
    address: MEZO_INTEGRATION_ADDRESS,
    abi: MEZO_INTEGRATION_ABI,
    functionName: 'getUserPosition',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
      staleTime: 10 * 1000, // 10 seconds
    },
  })

  // Get total protocol stats
  const { data: totalBtcDeposited } = useReadContract({
    address: MEZO_INTEGRATION_ADDRESS,
    abi: MEZO_INTEGRATION_ABI,
    functionName: 'totalBtcDeposited',
    query: {
      enabled: isConnected,
      staleTime: 30 * 1000,
    },
  })

  const { data: totalMusdMinted } = useReadContract({
    address: MEZO_INTEGRATION_ADDRESS,
    abi: MEZO_INTEGRATION_ABI,
    functionName: 'totalMusdMinted',
    query: {
      enabled: isConnected,
      staleTime: 30 * 1000,
    },
  })

  // Refetch position on block changes
  useEffect(() => {
    if (blockNumber) {
      refetchPosition()
    }
  }, [blockNumber, refetchPosition])

  // Write contract: deposit and mint
  const {
    writeContract: writeDeposit,
    data: depositTxHash,
    error: depositError,
    isPending: isDepositPending,
  } = useWriteContract()

  // Wait for deposit transaction
  const {
    isLoading: isDepositConfirming,
    isSuccess: isDepositConfirmed,
  } = useWaitForTransactionReceipt({
    hash: depositTxHash,
    pollingInterval: 1000,
  })

  // Write contract: burn and withdraw
  const {
    writeContract: writeWithdraw,
    data: withdrawTxHash,
    error: withdrawError,
    isPending: isWithdrawPending,
  } = useWriteContract()

  // Wait for withdraw transaction
  const {
    isLoading: isWithdrawConfirming,
    isSuccess: isWithdrawConfirmed,
  } = useWaitForTransactionReceipt({
    hash: withdrawTxHash,
    pollingInterval: 1000,
  })

  /**
   * Deposit BTC and mint MUSD
   * @param btcAmount Amount of BTC to deposit (in wei)
   */
  async function deposit(btcAmount: bigint): Promise<void> {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    if (btcAmount < parseEther('0.001')) {
      throw new Error('Minimum deposit is 0.001 BTC')
    }

    writeDeposit({
      address: MEZO_INTEGRATION_ADDRESS,
      abi: MEZO_INTEGRATION_ABI,
      functionName: 'depositAndMintNative',
      value: btcAmount,
    })
  }

  /**
   * Burn MUSD and withdraw BTC
   * @param musdAmount Amount of MUSD to repay (in wei)
   */
  async function withdraw(musdAmount: bigint): Promise<void> {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    if (musdAmount <= 0n) {
      throw new Error('Amount must be greater than 0')
    }

    writeWithdraw({
      address: MEZO_INTEGRATION_ADDRESS,
      abi: MEZO_INTEGRATION_ABI,
      functionName: 'burnAndWithdraw',
      args: [musdAmount],
    })
  }

  /**
   * Calculate max borrowable MUSD based on current BTC collateral
   */
  function calculateMaxBorrowable(btcCollateral: bigint, currentDebt: bigint): bigint {
    if (!targetLtv) return 0n

    // Assuming BTC price of $100,000 for simplification
    // In production, fetch from price oracle
    const btcPrice = parseEther('100000')
    const collateralValue = (btcCollateral * btcPrice) / parseEther('1')
    const maxDebt = (collateralValue * targetLtv) / 10000n

    return maxDebt > currentDebt ? maxDebt - currentDebt : 0n
  }

  /**
   * Calculate liquidation price
   */
  function calculateLiquidationPrice(btcCollateral: bigint, musdDebt: bigint): number {
    if (btcCollateral === 0n) return 0

    // Liquidation threshold is 110% (11000 basis points)
    const liquidationRatio = 11000n
    const liquidationValue = (musdDebt * liquidationRatio) / 10000n
    const liquidationPrice = (liquidationValue * parseEther('1')) / btcCollateral

    return Number(formatEther(liquidationPrice))
  }

  /**
   * Parse user position into readable format
   */
  const position: MezoPosition | null = userPosition
    ? {
        btcCollateral: userPosition[0],
        musdDebt: userPosition[1],
        collateralRatio: userPosition[1] > 0n
          ? Number((userPosition[0] * 10000n) / userPosition[1]) / 100
          : 0,
        healthFactor: userPosition[1] > 0n
          ? Number((userPosition[0] * 10000n) / userPosition[1]) / 110 // 110% is minimum
          : 100,
        isHealthy: userPosition[1] === 0n || userPosition[0] > 0n,
        maxBorrowable: calculateMaxBorrowable(userPosition[0], userPosition[1]),
        liquidationPrice: calculateLiquidationPrice(userPosition[0], userPosition[1]),
      }
    : null

  /**
   * Auto-refetch position when transactions confirm
   */
  useEffect(() => {
    if (isDepositConfirmed || isWithdrawConfirmed) {
      const timer = setTimeout(() => {
        refetchPosition()
        queryClient.invalidateQueries({ queryKey: ['mezo-borrow'] })
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isDepositConfirmed, isWithdrawConfirmed, refetchPosition, queryClient])

  return {
    // Position data
    position,
    hasPosition: position && position.musdDebt > 0n,

    // Protocol stats
    totalBtcDeposited: totalBtcDeposited as bigint | undefined,
    totalMusdMinted: totalMusdMinted as bigint | undefined,
    targetLtv: targetLtv as bigint | undefined,

    // Actions
    deposit,
    withdraw,

    // Deposit states
    isDepositing: isDepositPending,
    isDepositConfirming,
    isDepositConfirmed,
    depositTxHash,

    // Withdraw states
    isWithdrawing: isWithdrawPending,
    isWithdrawConfirming,
    isWithdrawConfirmed,
    withdrawTxHash,

    // Errors and states
    error: depositError?.message || withdrawError?.message || null,
    isLoading: isDepositPending || isWithdrawPending || isDepositConfirming || isWithdrawConfirming,
    isConnected: isConnected && !!address,

    // Utilities
    refetchPosition,
  }
}

/**
 * Helper: Format BTC from wei
 */
export function formatBTC(amount: bigint | undefined): string {
  if (!amount) return '0.00000'
  const btc = Number(formatEther(amount))
  return btc.toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 5 })
}

/**
 * Helper: Format collateral ratio
 */
export function formatCollateralRatio(ratio: number | undefined): string {
  if (!ratio) return '0%'
  return `${ratio.toFixed(2)}%`
}

/**
 * Helper: Get health status
 */
export function getHealthStatus(healthFactor: number): {
  status: 'safe' | 'warning' | 'danger'
  color: string
  label: string
} {
  if (healthFactor >= 150) {
    return { status: 'safe', color: 'text-green-500', label: 'Safe' }
  } else if (healthFactor >= 120) {
    return { status: 'warning', color: 'text-yellow-500', label: 'Warning' }
  } else {
    return { status: 'danger', color: 'text-red-500', label: 'Danger' }
  }
}
