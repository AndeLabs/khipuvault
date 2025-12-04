/**
 * @fileoverview Cooperative Pool V3 Read Queries
 * @module hooks/web3/cooperative/use-pool-queries
 *
 * All read-only queries for cooperative pool data
 */

'use client'

import { useAccount, useConfig } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { readContract } from '@wagmi/core'
import { formatEther, type Address } from 'viem'
import { MEZO_TESTNET_ADDRESSES, COOPERATIVE_POOL_V3_ABI as POOL_ABI } from '@/lib/web3/contracts-v3'
import {
  PoolInfo,
  MemberInfo,
  MemberWithAddress,
  PoolStatus,
  QUERY_KEYS,
  STALE_TIMES,
  REFETCH_INTERVALS,
} from './constants'

const poolAddress = MEZO_TESTNET_ADDRESSES.cooperativePoolV3 as Address

// ============================================================================
// GLOBAL POOL STATISTICS
// ============================================================================

/**
 * Get the total number of pools created
 */
export function usePoolCounter() {
  const { isConnected } = useAccount()
  const config = useConfig()

  return useQuery({
    queryKey: QUERY_KEYS.POOL_COUNTER,
    queryFn: async () => {
      const result = await readContract(config, {
        address: poolAddress,
        abi: POOL_ABI,
        functionName: 'poolCounter',
        args: [],
      })
      return Number(result || 0n)
    },
    enabled: isConnected,
    staleTime: STALE_TIMES.POOL_COUNTER,
  })
}

/**
 * Get the current performance fee (in basis points)
 */
export function usePerformanceFee() {
  const { isConnected } = useAccount()
  const config = useConfig()

  return useQuery({
    queryKey: QUERY_KEYS.PERFORMANCE_FEE,
    queryFn: async () => {
      const result = await readContract(config, {
        address: poolAddress,
        abi: POOL_ABI,
        functionName: 'performanceFee',
        args: [],
      })
      return Number(result || 0n)
    },
    enabled: isConnected,
    staleTime: STALE_TIMES.PERFORMANCE_FEE,
  })
}

/**
 * Check if emergency mode is active
 */
export function useEmergencyMode() {
  const { isConnected } = useAccount()
  const config = useConfig()

  return useQuery({
    queryKey: QUERY_KEYS.EMERGENCY_MODE,
    queryFn: async () => {
      const result = await readContract(config, {
        address: poolAddress,
        abi: POOL_ABI,
        functionName: 'emergencyMode',
        args: [],
      })
      return Boolean(result)
    },
    enabled: isConnected,
    staleTime: STALE_TIMES.EMERGENCY_MODE,
  })
}

// ============================================================================
// INDIVIDUAL POOL QUERIES
// ============================================================================

/**
 * Get detailed information about a specific pool
 * @param poolId - The ID of the pool to query
 */
export function usePoolInfo(poolId: number) {
  const config = useConfig()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.POOL_INFO(poolId),
    queryFn: async () => {
      if (poolId <= 0) return null

      try {
        console.log('🔄 Fetching pool info for pool:', poolId)

        const result = await readContract(config, {
          address: poolAddress,
          abi: POOL_ABI,
          functionName: 'getPoolInfo',
          args: [BigInt(poolId)],
        })

        if (!result) {
          console.error('❌ Invalid pool info data')
          return null
        }

        // Contract returns object, not array
        const poolInfo: PoolInfo = {
          minContribution: (result as any).minContribution || BigInt(0),
          maxContribution: (result as any).maxContribution || BigInt(0),
          maxMembers: Number((result as any).maxMembers || 0),
          currentMembers: Number((result as any).currentMembers || 0),
          createdAt: Number((result as any).createdAt || 0),
          status: ((result as any).status ?? 0) as PoolStatus,
          allowNewMembers: (result as any).allowNewMembers ?? false,
          creator: (result as any).creator as Address,
          name: (result as any).name || 'Unknown Pool',
          totalBtcDeposited: (result as any).totalBtcDeposited || BigInt(0),
          totalMusdMinted: (result as any).totalMusdMinted || BigInt(0),
          totalYieldGenerated: (result as any).totalYieldGenerated || BigInt(0)
        }

        console.log('✅ Pool info fetched:', {
          name: poolInfo.name,
          members: `${poolInfo.currentMembers}/${poolInfo.maxMembers}`,
          status: PoolStatus[poolInfo.status]
        })

        return poolInfo
      } catch (err) {
        console.error('❌ Error fetching pool info:', err)
        return null
      }
    },
    enabled: poolId > 0,
    staleTime: STALE_TIMES.POOL_INFO,
    refetchInterval: REFETCH_INTERVALS.POOL_INFO,
    retry: 2,
  })

  return { poolInfo: data, isLoading, error, refetch }
}

/**
 * Get member information for a specific address in a pool
 * @param poolId - The pool ID
 * @param memberAddress - Optional address to query (defaults to connected address)
 */
