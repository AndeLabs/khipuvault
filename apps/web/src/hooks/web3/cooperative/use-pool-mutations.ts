/**
 * @fileoverview Cooperative Pool V3 Mutations (Write Operations)
 * @module hooks/web3/cooperative/use-pool-mutations
 *
 * All write operations for cooperative pools
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { parseEther, type Address } from 'viem'
import { MEZO_TESTNET_ADDRESSES } from '@/lib/web3/contracts-v3'
import { ActionState, QUERY_KEYS } from './constants'
import { parsePoolError } from './use-pool-helpers'

const poolAddress = MEZO_TESTNET_ADDRESSES.cooperativePoolV3

// Minimal typed ABIs for mutations - ensures correct typing without full ABI import
const JOIN_POOL_ABI = [{
  type: 'function',
  name: 'joinPool',
  inputs: [{ name: 'poolId', type: 'uint256' }],
  outputs: [],
  stateMutability: 'payable'
}] as const

const LEAVE_POOL_ABI = [{
  type: 'function',
  name: 'leavePool',
  inputs: [{ name: 'poolId', type: 'uint256' }],
  outputs: [],
  stateMutability: 'nonpayable'
}] as const

const CREATE_POOL_ABI = [{
  type: 'function',
  name: 'createPool',
  inputs: [
    { name: 'name', type: 'string' },
    { name: 'minContribution', type: 'uint256' },
    { name: 'maxContribution', type: 'uint256' },
    { name: 'maxMembers', type: 'uint256' }
  ],
  outputs: [{ name: 'poolId', type: 'uint256' }],
  stateMutability: 'nonpayable'
}] as const

const CLAIM_YIELD_ABI = [{
  type: 'function',
  name: 'claimYield',
  inputs: [{ name: 'poolId', type: 'uint256' }],
  outputs: [],
  stateMutability: 'nonpayable'
}] as const

const CLOSE_POOL_ABI = [{
  type: 'function',
  name: 'closePool',
  inputs: [{ name: 'poolId', type: 'uint256' }],
  outputs: [],
  stateMutability: 'nonpayable'
}] as const

// ============================================================================
// BASE MUTATION HOOK
// ============================================================================

/**
 * Base hook for pool mutations - handles common transaction logic
 */
function usePoolMutation() {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()

  const [state, setState] = useState<ActionState>('idle')
  const [error, setError] = useState<string>('')

  const {
    writeContract: write,
    data: txHash,
    error: writeError,
    reset: resetWrite
  } = useWriteContract()

  const {
    isLoading: isPending,
    isSuccess,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && state === 'processing') {
      console.log('✅ Transaction confirmed!')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BASE })
      setState('success')
    }
  }, [isSuccess, state, queryClient])

  // Handle state transitions
  useEffect(() => {
    if (isPending && state === 'executing') {
      setState('processing')
    }
  }, [isPending, state])

  // Handle errors
  useEffect(() => {
    if (writeError) {
      console.error('❌ Transaction error:', writeError)
      setState('error')
      setError(parsePoolError(writeError))
    }
  }, [writeError])

  const reset = useCallback(() => {
    setState('idle')
    setError('')
    resetWrite()
  }, [resetWrite])

  return {
    address,
    isConnected,
    state,
    setState,
    error,
    setError,
    write,
    reset,
    txHash: receipt?.transactionHash || txHash,
    isProcessing: state !== 'idle' && state !== 'success' && state !== 'error',
  }
}

// ============================================================================
// CREATE POOL
// ============================================================================

/**
 * Create a new cooperative pool
 */
