/**
 * @fileoverview Individual Pool Detail Queries
 * @module hooks/web3/cooperative/queries/use-pool-details
 *
 * Read-only queries for individual pool and member data
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
  type MemberWithAddress,
  type MemberInfoContractResponse,
  type PoolInfoContractResponse,
  parsePoolInfo,
  parseMemberInfo,
} from "../constants";

const poolAddress = MEZO_TESTNET_ADDRESSES.cooperativePoolV3 as Address;

/**
 * Get detailed information about a specific pool
 * @param poolId - The ID of the pool to query
 */
export function usePoolInfo(poolId: number) {
  const config = useConfig();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.cooperativePool.pool(poolId),
    queryFn: async () => {
      if (poolId <= 0) {
        return null;
      }

      try {
        const result = await readContract(config, {
          address: poolAddress,
          abi: POOL_ABI,
          functionName: "getPoolInfo",
          args: [BigInt(poolId)],
        });

        if (!result) {
          return null;
        }

        return parsePoolInfo(result as PoolInfoContractResponse);
      } catch {
        return null;
      }
    },
    enabled: poolId > 0,
    staleTime: QUERY_PRESETS.POOL_INFO.staleTime,
    refetchInterval: QUERY_PRESETS.POOL_INFO.refetchInterval,
    retry: 2,
  });

  return { poolInfo: data, isLoading, error, refetch };
}

/**
 * Get member information for a specific address in a pool
 * @param poolId - The pool ID
 * @param memberAddress - Optional address to query (defaults to connected address)
 */
export function useMemberInfo(poolId: number, memberAddress?: Address) {
  const { address } = useAccount();
  const config = useConfig();
  const userAddress = memberAddress ?? address;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: userAddress
      ? queryKeys.cooperativePool.memberInfo(poolId, userAddress)
      : [...queryKeys.cooperativePool.all, "member-info", poolId, "none"],
    queryFn: async () => {
      if (poolId <= 0 || !userAddress) {
        return null;
      }

      try {
        const result = await readContract(config, {
          address: poolAddress,
          abi: POOL_ABI,
          functionName: "getMemberInfo",
          args: [BigInt(poolId), userAddress],
        });

        if (!result) {
          return null;
        }

        return parseMemberInfo(result as MemberInfoContractResponse);
      } catch {
        return null;
      }
    },
    enabled: poolId > 0 && !!userAddress,
    staleTime: QUERY_PRESETS.POOL_INFO.staleTime,
    refetchInterval: QUERY_PRESETS.POOL_INFO.refetchInterval,
    retry: 2,
  });

  return { memberInfo: data, isLoading, error, refetch };
}

/**
 * Get all members of a pool with their information
 * @param poolId - The pool ID
 */
export function usePoolMembers(poolId: number) {
  const config = useConfig();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.cooperativePool.members(poolId),
    queryFn: async () => {
      if (poolId <= 0) {
        return [];
      }

      try {
        const addresses = (await readContract(config, {
          address: poolAddress,
          abi: POOL_ABI,
          functionName: "getPoolMembers",
          args: [BigInt(poolId)],
        })) as Address[];

        if (!addresses || !Array.isArray(addresses)) {
          return [];
        }

        // Fetch member info for each address
        const membersWithInfo = await Promise.all(
          addresses.map(async (addr) => {
            try {
              const result = await readContract(config, {
                address: poolAddress,
                abi: POOL_ABI,
                functionName: "getMemberInfo",
                args: [BigInt(poolId), addr],
              });

              if (!result) {
                return null;
              }

              const parsed = parseMemberInfo(result as MemberInfoContractResponse);
              const memberInfo: MemberWithAddress = {
                address: addr,
                ...parsed,
              };

              return memberInfo;
            } catch {
              return null;
            }
          })
        );

        const validMembers = membersWithInfo.filter(
          (m): m is MemberWithAddress => m !== null && m.active
        );

        return validMembers;
      } catch {
        return [];
      }
    },
    enabled: poolId > 0,
    staleTime: QUERY_PRESETS.POOL_MEMBERS.staleTime,
    refetchInterval: QUERY_PRESETS.POOL_MEMBERS.refetchInterval,
    retry: 2,
  });

  return { members: data ?? [], isLoading, error, refetch };
}

/**
 * Calculate pending yield for a member
 * @param poolId - The pool ID
 * @param memberAddress - Optional address to query (defaults to connected address)
 */
export function useMemberYield(poolId: number, memberAddress?: Address) {
  const { address } = useAccount();
  const config = useConfig();
  const userAddress = memberAddress ?? address;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: userAddress
      ? queryKeys.cooperativePool.memberYield(poolId, userAddress)
      : [...queryKeys.cooperativePool.all, "member-yield", poolId, "none"],
    queryFn: async () => {
      if (poolId <= 0 || !userAddress) {
        return BigInt(0);
      }

      try {
        const result = await readContract(config, {
          address: poolAddress,
          abi: POOL_ABI,
          functionName: "calculateMemberYield",
          args: [BigInt(poolId), userAddress],
        });

        return typeof result === "bigint" ? result : 0n;
      } catch {
        return 0n;
      }
    },
    enabled: poolId > 0 && !!userAddress,
    staleTime: QUERY_PRESETS.POOL_MEMBERS.staleTime,
    refetchInterval: QUERY_PRESETS.POOL_MEMBERS.refetchInterval,
    retry: 2,
  });

  return { pendingYield: data ?? BigInt(0), isLoading, error, refetch };
}
