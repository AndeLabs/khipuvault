/**
 * @fileoverview Deposit Hook with Auto Approve
 * @module hooks/web3/use-deposit-with-approve
 * 
 * Handles deposit with automatic MUSD approval
 * This fixes the issue where deposits were failing due to missing approve
 */

'use client'

import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback, useState } from 'react'
import { parseEther, maxUint256, Address } from 'viem'
import { readContract } from 'wagmi/actions'
import { useConfig } from 'wagmi'
import { MEZO_TESTNET_ADDRESSES, INDIVIDUAL_POOL_ABI } from '@/lib/web3/contracts'

const POOL_ADDRESS = MEZO_TESTNET_ADDRESSES.individualPool as `0x${string}`
const MUSD_ADDRESS = MEZO_TESTNET_ADDRESSES.musd as `0x${string}`

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  }
] as const

export function useDepositWithApprove() {
  const { address } = useAccount()
  const config = useConfig()
  const queryClient = useQueryClient()
  const [localState, setLocalState] = useState<{
    isProcessing: boolean
    depositHash: string | null
    approveHash: string | null
    step: 'idle' | 'checking' | 'approving' | 'depositing'
    error: string | null
  }>({
    isProcessing: false,
    depositHash: null,
    approveHash: null,
    step: 'idle',
    error: null,
  })

  const [pendingAmount, setPendingAmount] = useState<bigint | null>(null)

  const { writeContract: writeApprove, data: approveHash } = useWriteContract()
  const { writeContract: writeDeposit, data: depositHash } = useWriteContract()

  const { isLoading: isApproving, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
    pollingInterval: 1000,
  })

  const { isLoading: isDepositing, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
    pollingInterval: 1000,
  })

  // After approve succeeds, do deposit
  useEffect(() => {
    if (isApproveSuccess && pendingAmount && localState.step === 'approving') {
      console.log('✅ Approval confirmed! Now depositing...')
      setLocalState(prev => ({ ...prev, step: 'depositing' }))
      
      writeDeposit(
        {
          address: POOL_ADDRESS,
          abi: INDIVIDUAL_POOL_ABI,
          functionName: 'deposit',
          args: [pendingAmount],
        },
        {
          onSuccess: (hash) => {
            console.log('✅ Deposit tx sent:', hash)
            setLocalState(prev => ({ ...prev, depositHash: hash }))
          },
          onError: (error) => {
            console.error('❌ Deposit error:', error.message)
            setLocalState(prev => ({
              ...prev,
              step: 'idle',
              isProcessing: false,
              error: error.message
            }))
          }
        }
      )
    }
  }, [isApproveSuccess, pendingAmount, localState.step, writeDeposit])

  // After deposit succeeds, refetch data
  useEffect(() => {
    if (isDepositSuccess && depositHash) {
      console.log('✅ Deposit confirmed!')
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['individual-pool'] })
        setLocalState(prev => ({
          ...prev,
          isProcessing: false,
          step: 'idle',
        }))
        setPendingAmount(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isDepositSuccess, depositHash, queryClient])

  const deposit = useCallback(
    async (amount: string | bigint) => {
      try {
        if (!address) {
          throw new Error('Wallet not connected')
        }

        const amountWei = typeof amount === 'string' ? parseEther(amount) : amount
        setPendingAmount(amountWei)

        // Check current allowance
        console.log('🔍 Checking MUSD allowance...')
        setLocalState(prev => ({ ...prev, step: 'checking', isProcessing: true }))

        const allowance = await readContract(config, {
          address: MUSD_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, POOL_ADDRESS],
        }) as bigint

        console.log('Current allowance:', allowance.toString())
        console.log('Required amount:', amountWei.toString())

        if (allowance >= amountWei) {
          // Already approved, just deposit
          console.log('✅ Already approved! Depositing directly...')
          setLocalState(prev => ({ ...prev, step: 'depositing' }))
          
          writeDeposit(
            {
              address: POOL_ADDRESS,
              abi: INDIVIDUAL_POOL_ABI,
              functionName: 'deposit',
              args: [amountWei],
            },
            {
              onSuccess: (hash) => {
                console.log('✅ Deposit tx sent:', hash)
                setLocalState(prev => ({ ...prev, depositHash: hash }))
              },
              onError: (error) => {
                console.error('❌ Deposit error:', error.message)
                setLocalState(prev => ({
                  ...prev,
                  step: 'idle',
                  isProcessing: false,
                  error: error.message
                }))
              }
            }
          )
        } else {
          // Need to approve first
          console.log('1️⃣ Requesting MUSD approval for unlimited amount...')
          setLocalState(prev => ({ ...prev, step: 'approving' }))
          
          writeApprove(
            {
              address: MUSD_ADDRESS,
              abi: ERC20_ABI,
              functionName: 'approve',
              args: [POOL_ADDRESS, maxUint256],
            },
            {
              onSuccess: (hash) => {
                console.log('✅ Approve tx sent:', hash)
                setLocalState(prev => ({ ...prev, approveHash: hash }))
              },
              onError: (error) => {
                console.error('❌ Approve error:', error.message)
                setLocalState(prev => ({
                  ...prev,
                  step: 'idle',
                  isProcessing: false,
                  error: error.message
                }))
              }
            }
          )
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('❌ Deposit error:', errorMsg)
        setLocalState(prev => ({
          ...prev,
          isProcessing: false,
          step: 'idle',
          error: errorMsg
        }))
        throw error
      }
    },
    [address, config, writeApprove, writeDeposit]
  )

  return {
    deposit,
    isApproving,
    isDepositing,
    isProcessing: localState.isProcessing,
    isSuccess: isDepositSuccess,
    approveHash,
    depositHash,
    step: localState.step,
    error: localState.error,
  }
}
