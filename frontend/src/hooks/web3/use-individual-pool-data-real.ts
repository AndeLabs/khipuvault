'use client'

import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { useState, useEffect } from 'react'
import { getContractAddress, INDIVIDUAL_POOL_ABI, ERC20_ABI } from '@/lib/web3/contracts'

/**
 * Real hook for Individual Pool data from Mezo Testnet
 * Replaces mock data with actual blockchain calls
 */
export function useIndividualPoolDataReal() {
  const { address, isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(true)

  // Get Individual Pool contract address
  const poolAddress = getContractAddress('individualPool') as `0x${string}`

  // Read pool statistics
  const { data: totalBtcData, isLoading: loadingTotalBtc } = useReadContract({
    address: poolAddress,
    abi: INDIVIDUAL_POOL_ABI,
    functionName: 'totalBtcDeposited',
    query: {
      enabled: isConnected,
    },
  })

  const { data: totalMusdData, isLoading: loadingTotalMusd } = useReadContract({
    address: poolAddress,
    abi: INDIVIDUAL_POOL_ABI,
    functionName: 'totalMusdMinted',
    query: {
      enabled: isConnected,
    },
  })

  const { data: totalYieldsData, isLoading: loadingTotalYields } = useReadContract({
    address: poolAddress,
    abi: INDIVIDUAL_POOL_ABI,
    functionName: 'totalYieldsGenerated',
    query: {
      enabled: isConnected,
    },
  })

  // Read user's specific deposit
  const { data: userDepositData, isLoading: loadingUserDeposit } = useReadContract({
    address: poolAddress,
    abi: INDIVIDUAL_POOL_ABI,
    functionName: 'userDeposits',
    args: [address!],
    query: {
      enabled: isConnected && !!address,
    },
  })

  // Get user's BTC balance
  const wbtcAddress = getContractAddress('wbtc') as `0x${string}`
  const { data: btcBalance, isLoading: loadingBtcBalance } = useReadContract({
    address: wbtcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: isConnected && !!address,
    },
  })

  // Get user's MUSD balance
  const musdAddress = getContractAddress('musd') as `0x${string}`
  const { data: musdBalance, isLoading: loadingMusdBalance } = useReadContract({
    address: musdAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: isConnected && !!address,
    },
  })

  // Get performance fee
  const { data: performanceFeeData, isLoading: loadingPerformanceFee } = useReadContract({
    address: poolAddress,
    abi: INDIVIDUAL_POOL_ABI,
    functionName: 'performanceFee',
    query: {
      enabled: isConnected,
    },
  })

  // Update loading state
  useEffect(() => {
    const isAnyLoading =
      loadingTotalBtc ||
      loadingTotalMusd ||
      loadingTotalYields ||
      loadingUserDeposit ||
      loadingBtcBalance ||
      loadingMusdBalance ||
      loadingPerformanceFee

    setIsLoading(isAnyLoading)
  }, [
    loadingTotalBtc,
    loadingTotalMusd,
    loadingTotalYields,
    loadingUserDeposit,
    loadingBtcBalance,
    loadingMusdBalance,
    loadingPerformanceFee,
  ])

  // Format pool stats
  const poolStats = {
    totalBtc: (totalBtcData as bigint) || BigInt(0),
    totalMusd: (totalMusdData as bigint) || BigInt(0),
    totalYields: (totalYieldsData as bigint) || BigInt(0),
    poolAPR: 6.2, // Fixed APR for Mezo
    memberCount: 0, // Would need separate counter contract
    isRecoveryMode: false,
  }

  // Format user deposit
  const userDeposit = userDepositData
    ? {
        btcAmount: (userDepositData[0] as bigint) || BigInt(0),
        musdMinted: (userDepositData[1] as bigint) || BigInt(0),
        yieldAccrued: (userDepositData[2] as bigint) || BigInt(0),
        depositTimestamp: Number(userDepositData[3] as bigint) || 0,
        lastYieldUpdate: Number(userDepositData[4] as bigint) || 0,
        active: (userDepositData[5] as boolean) || false,
      }
    : null

  // Format wallet balances
  const walletBalances = {
    btcBalance: (btcBalance as bigint) || BigInt(0),
    musdBalance: (musdBalance as bigint) || BigInt(0),
  }

  // Performance fee (in basis points, 100 = 1%)
  const performanceFee = Number(performanceFeeData as bigint) || 100

  return {
    poolStats,
    userDeposit,
    walletBalances,
    performanceFee,
    isLoading,
    isConnected,
    address,
    contractsConfigured: {
      pool: poolAddress !== '0x0000000000000000000000000000000000000000',
      wbtc: wbtcAddress !== '0x0000000000000000000000000000000000000000',
      musd: musdAddress !== '0x0000000000000000000000000000000000000000',
    },
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
    yieldsClaimed: yieldNum.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    feePaid: feePaid.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    netYield: netYield.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  }
}
