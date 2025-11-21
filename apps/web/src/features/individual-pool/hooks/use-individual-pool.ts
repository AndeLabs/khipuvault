import { useIndividualPool } from '@khipu/web3'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserPosition, getPoolData } from '../api/client'
import { useAccount } from 'wagmi'

export function useIndividualPoolData() {
  const { address } = useAccount()
  const pool = useIndividualPool()
  const queryClient = useQueryClient()

  // Fetch user position from API
  const { data: userPosition, isLoading: isLoadingPosition } = useQuery({
    queryKey: ['individual-pool', 'position', address],
    queryFn: () => getUserPosition(address!),
    enabled: !!address,
    refetchInterval: 10000, // Refetch every 10 seconds
  })

  // Fetch pool data from API
  const { data: poolData, isLoading: isLoadingPool } = useQuery({
    queryKey: ['individual-pool', 'data'],
    queryFn: getPoolData,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (amount: string) => {
      await pool.deposit(amount)
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['individual-pool'] })
    },
  })

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (amount: string) => {
      await pool.withdraw(amount)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['individual-pool'] })
    },
  })

  // Claim yield mutation
  const claimYieldMutation = useMutation({
    mutationFn: async () => {
      await pool.claimYield()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['individual-pool'] })
    },
  })

  return {
    // Contract data
    userInfo: pool.userInfo,
    pendingYield: pool.pendingYield,

    // API data
    userPosition,
    poolData,

    // Loading states
    isLoading: isLoadingPosition || isLoadingPool || pool.isLoading,

    // Mutations
    deposit: depositMutation.mutate,
    withdraw: withdrawMutation.mutate,
    claimYield: claimYieldMutation.mutate,

    // Mutation states
    isDepositing: depositMutation.isPending,
    isWithdrawing: withdrawMutation.isPending,
    isClaiming: claimYieldMutation.isPending,
  }
}
