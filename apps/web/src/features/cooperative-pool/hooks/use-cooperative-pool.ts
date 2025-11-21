import { useCooperativePool } from '@khipu/web3'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserCooperativePosition, getCooperativePoolData, getCooperativePoolUsers } from '../api/client'
import { useAccount } from 'wagmi'

export function useCooperativePoolData() {
  const { address } = useAccount()
  const pool = useCooperativePool()
  const queryClient = useQueryClient()

  // Fetch user position from API
  const { data: userPosition, isLoading: isLoadingPosition } = useQuery({
    queryKey: ['cooperative-pool', 'position', address],
    queryFn: () => getUserCooperativePosition(address!),
    enabled: !!address,
    refetchInterval: 10000,
  })

  // Fetch pool data from API
  const { data: poolData, isLoading: isLoadingPool } = useQuery({
    queryKey: ['cooperative-pool', 'data'],
    queryFn: getCooperativePoolData,
    refetchInterval: 30000,
  })

  // Fetch pool users
  const { data: poolUsers } = useQuery({
    queryKey: ['cooperative-pool', 'users'],
    queryFn: () => getCooperativePoolUsers(process.env.NEXT_PUBLIC_COOPERATIVE_POOL_ADDRESS!),
    refetchInterval: 30000,
  })

  // Create pool mutation
  const createPoolMutation = useMutation({
    mutationFn: async (params: {
      name: string
      targetAmount: string
      deadline: number
    }) => {
      await pool.createPool(params.name, params.targetAmount, params.deadline)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooperative-pool'] })
    },
  })

  // Join pool mutation
  const joinPoolMutation = useMutation({
    mutationFn: async (params: { poolId: string; amount: string }) => {
      await pool.joinPool(params.poolId, params.amount)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooperative-pool'] })
    },
  })

  // Leave pool mutation
  const leavePoolMutation = useMutation({
    mutationFn: async (poolId: string) => {
      await pool.leavePool(poolId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooperative-pool'] })
    },
  })

  return {
    // Contract data
    poolInfo: pool.poolInfo,
    memberInfo: pool.memberInfo,

    // API data
    userPosition,
    poolData,
    poolUsers,

    // Loading states
    isLoading: isLoadingPosition || isLoadingPool || pool.isLoading,

    // Mutations
    createPool: createPoolMutation.mutate,
    joinPool: joinPoolMutation.mutate,
    leavePool: leavePoolMutation.mutate,

    // Mutation states
    isCreating: createPoolMutation.isPending,
    isJoining: joinPoolMutation.isPending,
    isLeaving: leavePoolMutation.isPending,
  }
}
