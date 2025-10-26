'use client'

import { useAccount, useReadContract, useBalance } from 'wagmi'
import { useState, useEffect } from 'react'
import { MEZO_TESTNET_ADDRESSES, INDIVIDUAL_POOL_ABI, ERC20_ABI } from '@/lib/web3/contracts'

/**
 * Production hook for Individual Pool data on Mezo Testnet
 * Uses native BTC (no WBTC needed)
 */
export function useIndividualPool() {
  const { address, isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(true)

  // Get Individual Pool contract address
  const poolAddress = MEZO_TESTNET_ADDRESSES.individualPool as `0x${string}`
  const musdAddress = MEZO_TESTNET_ADDRESSES.musd as `0x${string}`

  // Read pool statistics
  const { data: totalMusdDepositedData, isLoading: loadingTotalMusdDeposited, refetch: refetchTotalMusdDeposited } = useReadContract({
    address: poolAddress,
    abi: INDIVIDUAL_POOL_ABI,
    functionName: 'totalMusdDeposited',
    query: {
      enabled: isConnected && poolAddress !== '0x0000000000000000000000000000000000000000',
    },
  })

  const { data: totalYieldsData, isLoading: loadingTotalYields, refetch: refetchTotalYields } = useReadContract({
    address: poolAddress,
    abi: INDIVIDUAL_POOL_ABI,
    functionName: 'totalYieldsGenerated',
    query: {
      enabled: isConnected && poolAddress !== '0x0000000000000000000000000000000000000000',
    },
  })

  // Read user's specific deposit
  const { data: userDepositData, isLoading: loadingUserDeposit, refetch: refetchUserDeposit } = useReadContract({
    address: poolAddress,
    abi: INDIVIDUAL_POOL_ABI,
    functionName: 'userDeposits',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && poolAddress !== '0x0000000000000000000000000000000000000000',
    },
  })

  // Note: Native BTC balance no longer needed for MUSD-only deposits

  // Get user's MUSD balance
  const { data: musdBalanceData, isLoading: loadingMusdBalance, refetch: refetchMusdBalance } = useReadContract({
    address: musdAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && musdAddress !== '0x0000000000000000000000000000000000000000',
    },
  })

  // Get performance fee
  const { data: performanceFeeData, isLoading: loadingPerformanceFee } = useReadContract({
    address: poolAddress,
    abi: INDIVIDUAL_POOL_ABI,
    functionName: 'performanceFee',
    query: {
      enabled: isConnected && poolAddress !== '0x0000000000000000000000000000000000000000',
    },
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
    totalMusdDeposited: (totalMusdDepositedData as bigint) || BigInt(0),
    totalYields: (totalYieldsData as bigint) || BigInt(0),
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
    musdBalance: (musdBalanceData as bigint) || BigInt(0),
  }

  // Performance fee (in basis points, 100 = 1%)
  const performanceFee = Number(performanceFeeData as bigint) || 100

  // Refetch all data function
  const refetchAll = () => {
    refetchTotalMusdDeposited()
    refetchTotalYields()
    refetchUserDeposit()
    refetchMusdBalance()
  }

  return {
    poolStats,
    userDeposit,
    walletBalances,
    performanceFee,
    isLoading,
    isConnected,
    address,
    refetchAll,
    contractsConfigured: {
      pool: poolAddress !== '0x0000000000000000000000000000000000000000',
      musd: musdAddress !== '0x0000000000000000000000000000000000000000',
    },
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
 */
export function calculateUSD(btcAmount: bigint, btcPrice: number = 60000): string {
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
