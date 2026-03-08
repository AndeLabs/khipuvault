/**
 * @fileoverview Pool Details Hook
 *
 * Combines all pool-related data fetching hooks for the pool details modal.
 * Provides a single interface for all pool data needs.
 *
 * Note: The underlying hooks use `enabled: poolId > 0` so passing 0
 * when poolId is null is safe - queries won't execute until valid poolId.
 */

"use client";

import {
  usePoolInfo,
  usePoolMembers,
  useMemberInfo,
  useMemberYield,
} from "@/hooks/web3/use-cooperative-pool";

export function usePoolDetails(poolId: number | null) {
  // Safe: queries have `enabled: poolId > 0`, so 0 won't trigger network calls
  const safePoolId = poolId ?? 0;
  const { poolInfo, isLoading: loadingPool } = usePoolInfo(safePoolId);
  const { members, isLoading: loadingMembers } = usePoolMembers(safePoolId);
  const { memberInfo, isLoading: loadingMember } = useMemberInfo(safePoolId);
  const { pendingYield } = useMemberYield(safePoolId);

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
