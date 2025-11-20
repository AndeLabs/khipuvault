/**
 * @fileoverview Hooks for Cooperative Pool interactions
 * @module hooks/web3/use-cooperative-pools
 * 
 * Production-ready hooks for interacting with CooperativePool contract
 * on Mezo Testnet. Uses TanStack Query for optimal state management.
 */

'use client'

import { usePublicClient, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { MEZO_TESTNET_ADDRESSES } from '@/lib/web3/contracts'
import { COOPERATIVE_POOL_ABI } from '@/lib/web3/cooperative-pool-abi'
import { parseEther, formatEther } from 'viem'
import { normalizeBigInt } from '@/lib/query-utils'
import {
  fetchCooperativePools,
  fetchPoolInfo,
  fetchMemberInfo,
  fetchPoolMembers,
  fetchMemberYield,
  type PoolInfo,
  type MemberInfo,
} from '@/lib/blockchain/fetch-cooperative-pools'

const poolAddress = MEZO_TESTNET_ADDRESSES.cooperativePool as `0x${string}`

/**
 * Hook to get all pools using TanStack Query
 * 
 * Benefits:
 * - Automatic caching and deduplication
 * - Real-time updates via refetchQueries()
 * - Background refetching based on staleTime
 * - Better error handling
 * 
 * @returns Object with pools array, loading state, and error
 */
export function useCooperativePools() {
  const publicClient = usePublicClient()

  // Get pool counter using wagmi's useReadContract (already optimized)
  const { data: poolCounter } = useReadContract({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    functionName: 'poolCounter',
  })

  // Fetch all pools using useQuery
  const { data: pools = [], isLoading, error } = useQuery({
    queryKey: ['cooperative-pool', 'all-pools', normalizeBigInt(poolCounter)],
    queryFn: () => {
      if (!publicClient) {
        return Promise.resolve([])
      }
      return fetchCooperativePools(publicClient, Number(poolCounter || 0))
    },
    enabled: !!publicClient && !!poolCounter && Number(poolCounter) > 0,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })

  return {
    pools,
    isLoading,
    error,
    poolCounter: Number(poolCounter || 0),
  }
}

/**
 * Hook to get specific pool info using TanStack Query
 * 
 * @param poolId - ID of the pool to fetch
 * @returns Object with poolInfo, loading state, and error
 */
export function usePoolInfo(poolId: number) {
  const publicClient = usePublicClient()

  const { data: poolInfo, isLoading, error } = useQuery({
    queryKey: ['cooperative-pool', 'pool-info', poolId],
    queryFn: () => {
      if (!publicClient) {
        return Promise.resolve(null)
      }
      return fetchPoolInfo(publicClient, poolId)
    },
    enabled: !!publicClient && poolId > 0,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  })

  return {
    poolInfo: poolInfo as PoolInfo | null | undefined,
    isLoading,
    error,
  }
}

/**
 * Hook to get member info for a pool using TanStack Query
 * 
 * @param poolId - ID of the pool
 * @param memberAddress - Address of the member
 * @returns Object with memberInfo, loading state, and error
 */
export function useMemberInfo(poolId: number, memberAddress?: `0x${string}`) {
  const publicClient = usePublicClient()

  const { data: memberInfo, isLoading, error } = useQuery({
    queryKey: ['cooperative-pool', 'member-info', poolId, memberAddress || 'none'],
    queryFn: () => {
      if (!publicClient || !memberAddress) {
        return Promise.resolve(null)
      }
      return fetchMemberInfo(publicClient, poolId, memberAddress)
    },
    enabled: !!publicClient && poolId > 0 && !!memberAddress,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  })

  return {
    memberInfo: memberInfo as MemberInfo | null | undefined,
    isLoading,
    error,
  }
}

/**
 * Hook to get pool members using TanStack Query
 * 
 * @param poolId - ID of the pool
 * @returns Object with members array, loading state, and error
 */
export function usePoolMembers(poolId: number) {
  const publicClient = usePublicClient()

  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ['cooperative-pool', 'members', poolId],
    queryFn: () => {
      if (!publicClient) {
        return Promise.resolve([])
      }
      return fetchPoolMembers(publicClient, poolId)
    },
    enabled: !!publicClient && poolId > 0,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  })

  return {
    members,
    isLoading,
    error,
  }
}

