/**
 * @fileoverview Aggregate Pool Queries
 * @module hooks/web3/cooperative/queries/use-pool-aggregates
 *
 * Queries that aggregate data across multiple pools
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

import {
  type PoolInfo,
  type MemberInfoContractResponse,
  type PoolInfoContractResponse,
  parsePoolInfo,
  parseMemberInfo,
} from "../constants";
import { usePoolCounter } from "./use-pool-stats";

const poolAddress = MEZO_TESTNET_ADDRESSES.cooperativePoolV3 as Address;

/**
 * Get all cooperative pools with their info
 * Used for displaying pool list and dashboard statistics
 */
export function useAllCooperativePools() {
  const config = useConfig();
  const { isConnected } = useAccount();

  // First get pool counter
  const { data: poolCounter } = usePoolCounter();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...queryKeys.cooperativePool.all, "all-pools", poolCounter ?? 0],
    queryFn: async () => {
      if (!poolCounter || poolCounter === 0) {
        return [];
      }

      const pools: PoolInfo[] = [];

      for (let i = 1; i <= poolCounter; i++) {
        try {
          const result = await readContract(config, {
            address: poolAddress,
            abi: POOL_ABI,
            functionName: "getPoolInfo",
            args: [BigInt(i)],
          });

          if (result) {
            const parsed = parsePoolInfo(result as PoolInfoContractResponse);
            pools.push({ ...parsed, id: i });
          }
        } catch {
          // Skip pools that fail to load
        }
      }

      return pools;
    },
    enabled: isConnected && !!poolCounter && poolCounter > 0,
    staleTime: QUERY_PRESETS.POOL_INFO.staleTime,
    refetchInterval: QUERY_PRESETS.POOL_INFO.refetchInterval,
  });

  return {
    pools: data ?? [],
    poolCounter: poolCounter ?? 0,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Get user's total contribution across all cooperative pools
 * Used for dashboard portfolio display
 *
 * @param userAddress - Address of the user (defaults to connected address)
 */
export function useUserCooperativeTotal(userAddress?: Address) {
  const { address } = useAccount();
  const config = useConfig();
  const targetAddress = userAddress ?? address;

  // Get pool counter
  const { data: poolCounter } = usePoolCounter();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      ...queryKeys.cooperativePool.all,
      "user-total",
      targetAddress ?? "none",
      poolCounter ?? 0,
    ],
    queryFn: async () => {
      if (!targetAddress || !poolCounter || poolCounter === 0) {
        return { totalContribution: 0n, poolsParticipated: 0, memberInfos: [] };
      }

      let totalContribution = 0n;
      let poolsParticipated = 0;
      const memberInfos: Array<{
        poolId: number;
        contribution: bigint;
        active: boolean;
      }> = [];

      for (let i = 1; i <= poolCounter; i++) {
        try {
          const result = await readContract(config, {
            address: poolAddress,
            abi: POOL_ABI,
            functionName: "getMemberInfo",
            args: [BigInt(i), targetAddress],
          });

          if (result) {
            const parsed = parseMemberInfo(result as MemberInfoContractResponse);
            if (parsed.active && parsed.btcContributed > 0n) {
              totalContribution += parsed.btcContributed;
              poolsParticipated++;
              memberInfos.push({
                poolId: i,
                contribution: parsed.btcContributed,
                active: parsed.active,
              });
            }
          }
        } catch {
          // Skip pools where user is not a member
        }
      }

      return { totalContribution, poolsParticipated, memberInfos };
    },
    enabled: !!targetAddress && !!poolCounter && poolCounter > 0,
    staleTime: QUERY_PRESETS.POOL_INFO.staleTime,
    refetchInterval: QUERY_PRESETS.POOL_INFO.refetchInterval,
  });

  return {
    totalContribution: data?.totalContribution ?? 0n,
    poolsParticipated: data?.poolsParticipated ?? 0,
    memberInfos: data?.memberInfos ?? [],
    isLoading,
    error,
    refetch,
  };
}
