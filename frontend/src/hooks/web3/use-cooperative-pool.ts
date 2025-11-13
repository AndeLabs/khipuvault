/**
 * @fileoverview Cooperative Pool Hook - Production Ready
 * 
 * Features:
 * - Create cooperative pools
 * - Join existing pools
 * - Leave pools (with yield distribution)
 * - Claim yields
 * - View pool stats
 * 
 * Uses MUSD instead of BTC for contributions
 */

'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useConfig } from 'wagmi'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { parseEther, formatEther, type Address } from 'viem'
import { readContract } from '@wagmi/core'

// ✅ Production address - CooperativePool V3 Proxy (UUPS) - Updated Nov 12, 2024
const COOPERATIVE_POOL_ADDRESS = '0x323fca9b377fe29b8fc95ddbd9fe54cea1655f88' as Address
const MUSD_ADDRESS = '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503' as Address

const POOL_ABI = [
  {
    name: 'createPool',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'minContribution', type: 'uint256' },
      { name: 'maxContribution', type: 'uint256' },
      { name: 'maxMembers', type: 'uint256' }
    ],
    outputs: [{ name: 'poolId', type: 'uint256' }]
  },
  {
    name: 'joinPool',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'leavePool',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'claimYield',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'getPoolInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'minContribution', type: 'uint128' },
        { name: 'maxContribution', type: 'uint128' },
        { name: 'maxMembers', type: 'uint64' },
        { name: 'currentMembers', type: 'uint64' },
        { name: 'createdAt', type: 'uint64' },
        { name: 'status', type: 'uint8' },
        { name: 'allowNewMembers', type: 'bool' },
        { name: 'creator', type: 'address' },
        { name: 'name', type: 'string' },
        { name: 'totalBtcDeposited', type: 'uint256' },
        { name: 'totalMusdMinted', type: 'uint256' },
        { name: 'totalYieldGenerated', type: 'uint256' }
      ]
    }]
  },
  {
    name: 'getMemberInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'poolId', type: 'uint256' },
      { name: 'member', type: 'address' }
    ],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'btcContributed', type: 'uint128' },
        { name: 'shares', type: 'uint128' },
        { name: 'joinedAt', type: 'uint64' },
        { name: 'active', type: 'bool' },
        { name: 'yieldClaimed', type: 'uint256' }
      ]
    }]
  },
  {
    name: 'getPoolMembers',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address[]' }]
  },
  {
    name: 'calculateMemberYield',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'poolId', type: 'uint256' },
      { name: 'member', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'poolCounter',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'MIN_CONTRIBUTION',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

const MUSD_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  }
] as const

type ActionState = 
  | 'idle'
  | 'approving'
  | 'waitingApproval'
  | 'executing'
  | 'processing'
  | 'success'
  | 'error'

export enum PoolStatus {
  ACCEPTING = 0,
  ACTIVE = 1,
  CLOSED = 2
}

export interface PoolInfo {
  minContribution: bigint
  maxContribution: bigint
  maxMembers: number
  currentMembers: number
  createdAt: number
  status: PoolStatus
  allowNewMembers: boolean
  creator: Address
  name: string
  totalBtcDeposited: bigint
  totalMusdMinted: bigint
  totalYieldGenerated: bigint
}

export interface MemberInfo {
  btcContributed: bigint
  shares: bigint
  joinedAt: number
  active: boolean
  yieldClaimed: bigint
}

