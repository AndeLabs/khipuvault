'use client'

import { useWatchContractEvent } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { MEZO_TESTNET_ADDRESSES } from '@/lib/web3/contracts'
import { useAccount } from 'wagmi'
import IndividualPoolABI from '@/contracts/abis/IndividualPool.json'

const POOL_ABI = (IndividualPoolABI as any).abi as const

/**
 * Hook to watch for IndividualPool contract events and auto-refetch queries
 * This replaces inefficient polling with event-driven updates
 * 
 * Best Practice: Use refetchQueries instead of invalidateQueries for immediate updates
 * Source: https://tanstack.com/query/v5/docs/reference/QueryClient
 */
export function usePoolEvents() {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const poolAddress = MEZO_TESTNET_ADDRESSES.individualPool as `0x${string}`

  // Watch for Deposited events
  useWatchContractEvent({
    address: poolAddress,
    abi: POOL_ABI,
    eventName: 'Deposited',
    onLogs(logs) {
      console.log('🔔 [V3] Deposited event detected:', logs)
      // Refetch ALL active queries immediately (best practice for real-time updates)
      queryClient.refetchQueries({ 
        type: 'active',
        refetchType: 'all' 
      })
    },
  })

  // Watch for Withdrawn events
  useWatchContractEvent({
    address: poolAddress,
    abi: POOL_ABI,
    eventName: 'Withdrawn',
    onLogs(logs) {
      console.log('🔔 [V3] Withdrawn event detected:', logs)
      queryClient.refetchQueries({ 
        type: 'active',
        refetchType: 'all' 
      })
    },
  })

  // Watch for YieldClaimed events
  useWatchContractEvent({
    address: poolAddress,
    abi: POOL_ABI,
    eventName: 'YieldClaimed',
    onLogs(logs) {
      console.log('🔔 [V3] YieldClaimed event detected:', logs)
      queryClient.refetchQueries({ 
        type: 'active',
        refetchType: 'all' 
      })
    },
  })
  
  // Watch for AutoCompound events (V3 feature)
  useWatchContractEvent({
    address: poolAddress,
    abi: POOL_ABI,
    eventName: 'YieldAutoCompounded',
    onLogs(logs) {
      console.log('🔔 [V3] YieldAutoCompounded event detected:', logs)
      queryClient.refetchQueries({ 
        type: 'active',
        refetchType: 'all' 
      })
    },
  })
}