/**
 * Hook to calculate member yield using TanStack Query
 * 
 * @param poolId - ID of the pool
 * @param memberAddress - Address of the member
 * @returns Object with yieldAmount, loading state, and error
 */
export function useMemberYield(poolId: number, memberAddress?: `0x${string}`) {
  const publicClient = usePublicClient()

  const { data: yieldAmount, isLoading, error } = useQuery({
    queryKey: ['cooperative-pool', 'member-yield', poolId, memberAddress || 'none'],
    queryFn: () => {
      if (!publicClient || !memberAddress) {
        return Promise.resolve(null)
      }
      return fetchMemberYield(publicClient, poolId, memberAddress)
    },
    enabled: !!publicClient && poolId > 0 && !!memberAddress,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  })

  return {
    yieldAmount: yieldAmount as bigint | null | undefined,
    isLoading,
    error,
  }
}

/**
 * Hook to create a new pool
 * 
 * @returns Object with createPool function and transaction states
 */
export function useCreatePool() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const createPool = async (
    name: string,
    minContribution: string,
    maxContribution: string,
    maxMembers: number
  ) => {
    try {
      const minBtc = parseEther(minContribution)
      const maxBtc = parseEther(maxContribution)

      writeContract({
        address: poolAddress,
        abi: COOPERATIVE_POOL_ABI,
        functionName: 'createPool',
        args: [name, minBtc, maxBtc, BigInt(maxMembers)],
      })
    } catch (err) {
      console.error('Error creating pool:', err)
      throw err
    }
  }

  return {
    createPool,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  }
}

/**
 * Hook to join a pool
 * 
 * @returns Object with joinPool function and transaction states
 */
export function useJoinPool() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const joinPool = async (poolId: number, btcAmount: string) => {
    try {
      const value = parseEther(btcAmount)

      writeContract({
        address: poolAddress,
        abi: COOPERATIVE_POOL_ABI,
        functionName: 'joinPool',
        args: [BigInt(poolId)],
        value, // BTC is native on Mezo
      })
    } catch (err) {
      console.error('Error joining pool:', err)
      throw err
    }
  }

  return {
    joinPool,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  }
}

/**
 * Hook to leave a pool
 * 
 * @returns Object with leavePool function and transaction states
 */
export function useLeavePool() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const leavePool = async (poolId: number) => {
    try {
      writeContract({
        address: poolAddress,
        abi: COOPERATIVE_POOL_ABI,
        functionName: 'leavePool',
        args: [BigInt(poolId)],
      })
    } catch (err) {
      console.error('Error leaving pool:', err)
      throw err
    }
  }

  return {
    leavePool,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  }
}

/**
 * Hook to claim yield from a pool
 * 
 * @returns Object with claimYield function and transaction states
 */
export function useClaimYield() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claimYield = async (poolId: number) => {
    try {
      writeContract({
        address: poolAddress,
        abi: COOPERATIVE_POOL_ABI,
        functionName: 'claimYield',
        args: [BigInt(poolId)],
      })
    } catch (err) {
      console.error('Error claiming yield:', err)
      throw err
    }
  }

  return {
    claimYield,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  }
}

/**
 * Helper: Format BTC amount
 */
export function formatBTC(amount: bigint): string {
  return formatEther(amount)
}

/**
 * Helper: Get pool status text
 */
export function getPoolStatusText(status: number): string {
  switch (status) {
    case 0:
      return 'Abierto'
    case 1:
      return 'Activo'
    case 2:
      return 'Cerrado'
    default:
      return 'Desconocido'
  }
}

/**
 * Helper: Get pool status color
 */
export function getPoolStatusColor(status: number): string {
  switch (status) {
    case 0:
      return 'green'
    case 1:
      return 'blue'
    case 2:
      return 'red'
    default:
      return 'gray'
  }
}

/**
 * Helper: Calculate APR for a pool (mock for now)
 */
export function calculatePoolAPR(totalYield: bigint, totalBtc: bigint, daysActive: number): string {
  if (totalBtc === 0n || daysActive === 0) return '0'

  const yieldPercent = Number(totalYield) / Number(totalBtc)
  const annualizedYield = (yieldPercent / daysActive) * 365
  return (annualizedYield * 100).toFixed(2)
}

/**
 * Re-export types for consumers
 */
export type { PoolInfo, MemberInfo }
