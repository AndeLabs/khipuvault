"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, useConfig } from "wagmi";
import { readContract } from "wagmi/actions";

import { queryKeys } from "@/lib/query-keys";
import { MEZO_TESTNET_ADDRESSES, INDIVIDUAL_POOL_ABI } from "@/lib/web3/contracts-v3";

/**
 * Hook for fetching IndividualPool statistics
 * Separated from main hook to enable selective subscription
 */
export function usePoolStatistics() {
  const { isConnected } = useAccount();
  const config = useConfig();

  const poolAddress = MEZO_TESTNET_ADDRESSES.individualPoolV3 as `0x${string}`;

  const { data: totalMusdDeposited, isLoading: loadingTvl } = useQuery({
    queryKey: queryKeys.individualPool.stats(),
    queryFn: async () => {
      return await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: "totalMusdDeposited",
        args: [],
      });
    },
    enabled: isConnected,
    staleTime: 10_000,
  });

  const { data: totalYieldsGenerated, isLoading: loadingYields } = useQuery({
    queryKey: [...queryKeys.individualPool.stats(), "total-yields"],
    queryFn: async () => {
      return await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: "totalYieldsGenerated",
        args: [],
      });
    },
    enabled: isConnected,
    staleTime: 10_000,
  });

  const { data: totalReferralRewards, isLoading: loadingRewards } = useQuery({
    queryKey: [...queryKeys.individualPool.stats(), "total-referral-rewards"],
    queryFn: async () => {
      return await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: "totalReferralRewards",
        args: [],
      });
    },
    enabled: isConnected,
    staleTime: 10_000,
  });

  return {
    totalMusdDeposited: BigInt((totalMusdDeposited as unknown as bigint) || 0n),
    totalYieldsGenerated: BigInt((totalYieldsGenerated as unknown as bigint) || 0n),
    totalReferralRewards: BigInt((totalReferralRewards as unknown as bigint) || 0n),
    isLoading: loadingTvl || loadingYields || loadingRewards,
    poolAddress,
  };
}
