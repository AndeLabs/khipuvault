/**
 * @fileoverview Pool Details Hook
 *
 * Combines all pool-related data fetching hooks for the pool details modal.
 * Provides a single interface for all pool data needs.
 */

"use client";

import {
  usePoolInfo,
  usePoolMembers,
  useMemberInfo,
  useMemberYield,
} from "@/hooks/web3/use-cooperative-pool";

export function usePoolDetails(poolId: number | null) {
  const { poolInfo, isLoading: loadingPool } = usePoolInfo(poolId ?? 0);
  const { members, isLoading: loadingMembers } = usePoolMembers(poolId ?? 0);
  const { memberInfo, isLoading: loadingMember } = useMemberInfo(poolId ?? 0);
  const { pendingYield } = useMemberYield(poolId ?? 0);

  const isLoading = loadingPool || loadingMembers || loadingMember;
  const isMember = memberInfo?.active ?? false;
  const totalShares = members.reduce((sum, m) => sum + m.shares, BigInt(0));

  return {
    poolInfo,
    members,
    memberInfo,
    pendingYield,
    isLoading,
    isMember,
    totalShares,
  };
}
