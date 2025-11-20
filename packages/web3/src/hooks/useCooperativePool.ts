import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { TESTNET_ADDRESSES } from '../addresses'

/**
 * Hook para interactuar con CooperativePool V3
 */
export function useCooperativePool() {
  // Read functions
  const { data: poolInfo } = useReadContract({
    address: TESTNET_ADDRESSES.COOPERATIVE_POOL,
    abi: [], // TODO: Add ABI
    functionName: 'getPool',
  })

  const { data: memberInfo } = useReadContract({
    address: TESTNET_ADDRESSES.COOPERATIVE_POOL,
    abi: [], // TODO: Add ABI
    functionName: 'getMemberInfo',
  })

  // Write functions
  const { writeContract: createPool, data: createHash } = useWriteContract()
  const { writeContract: joinPool, data: joinHash } = useWriteContract()
  const { writeContract: leavePool, data: leaveHash } = useWriteContract()

  // Transaction confirmations
  const { isLoading: isCreateConfirming } = useWaitForTransactionReceipt({ hash: createHash })
  const { isLoading: isJoinConfirming } = useWaitForTransactionReceipt({ hash: joinHash })
  const { isLoading: isLeaveConfirming } = useWaitForTransactionReceipt({ hash: leaveHash })

  return {
    // Read data
    poolInfo,
    memberInfo,

    // Write functions
    createPool,
    joinPool,
    leavePool,

    // Loading states
    isCreateConfirming,
    isJoinConfirming,
    isLeaveConfirming,

    // Transaction hashes
    createHash,
    joinHash,
    leaveHash,
  }
}
