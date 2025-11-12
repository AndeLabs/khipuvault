/**
 * @fileoverview Mezo Stability Pool Hook - Production Ready
 * @module hooks/web3/use-stability-pool
 *
 * Comprehensive hook for interacting with StabilityPoolStrategy contract
 * Earn BTC rewards from liquidations by depositing MUSD
 *
 * Features:
 * - Deposit MUSD to earn liquidation rewards
 * - Withdraw MUSD
 * - Claim collateral gains (BTC)
 * - Real-time position tracking
 * - TVL and APY calculations
 * - Auto-refetch on block changes
 * - Production-grade error handling
 */

'use client'

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBlockNumber } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { parseEther, formatEther } from 'viem'
import { MEZO_TESTNET_ADDRESSES } from '@/lib/web3/contracts'

const STABILITY_POOL_STRATEGY_ADDRESS = '0xe6e0608abEf8f31847C1c9367465DbF68A040Edc' as `0x${string}`

// Minimal ABI for StabilityPoolStrategy contract
const STABILITY_POOL_STRATEGY_ABI = [
  {
    type: 'function',
    name: 'depositMUSD',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_amount', type: 'uint256' }],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'withdrawMUSD',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_amount', type: 'uint256' }],
    outputs: [{ name: 'sharesBurned', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'claimCollateralGains',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: 'collateralGains', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getUserMusdValue',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: 'musdValue', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getUserPendingGains',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: 'pendingGains', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getUserSharePercentage',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: 'sharePct', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getUserPosition',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [
      {
        name: 'position',
        type: 'tuple',
        components: [
          { name: 'shares', type: 'uint256' },
          { name: 'lastCollateralSnapshot', type: 'uint256' },
          { name: 'pendingCollateralGains', type: 'uint256' },
          { name: 'depositTimestamp', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getTVL',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'tvl', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getEstimatedAPY',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'apy', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalShares',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalMusdDeposited',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'performanceFee',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'Deposited',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'musdAmount', type: 'uint256', indexed: false },
      { name: 'sharesIssued', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Withdrawn',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'musdAmount', type: 'uint256', indexed: false },
      { name: 'sharesBurned', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'CollateralGainsClaimed',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'collateralAmount', type: 'uint256', indexed: false },
      { name: 'feeAmount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const

/**
 * User position in Stability Pool
 */
export interface StabilityPoolPosition {
  shares: bigint
  musdValue: bigint
  pendingCollateralGains: bigint
  sharePercentage: number // in basis points (10000 = 100%)
  depositTimestamp: bigint
  daysActive: number
}

/**
 * Stability Pool stats
 */
export interface StabilityPoolStats {
  tvl: bigint
  estimatedAPY: number // in percentage
  totalShares: bigint
  performanceFee: number // in basis points
}

/**
 * Hook for Stability Pool operations
 *
 * Usage:
 * ```tsx
 * const {
 *   position,
 *   stats,
 *   deposit,
 *   withdraw,
 *   claimRewards,
 *   isDepositing,
 *   isWithdrawing,
 *   isClaiming,
 *   error
 * } = useStabilityPool()
 *
 * // Deposit 100 MUSD
 * await deposit(parseEther('100'))
 *
 * // Withdraw 50 MUSD
 * await withdraw(parseEther('50'))
 *
 * // Claim BTC rewards
 * await claimRewards()
 * ```
 */
export function useStabilityPool() {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()

  // Watch block number for real-time updates
  const { data: blockNumber } = useBlockNumber({ watch: true })

  // Get user MUSD value
  const { data: userMusdValue, refetch: refetchMusdValue } = useReadContract({
    address: STABILITY_POOL_STRATEGY_ADDRESS,
    abi: STABILITY_POOL_STRATEGY_ABI,
    functionName: 'getUserMusdValue',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
      staleTime: 10 * 1000,
    },
  })

  // Get user pending gains
  const { data: userPendingGains, refetch: refetchPendingGains } = useReadContract({
    address: STABILITY_POOL_STRATEGY_ADDRESS,
    abi: STABILITY_POOL_STRATEGY_ABI,
    functionName: 'getUserPendingGains',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
      staleTime: 10 * 1000,
    },
  })

  // Get user share percentage
  const { data: userSharePercentage } = useReadContract({
    address: STABILITY_POOL_STRATEGY_ADDRESS,
    abi: STABILITY_POOL_STRATEGY_ABI,
    functionName: 'getUserSharePercentage',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
      staleTime: 10 * 1000,
    },
  })

  // Get user position details
  const { data: userPosition, refetch: refetchPosition } = useReadContract({
    address: STABILITY_POOL_STRATEGY_ADDRESS,
    abi: STABILITY_POOL_STRATEGY_ABI,
    functionName: 'getUserPosition',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
      staleTime: 10 * 1000,
    },
  })

  // Get pool stats
  const { data: tvl } = useReadContract({
    address: STABILITY_POOL_STRATEGY_ADDRESS,
    abi: STABILITY_POOL_STRATEGY_ABI,
    functionName: 'getTVL',
    query: {
      enabled: isConnected,
      staleTime: 30 * 1000,
    },
  })

  const { data: estimatedAPY } = useReadContract({
    address: STABILITY_POOL_STRATEGY_ADDRESS,
    abi: STABILITY_POOL_STRATEGY_ABI,
    functionName: 'getEstimatedAPY',
    query: {
      enabled: isConnected,
      staleTime: 30 * 1000,
    },
  })

  const { data: totalShares } = useReadContract({
    address: STABILITY_POOL_STRATEGY_ADDRESS,
    abi: STABILITY_POOL_STRATEGY_ABI,
    functionName: 'totalShares',
    query: {
      enabled: isConnected,
      staleTime: 30 * 1000,
    },
  })

  const { data: performanceFee } = useReadContract({
    address: STABILITY_POOL_STRATEGY_ADDRESS,
    abi: STABILITY_POOL_STRATEGY_ABI,
    functionName: 'performanceFee',
    query: {
      enabled: isConnected,
      staleTime: 60 * 1000,
    },
  })

  // Refetch on block changes
  useEffect(() => {
    if (blockNumber) {
      refetchMusdValue()
      refetchPendingGains()
      refetchPosition()
    }
  }, [blockNumber, refetchMusdValue, refetchPendingGains, refetchPosition])

  // Write contract: deposit
  const {
    writeContract: writeDeposit,
    data: depositTxHash,
    error: depositError,
    isPending: isDepositPending,
  } = useWriteContract()

  const {
    isLoading: isDepositConfirming,
    isSuccess: isDepositConfirmed,
  } = useWaitForTransactionReceipt({
    hash: depositTxHash,
    pollingInterval: 1000,
  })

  // Write contract: withdraw
  const {
    writeContract: writeWithdraw,
    data: withdrawTxHash,
    error: withdrawError,
    isPending: isWithdrawPending,
  } = useWriteContract()

  const {
    isLoading: isWithdrawConfirming,
    isSuccess: isWithdrawConfirmed,
  } = useWaitForTransactionReceipt({
    hash: withdrawTxHash,
    pollingInterval: 1000,
  })

  // Write contract: claim
  const {
    writeContract: writeClaim,
    data: claimTxHash,
    error: claimError,
    isPending: isClaimPending,
  } = useWriteContract()

  const {
    isLoading: isClaimConfirming,
    isSuccess: isClaimConfirmed,
  } = useWaitForTransactionReceipt({
    hash: claimTxHash,
    pollingInterval: 1000,
  })

  /**
   * Deposit MUSD to Stability Pool
   * @param amount Amount of MUSD to deposit (in wei)
   */
  async function deposit(amount: bigint): Promise<void> {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    const minDeposit = parseEther('10') // 10 MUSD minimum
    if (amount < minDeposit) {
      throw new Error('Minimum deposit is 10 MUSD')
    }

    writeDeposit({
      address: STABILITY_POOL_STRATEGY_ADDRESS,
      abi: STABILITY_POOL_STRATEGY_ABI,
      functionName: 'depositMUSD',
      args: [amount],
    })
  }

  /**
   * Withdraw MUSD from Stability Pool
   * @param amount Amount of MUSD to withdraw (in wei)
   */
  async function withdraw(amount: bigint): Promise<void> {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    if (amount <= 0n) {
      throw new Error('Amount must be greater than 0')
    }

    writeWithdraw({
      address: STABILITY_POOL_STRATEGY_ADDRESS,
      abi: STABILITY_POOL_STRATEGY_ABI,
      functionName: 'withdrawMUSD',
      args: [amount],
    })
  }

  /**
   * Claim collateral gains (BTC rewards)
   */
  async function claimRewards(): Promise<void> {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    writeClaim({
      address: STABILITY_POOL_STRATEGY_ADDRESS,
      abi: STABILITY_POOL_STRATEGY_ABI,
      functionName: 'claimCollateralGains',
    })
  }

  /**
   * Calculate days active
   */
  function calculateDaysActive(depositTimestamp: bigint): number {
    if (depositTimestamp === 0n) return 0
    const now = Math.floor(Date.now() / 1000)
    const secondsActive = now - Number(depositTimestamp)
    return Math.floor(secondsActive / 86400)
  }

  /**
   * Parse user position
   */
  const position: StabilityPoolPosition | null = userPosition && userMusdValue !== undefined
    ? {
        shares: userPosition[0],
        musdValue: userMusdValue as bigint,
        pendingCollateralGains: (userPendingGains as bigint) || 0n,
        sharePercentage: userSharePercentage ? Number(userSharePercentage) / 100 : 0,
        depositTimestamp: userPosition[3],
        daysActive: calculateDaysActive(userPosition[3]),
      }
    : null

  /**
   * Parse pool stats
   */
  const stats: StabilityPoolStats = {
    tvl: (tvl as bigint) || 0n,
    estimatedAPY: estimatedAPY ? Number(estimatedAPY) / 100 : 0,
    totalShares: (totalShares as bigint) || 0n,
    performanceFee: performanceFee ? Number(performanceFee) : 0,
  }

  /**
   * Auto-refetch when transactions confirm
   */
  useEffect(() => {
    if (isDepositConfirmed || isWithdrawConfirmed || isClaimConfirmed) {
      const timer = setTimeout(() => {
        refetchMusdValue()
        refetchPendingGains()
        refetchPosition()
        queryClient.invalidateQueries({ queryKey: ['stability-pool'] })
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isDepositConfirmed, isWithdrawConfirmed, isClaimConfirmed, refetchMusdValue, refetchPendingGains, refetchPosition, queryClient])

  return {
    // Position data
    position,
    hasPosition: position && position.musdValue > 0n,

    // Pool stats
    stats,

    // Actions
    deposit,
    withdraw,
    claimRewards,

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

    // Claim states
    isClaiming: isClaimPending,
    isClaimConfirming,
    isClaimConfirmed,
    claimTxHash,

    // Errors and states
    error: depositError?.message || withdrawError?.message || claimError?.message || null,
    isLoading: isDepositPending || isWithdrawPending || isClaimPending || isDepositConfirming || isWithdrawConfirming || isClaimConfirming,
    isConnected: isConnected && !!address,

    // Utilities
    refetchPosition: () => {
      refetchMusdValue()
      refetchPendingGains()
      refetchPosition()
    },
  }
}

/**
 * Helper: Format APY
 */
export function formatAPY(apy: number | undefined): string {
  if (!apy) return '0.00%'
  return `${apy.toFixed(2)}%`
}

/**
 * Helper: Format share percentage
 */
export function formatSharePercentage(sharePct: number | undefined): string {
  if (!sharePct) return '0.00%'
  return `${sharePct.toFixed(2)}%`
}

/**
 * Helper: Format fee
 */
export function formatFee(fee: number | undefined): string {
  if (!fee) return '0%'
  return `${(fee / 100).toFixed(2)}%`
}
