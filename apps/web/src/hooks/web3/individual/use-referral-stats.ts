"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, useConfig } from "wagmi";
import { readContract } from "wagmi/actions";

import { queryKeys } from "@/lib/query-keys";
import {
  MEZO_TESTNET_ADDRESSES,
  INDIVIDUAL_POOL_ABI,
  type ReferralStats,
} from "@/lib/web3/contracts-v3";

/**
 * Hook for fetching referral system data
 * Isolated to prevent unnecessary re-renders when referral data updates
 */
export function useReferralStats() {
  const { address, isConnected } = useAccount();
  const config = useConfig();

  const poolAddress = MEZO_TESTNET_ADDRESSES.individualPoolV3 as `0x${string}`;

  const { data: referralStatsRaw, isLoading } = useQuery({
    queryKey: address
      ? [...queryKeys.individualPool.userInfo(address), "referral-stats"]
      : ["individual-pool", "user-info", "none", "referral-stats"],
    queryFn: async () => {
      if (!address) return null;
      const result = await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: "getReferralStats",
        args: [address],
      });
      return result as unknown as [bigint, bigint, string];
    },
    enabled: isConnected && !!address,
    staleTime: 10_000,
  });

  const referralStats: ReferralStats | null = referralStatsRaw
    ? {
        count: referralStatsRaw[0],
        rewards: referralStatsRaw[1],
        referrer: referralStatsRaw[2],
      }
    : null;

  return {
    referralStats,
    referralCount: referralStats?.count ?? BigInt(0),
    totalRewards: referralStats?.rewards ?? BigInt(0),
    hasReferralRewards: referralStats ? referralStats.rewards > BigInt(0) : false,
    referrer: referralStats?.referrer ?? null,
    isLoading,
  };
}
