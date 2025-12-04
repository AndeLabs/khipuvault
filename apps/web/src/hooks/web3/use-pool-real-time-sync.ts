/**
 * @fileoverview Real-time Pool Sync Hook
 * @module hooks/web3/use-pool-real-time-sync
 * 
 * Keeps pool data in sync with blockchain in real-time
 * Uses block watching + event listening + query invalidation
 * 
 * Best Practice: Call this hook once in your main pool component
 * to enable real-time updates for all child components
 */

'use client'

import { useBlockNumber } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { usePoolEvents } from './use-pool-events'

/**
 * Hook to enable real-time synchronization of pool data
 * 
 * This hook:
 * 1. Watches for new blocks
 * 2. Listens to contract events (Deposited, Withdrawn, YieldClaimed)
 * 3. Automatically refetches pool data when changes occur
 * 4. Keeps UI in sync with blockchain
 * 
 * Usage:
 * ```tsx
 * export function IndividualSavingsPage() {
 *   // Call once to enable real-time updates for entire page
 *   usePoolRealTimeSync()
 *   
 *   return (
 *     <>
 *       <YourPoolComponents />
 *     </>
 *   )
 * }
 * ```
 */
export function usePoolRealTimeSync() {
  const queryClient = useQueryClient()
  
  // Watch for new blocks (every ~12 seconds on most networks)
  // Set to true to enable automatic polling
  const { data: blockNumber, isLoading } = useBlockNumber({
    watch: {
      pollingInterval: 12000, // Poll every 12 seconds (balanced updates vs RPC load)
    },
  })

  // Listen to contract events for immediate updates
  usePoolEvents()

  // Refetch data when block changes
  useEffect(() => {
    if (!blockNumber || isLoading) return

    // Refetch all active pool queries
    queryClient.refetchQueries({
      queryKey: ['individual-pool-v3'],
      type: 'active',
    })

    console.log(`🔄 Block ${blockNumber}: Syncing pool data...`)
  }, [blockNumber, queryClient, isLoading])
}

/**
 * Hook to check if data is being synced
 * Useful for showing "live" indicators or sync status
 */
export function useIsSyncing() {
  const queryClient = useQueryClient()
  const { data: blockNumber, isLoading } = useBlockNumber({
    watch: true,
  })

  // Consider syncing if we're watching blocks and latest block is available
  const isSyncing = !isLoading && !!blockNumber

  return {
    isSyncing,
    blockNumber,
    isLoading,
  }
}
