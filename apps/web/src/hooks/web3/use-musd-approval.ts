'use client'

import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useCallback, useEffect } from 'react'
import { parseEther, maxUint256 } from 'viem'
import { MEZO_TESTNET_ADDRESSES, ERC20_ABI } from '@/lib/web3/contracts'

/**
 * Hook to manage MUSD approval for IndividualPool
 * 
 * MUSD is an ERC20 token, so users must approve the pool to spend their MUSD
 * This hook handles checking allowance and approving MUSD
 */
export function useMUSDApproval() {
  const { address, isConnected } = useAccount()
  const [error, setError] = useState<string | null>(null)
  const [isRefetching, setIsRefetching] = useState(false)

  const musdAddress = MEZO_TESTNET_ADDRESSES.musd as `0x${string}`
  const poolAddress = MEZO_TESTNET_ADDRESSES.individualPool as `0x${string}`

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: musdAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, poolAddress] : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  })

  // Get MUSD balance
  const { data: musdBalance, refetch: refetchBalance } = useReadContract({
    address: musdAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  })

  // Approve transaction
  const {
    writeContract: approve,
    isPending: isApproving,
    data: approveTxHash,
  } = useWriteContract()

  const { data: approveReceipt, isLoading: isWaitingApproval } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  })

  // Auto-refetch allowance when approval completes
  const isApprovalComplete = !!approveReceipt?.blockHash
  
  // Use effect to refetch when approval completes
  const handleApprovalComplete = useCallback(async () => {
    if (isApprovalComplete && !isRefetching) {
      setIsRefetching(true)
      try {
        // Small delay to ensure blockchain state is updated
        await new Promise(resolve => setTimeout(resolve, 1000))
        await refetchAllowance()
        await refetchBalance()
      } catch (err) {
        console.error('Error refetching after approval:', err)
      } finally {
        setIsRefetching(false)
      }
    }
  }, [isApprovalComplete, isRefetching, refetchAllowance, refetchBalance])

  // Auto-refetch when approval completes
  useEffect(() => {
    handleApprovalComplete()
  }, [handleApprovalComplete])

  // Check if approval is needed
  const needsApproval = (amount: string): boolean => {
    if (!allowance) return true
    const requiredAmount = parseEther(amount)
    return allowance < requiredAmount
  }

  // Handle approval
  const handleApprove = useCallback(
    async (amount?: string) => {
      try {
        setError(null)

        if (!address) {
          setError('Wallet not connected')
          return
        }

        // If no amount specified, approve infinite (unlimited)
        const approvalAmount = amount ? parseEther(amount) : maxUint256

        approve({
          address: musdAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [poolAddress, approvalAmount],
          account: address,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Approval failed')
      }
    },
    [approve, musdAddress, poolAddress, address]
  )

  // Format balance for display
  const formattedBalance = musdBalance ? (Number(musdBalance) / 1e18).toFixed(6) : '0.000000'
  const formattedAllowance = allowance ? (Number(allowance) / 1e18).toFixed(6) : '0.000000'

  return {
    // Balance info
    musdBalance,
    formattedBalance,

    // Allowance info
    allowance,
    formattedAllowance,
    needsApproval,

    // Approval actions
    approve: handleApprove,
    isApproving,
    isWaitingApproval,
    approveTxHash,
    approveReceipt,
    isApprovalComplete,

    // Utilities
    refetchAllowance,
    refetchBalance,
    error,
  }
}

/**
 * Format MUSD amount with proper decimals
 */
export function formatMUSD(value: bigint | undefined): string {
  if (!value) return '0.000000'
  return (Number(value) / 1e18).toFixed(6)
}

/**
 * Format MUSD for display (shorter format)
 */
export function formatMUSDShort(value: bigint | undefined): string {
  if (!value) return '0'
  const amount = Number(value) / 1e18
  if (amount >= 1000) return (amount / 1000).toFixed(2) + 'k'
  if (amount >= 1) return amount.toFixed(2)
  return amount.toFixed(6)
}