export function useMemberInfo(poolId: number, memberAddress?: Address) {
  const { address } = useAccount()
  const config = useConfig()
  const userAddress = memberAddress || address

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.MEMBER_INFO(poolId, userAddress as Address),
    queryFn: async () => {
      if (poolId <= 0 || !userAddress) return null

      try {
        console.log('🔄 Fetching member info for pool:', poolId, 'member:', userAddress)

        const result = await readContract(config, {
          address: poolAddress,
          abi: POOL_ABI,
          functionName: 'getMemberInfo',
          args: [BigInt(poolId), userAddress],
        })

        if (!result) {
          console.error('❌ Invalid member info data')
          return null
        }

        // Contract returns object, not array
        const memberInfo: MemberInfo = {
          btcContributed: (result as any).btcContributed || BigInt(0),
          shares: (result as any).shares || BigInt(0),
          joinedAt: Number((result as any).joinedAt || 0),
          active: (result as any).active ?? false,
          yieldClaimed: (result as any).yieldClaimed || BigInt(0)
        }

        console.log('✅ Member info fetched:', {
          active: memberInfo.active,
          contribution: formatEther(memberInfo.btcContributed),
        })

        return memberInfo
      } catch (err) {
        console.error('❌ Error fetching member info:', err)
        return null
      }
    },
    enabled: poolId > 0 && !!userAddress,
    staleTime: STALE_TIMES.MEMBER_INFO,
    refetchInterval: REFETCH_INTERVALS.MEMBER_INFO,
    retry: 2,
  })

  return { memberInfo: data, isLoading, error, refetch }
}

/**
 * Get all members of a pool with their information
 * @param poolId - The pool ID
 */
export function usePoolMembers(poolId: number) {
  const config = useConfig()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.POOL_MEMBERS(poolId),
    queryFn: async () => {
      if (poolId <= 0) return []

      try {
        console.log('🔄 Fetching members for pool:', poolId)

        const addresses = await readContract(config, {
          address: poolAddress,
          abi: POOL_ABI,
          functionName: 'getPoolMembers',
          args: [BigInt(poolId)],
        }) as Address[]

        if (!addresses || !Array.isArray(addresses)) {
          console.error('❌ Invalid members data')
          return []
        }

        // Fetch member info for each address
        const membersWithInfo = await Promise.all(
          addresses.map(async (addr) => {
            try {
              const result = await readContract(config, {
                address: poolAddress,
                abi: POOL_ABI,
                functionName: 'getMemberInfo',
                args: [BigInt(poolId), addr],
              })

              if (!result) {
                return null
              }

              // Contract returns object, not array
              const memberInfo: MemberWithAddress = {
                address: addr,
                btcContributed: (result as any).btcContributed || BigInt(0),
                shares: (result as any).shares || BigInt(0),
                joinedAt: Number((result as any).joinedAt || 0),
                active: (result as any).active ?? false,
                yieldClaimed: (result as any).yieldClaimed || BigInt(0)
              }

              return memberInfo
            } catch (err) {
              console.error('❌ Error fetching member info for:', addr, err)
              return null
            }
          })
        )

        const validMembers = membersWithInfo.filter((m): m is MemberWithAddress =>
          m !== null && m.active
        )

        console.log('✅ Pool members fetched:', validMembers.length, 'active members')

        return validMembers
      } catch (err) {
        console.error('❌ Error fetching pool members:', err)
        return []
      }
    },
    enabled: poolId > 0,
    staleTime: STALE_TIMES.POOL_MEMBERS,
    refetchInterval: REFETCH_INTERVALS.POOL_MEMBERS,
    retry: 2,
  })

  return { members: data || [], isLoading, error, refetch }
}

/**
 * Calculate pending yield for a member
 * @param poolId - The pool ID
 * @param memberAddress - Optional address to query (defaults to connected address)
 */
export function useMemberYield(poolId: number, memberAddress?: Address) {
  const { address } = useAccount()
  const config = useConfig()
  const userAddress = memberAddress || address

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.MEMBER_YIELD(poolId, userAddress as Address),
    queryFn: async () => {
      if (poolId <= 0 || !userAddress) return BigInt(0)

      try {
        const result = await readContract(config, {
          address: poolAddress,
          abi: POOL_ABI,
          functionName: 'calculateMemberYield',
          args: [BigInt(poolId), userAddress],
        })

        return BigInt(result as unknown as bigint || 0n)
      } catch (err) {
        console.error('❌ Error fetching member yield:', err)
        return BigInt(0)
      }
    },
    enabled: poolId > 0 && !!userAddress,
    staleTime: STALE_TIMES.MEMBER_YIELD,
    refetchInterval: REFETCH_INTERVALS.MEMBER_YIELD,
    retry: 2,
  })

  return { pendingYield: data || BigInt(0), isLoading, error, refetch }
}
