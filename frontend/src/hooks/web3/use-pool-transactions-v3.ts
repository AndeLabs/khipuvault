/**
 * @fileoverview V3 Pool Transactions Hook - Production Ready
 * @module hooks/web3/use-pool-transactions-v3
 * 
 * Handles all V3 pool transactions with new features:
 * - Auto-compound toggle
 * - Referral system
 * - Incremental deposits
 * - Partial withdrawals
 * - Emergency mode support
 * 
 * V3 Features:
 * ✅ UUPS Upgradeable Pattern
 * ✅ Storage Packing (~40-60k gas saved)
 * ✅ Flash Loan Protection
 * ✅ Emergency Mode
 * ✅ Auto-Compound
 * ✅ Referral System
 * ✅ Incremental Deposits
 * ✅ Partial Withdrawals
 */

'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback, useState } from 'react'
import { parseEther } from 'viem'
import { 
  MEZO_V3_ADDRESSES, 
  INDIVIDUAL_POOL_V3_ABI, 
  YIELD_AGGREGATOR_V3_ABI,
  V3_FEATURES 
} from '@/lib/web3/contracts-v3'

const INDIVIDUAL_POOL_ADDRESS = MEZO_V3_ADDRESSES.individualPoolV3 as `0x${string}`
const YIELD_AGGREGATOR_ADDRESS = MEZO_V3_ADDRESSES.yieldAggregatorV3 as `0x${string}`

// ============================================================================
// INDIVIDUAL POOL V3 TRANSACTIONS
// ============================================================================

/**
 * Hook to handle V3 pool deposit with referral support
 * 
 * Usage:
 * ```tsx
 * const { 
 *   deposit, 
 *   isDepositing, 
 *   isConfirming, 
 *   isSuccess, 
 *   error 
 * } = useDepositV3()
 * 
 * await deposit(parseEther('100'), '0xreferrer...') // Deposit 100 MUSD with referral
 * ```
 */
