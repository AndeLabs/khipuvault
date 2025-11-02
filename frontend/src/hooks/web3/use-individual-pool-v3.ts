

'use client'

import { useAccount, useConfig } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { readContract } from 'wagmi/actions'
import { 
  MEZO_TESTNET_ADDRESSES, 
  INDIVIDUAL_POOL_ABI, 
  ERC20_ABI,
  V3_FEATURES,
  type UserInfoV3,
  type ReferralStats,
} from '@/lib/web3/contracts-v3'

/**
 * Production hook for IndividualPoolV3 with all V3 features
 * 
 * V3 Features:
 * ✅ Auto-Compound
 * ✅ Referral System  
 * ✅ Incremental Deposits
 * ✅ Partial Withdrawals
 * ✅ Enhanced View Functions
 */
export function useIndividualPoolV3() {
  const { address, isConnected } = useAccount()
  const config = useConfig()
  const queryClient = useQueryClient()

  const poolAddress = MEZO_TESTNET_ADDRESSES.individualPoolV3 as `0x${string}`
  const musdAddress = MEZO_TESTNET_ADDRESSES.musd as `0x${string}`

  // ========================================================================
  // POOL STATISTICS
  // ========================================================================

  const { data: totalMusdDeposited } = useQuery({
    queryKey: ['individual-pool-v3', 'total-musd'],
    queryFn: async () => {
      return await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: 'totalMusdDeposited',
        args: [],
      })
    },
    enabled: isConnected,
    staleTime: 10_000,
  })

  const { data: totalYieldsGenerated } = useQuery({
    queryKey: ['individual-pool-v3', 'total-yields'],
    queryFn: async () => {
      return await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: 'totalYieldsGenerated',
        args: [],
      })
    },
    enabled: isConnected,
    staleTime: 10_000,
  })

  const { data: totalReferralRewards } = useQuery({
    queryKey: ['individual-pool-v3', 'total-referral-rewards'],
    queryFn: async () => {
      return await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: 'totalReferralRewards',
        args: [],
      })
    },
    enabled: isConnected,
    staleTime: 10_000,
  })

  // ========================================================================
  // USER DATA (V3 Enhanced)
  // ========================================================================

  // Use getUserInfo() instead of userDeposits - V3 feature!
  const { 
    data: userInfoRaw, 
    isLoading: loadingUserInfo,
    refetch: refetchUserInfo,
  } = useQuery({
    queryKey: ['individual-pool-v3', 'user-info', address],
    queryFn: async () => {
      if (!address) return null
      console.log('🔄 [V3] Fetching user info for:', address)
      const result = await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: 'getUserInfo',
        args: [address],
      })
      console.log('📊 [V3] User info fetched:', result)
      console.log('  - Deposit:', result[0]?.toString(), 'wei')
      console.log('  - Yields:', result[1]?.toString(), 'wei')
      return result as unknown as [bigint, bigint, bigint, bigint, bigint, boolean]
    },
    enabled: isConnected && !!address,
    staleTime: 5_000,
    refetchInterval: 10_000,
  })

  // Parse getUserInfo result
  const userInfo: UserInfoV3 | null = userInfoRaw ? {
    deposit: userInfoRaw[0],
    yields: userInfoRaw[1],
    netYields: userInfoRaw[2],
    daysActive: userInfoRaw[3],
    estimatedAPR: userInfoRaw[4],
    autoCompoundEnabled: userInfoRaw[5],
  } : null

  // Get user total balance (principal + net yields)
  const { data: userTotalBalance } = useQuery({
    queryKey: ['individual-pool-v3', 'user-total-balance', address],
    queryFn: async () => {
      if (!address) return null
      return await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: 'getUserTotalBalance',
        args: [address],
      })
    },
    enabled: isConnected && !!address,
    staleTime: 5_000,
  })

  // ========================================================================
  // REFERRAL SYSTEM
  // ========================================================================

  const { data: referralStatsRaw } = useQuery({
    queryKey: ['individual-pool-v3', 'referral-stats', address],
    queryFn: async () => {
      if (!address) return null
      const result = await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: 'getReferralStats',
        args: [address],
      })
      return result as unknown as [bigint, bigint, string]
    },
    enabled: isConnected && !!address,
    staleTime: 30_000,
  })

  const referralStats: ReferralStats | null = referralStatsRaw ? {
    count: referralStatsRaw[0],
    rewards: referralStatsRaw[1],
    referrer: referralStatsRaw[2],
  } : null

  // ========================================================================
  // WALLET BALANCES
  // ========================================================================

  const { data: musdBalance } = useQuery({
    queryKey: ['individual-pool-v3', 'musd-balance', address],
    queryFn: async () => {
      if (!address) return null
      return await readContract(config, {
        address: musdAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      })
    },
    enabled: isConnected && !!address,
    staleTime: 10_000,
  })

  // ========================================================================
  // CONTRACT CONFIGURATION
  // ========================================================================

  const { data: performanceFee } = useQuery({
    queryKey: ['individual-pool-v3', 'performance-fee'],
    queryFn: async () => {
      return await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: 'performanceFee',
        args: [],
      })
    },
    enabled: isConnected,
    staleTime: 60_000,
  })

  const { data: emergencyMode } = useQuery({
    queryKey: ['individual-pool-v3', 'emergency-mode'],
    queryFn: async () => {
      return await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: 'emergencyMode',
        args: [],
      })
    },
    enabled: isConnected,
    staleTime: 30_000,
  })

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================

  const poolStats = {
    totalMusdDeposited: (totalMusdDeposited as bigint) || BigInt(0),
    totalYields: (totalYieldsGenerated as bigint) || BigInt(0),
    totalReferralRewards: (totalReferralRewards as bigint) || BigInt(0),
    poolAPR: userInfo?.estimatedAPR ? Number(userInfo.estimatedAPR) / 100 : 6.2,
    emergencyMode: emergencyMode as boolean || false,
  }

  const walletBalances = {
    musdBalance: (musdBalance as bigint) || BigInt(0),
  }

  const hasActiveDeposit = userInfo ? userInfo.deposit > BigInt(0) : false
  const canWithdrawPartial = hasActiveDeposit && userInfo ? 
    userInfo.deposit >= BigInt(V3_FEATURES.individualPool.minWithdrawal) : false
  const shouldShowAutoCompound = hasActiveDeposit && userInfo ?
    userInfo.yields >= BigInt(V3_FEATURES.individualPool.autoCompoundThreshold) : false

  // ========================================================================
  // HELPER FUNCTIONS
  // ========================================================================

  const refetchAll = () => {
    console.log('🔄 [V3] Refetching all data...')
    return queryClient.refetchQueries({ queryKey: ['individual-pool-v3'] })
  }

  const invalidateAll = () => {
    console.log('🗑️ [V3] Invalidating all data...')
    return queryClient.invalidateQueries({ queryKey: ['individual-pool-v3'] })
  }

  return {
    // Pool Statistics
    poolStats,
    poolTVL: totalMusdDeposited as bigint || BigInt(0),
    
    // User Data
    userInfo,
    userTotalBalance: (userTotalBalance as bigint) || BigInt(0),
    hasActiveDeposit,
    
    // Referral System
    referralStats,
    hasReferralRewards: referralStats ? referralStats.rewards > BigInt(0) : false,
    referralCount: referralStats?.count || BigInt(0),
    
    // Wallet
    walletBalances,
    
    // Contract Config
    performanceFee: Number(performanceFee as bigint) || V3_FEATURES.individualPool.performanceFee,
    emergencyMode: poolStats.emergencyMode,
    
    // UI Helpers
    canWithdrawPartial,
    shouldShowAutoCompound,
    autoCompoundEnabled: userInfo?.autoCompoundEnabled || false,
    
    // V3 Features Info
    features: V3_FEATURES.individualPool,
    
    // Loading States
    isLoading: loadingUserInfo,
    isConnected,
    address,
    
    // Actions
    refetchAll,
    invalidateAll,
    refetchUserInfo,
    
    // Contract Addresses
    contracts: {
      pool: poolAddress,
      musd: musdAddress,
    },
  }
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

export function formatMUSD(value: bigint | undefined): string {
  if (!value) return '0.00'
  const num = Number(value) / 1e18
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatMUSDCompact(value: bigint | undefined): string {
  if (!value) return '0'
  const num = Number(value) / 1e18
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toFixed(2)
}

export function formatAPR(apr: bigint | number): string {
  const value = typeof apr === 'bigint' ? Number(apr) / 100 : apr
  return `${value.toFixed(2)}%`
}

export function formatDays(days: bigint | number): string {
  const value = typeof days === 'bigint' ? Number(days) : days
  if (value === 0) return 'Hoy'
  if (value === 1) return '1 día'
  return `${value} días`
}

export function formatReferralBonus(): string {
  return `${(V3_FEATURES.individualPool.referralBonus / 100).toFixed(2)}%`
}

export function calculateFee(amount: bigint, feeBps: number): bigint {
  return (amount * BigInt(feeBps)) / BigInt(10000)
}

export function calculateNetAmount(gross: bigint, feeBps: number): bigint {
  const fee = calculateFee(gross, feeBps)
  return gross - fee
}

// Backward compatibility
export { useIndividualPoolV3 as useIndividualPoolData }
