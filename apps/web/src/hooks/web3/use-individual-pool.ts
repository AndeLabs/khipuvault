'use client'

import { useAccount, useConfig } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { readContract } from 'wagmi/actions'
import { useState, useEffect } from 'react'
import { MEZO_TESTNET_ADDRESSES, INDIVIDUAL_POOL_ABI, ERC20_ABI } from '@/lib/web3/contracts'
import { ZERO_ADDRESS } from '@/contracts/addresses'

/**
 * Production hook for Individual Pool data on Mezo Testnet
 * Uses TanStack Query with 'individual-pool' queryKey for real-time updates
 */
export function useIndividualPool() {
  const { address, isConnected } = useAccount()
  const config = useConfig()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(true)

  // Get Individual Pool contract address
  const poolAddress = MEZO_TESTNET_ADDRESSES.individualPool as `0x${string}`
  const musdAddress = MEZO_TESTNET_ADDRESSES.musd as `0x${string}`

  // Read pool statistics - MIGRATED TO TANSTACK QUERY
  const { data: totalMusdDepositedData, isLoading: loadingTotalMusdDeposited } = useQuery({
    queryKey: ['individual-pool', 'total-musd-deposited'],
    queryFn: async () => {
      return await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: 'totalMusdDeposited',
        args: [],
      })
    },
    enabled: isConnected && poolAddress !== ZERO_ADDRESS,
    staleTime: 10 * 1000, // 10 seconds
  })

  const { data: totalYieldsData, isLoading: loadingTotalYields } = useQuery({
    queryKey: ['individual-pool', 'total-yields'],
    queryFn: async () => {
      return await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: 'totalYieldsGenerated',
        args: [],
      })
    },
    enabled: isConnected && poolAddress !== ZERO_ADDRESS,
    staleTime: 10 * 1000,
  })

  // Read user's specific deposit - MIGRATED TO TANSTACK QUERY
  const {
    data: userDepositData,
    isLoading: loadingUserDeposit,
  } = useQuery({
    queryKey: ['individual-pool', 'user-deposit', address || 'none'],
    queryFn: async () => {
      if (!address) return null
      return await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: 'userDeposits',
        args: [address],
      })
    },
    enabled: isConnected && !!address && poolAddress !== ZERO_ADDRESS,
    staleTime: 10 * 1000,
  })


  // Get user's MUSD balance - MIGRATED TO TANSTACK QUERY
  const {
    data: musdBalanceData,
    isLoading: loadingMusdBalance,
  } = useQuery({
    queryKey: ['individual-pool', 'musd-balance', address || 'none'],
    queryFn: async () => {
      if (!address) return null
      return await readContract(config, {
        address: musdAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      })
    },
    enabled: isConnected && !!address && musdAddress !== ZERO_ADDRESS,
    staleTime: 10 * 1000,
  })


  // Get performance fee - MIGRATED TO TANSTACK QUERY
  const { data: performanceFeeData, isLoading: loadingPerformanceFee } = useQuery({
    queryKey: ['individual-pool', 'performance-fee'],
    queryFn: async () => {
      return await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: 'performanceFee',
        args: [],
      })
    },
    enabled: isConnected && poolAddress !== ZERO_ADDRESS,
    staleTime: 60 * 1000, // 60 seconds - performance fee rarely changes
  })

  // Update loading state
  useEffect(() => {
    const isAnyLoading =
      loadingTotalMusdDeposited ||
      loadingTotalYields ||
      loadingUserDeposit ||
      loadingMusdBalance ||
      loadingPerformanceFee

    setIsLoading(isAnyLoading)
  }, [
    loadingTotalMusdDeposited,
    loadingTotalYields,
    loadingUserDeposit,
    loadingMusdBalance,
    loadingPerformanceFee,
  ])

  // Format pool stats
  const poolStats = {
    totalMusdDeposited: BigInt(totalMusdDepositedData as unknown as bigint || 0n),
    totalYields: BigInt(totalYieldsData as unknown as bigint || 0n),
    poolAPR: 6.2, // MUSD protocol APR on Mezo
    memberCount: 0, // Would need separate counter
    isRecoveryMode: false,
  }

  // Format user deposit - Structure from IndividualPool.sol (MUSD-only)
  // UserDeposit struct: {musdAmount, yieldAccrued, depositTimestamp, lastYieldUpdate, active}
  const userDeposit = userDepositData
    ? {
        musdAmount: (userDepositData as any)[0] as bigint || BigInt(0),
        yieldAccrued: (userDepositData as any)[1] as bigint || BigInt(0),
        depositTimestamp: Number((userDepositData as any)[2] as bigint) || 0,
        lastYieldUpdate: Number((userDepositData as any)[3] as bigint) || 0,
        active: (userDepositData as any)[4] as boolean || false,
      }
    : null

  // Format wallet balances (MUSD only for deposits)
  const walletBalances = {
    musdBalance: BigInt(musdBalanceData as unknown as bigint || 0n),
  }

  // Performance fee (in basis points, 100 = 1%)
  const performanceFee = Number(performanceFeeData as unknown as bigint || 0n) || 100

  // Debug tools for troubleshooting (no-op in production)
  const debugTools = {
    manualRefetch: () => queryClient.refetchQueries({ queryKey: ['individual-pool'] }),
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: ['individual-pool'] }),
    getQueryState: () => queryClient.getQueryCache().findAll({ queryKey: ['individual-pool'] }),
    getCurrentData: () => ({
      userDeposit: userDeposit ? {
        musdAmount: userDeposit.musdAmount.toString(),
        yieldAccrued: userDeposit.yieldAccrued.toString(),
      } : null,
      musdBalance: walletBalances.musdBalance.toString(),
      poolStats: {
        totalMusdDeposited: poolStats.totalMusdDeposited.toString(),
        totalYields: poolStats.totalYields.toString(),
      }
    }),
  }

  return {
    poolStats,
    userDeposit,
    walletBalances,
    performanceFee,
    isLoading,
    isConnected,
    address,
    contractsConfigured: {
      pool: poolAddress !== ZERO_ADDRESS,
      musd: musdAddress !== ZERO_ADDRESS,
    },
    _debug: debugTools, // Debug tools (prefix with _ to indicate internal use)
  }
}