export function useCreatePool() {
  const mutation = usePoolMutation()

  const createPool = useCallback(async (
    name: string,
    minContribution: string,
    maxContribution: string,
    maxMembers: number
  ) => {
    if (!mutation.address) {
      mutation.setError('Please connect your wallet')
      mutation.setState('error')
      return
    }

    try {
      mutation.setState('idle')
      mutation.setError('')
      mutation.reset()

      const min = parseEther(minContribution)
      const max = parseEther(maxContribution)

      console.log('🏗️ Creating pool:', { name, minContribution, maxContribution, maxMembers })
      mutation.setState('executing')

      mutation.write({
        address: poolAddress,
        abi: CREATE_POOL_ABI,
        functionName: 'createPool',
        args: [name, min, max, BigInt(maxMembers)]
      })
    } catch (err) {
      console.error('❌ Error:', err)
      mutation.setState('error')
      mutation.setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [mutation])

  return {
    createPool,
    ...mutation
  }
}

// ============================================================================
// JOIN POOL
// ============================================================================

/**
 * Join an existing cooperative pool
 */
export function useJoinPool() {
  const mutation = usePoolMutation()

  const joinPool = useCallback(async (poolId: number, btcAmount: string) => {
    if (!mutation.address) {
      mutation.setError('Please connect your wallet')
      mutation.setState('error')
      return
    }

    try {
      mutation.setState('idle')
      mutation.setError('')
      mutation.reset()

      const amount = parseEther(btcAmount)

      console.log('🤝 Joining pool:', poolId, 'with', btcAmount, 'BTC')
      mutation.setState('executing')

      mutation.write({
        address: poolAddress,
        abi: JOIN_POOL_ABI,
        functionName: 'joinPool',
        args: [BigInt(poolId)],
        value: amount
      })
    } catch (err) {
      console.error('❌ Error:', err)
      mutation.setState('error')
      mutation.setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [mutation])

  return {
    joinPool,
    ...mutation
  }
}

// ============================================================================
// LEAVE POOL
// ============================================================================

/**
 * Leave a cooperative pool
 */
export function useLeavePool() {
  const mutation = usePoolMutation()

  const leavePool = useCallback(async (poolId: number) => {
    if (!mutation.address) {
      mutation.setError('Please connect your wallet')
      mutation.setState('error')
      return
    }

    try {
      mutation.setState('idle')
      mutation.setError('')
      mutation.reset()

      console.log('👋 Leaving pool:', poolId)
      mutation.setState('executing')

      mutation.write({
        address: poolAddress,
        abi: LEAVE_POOL_ABI,
        functionName: 'leavePool',
        args: [BigInt(poolId)]
      })
    } catch (err) {
      console.error('❌ Error:', err)
      mutation.setState('error')
      mutation.setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [mutation])

  return {
    leavePool,
    ...mutation
  }
}

// ============================================================================
// CLAIM YIELD
// ============================================================================

/**
 * Claim yields from a cooperative pool
 */
export function useClaimYield() {
  const mutation = usePoolMutation()

  const claimYield = useCallback(async (poolId: number) => {
    if (!mutation.address) {
      mutation.setError('Please connect your wallet')
      mutation.setState('error')
      return
    }

    try {
      mutation.setState('idle')
      mutation.setError('')
      mutation.reset()

      console.log('💰 Claiming yields from pool:', poolId)
      mutation.setState('executing')

      mutation.write({
        address: poolAddress,
        abi: CLAIM_YIELD_ABI,
        functionName: 'claimYield',
        args: [BigInt(poolId)]
      })
    } catch (err) {
      console.error('❌ Error:', err)
      mutation.setState('error')
      mutation.setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [mutation])

  return {
    claimYield,
    ...mutation
  }
}

// ============================================================================
// CLOSE POOL
// ============================================================================

/**
 * Close a cooperative pool (creator only)
 */
export function useClosePool() {
  const mutation = usePoolMutation()

  const closePool = useCallback(async (poolId: number) => {
    if (!mutation.address) {
      mutation.setError('Please connect your wallet')
      mutation.setState('error')
      return
    }

    try {
      mutation.setState('idle')
      mutation.setError('')
      mutation.reset()

      console.log('🔒 Closing pool:', poolId)
      mutation.setState('executing')

      mutation.write({
        address: poolAddress,
        abi: CLOSE_POOL_ABI,
        functionName: 'closePool',
        args: [BigInt(poolId)]
      })
    } catch (err) {
      console.error('❌ Error:', err)
      mutation.setState('error')
      mutation.setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [mutation])

  return {
    closePool,
    ...mutation
  }
}