export function useCooperativePool() {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  
  const [state, setState] = useState<ActionState>('idle')
  const [error, setError] = useState<string>('')

  // Read pool counter
  const { data: poolCounter } = useReadContract({
    address: COOPERATIVE_POOL_ADDRESS,
    abi: POOL_ABI,
    functionName: 'poolCounter',
    query: {
      refetchInterval: 30_000,
    }
  })

  // Read MUSD balance
  const { data: musdBalance } = useReadContract({
    address: MUSD_ADDRESS,
    abi: MUSD_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: MUSD_ADDRESS,
    abi: MUSD_ABI,
    functionName: 'allowance',
    args: address ? [address, COOPERATIVE_POOL_ADDRESS] : undefined,
  })

  // Approve transaction
  const {
    writeContract: approveWrite,
    data: approveTxHash,
    error: approveError,
    reset: resetApprove
  } = useWriteContract()
  
  const {
    isLoading: isApprovePending,
    isSuccess: isApproveSuccess
  } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  })

  // Main transaction (create/join/leave/claim)
  const {
    writeContract: mainWrite,
    data: mainTxHash,
    error: mainError,
    reset: resetMain
  } = useWriteContract()
  
  const {
    isLoading: isMainPending,
    isSuccess: isMainSuccess,
    data: mainReceipt
  } = useWaitForTransactionReceipt({
    hash: mainTxHash,
  })

  // Handle approval flow
  useEffect(() => {
    if (isApproveSuccess && state === 'waitingApproval') {
      console.log('✅ Approval confirmed!')
      setState('success')
    }
  }, [isApproveSuccess, state])

  // Handle main transaction success
  useEffect(() => {
    if (isMainSuccess && state === 'processing') {
      console.log('✅ Transaction confirmed!')

      // ✅ CRITICAL FIX: Invalidate specific queries instead of all queries
      // This ensures poolCounter and all pool data are refetched
      // Invalidations automatically trigger refetch of active queries
      queryClient.invalidateQueries({ queryKey: ['cooperative-pool', 'counter'] })
      queryClient.invalidateQueries({ queryKey: ['cooperative-pool'] })
      queryClient.invalidateQueries({ queryKey: ['pool-info'] })
      queryClient.invalidateQueries({ queryKey: ['member-info'] })

      console.log('✅ All pool queries invalidated')
      setState('success')
    }
  }, [isMainSuccess, state, queryClient])

  // Handle state transitions
  useEffect(() => {
    if (isApprovePending && state === 'approving') {
      setState('waitingApproval')
    }
  }, [isApprovePending, state])

  useEffect(() => {
    if (isMainPending && state === 'executing') {
      setState('processing')
    }
  }, [isMainPending, state])

  // Handle errors
  useEffect(() => {
    if (approveError || mainError) {
      const err = approveError || mainError
      console.error('❌ Error:', err)
      setState('error')
      
      const msg = err?.message || ''
      if (msg.includes('User rejected')) {
        setError('Rechazaste la transacción')
      } else {
        setError('Error en la operación')
      }
    }
  }, [approveError, mainError])

  // Create pool
  const createPool = async (
    name: string,
    minContribution: string,
    maxContribution: string,
    maxMembers: number
  ) => {
    if (!address) {
      setError('Conecta tu wallet primero')
      setState('error')
      return
    }

    try {
      setState('idle')
      setError('')
      resetMain()

      const min = parseEther(minContribution)
      const max = parseEther(maxContribution)

      console.log('🏗️ Creating pool:', { name, minContribution, maxContribution, maxMembers })
      setState('executing')

      mainWrite({
        address: COOPERATIVE_POOL_ADDRESS,
        abi: POOL_ABI,
        functionName: 'createPool',
        args: [name, min, max, BigInt(maxMembers)]
      })
    } catch (err) {
      console.error('❌ Error:', err)
      setState('error')
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  // Join pool with BTC (payable)
  const joinPool = async (poolId: number, btcAmount: string) => {
    if (!address) {
      setError('Conecta tu wallet primero')
      setState('error')
      return
    }

    try {
      setState('idle')
      setError('')
      resetMain()

      const amount = parseEther(btcAmount)

      console.log('🤝 Joining pool:', poolId, 'with', btcAmount, 'BTC')
      setState('executing')

      mainWrite({
        address: COOPERATIVE_POOL_ADDRESS,
        abi: POOL_ABI,
        functionName: 'joinPool',
        args: [BigInt(poolId)],
        value: amount
      })
    } catch (err) {
      console.error('❌ Error:', err)
      setState('error')
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  // Leave pool
  const leavePool = async (poolId: number) => {
    if (!address) {
      setError('Conecta tu wallet primero')
      setState('error')
      return
    }

    try {
      setState('idle')
      setError('')
      resetMain()

      console.log('👋 Leaving pool:', poolId)
      setState('executing')

      mainWrite({
        address: COOPERATIVE_POOL_ADDRESS,
        abi: POOL_ABI,
        functionName: 'leavePool',
        args: [BigInt(poolId)]
      })
    } catch (err) {
      console.error('❌ Error:', err)
      setState('error')
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  // Claim yields
  const claimYield = async (poolId: number) => {
    if (!address) {
      setError('Conecta tu wallet primero')
      setState('error')
      return
    }

    try {
      setState('idle')
      setError('')
      resetMain()

      console.log('💰 Claiming yields from pool:', poolId)
      setState('executing')

      mainWrite({
        address: COOPERATIVE_POOL_ADDRESS,
        abi: POOL_ABI,
        functionName: 'claimYield',
        args: [BigInt(poolId)]
      })
    } catch (err) {
      console.error('❌ Error:', err)
      setState('error')
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const reset = () => {
    setState('idle')
    setError('')
    resetApprove()
    resetMain()
  }

  return {
    // Actions
    createPool,
    joinPool,
    leavePool,
    claimYield,
    reset,

    // State
    state,
    error,
    txHash: mainReceipt?.transactionHash || mainTxHash || approveTxHash,
    isProcessing: state !== 'idle' && state !== 'success' && state !== 'error',

    // Data
    poolCounter: Number(poolCounter || 0n),
    musdBalance: musdBalance || 0n,
    allowance: allowance || 0n,

    // Contracts
    poolAddress: COOPERATIVE_POOL_ADDRESS,
    musdAddress: MUSD_ADDRESS,
  }
}

// Type guard for pool info result
function isValidPoolInfoResult(result: any): boolean {
  if (!result || !Array.isArray(result) || result.length < 12) {
    console.warn('⚠️ Invalid pool info result structure:', result)
    return false
  }
  
  // Validate critical fields
  if (typeof result[7] !== 'string' || !result[7].startsWith('0x')) {
    console.warn('⚠️ Invalid creator address:', result[7])
    return false
  }
  
  if (typeof result[8] !== 'string' || result[8].length === 0) {
    console.warn('⚠️ Invalid pool name:', result[8])
    return false
  }
  
  return true
}

// Hook to fetch pool info
export function usePoolInfo(poolId: number) {
  const config = useConfig()
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pool-info', poolId],
    queryFn: async () => {
      if (poolId <= 0) return null

      try {
        // console.log('🔄 [COOPERATIVE] Fetching pool info for pool:', poolId) // Commented to reduce log spam

        const result = await readContract(config, {
          address: COOPERATIVE_POOL_ADDRESS,
          abi: POOL_ABI,
          functionName: 'getPoolInfo',
          args: [BigInt(poolId)],
        })

        // console.log('📊 [COOPERATIVE] Raw pool info result:', result) // Commented to reduce log spam

        if (!isValidPoolInfoResult(result)) {
          console.error('❌ [COOPERATIVE] Invalid pool info data')
          return null
        }

        const poolInfo: PoolInfo = {
          minContribution: result[0] || BigInt(0),
          maxContribution: result[1] || BigInt(0),
          maxMembers: Number(result[2] || 0),
          currentMembers: Number(result[3] || 0),
          createdAt: Number(result[4] || 0),
          status: (result[5] ?? 0) as PoolStatus,
          allowNewMembers: result[6] ?? false,
          creator: result[7] as Address,
          name: result[8] || 'Unknown Pool',
          totalBtcDeposited: result[9] || BigInt(0),
          totalMusdMinted: result[10] || BigInt(0),
          totalYieldGenerated: result[11] || BigInt(0)
        }

        console.log('✅ [COOPERATIVE] Pool info parsed:', {
          name: poolInfo.name,
          creator: poolInfo.creator,
          status: poolInfo.status,
          members: `${poolInfo.currentMembers}/${poolInfo.maxMembers}`
        })

        return poolInfo
      } catch (err) {
        console.error('❌ [COOPERATIVE] Error fetching pool info:', err)
        return null
      }
    },
    enabled: poolId > 0,
    retry: 3,
    retryDelay: 1000,
  })

  return { poolInfo: data, isLoading, error, refetch }
}

// Type guard for member info result
function isValidMemberInfoResult(result: any): boolean {
  if (!result || !Array.isArray(result) || result.length < 5) {
    console.warn('⚠️ Invalid member info result structure:', result)
    return false
  }
  return true
}

// Hook to fetch member info
export function useMemberInfo(poolId: number, memberAddress?: Address) {
  const { address } = useAccount()
  const config = useConfig()
  const userAddress = memberAddress || address

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['member-info', poolId, userAddress],
    queryFn: async () => {
      if (poolId <= 0 || !userAddress) return null

      try {
        // console.log('🔄 [COOPERATIVE] Fetching member info for pool:', poolId, 'member:', userAddress) // Commented to reduce log spam

        const result = await readContract(config, {
          address: COOPERATIVE_POOL_ADDRESS,
          abi: POOL_ABI,
          functionName: 'getMemberInfo',
          args: [BigInt(poolId), userAddress],
        })

        // console.log('📊 [COOPERATIVE] Raw member info result:', result) // Commented to reduce log spam

        if (!isValidMemberInfoResult(result)) {
          console.error('❌ [COOPERATIVE] Invalid member info data')
          return null
        }

        const memberInfo: MemberInfo = {
          btcContributed: result[0] || BigInt(0),
          shares: result[1] || BigInt(0),
          joinedAt: Number(result[2] || 0),
          active: result[3] ?? false,
          yieldClaimed: result[4] || BigInt(0)
        }

        // console.log('✅ [COOPERATIVE] Member info parsed:', {
        //   btcContributed: memberInfo.btcContributed.toString(),
        //   shares: memberInfo.shares.toString(),
        //   active: memberInfo.active
        // }) // Commented to reduce log spam

        return memberInfo
      } catch (err) {
        console.error('❌ [COOPERATIVE] Error fetching member info:', err)
        return null
      }
    },
    enabled: poolId > 0 && !!userAddress,
    retry: 3,
    retryDelay: 1000,
  })

  return { memberInfo: data, isLoading, error, refetch }
}
