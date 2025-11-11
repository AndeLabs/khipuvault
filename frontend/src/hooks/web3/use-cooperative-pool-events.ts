/**
 * @fileoverview Event listener hook for Cooperative Pool contract events
 * @module hooks/web3/use-cooperative-pool-events
 * 
 * This hook watches for contract events and automatically triggers
 * refetchQueries() to keep all pool data in sync with blockchain.
 * 
 * This replaces inefficient polling with event-driven updates.
 * When events occur, ALL active TanStack Query queries are refetched.
 */

'use client'

import { useWatchContractEvent } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { MEZO_TESTNET_ADDRESSES } from '@/lib/web3/contracts'
import { COOPERATIVE_POOL_ABI } from '@/lib/web3/cooperative-pool-abi'

/**
 * Hook to watch for CooperativePool contract events and auto-refetch queries
 * 
 * Events monitored:
 * - PoolCreated: New pool created
 * - PoolClosed: Pool closed
 * - MemberJoined: User joined a pool
 * - MemberLeft: User left a pool
 * - YieldClaimed: User claimed yield
 * 
 * When any event is detected, ALL active queries are refetched immediately
 * using TanStack Query's refetchQueries({ type: 'active' })
 * 
 * This is the best practice for real-time updates as recommended by TanStack Query docs
 */
export function useCooperativePoolEvents() {
  const queryClient = useQueryClient()
  const poolAddress = MEZO_TESTNET_ADDRESSES.cooperativePool as `0x${string}`

  // Watch for PoolCreated events
  useWatchContractEvent({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    eventName: 'PoolCreated',
    onLogs(logs) {
      console.log('🔔 PoolCreated event detected:', logs)

      // ✅ CRITICAL FIX: Invalidate poolCounter first (this triggers all-pools refetch)
      queryClient.invalidateQueries({ queryKey: ['cooperative-pool', 'counter'] })

      // Invalidate all pool-related queries
      queryClient.invalidateQueries({ queryKey: ['cooperative-pool'] })
      queryClient.invalidateQueries({ queryKey: ['pool-info'] })
      queryClient.invalidateQueries({ queryKey: ['member-info'] })

      // ✅ CRITICAL FIX: Refetch ALL queries (not just active ones)
      // This ensures background tabs also get updated data
      queryClient.refetchQueries({
        type: 'all', // Changed from 'active' to 'all'
      })

      console.log('✅ All queries invalidated and refetching after PoolCreated')
    },
  })

  // Watch for PoolClosed events
  useWatchContractEvent({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    eventName: 'PoolClosed',
    onLogs(logs) {
      console.log('🔔 PoolClosed event detected:', logs)
      queryClient.invalidateQueries({ queryKey: ['cooperative-pool', 'counter'] })
      queryClient.invalidateQueries({ queryKey: ['pool-info'] })
      queryClient.refetchQueries({
        type: 'all',
      })
      console.log('✅ Queries refetched after PoolClosed')
    },
  })

  // Watch for MemberJoined events
  useWatchContractEvent({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    eventName: 'MemberJoined',
    onLogs(logs) {
      console.log('🔔 MemberJoined event detected:', logs)
      queryClient.invalidateQueries({ queryKey: ['cooperative-pool', 'counter'] })
      queryClient.invalidateQueries({ queryKey: ['pool-info'] })
      queryClient.invalidateQueries({ queryKey: ['member-info'] })
      queryClient.refetchQueries({
        type: 'all',
      })
      console.log('✅ Queries refetched after MemberJoined')
    },
  })

  // Watch for MemberLeft events
  useWatchContractEvent({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    eventName: 'MemberLeft',
    onLogs(logs) {
      console.log('🔔 MemberLeft event detected:', logs)
      queryClient.invalidateQueries({ queryKey: ['cooperative-pool', 'counter'] })
      queryClient.invalidateQueries({ queryKey: ['pool-info'] })
      queryClient.invalidateQueries({ queryKey: ['member-info'] })
      queryClient.refetchQueries({
        type: 'all',
      })
      console.log('✅ Queries refetched after MemberLeft')
    },
  })

  // Watch for YieldClaimed events
  useWatchContractEvent({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    eventName: 'YieldClaimed',
    onLogs(logs) {
      console.log('🔔 YieldClaimed event detected:', logs)
      queryClient.invalidateQueries({ queryKey: ['pool-info'] })
      queryClient.invalidateQueries({ queryKey: ['member-info'] })
      queryClient.refetchQueries({
        type: 'all',
      })
      console.log('✅ Queries refetched after YieldClaimed')
    },
  })
}