/**
 * Format BTC with proper decimals (18 on Mezo, not 8)
 */
export function formatBTC(value: bigint | undefined): string {
  if (!value) return '0.000000'
  return (Number(value) / 1e18).toFixed(6)
}

/**
 * Format BTC to display (shorter version)
 */
export function formatBTCDisplay(value: bigint | undefined): string {
  if (!value) return '0.00'
  const num = Number(value) / 1e18
  if (num < 0.01) return num.toFixed(6)
  return num.toFixed(2)
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

/**
 * Format MUSD for display (shorter)
 */
export function formatMUSDDisplay(value: bigint | undefined): string {
  if (!value) return '0'
  const num = Number(value) / 1e18
  if (num < 1000) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

/**
 * Calculate USD value (rough estimate)
 * Note: For real-time prices, use useBTCPrice hook instead
 */
export function calculateUSD(btcAmount: bigint, btcPrice: number = 95000): string {
  const btc = Number(btcAmount) / 1e18
  const usd = btc * btcPrice
  return usd.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

/**
 * Calculate yield earned with fee deduction
 */
export function calculateYieldAfterFee(
  yieldAmount: bigint,
  performanceFee: number
): {
  yieldsClaimed: string
  feePaid: string
  netYield: string
} {
  const yieldNum = Number(yieldAmount) / 1e18
  const feePercent = performanceFee / 10000 // Convert basis points to percentage
  const feePaid = yieldNum * feePercent
  const netYield = yieldNum - feePaid

  return {
    yieldsClaimed: yieldNum.toFixed(6),
    feePaid: feePaid.toFixed(6),
    netYield: netYield.toFixed(6),
  }
}

/**
 * Calculate time since deposit
 */
export function formatTimeSince(timestamp: number): string {
  if (!timestamp || timestamp === 0) return 'Sin depósito'
  
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp
  
  const days = Math.floor(diff / 86400)
  const hours = Math.floor((diff % 86400) / 3600)
  
  if (days > 0) {
    return `${days} día${days !== 1 ? 's' : ''}`
  }
  if (hours > 0) {
    return `${hours} hora${hours !== 1 ? 's' : ''}`
  }
  return 'Menos de 1 hora'
}


// Alias export for backward compatibility
export { useIndividualPool as useIndividualPoolData }
