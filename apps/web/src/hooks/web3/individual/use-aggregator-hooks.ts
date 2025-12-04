/**
 * @fileoverview Yield Aggregator V3 Transaction Hooks
 * @module hooks/web3/individual/use-aggregator-hooks
 */

'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback, useState } from 'react'
import {
  MEZO_V3_ADDRESSES,
  YIELD_AGGREGATOR_V3_ABI,
  V3_FEATURES
} from '@/lib/web3/contracts-v3'
import { QUERY_KEYS, INITIAL_TX_STATE, TransactionState } from './constants'

const YIELD_AGGREGATOR_ADDRESS = MEZO_V3_ADDRESSES.yieldAggregatorV3 as `0x${string}`

// ============================================================================
// DEPOSIT/WITHDRAW HOOKS
// ============================================================================

/**
 * Hook to handle yield aggregator deposit
 */
export function useYieldAggregatorDeposit() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<TransactionState>(INITIAL_TX_STATE)

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const deposit = useCallback(async (amount: bigint) => {
    try {
      setLocalState({ isProcessing: true, hash: null })

      // Validate minimum deposit
      if (amount < BigInt(V3_FEATURES.yieldAggregator.minDeposit)) {
        throw new Error(`Minimum deposit is ${V3_FEATURES.yieldAggregator.minDeposit} MUSD`)
      }

      writeContract({
        address: YIELD_AGGREGATOR_ADDRESS,
        abi: YIELD_AGGREGATOR_V3_ABI,
        functionName: 'deposit',
        args: [amount],
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.YIELD_AGGREGATOR })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BALANCE })
    }
  }, [isSuccess, queryClient])

  return {
    deposit,
    isDepositing: isPending || localState.isProcessing,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

/**
 * Hook to handle yield aggregator withdrawal
 */
export function useYieldAggregatorWithdraw() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<TransactionState>(INITIAL_TX_STATE)

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const withdraw = useCallback(async (amount: bigint) => {
    try {
      setLocalState({ isProcessing: true, hash: null })

      writeContract({
        address: YIELD_AGGREGATOR_ADDRESS,
        abi: YIELD_AGGREGATOR_V3_ABI,
        functionName: 'withdraw',
        args: [amount],
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.YIELD_AGGREGATOR })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BALANCE })
    }
  }, [isSuccess, queryClient])

  return {
    withdraw,
    isWithdrawing: isPending || localState.isProcessing,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

// ============================================================================
// COMPOUND HOOKS
// ============================================================================

/**
 * Hook to handle compound yields
 */
export function useCompoundYields() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<TransactionState>(INITIAL_TX_STATE)

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const compoundYields = useCallback(async () => {
    try {
      setLocalState({ isProcessing: true, hash: null })

      writeContract({
        address: YIELD_AGGREGATOR_ADDRESS,
        abi: YIELD_AGGREGATOR_V3_ABI,
        functionName: 'compoundYields',
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.YIELD_AGGREGATOR })
    }
  }, [isSuccess, queryClient])

  return {
    compoundYields,
    isCompounding: isPending || localState.isProcessing,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}
