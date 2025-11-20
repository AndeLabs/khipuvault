/**
 * @fileoverview Pool Transactions Hook - Production Ready
 * @module hooks/web3/use-pool-transactions-v2
 * 
 * Handles all pool transactions (deposit, withdraw, claim yield)
 * Uses Wagmi v2 patterns with proper state management
 * 
 * Features:
 * - Proper async/await handling
 * - Real-time confirmation tracking
 * - Auto-refetch data after transaction
 * - Error handling
 * - Loading states
 */

'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback, useState } from 'react'
import { parseEther } from 'viem'
import { MEZO_TESTNET_ADDRESSES, INDIVIDUAL_POOL_ABI } from '@/lib/web3/contracts'

const POOL_ADDRESS = MEZO_TESTNET_ADDRESSES.individualPool as `0x${string}`

/**
 * Hook to handle pool deposit
 * 
 * Usage:
 * ```tsx
 * const { 
 *   deposit, 
 *   isDepositing, 
 *   isConfirming, 
 *   isSuccess, 
 *   error 
 * } = useDepositV2()
 * 
 * await deposit(parseEther('100')) // Deposit 100 MUSD
 * ```
 */
export function useDepositV2() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<{
    isProcessing: boolean
    hash: string | null
  }>({
    isProcessing: false,
    hash: null,
  })

  const { writeContract, data: txHash, error: txError, isPending: isWritePending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    pollingInterval: 1000,
  })

  const deposit = useCallback(
    async (amount: string | bigint) => {
      try {
        setLocalState({ isProcessing: true, hash: null })

        const amountWei = typeof amount === 'string' ? parseEther(amount) : amount

        // Write transaction
        writeContract(
          {
            address: POOL_ADDRESS,
            abi: INDIVIDUAL_POOL_ABI,
            functionName: 'deposit',
            args: [amountWei],
          },
          {
            onSuccess(hash) {
              setLocalState({ isProcessing: true, hash })
              console.log('✅ Deposit tx sent:', hash)
            },
            onError(error) {
              setLocalState({ isProcessing: false, hash: null })
              console.error('❌ Deposit error:', error.message)
              throw error
            },
          }
        )
      } catch (error) {
        setLocalState({ isProcessing: false, hash: null })
        throw error
      }
    },
    [writeContract]
  )

  // Auto-refetch when confirmed
  useEffect(() => {
    if (isSuccess && txHash) {
      console.log('✅ Deposit confirmed! Invalidating queries in 5 seconds...')
      // Increased delay to let Mezo Testnet blockchain update
      const timer = setTimeout(() => {
        console.log('🔄 [INVALIDATE] Starting query invalidation after deposit...')
        
        // Log queries before invalidation
        const queriesBeforeInvalidate = queryClient.getQueryCache().findAll({ queryKey: ['individual-pool'] })
        console.log('📋 [INVALIDATE] Found queries to invalidate:', {
          count: queriesBeforeInvalidate.length,
          keys: queriesBeforeInvalidate.map(q => q.queryKey),
        })
        
        // Invalidate all individual-pool queries
        queryClient.invalidateQueries({
          queryKey: ['individual-pool'],
        })
        
        setLocalState({ isProcessing: false, hash: txHash })
        
        // Verify invalidation worked
        setTimeout(() => {
          const queriesAfterInvalidate = queryClient.getQueryCache().findAll({ queryKey: ['individual-pool'] })
          console.log('✅ [INVALIDATE] Queries invalidated. Refetching status:', {
            count: queriesAfterInvalidate.length,
            refetching: queriesAfterInvalidate.map(q => ({
              key: q.queryKey,
              isFetching: q.state.isFetching,
            }))
          })
        }, 500)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isSuccess, txHash, queryClient])

  return {
    deposit,
    hash: txHash,
    isDepositing: isWritePending || localState.isProcessing,
    isConfirming,
    isSuccess,
    error: txError?.message || null,
  }
}

/**
 * Hook to handle pool withdrawal
 * 
 * Usage:
 * ```tsx
 * const { 
 *   withdraw, 
 *   isWithdrawing, 
 *   isSuccess, 
 *   error 
 * } = useWithdrawV2()
 * 
 * await withdraw() // Withdraws entire position
 * ```
 */
export function useWithdrawV2() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<{
    isProcessing: boolean
    hash: string | null
  }>({
    isProcessing: false,
    hash: null,
  })

  const { writeContract, data: txHash, error: txError, isPending: isWritePending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    pollingInterval: 1000,
  })

  const withdraw = useCallback(async () => {
    try {
      setLocalState({ isProcessing: true, hash: null })

      writeContract(
        {
          address: POOL_ADDRESS,
          abi: INDIVIDUAL_POOL_ABI,
          functionName: 'withdraw',
          args: [BigInt(0)], // Pass 0 for any required uint256 parameter (withdraws entire position)
        },
        {
          onSuccess(hash) {
            setLocalState({ isProcessing: true, hash })
            console.log('✅ Withdrawal tx sent:', hash)
          },
          onError(error) {
            setLocalState({ isProcessing: false, hash: null })
            console.error('❌ Withdrawal error:', error.message)
            throw error
          },
        }
      )
    } catch (error) {
      setLocalState({ isProcessing: false, hash: null })
      throw error
    }
  }, [writeContract])

  // Auto-refetch when confirmed
  useEffect(() => {
    if (isSuccess && txHash) {
      console.log('✅ Withdrawal confirmed! Invalidating queries in 5 seconds...')
      const timer = setTimeout(() => {
        console.log('🔄 [INVALIDATE] Starting query invalidation after withdrawal...')
        
        // Log queries before invalidation
        const queriesBeforeInvalidate = queryClient.getQueryCache().findAll({ queryKey: ['individual-pool'] })
        console.log('📋 [INVALIDATE] Found queries to invalidate:', {
          count: queriesBeforeInvalidate.length,
          keys: queriesBeforeInvalidate.map(q => q.queryKey),
        })
        
        // Invalidate all individual-pool queries
        queryClient.invalidateQueries({
          queryKey: ['individual-pool'],
        })
        
        setLocalState({ isProcessing: false, hash: txHash })
        
        // Verify invalidation worked
        setTimeout(() => {
          const queriesAfterInvalidate = queryClient.getQueryCache().findAll({ queryKey: ['individual-pool'] })
          console.log('✅ [INVALIDATE] Queries invalidated. Refetching status:', {
            count: queriesAfterInvalidate.length,
            refetching: queriesAfterInvalidate.map(q => ({
              key: q.queryKey,
              isFetching: q.state.isFetching,
            }))
          })
        }, 500)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isSuccess, txHash, queryClient])

  return {
    withdraw,
    hash: txHash,
    isWithdrawing: isWritePending || localState.isProcessing,
    isConfirming,
    isSuccess,
    error: txError?.message || null,
  }
}

/**
 * Hook to handle yield claims
 * 
 * Usage:
 * ```tsx
 * const { 
 *   claimYield, 
 *   isClaimingYield, 
 *   isSuccess, 
 *   error 
 * } = useClaimYieldV2()
 * 
 * await claimYield() // Claims all accrued yield
 * ```
 */
export function useClaimYieldV2() {
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<{
    isProcessing: boolean
    hash: string | null
  }>({
    isProcessing: false,
    hash: null,
  })

  const { writeContract, data: txHash, error: txError, isPending: isWritePending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    pollingInterval: 1000,
  })

  const claimYield = useCallback(async () => {
    try {
      setLocalState({ isProcessing: true, hash: null })

      writeContract(
        {
          address: POOL_ADDRESS,
          abi: INDIVIDUAL_POOL_ABI,
          functionName: 'claimYield',
          args: [],
        },
        {
          onSuccess(hash) {
            setLocalState({ isProcessing: true, hash })
            console.log('✅ Claim yield tx sent:', hash)
          },
          onError(error) {
            setLocalState({ isProcessing: false, hash: null })
            console.error('❌ Claim yield error:', error.message)
            throw error
          },
        }
      )
    } catch (error) {
      setLocalState({ isProcessing: false, hash: null })
      throw error
    }
  }, [writeContract])

  // Auto-refetch when confirmed
  useEffect(() => {
    if (isSuccess && txHash) {
      console.log('✅ Claim yield confirmed! Invalidating queries in 5 seconds...')
      const timer = setTimeout(() => {
        console.log('🔄 [INVALIDATE] Starting query invalidation after claim yield...')
        
        // Log queries before invalidation
        const queriesBeforeInvalidate = queryClient.getQueryCache().findAll({ queryKey: ['individual-pool'] })
        console.log('📋 [INVALIDATE] Found queries to invalidate:', {
          count: queriesBeforeInvalidate.length,
          keys: queriesBeforeInvalidate.map(q => q.queryKey),
        })
        
        // Invalidate all individual-pool queries
        queryClient.invalidateQueries({
          queryKey: ['individual-pool'],
        })
        
        setLocalState({ isProcessing: false, hash: txHash })
        
        // Verify invalidation worked
        setTimeout(() => {
          const queriesAfterInvalidate = queryClient.getQueryCache().findAll({ queryKey: ['individual-pool'] })
          console.log('✅ [INVALIDATE] Queries invalidated. Refetching status:', {
            count: queriesAfterInvalidate.length,
            refetching: queriesAfterInvalidate.map(q => ({
              key: q.queryKey,
              isFetching: q.state.isFetching,
            }))
          })
        }, 500)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isSuccess, txHash, queryClient])

  return {
    claimYield,
    hash: txHash,
    isClaimingYield: isWritePending || localState.isProcessing,
    isConfirming,
    isSuccess,
    error: txError?.message || null,
  }
}
