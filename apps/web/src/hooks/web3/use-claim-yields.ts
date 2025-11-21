/**
 * @fileoverview Claim Yields Hook - IndividualPoolV3 Feature
 * 
 * Allows users to claim their accumulated yields without withdrawing principal
 * Production-ready with proper error handling
 */

'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { type Address } from 'viem'

const POOL_ADDRESS = '0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393' as Address

const POOL_ABI = [
  {
    name: 'claimYield',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: 'netYield', type: 'uint256' }]
  }
] as const

type ClaimState = 
  | 'idle'
  | 'confirming'
  | 'processing'
  | 'success'
  | 'error'

export function useClaimYields() {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  
  const [state, setState] = useState<ClaimState>('idle')
  const [error, setError] = useState<string>('')

  const {
    writeContract,
    data: txHash,
    error: txError,
    reset: resetTx
  } = useWriteContract()
  
  const {
    isLoading: isPending,
    isSuccess,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Handle state transitions
  useEffect(() => {
    if (isPending && state === 'confirming') {
      setState('processing')
    }
  }, [isPending, state])

  useEffect(() => {
    if (isSuccess && state === 'processing') {
      console.log('✅ Yields claimed successfully!')
      console.log('📝 Transaction hash:', receipt?.transactionHash)
      
      // Refetch user info to update yields
      queryClient.invalidateQueries({ queryKey: ['pool-simple'] })
      queryClient.refetchQueries({ type: 'active' })
      
      setState('success')
    }
  }, [isSuccess, state, queryClient, receipt])

  // Handle errors
  useEffect(() => {
    if (txError) {
      console.error('❌ Claim error:', txError)
      setState('error')
      
      const msg = txError.message || ''
      if (msg.includes('User rejected') || msg.includes('user rejected')) {
        setError('Rechazaste la transacción en tu wallet')
      } else if (msg.includes('NoActiveDeposit')) {
        setError('No tienes un depósito activo')
      } else if (msg.includes('InvalidAmount')) {
        setError('No tienes yields para reclamar')
      } else {
        setError('Error al reclamar yields')
      }
    }
  }, [txError])

  // Main function
  const claimYields = async () => {
    if (!address) {
      setError('Conecta tu wallet primero')
      setState('error')
      return
    }

    try {
      setState('idle')
      setError('')
      resetTx()

      console.log('💰 Claiming yields...')
      setState('confirming')

      writeContract({
        address: POOL_ADDRESS,
        abi: POOL_ABI,
        functionName: 'claimYield',
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
    resetTx()
  }

  return {
    claimYields,
    reset,
    state,
    error,
    txHash: receipt?.transactionHash || txHash,
    isProcessing: state === 'confirming' || state === 'processing',
    canClaim: state === 'idle' || state === 'error' || state === 'success',
  }
}
