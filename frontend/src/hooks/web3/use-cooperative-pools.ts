/**
 * @fileoverview Hooks for Cooperative Pool interactions
 * @module hooks/web3/use-cooperative-pools
 * 
 * Production-ready hooks for interacting with CooperativePool contract
 * on Mezo Testnet
 */

'use client'

import { useAccount, usePublicClient, useWalletClient, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useEffect } from 'react'
import { MEZO_TESTNET_ADDRESSES } from '@/lib/web3/contracts'
import { COOPERATIVE_POOL_ABI } from '@/lib/web3/cooperative-pool-abi'
import { parseEther, formatEther } from 'viem'

// Types
export interface PoolInfo {
  poolId: bigint
  name: string
  creator: string
  minContribution: bigint
  maxContribution: bigint
  maxMembers: bigint
  currentMembers: bigint
  totalBtcDeposited: bigint
  totalMusdMinted: bigint
  totalYieldGenerated: bigint
  createdAt: bigint
  status: number // 0=ACCEPTING, 1=ACTIVE, 2=CLOSED
  allowNewMembers: boolean
}

export interface MemberInfo {
  btcContributed: bigint
  shares: bigint
  yieldClaimed: bigint
  joinedAt: bigint
  active: boolean
}

const poolAddress = MEZO_TESTNET_ADDRESSES.cooperativePool as `0x${string}`

/**
 * Hook to get all pools
 */
export function useCooperativePools() {
  const publicClient = usePublicClient()
  const [pools, setPools] = useState<PoolInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Get pool counter
  const { data: poolCounter } = useReadContract({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    functionName: 'poolCounter',
  })

  useEffect(() => {
    if (!publicClient || !poolCounter) {
      setIsLoading(false)
      return
    }

    async function fetchPools() {
      try {
        setIsLoading(true)
        const poolsData: PoolInfo[] = []
        const count = Number(poolCounter)

        // Fetch each pool info
        for (let i = 1; i <= count; i++) {
          try {
            const poolInfo = await publicClient!.readContract({
              address: poolAddress,
              abi: COOPERATIVE_POOL_ABI,
              functionName: 'getPoolInfo',
              args: [BigInt(i)],
            }) as PoolInfo

            poolsData.push(poolInfo)
          } catch (error) {
            console.warn(`Failed to fetch pool ${i}:`, error)
          }
        }

        setPools(poolsData)
      } catch (error) {
        console.error('Error fetching pools:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPools()
  }, [publicClient, poolCounter])

  return { pools, isLoading, poolCounter: Number(poolCounter || 0) }
}

/**
 * Hook to get specific pool info
 */
export function usePoolInfo(poolId: number) {
  const { data: poolInfo, isLoading, refetch } = useReadContract({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    functionName: 'getPoolInfo',
    args: [BigInt(poolId)],
  })

  return {
    poolInfo: poolInfo as PoolInfo | undefined,
    isLoading,
    refetch,
  }
}

/**
 * Hook to get member info for a pool
 */
export function useMemberInfo(poolId: number, memberAddress?: `0x${string}`) {
  const { data: memberInfo, isLoading, refetch } = useReadContract({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    functionName: 'getMemberInfo',
    args: memberAddress ? [BigInt(poolId), memberAddress] : undefined,
  })

  return {
    memberInfo: memberInfo as MemberInfo | undefined,
    isLoading,
    refetch,
  }
}

/**
 * Hook to get pool members
 */
export function usePoolMembers(poolId: number) {
  const { data: members, isLoading, refetch } = useReadContract({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    functionName: 'getPoolMembers',
    args: [BigInt(poolId)],
  })

  return {
    members: (members as string[]) || [],
    isLoading,
    refetch,
  }
}

/**
 * Hook to calculate member yield
 */
export function useMemberYield(poolId: number, memberAddress?: `0x${string}`) {
  const { data: yieldAmount, isLoading, refetch } = useReadContract({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    functionName: 'calculateMemberYield',
    args: memberAddress ? [BigInt(poolId), memberAddress] : undefined,
  })

  return {
    yieldAmount: yieldAmount as bigint | undefined,
    isLoading,
    refetch,
  }
}

/**
 * Hook to create a new pool
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
