/**
 * @fileoverview Event listener hook for Lottery Pool contract events
 * @module hooks/web3/use-lottery-pool-events
 * 
 * This hook watches for contract events and automatically triggers
 * refetchQueries() to keep all lottery data in sync with blockchain.
 * 
 * This replaces inefficient polling with event-driven updates.
 * When events occur, ALL active TanStack Query queries are refetched.
 */

'use client'

import { useWatchContractEvent } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { LOTTERY_POOL_ABI } from '@/lib/web3/lottery-pool-abi'

// SimpleLotteryPool deployed on Mezo Testnet
const LOTTERY_POOL_ADDRESS = '0x3e5d272321e28731844c20e0a0c725a97301f83a' as `0x${string}`

/**
 * Hook to watch for LotteryPool contract events and auto-refetch queries
 * 
 * Events monitored:
 * - RoundCreated: New lottery round created
 * - TicketsPurchased: User bought tickets
 * - RoundCompleted: Round drawing completed
 * - PrizeClaimed: Winner claimed prize
 * - CapitalWithdrawn: User withdrew capital
 * 
 * When any event is detected, ALL active queries are refetched immediately
 * using TanStack Query's refetchQueries({ type: 'active' })
 * 
 * This is the best practice for real-time updates as recommended by TanStack Query docs
 */
export function useLotteryPoolEvents() {
  const queryClient = useQueryClient()

  // Watch for RoundCreated events
  useWatchContractEvent({
    address: LOTTERY_POOL_ADDRESS,
    abi: LOTTERY_POOL_ABI,
    eventName: 'RoundCreated',
    onLogs(logs) {
      console.log('🔔 RoundCreated event detected:', logs)
      // Refetch ALL active queries immediately
      queryClient.refetchQueries({
        type: 'active',
        refetchType: 'all',
      })
    },
  })

  // Watch for TicketsPurchased events
  useWatchContractEvent({
    address: LOTTERY_POOL_ADDRESS,
    abi: LOTTERY_POOL_ABI,
    eventName: 'TicketsPurchased',
    onLogs(logs) {
      console.log('🔔 TicketsPurchased event detected:', logs)
      queryClient.refetchQueries({
        type: 'active',
        refetchType: 'all',
      })
    },
  })

  // Watch for RoundCompleted events
  useWatchContractEvent({
    address: LOTTERY_POOL_ADDRESS,
    abi: LOTTERY_POOL_ABI,
    eventName: 'RoundCompleted',
    onLogs(logs) {
      console.log('🔔 RoundCompleted event detected:', logs)
      queryClient.refetchQueries({
        type: 'active',
        refetchType: 'all',
      })
    },
  })

  // Watch for PrizeClaimed events
  useWatchContractEvent({
    address: LOTTERY_POOL_ADDRESS,
    abi: LOTTERY_POOL_ABI,
    eventName: 'PrizeClaimed',
    onLogs(logs) {
      console.log('🔔 PrizeClaimed event detected:', logs)
      queryClient.refetchQueries({
        type: 'active',
        refetchType: 'all',
      })
    },
  })

  // Watch for CapitalWithdrawn events
  useWatchContractEvent({
    address: LOTTERY_POOL_ADDRESS,
    abi: LOTTERY_POOL_ABI,
    eventName: 'CapitalWithdrawn',
    onLogs(logs) {
      console.log('🔔 CapitalWithdrawn event detected:', logs)
      queryClient.refetchQueries({
        type: 'active',
        refetchType: 'all',
      })
    },
  })
}
