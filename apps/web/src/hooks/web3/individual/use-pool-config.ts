"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, useConfig } from "wagmi";
import { readContract } from "wagmi/actions";

import { queryKeys } from "@/lib/query-keys";
import { MEZO_TESTNET_ADDRESSES, INDIVIDUAL_POOL_ABI, V3_FEATURES } from "@/lib/web3/contracts-v3";

/**
 * Hook for fetching contract configuration
 * Static data that rarely changes - uses longer stale times
 */
export function usePoolConfig() {
  const { isConnected } = useAccount();
  const config = useConfig();

  const poolAddress = MEZO_TESTNET_ADDRESSES.individualPoolV3 as `0x${string}`;
  const musdAddress = MEZO_TESTNET_ADDRESSES.musd as `0x${string}`;

  const { data: performanceFee, isLoading: loadingFee } = useQuery({
    queryKey: [...queryKeys.individualPool.stats(), "performance-fee"],
    queryFn: async () => {
      return await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: "performanceFee",
        args: [],
      });
    },
    enabled: isConnected,
    staleTime: 60_000, // 1 minute - rarely changes
  });

  const { data: emergencyMode, isLoading: loadingEmergency } = useQuery({
    queryKey: [...queryKeys.individualPool.stats(), "emergency-mode"],
    queryFn: async () => {
      return await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: "emergencyMode",
        args: [],
      });
    },
    enabled: isConnected,
    staleTime: 10_000,
  });

  return {
    performanceFee:
      (performanceFee as unknown as bigint) || BigInt(V3_FEATURES.individualPool.performanceFee),
    emergencyMode: Boolean(emergencyMode),
    features: V3_FEATURES.individualPool,
    isLoading: loadingFee || loadingEmergency,

    // Contract addresses
    contracts: {
      pool: poolAddress,
      musd: musdAddress,
    },
  };
}
