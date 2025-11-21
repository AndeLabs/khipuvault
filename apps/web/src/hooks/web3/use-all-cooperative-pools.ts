/**
 * @fileoverview Hook to fetch all Cooperative Pools V3
 *
 * Features:
 * ✅ Fetch all pools with complete info
 * ✅ Filter by status (ACCEPTING, ACTIVE, CLOSED)
 * ✅ Sort by various criteria
 * ✅ User membership detection
 * ✅ Aggregate statistics
 */

'use client'

import { useAccount, useConfig } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { readContract } from '@wagmi/core'
import { type Address } from 'viem'
import {
  MEZO_TESTNET_ADDRESSES,
  COOPERATIVE_POOL_V3_ABI as POOL_ABI,
} from '@/lib/web3/contracts-v3'
import { PoolStatus, type PoolInfo } from './use-cooperative-pool-v3'

export interface PoolWithMembership extends PoolInfo {
  poolId: number
  isMember: boolean
  userContribution: bigint
  userShares: bigint
  userPendingYield: bigint
}

export interface PoolsStatistics {
  totalPools: number
  acceptingPools: number
  activePools: number
  closedPools: number
  totalBtcLocked: bigint
  totalMembers: number
  userMemberships: number
}

export function useAllCooperativePools() {
  const { address, isConnected } = useAccount()
  const config = useConfig()
  const poolAddress = MEZO_TESTNET_ADDRESSES.cooperativePoolV3 as Address

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cooperative-pool-v3', 'all-pools', address],
    queryFn: async () => {
      try {
        console.log('🔄 Fetching all cooperative pools...')

        // Get pool counter
        const poolCounter = await readContract(config, {
          address: poolAddress,
          abi: POOL_ABI,
          functionName: 'poolCounter',
          args: [],
        })

        const totalPools = Number(poolCounter || 0n)
        console.log('📊 Total pools:', totalPools)

        if (totalPools === 0) {
          return {
            pools: [],
            statistics: {
              totalPools: 0,
              acceptingPools: 0,
              activePools: 0,
              closedPools: 0,
              totalBtcLocked: BigInt(0),
              totalMembers: 0,
              userMemberships: 0,
            } as PoolsStatistics
          }
        }

        // Fetch all pools (pool IDs start from 1)
        const poolPromises = Array.from({ length: totalPools }, (_, i) => i + 1).map(async (poolId) => {
          try {
            // Get pool info
            const poolInfoResult = await readContract(config, {
              address: poolAddress,
              abi: POOL_ABI,
              functionName: 'getPoolInfo',
              args: [BigInt(poolId)],
            })

            // Contract returns an object, not an array
            if (!poolInfoResult) {
              console.warn(`⚠️ Invalid pool info for pool ${poolId}`)
              return null
            }

            // Access as object properties (viem returns struct as object)
            const poolInfo: PoolInfo = {
              minContribution: (poolInfoResult as any).minContribution || BigInt(0),
              maxContribution: (poolInfoResult as any).maxContribution || BigInt(0),
              maxMembers: Number((poolInfoResult as any).maxMembers || 0),
              currentMembers: Number((poolInfoResult as any).currentMembers || 0),
              createdAt: Number((poolInfoResult as any).createdAt || 0),
              status: ((poolInfoResult as any).status ?? 0) as PoolStatus,
              allowNewMembers: (poolInfoResult as any).allowNewMembers ?? false,
              creator: (poolInfoResult as any).creator as Address,
              name: (poolInfoResult as any).name || `Pool #${poolId}`,
              totalBtcDeposited: (poolInfoResult as any).totalBtcDeposited || BigInt(0),
              totalMusdMinted: (poolInfoResult as any).totalMusdMinted || BigInt(0),
              totalYieldGenerated: (poolInfoResult as any).totalYieldGenerated || BigInt(0)
            }

            // Get user membership info if connected
            let isMember = false
            let userContribution = BigInt(0)
            let userShares = BigInt(0)
            let userPendingYield = BigInt(0)

            if (address) {
              try {
                const memberInfoResult = await readContract(config, {
                  address: poolAddress,
                  abi: POOL_ABI,
                  functionName: 'getMemberInfo',
                  args: [BigInt(poolId), address],
                })

                // Contract returns object, not array
                if (memberInfoResult) {
                  console.log(`📦 Pool ${poolId} member info raw:`, memberInfoResult)
                  // Contract uses 'active' not 'isMember', and 'btcContributed' not 'contribution'
                  isMember = (memberInfoResult as any).active ?? false
                  userContribution = (memberInfoResult as any).btcContributed || BigInt(0)
                  userShares = (memberInfoResult as any).shares || BigInt(0)
                  console.log(`👤 Pool ${poolId} parsed: isMember=${isMember}, contribution=${userContribution}`)
                }

                // Get pending yield if member
                if (isMember) {
                  const yieldResult = await readContract(config, {
                    address: poolAddress,
                    abi: POOL_ABI,
                    functionName: 'calculateMemberYield',
                    args: [BigInt(poolId), address],
                  })
                  userPendingYield = (yieldResult as bigint) || BigInt(0)
                }
              } catch (err) {
                // Member info not available, user not a member
                console.log(`Member info not available for pool ${poolId}`)
              }
            }

            const pool: PoolWithMembership = {
              ...poolInfo,
              poolId,
              isMember,
              userContribution,
              userShares,
              userPendingYield,
            }

            return pool
          } catch (err) {
            console.error(`❌ Error fetching pool ${poolId}:`, err)
            return null
          }
        })

        const poolsResults = await Promise.all(poolPromises)
        const pools = poolsResults.filter((p): p is PoolWithMembership => p !== null)

        console.log('✅ Fetched pools:', pools.length)

        // Calculate statistics
        const statistics: PoolsStatistics = {
          totalPools: pools.length,
          acceptingPools: pools.filter(p => p.status === PoolStatus.ACCEPTING).length,
          activePools: pools.filter(p => p.status === PoolStatus.ACTIVE).length,
          closedPools: pools.filter(p => p.status === PoolStatus.CLOSED).length,
          totalBtcLocked: pools.reduce((sum, p) => sum + p.totalBtcDeposited, BigInt(0)),
          totalMembers: pools.reduce((sum, p) => sum + p.currentMembers, 0),
          userMemberships: pools.filter(p => p.isMember).length,
        }

        console.log('📊 Pool statistics:', statistics)

        return { pools, statistics }
      } catch (err) {
        console.error('❌ Error fetching all pools:', err)
        throw err
      }
    },
    enabled: isConnected,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 2,
  })

  return {
    pools: data?.pools || [],
    statistics: data?.statistics || {
      totalPools: 0,
      acceptingPools: 0,
      activePools: 0,
      closedPools: 0,
      totalBtcLocked: BigInt(0),
      totalMembers: 0,
      userMemberships: 0,
    },
    isLoading,
    error,
    refetch,
  }
}

