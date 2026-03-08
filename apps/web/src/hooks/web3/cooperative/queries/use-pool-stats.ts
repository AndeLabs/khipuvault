/**
 * @fileoverview Global Pool Statistics Queries
 * @module hooks/web3/cooperative/queries/use-pool-stats
 *
 * Read-only queries for global cooperative pool statistics
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { type Address } from "viem";
import { useAccount, useConfig } from "wagmi";

import { queryKeys } from "@/lib/query-keys";
import { QUERY_PRESETS } from "@/lib/query-config";
import {
  MEZO_TESTNET_ADDRESSES,
  COOPERATIVE_POOL_V3_ABI as POOL_ABI,
} from "@/lib/web3/contracts-v3";

const poolAddress = MEZO_TESTNET_ADDRESSES.cooperativePoolV3 as Address;

/**
 * Get the total number of pools created
 */
export function usePoolCounter() {
  const { isConnected } = useAccount();
  const config = useConfig();

  return useQuery({
    queryKey: [...queryKeys.cooperativePool.all, "pool-counter"],
    queryFn: async () => {
      const result = await readContract(config, {
        address: poolAddress,
        abi: POOL_ABI,
        functionName: "poolCounter",
        args: [],
      });
      return Number(result || 0n);
    },
    enabled: isConnected,
    staleTime: QUERY_PRESETS.POOL_CONFIG.staleTime,
  });
}

/**
 * Get the current performance fee (in basis points)
 */
export function usePerformanceFee() {
  const { isConnected } = useAccount();
  const config = useConfig();

  return useQuery({
    queryKey: [...queryKeys.cooperativePool.all, "performance-fee"],
    queryFn: async () => {
      const result = await readContract(config, {
        address: poolAddress,
        abi: POOL_ABI,
        functionName: "performanceFee",
        args: [],
      });
      return Number(result || 0n);
    },
    enabled: isConnected,
    staleTime: QUERY_PRESETS.POOL_CONFIG.staleTime,
  });
}

/**
 * Check if emergency mode is active
 */
export function useEmergencyMode() {
  const { isConnected } = useAccount();
  const config = useConfig();

  return useQuery({
    queryKey: [...queryKeys.cooperativePool.all, "emergency-mode"],
    queryFn: async () => {
      const result = await readContract(config, {
        address: poolAddress,
        abi: POOL_ABI,
        functionName: "emergencyMode",
        args: [],
      });
      return Boolean(result);
    },
    enabled: isConnected,
    staleTime: QUERY_PRESETS.POOL_CONFIG.staleTime,
  });
}