export function useDepositV3() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<{
    isProcessing: boolean
    hash: string | null
  }>({
    isProcessing: false,
    hash: null,
  })

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const deposit = useCallback(async (
    amount: bigint, 
    referrer?: string
  ) => {
    try {
      setLocalState({ isProcessing: true, hash: null })

      // Validate minimum deposit
      if (amount < BigInt(V3_FEATURES.individualPool.minDeposit)) {
        throw new Error(`Minimum deposit is ${V3_FEATURES.individualPool.minDeposit} MUSD`)
      }

      // Validate maximum deposit
      if (amount > BigInt(V3_FEATURES.individualPool.maxDeposit)) {
        throw new Error(`Maximum deposit is ${V3_FEATURES.individualPool.maxDeposit} MUSD`)
      }

      writeContract({
        address: INDIVIDUAL_POOL_ADDRESS,
        abi: INDIVIDUAL_POOL_V3_ABI,
        functionName: 'deposit',
        args: [amount, referrer || '0x0000000000000000000000000000000000000000'],
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
      queryClient.invalidateQueries({ queryKey: ['individual-pool-v3'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
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
 * Hook to handle V3 partial withdrawal
 */
export function usePartialWithdrawV3() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<{
    isProcessing: boolean
    hash: string | null
  }>({
    isProcessing: false,
    hash: null,
  })

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const partialWithdraw = useCallback(async (amount: bigint) => {
    try {
      setLocalState({ isProcessing: true, hash: null })

      // Validate minimum withdrawal
      if (amount < BigInt(V3_FEATURES.individualPool.minWithdrawal)) {
        throw new Error(`Minimum withdrawal is ${V3_FEATURES.individualPool.minWithdrawal} MUSD`)
      }

      writeContract({
        address: INDIVIDUAL_POOL_ADDRESS,
        abi: INDIVIDUAL_POOL_V3_ABI,
        functionName: 'partialWithdraw',
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
      queryClient.invalidateQueries({ queryKey: ['individual-pool-v3'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    }
  }, [isSuccess, queryClient])

  return {
    partialWithdraw,
    isWithdrawing: isPending || localState.isProcessing,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

/**
 * Hook to handle V3 full withdrawal
 */
export function useFullWithdrawV3() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<{
    isProcessing: boolean
    hash: string | null
  }>({
    isProcessing: false,
    hash: null,
  })

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const fullWithdraw = useCallback(async () => {
    try {
      setLocalState({ isProcessing: true, hash: null })

      writeContract({
        address: INDIVIDUAL_POOL_ADDRESS,
        abi: INDIVIDUAL_POOL_V3_ABI,
        functionName: 'fullWithdraw',
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
      queryClient.invalidateQueries({ queryKey: ['individual-pool-v3'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    }
  }, [isSuccess, queryClient])

  return {
    fullWithdraw,
    isWithdrawing: isPending || localState.isProcessing,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

/**
 * Hook to handle auto-compound toggle
 */
export function useToggleAutoCompoundV3() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<{
    isProcessing: boolean
    hash: string | null
  }>({
    isProcessing: false,
    hash: null,
  })

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
      queryClient.invalidateQueries({ queryKey: ['individual-pool-v3'] })
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

/**
 * Hook to handle claim yield
 */
export function useClaimYieldV3() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<{
    isProcessing: boolean
    hash: string | null
  }>({
    isProcessing: false,
    hash: null,
  })

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
      queryClient.invalidateQueries({ queryKey: ['individual-pool-v3'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
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
export function useClaimReferralRewardsV3() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<{
    isProcessing: boolean
    hash: string | null
  }>({
    isProcessing: false,
    hash: null,
  })

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
      queryClient.invalidateQueries({ queryKey: ['individual-pool-v3'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
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
// YIELD AGGREGATOR V3 TRANSACTIONS
// ============================================================================

/**
 * Hook to handle yield aggregator deposit
 */
export function useYieldAggregatorDepositV3() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<{
    isProcessing: boolean
    hash: string | null
  }>({
    isProcessing: false,
    hash: null,
  })

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
      queryClient.invalidateQueries({ queryKey: ['yield-aggregator-v3'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
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
export function useYieldAggregatorWithdrawV3() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<{
    isProcessing: boolean
    hash: string | null
  }>({
    isProcessing: false,
    hash: null,
  })

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
      queryClient.invalidateQueries({ queryKey: ['yield-aggregator-v3'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
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

/**
 * Hook to handle compound yields
 */
export function useCompoundYieldsV3() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<{
    isProcessing: boolean
    hash: string | null
  }>({
    isProcessing: false,
    hash: null,
  })

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
      queryClient.invalidateQueries({ queryKey: ['yield-aggregator-v3'] })
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

// ============================================================================
// COMBINED HOOKS
// ============================================================================

/**
 * Combined hook for all V3 individual pool transactions
 */
export function useIndividualPoolTransactionsV3() {
  const deposit = useDepositV3()
  const partialWithdraw = usePartialWithdrawV3()
  const fullWithdraw = useFullWithdrawV3()
  const toggleAutoCompound = useToggleAutoCompoundV3()
  const claimYield = useClaimYieldV3()
  const claimReferralRewards = useClaimReferralRewardsV3()

  return {
    deposit,
    partialWithdraw,
    fullWithdraw,
    toggleAutoCompound,
    claimYield,
    claimReferralRewards,
    
    // Combined loading states
    isAnyTransactionPending: 
      deposit.isDepositing || 
      partialWithdraw.isWithdrawing || 
      fullWithdraw.isWithdrawing || 
      toggleAutoCompound.isToggling || 
      claimYield.isClaiming || 
      claimReferralRewards.isClaiming,
  }
}

/**
 * Combined hook for all V3 yield aggregator transactions
 */
export function useYieldAggregatorTransactionsV3() {
  const deposit = useYieldAggregatorDepositV3()
  const withdraw = useYieldAggregatorWithdrawV3()
  const compoundYields = useCompoundYieldsV3()

  return {
    deposit,
    withdraw,
    compoundYields,
    
    // Combined loading states
    isAnyTransactionPending: 
      deposit.isDepositing || 
      withdraw.isWithdrawing || 
      compoundYields.isCompounding,
  }
}