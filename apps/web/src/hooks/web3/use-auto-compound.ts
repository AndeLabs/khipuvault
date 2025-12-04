/**
 * @fileoverview Auto-Compound Hook - IndividualPoolV3 Feature
 * 
 * Allows users to toggle auto-compounding of yields
 * When enabled, yields are automatically reinvested into principal
 * 
 * Production-ready with proper error handling
 */

'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { type Address } from 'viem'
import { MEZO_TESTNET_ADDRESSES } from '@/lib/web3/contracts'

const POOL_ADDRESS = MEZO_TESTNET_ADDRESSES.individualPool as Address

const POOL_ABI = [
  {
    name: 'setAutoCompound',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'enabled', type: 'bool' }],
    outputs: []
  }
] as const

type AutoCompoundState = 
  | 'idle'
  | 'confirming'
  | 'processing'
  | 'success'
  | 'error'

export function useAutoCompound() {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  
  const [state, setState] = useState<AutoCompoundState>('idle')
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
      console.log('✅ Auto-compound setting updated!')
      console.log('📝 Transaction hash:', receipt?.transactionHash)

      // Immediately invalidate pool queries to update UI
      // The usePoolEvents hook also listens for AutoCompounded events
      queryClient.invalidateQueries({ queryKey: ['individual-pool-v3'] })
      queryClient.invalidateQueries({ queryKey: ['individual-pool'] })

      setState('success')
    }
  }, [isSuccess, state, queryClient, receipt])

  // Handle errors
  useEffect(() => {
    if (txError) {
      console.error('❌ Auto-compound error:', txError)
      setState('error')
      
      const msg = txError.message || ''
      if (msg.includes('User rejected') || msg.includes('user rejected')) {
        setError('Rechazaste la transacción en tu wallet')
      } else if (msg.includes('NoActiveDeposit')) {
        setError('No tienes un depósito activo')
      } else {
        setError('Error al cambiar configuración')
      }
    }
  }, [txError])

  // Main function
  const setAutoCompound = async (enabled: boolean) => {
    if (!address) {
      setError('Conecta tu wallet primero')
      setState('error')
      return
    }

    try {
      setState('idle')
      setError('')
      resetTx()

      console.log(`🔄 Setting auto-compound to: ${enabled}`)
      setState('confirming')

      writeContract({
        address: POOL_ADDRESS,
        abi: POOL_ABI,
        functionName: 'setAutoCompound',
        args: [enabled]
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
    setAutoCompound,
    reset,
    state,
    error,
    txHash: receipt?.transactionHash || txHash,
    isProcessing: state === 'confirming' || state === 'processing',
    canToggle: state === 'idle' || state === 'error' || state === 'success',
  }
}
