/**
 * @fileoverview Simple Withdraw Hook - Production Ready
 * Handles full withdrawal (principal + yields)
 */

'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { parseEther, type Address } from 'viem'

const POOL_ADDRESS = '0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393' as Address

const POOL_ABI = [
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [
      { name: 'musdAmount', type: 'uint256' },
      { name: 'netYield', type: 'uint256' }
    ]
  },
  {
    name: 'withdrawPartial',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'musdAmount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

type WithdrawState = 
  | 'idle'
  | 'confirming'      // User confirming in wallet
  | 'processing'      // TX submitted, waiting for confirmation
  | 'success'
  | 'error'

export function useSimpleWithdraw() {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  
  const [state, setState] = useState<WithdrawState>('idle')
  const [error, setError] = useState<string>('')

  // Withdraw transaction
  const {
    writeContract: withdrawWrite,
    data: withdrawTxHash,
    error: withdrawError,
    reset: resetWithdraw
  } = useWriteContract()
  
  const {
    isLoading: isWithdrawPending,
    isSuccess: isWithdrawSuccess,
    data: withdrawReceipt
  } = useWaitForTransactionReceipt({
    hash: withdrawTxHash,
  })

  // Handle state transitions
  useEffect(() => {
    if (isWithdrawPending && state === 'confirming') {
      setState('processing')
    }
  }, [isWithdrawPending, state])

  useEffect(() => {
    if (isWithdrawSuccess && state === 'processing') {
      console.log('✅ Withdraw confirmed!')
      console.log('📝 Transaction hash:', withdrawReceipt?.transactionHash)
      console.log('🔄 Refetching all queries...')
      
      // Invalidate all queries to update UI
      queryClient.invalidateQueries()
      queryClient.refetchQueries({ type: 'active' })
      
      setState('success')
    }
  }, [isWithdrawSuccess, state, queryClient, withdrawReceipt])

  // Handle errors
  useEffect(() => {
    if (withdrawError) {
      console.error('❌ Withdraw error:', withdrawError)
      setState('error')
      
      const msg = withdrawError.message || ''
      if (msg.includes('User rejected') || msg.includes('user rejected')) {
        setError('Rechazaste la transacción en tu wallet')
      } else if (msg.includes('insufficient funds')) {
        setError('No tienes suficiente BTC para pagar el gas')
      } else if (msg.includes('NoActiveDeposit')) {
        setError('No tienes depósitos activos para retirar')
      } else {
        setError('Error al retirar. Intenta nuevamente.')
      }
    }
  }, [withdrawError])

  // Main withdraw function (full or partial)
  const withdraw = async (amountString?: string) => {
    if (!address) {
      setError('Conecta tu wallet primero')
      setState('error')
      return
    }

    try {
      setState('idle')
      setError('')
      resetWithdraw()

      // If amount provided, do partial withdrawal
      if (amountString) {
        const amount = parseEther(amountString)
        
        // Validate minimum (1 MUSD)
        if (amount < parseEther('1')) {
          setError('El mínimo de retiro parcial es 1 MUSD')
          setState('error')
          return
        }

        console.log('💸 Starting partial withdrawal:', amountString, 'MUSD')
        setState('confirming')

        withdrawWrite({
          address: POOL_ADDRESS,
          abi: POOL_ABI,
          functionName: 'withdrawPartial',
          args: [amount]
        })
      } else {
        // Full withdrawal
        console.log('💸 Starting full withdrawal...')
        setState('confirming')

        withdrawWrite({
          address: POOL_ADDRESS,
          abi: POOL_ABI,
          functionName: 'withdraw',
        })
      }
    } catch (err) {
      console.error('❌ Error:', err)
      setState('error')
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  // Reset function
  const reset = () => {
    setState('idle')
    setError('')
    resetWithdraw()
  }

  return {
    withdraw,
    reset,
    state,
    error,
    withdrawTxHash: withdrawReceipt?.transactionHash || withdrawTxHash,
    isProcessing: state === 'confirming' || state === 'processing',
    canWithdraw: state === 'idle' || state === 'error' || state === 'success',
  }
}