// ============================================================================
// FILTERED HOOKS
// ============================================================================

export function useUserPools() {
  const { pools, isLoading, error, refetch } = useAllCooperativePools()

  const userPools = pools.filter(pool => pool.isMember)

  return {
    pools: userPools,
    isLoading,
    error,
    refetch,
  }
}

export function useAvailablePools() {
  const { pools, isLoading, error, refetch } = useAllCooperativePools()

  const availablePools = pools.filter(
    pool => pool.status === PoolStatus.ACCEPTING &&
            pool.allowNewMembers &&
            pool.currentMembers < pool.maxMembers &&
            !pool.isMember
  )

  return {
    pools: availablePools,
    isLoading,
    error,
    refetch,
  }
}

export function useCreatedPools() {
  const { address } = useAccount()
  const { pools, isLoading, error, refetch } = useAllCooperativePools()

  const createdPools = pools.filter(
    pool => address && pool.creator.toLowerCase() === address.toLowerCase()
  )

  return {
    pools: createdPools,
    isLoading,
    error,
    refetch,
  }
}

// ============================================================================
// SORTING AND FILTERING UTILITIES
// ============================================================================

export type SortBy = 'newest' | 'oldest' | 'members' | 'deposits' | 'yields'
export type FilterStatus = 'all' | 'accepting' | 'active' | 'closed'

export function sortPools(pools: PoolWithMembership[], sortBy: SortBy): PoolWithMembership[] {
  const sorted = [...pools]

  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => b.createdAt - a.createdAt)
    case 'oldest':
      return sorted.sort((a, b) => a.createdAt - b.createdAt)
    case 'members':
      return sorted.sort((a, b) => b.currentMembers - a.currentMembers)
    case 'deposits':
      return sorted.sort((a, b) => Number(b.totalBtcDeposited - a.totalBtcDeposited))
    case 'yields':
      return sorted.sort((a, b) => Number(b.totalYieldGenerated - a.totalYieldGenerated))
    default:
      return sorted
  }
}

export function filterPoolsByStatus(
  pools: PoolWithMembership[],
  status: FilterStatus
): PoolWithMembership[] {
  if (status === 'all') return pools

  const statusMap = {
    accepting: PoolStatus.ACCEPTING,
    active: PoolStatus.ACTIVE,
    closed: PoolStatus.CLOSED,
  }

  return pools.filter(pool => pool.status === statusMap[status])
}

export function filterPoolsByContribution(
  pools: PoolWithMembership[],
  minBtc: bigint,
  maxBtc: bigint
): PoolWithMembership[] {
  return pools.filter(pool =>
    pool.minContribution >= minBtc && pool.maxContribution <= maxBtc
  )
}

export function searchPools(pools: PoolWithMembership[], query: string): PoolWithMembership[] {
  if (!query.trim()) return pools

  const lowerQuery = query.toLowerCase()

  return pools.filter(pool =>
    pool.name.toLowerCase().includes(lowerQuery) ||
    pool.poolId.toString().includes(lowerQuery) ||
    pool.creator.toLowerCase().includes(lowerQuery)
  )
}
