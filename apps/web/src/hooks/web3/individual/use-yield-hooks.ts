/**
 * @fileoverview Individual Pool V3 Yield Management Hooks
 * @module hooks/web3/individual/use-yield-hooks
 */

'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback, useState } from 'react'
import { MEZO_V3_ADDRESSES, INDIVIDUAL_POOL_V3_ABI } from '@/lib/web3/contracts-v3'
import { QUERY_KEYS, INITIAL_TX_STATE, TransactionState } from './constants'

const INDIVIDUAL_POOL_ADDRESS = MEZO_V3_ADDRESSES.individualPoolV3 as `0x${string}`

// ============================================================================
// YIELD CLAIM HOOKS
// ============================================================================

/**
 * Hook to handle claim yield
 */
export function useClaimYield() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<TransactionState>(INITIAL_TX_STATE)

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const claimYield = useCallback(async () => {
    try {
      setLocalState({ isProcessing: true, hash: null })

      writeContract({
        address: INDIVIDUAL_POOL_ADDRESS,
        abi: INDIVIDUAL_POOL_V3_ABI,
        functionName: 'claimYield',
        args: [],
      })

    } catch (err) {
      setLocalState({ isProcessing: false, hash: null })
      throw err
    }
  }, [writeContract])

  // Update local state when hash changes
  useEffect(() => {
    if (hash) {
      setLocalState({ isProcessing: false, hash })
    }
  }, [hash])

  // Refetch data on success
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INDIVIDUAL_POOL })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BALANCE })
    }
  }, [isSuccess, queryClient])

  return {
    claimYield,
    isClaiming: isPending || localState.isProcessing,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

/**
 * Hook to handle claim referral rewards
 */
export function useClaimReferralRewards() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<TransactionState>(INITIAL_TX_STATE)

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const claimReferralRewards = useCallback(async () => {
    try {
      setLocalState({ isProcessing: true, hash: null })

      writeContract({
        address: INDIVIDUAL_POOL_ADDRESS,
        abi: INDIVIDUAL_POOL_V3_ABI,
        functionName: 'claimReferralRewards',
        args: [],
      })

    } catch (err) {
      setLocalState({ isProcessing: false, hash: null })
      throw err
    }
  }, [writeContract])

  // Update local state when hash changes
  useEffect(() => {
    if (hash) {
      setLocalState({ isProcessing: false, hash })
    }
  }, [hash])

  // Refetch data on success
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INDIVIDUAL_POOL })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BALANCE })
    }
  }, [isSuccess, queryClient])

  return {
    claimReferralRewards,
    isClaiming: isPending || localState.isProcessing,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

// ============================================================================
// AUTO-COMPOUND HOOKS
// ============================================================================

/**
 * Hook to handle auto-compound toggle
 */
export function useToggleAutoCompound() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<TransactionState>(INITIAL_TX_STATE)

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const toggleAutoCompound = useCallback(async (enabled: boolean) => {
    try {
      setLocalState({ isProcessing: true, hash: null })

      writeContract({
        address: INDIVIDUAL_POOL_ADDRESS,
        abi: INDIVIDUAL_POOL_V3_ABI,
        functionName: 'toggleAutoCompound',
        args: [enabled],
      })

    } catch (err) {
      setLocalState({ isProcessing: false, hash: null })
      throw err
    }
  }, [writeContract])

  // Update local state when hash changes
  useEffect(() => {
    if (hash) {
      setLocalState({ isProcessing: false, hash })
    }
  }, [hash])

  // Refetch data on success
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INDIVIDUAL_POOL })
    }
  }, [isSuccess, queryClient])

  return {
    toggleAutoCompound,
    isToggling: isPending || localState.isProcessing,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

// Note: useCompoundYields is exported from use-aggregator-hooks.ts
// Do not duplicate here to avoid export conflicts
