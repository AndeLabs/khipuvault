'use client'

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useCallback } from 'react'
import { parseEther } from 'viem'
import { MEZO_TESTNET_ADDRESSES, INDIVIDUAL_POOL_ABI, ERC20_ABI } from '@/lib/web3/contracts'

/**
 * Hook for depositing MUSD to Individual Pool
 * 
 * IMPORTANT: MUSD-only model (simplified)
 * - Users obtain MUSD first at mezo.org
 * - Approve MUSD to IndividualPool
 * - Deposit MUSD amount
 * - Yields are generated automatically
 */
export function useDepositToPool() {
  const { address } = useAccount()
  const [error, setError] = useState<string | null>(null)

  const poolAddress = MEZO_TESTNET_ADDRESSES.individualPool as `0x${string}`
  const musdAddress = MEZO_TESTNET_ADDRESSES.musd as `0x${string}`

  const {
    writeContract: deposit,
    isPending,
    data: txHash,
  } = useWriteContract()

  const { data: receipt, isLoading: isWaiting } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const handleDeposit = useCallback(
    async (musdAmount: string) => {
      try {
        setError(null)

        if (!address) {
          setError('Wallet not connected')
          return
        }

        // Parse MUSD amount (18 decimals, standard ERC20)
        const amount = parseEther(musdAmount)
        if (amount <= 0n) {
          setError('Amount must be greater than 0')
          return
        }

        // Validate amount is within limits (10 - 100,000 MUSD)
        const minDeposit = parseEther('10')
        const maxDeposit = parseEther('100000')
        
        if (amount < minDeposit) {
          setError('Minimum deposit is 10 MUSD')
          return
        }
        
        if (amount > maxDeposit) {
          setError('Maximum deposit is 100,000 MUSD')
          return
        }

        // Deposit MUSD to pool
        // User must approve MUSD first (see useMUSDApproval hook)
        deposit({
          address: poolAddress,
          abi: INDIVIDUAL_POOL_ABI,
          functionName: 'deposit',
          args: [amount], // Pass MUSD amount as argument
          account: address,
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMsg)
        console.error('Deposit error:', err)
      }
    },
    [deposit, poolAddress, address]
  )

  return {
    deposit: handleDeposit,
    isPending,
    isWaiting,
    txHash,
    receipt,
    error,
    isSuccess: !!receipt?.blockHash,
  }
}

/**
 * Hook for claiming yields from Individual Pool
 */
export function useClaimYield() {
  const { address } = useAccount()
  const [error, setError] = useState<string | null>(null)

  const poolAddress = MEZO_TESTNET_ADDRESSES.individualPool as `0x${string}`

  const {
    writeContract: claimYield,
    isPending,
    data: txHash,
  } = useWriteContract()

  const { data: receipt, isLoading: isWaiting } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const handleClaimYield = useCallback(async () => {
    try {
      setError(null)

      // ClaimYield takes no arguments - claims all available yields
      claimYield({
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: 'claimYield',
        args: [],
        account: address,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    }
  }, [claimYield, poolAddress, address])

  return {
    claimYield: handleClaimYield,
    isPending,
    isWaiting,
    txHash,
    receipt,
    error,
    isSuccess: !!receipt?.blockHash,
  }
}

/**
 * Hook for withdrawing ALL MUSD from Individual Pool
 * IMPORTANT: withdraw() takes NO parameters - withdraws entire user deposit + yields
 * Returns both principal MUSD + accumulated yields in MUSD
 */
export function useWithdrawFromPool() {
  const { address } = useAccount()
  const [error, setError] = useState<string | null>(null)

  const poolAddress = MEZO_TESTNET_ADDRESSES.individualPool as `0x${string}`

  const {
    writeContract: withdraw,
    isPending,
    data: txHash,
  } = useWriteContract()

  const { data: receipt, isLoading: isWaiting } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const handleWithdraw = useCallback(
    async () => {
      try {
        setError(null)

        if (!address) {
          setError('Wallet not connected')
          return
        }

        // Withdraw ALL MUSD from pool (principal + yields)
        // NO parameters needed - contract withdraws entire user position
        withdraw({
          address: poolAddress,
          abi: INDIVIDUAL_POOL_ABI,
          functionName: 'withdraw',
          args: [], // NO args - withdraw() takes no parameters
          account: address,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      }
    },
    [withdraw, poolAddress, address]
  )

  return {
    withdraw: handleWithdraw,
    isPending,
    isWaiting,
    txHash,
    receipt,
    error,
    isSuccess: !!receipt?.blockHash,
  }
}

/**
 * Hook to check if user needs to approve MUSD (for future features)
 * Note: BTC doesn't need approval (it's native)
 */
export function useCheckMUSDAllowance() {
  // MUSD approval might be needed for some operations
  // but NOT for deposits (BTC is native)
  return {
    needsApproval: false, // For deposits, always false
    checkAllowance: () => Promise.resolve(false),
  }
}
