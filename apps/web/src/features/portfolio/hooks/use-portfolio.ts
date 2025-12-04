import { useQuery } from '@tanstack/react-query'
import { getUserPortfolio, getUserTransactions, getAllPools } from '../api/client'
import { useAccount } from 'wagmi'

export function usePortfolio() {
  const { address } = useAccount()

  const { data: portfolio, isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ['portfolio', address],
    queryFn: () => getUserPortfolio(address!),
    enabled: !!address,
    refetchInterval: 10000,
  })

  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['portfolio', 'transactions', address],
    queryFn: () => getUserTransactions(address!),
    enabled: !!address,
    refetchInterval: 15000,
  })

  const { data: pools, isLoading: isLoadingPools } = useQuery({
    queryKey: ['pools'],
    queryFn: getAllPools,
    refetchInterval: 30000,
  })

  return {
    portfolio,
    transactions: transactionsData || [],
    pools,
    isLoading: isLoadingPortfolio || isLoadingTransactions || isLoadingPools,
  }
}
