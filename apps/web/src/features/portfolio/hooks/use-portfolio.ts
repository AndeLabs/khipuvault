import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

import { trackedApi } from "@/lib/api-client";

export function usePortfolio() {
  const { address } = useAccount();

  const { data: portfolio, isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ["portfolio", address],
    queryFn: () => trackedApi.getUserPortfolio(address!),
    enabled: !!address,
    refetchInterval: 10000,
  });

  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["portfolio", "transactions", address],
    queryFn: () => trackedApi.getUserTransactions(address!),
    enabled: !!address,
    refetchInterval: 15000,
  });

  const { data: pools, isLoading: isLoadingPools } = useQuery({
    queryKey: ["pools"],
    queryFn: trackedApi.getPools,
    refetchInterval: 30000,
  });

  return {
    portfolio,
    transactions: transactionsData ?? [],
    pools,
    isLoading: isLoadingPortfolio || isLoadingTransactions || isLoadingPools,
  };
}
