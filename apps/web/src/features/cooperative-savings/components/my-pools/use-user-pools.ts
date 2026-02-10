/**
 * @fileoverview Hook for fetching user's pools with statistics
 */

"use client";

import {
  useUserPools as useUserPoolsBase,
  useCreatedPools,
} from "@/hooks/web3/use-all-cooperative-pools";

export interface UserPoolsStatistics {
  totalContribution: bigint;
  totalPendingYield: bigint;
  totalPools: number;
}

export function useUserPools() {
  const { pools: userPools, isLoading: loadingUserPools } = useUserPoolsBase();
  const { pools: createdPools, isLoading: loadingCreatedPools } = useCreatedPools();

  const isLoading = loadingUserPools || loadingCreatedPools;

  // Calculate total statistics
  const statistics: UserPoolsStatistics = {
    totalContribution: userPools.reduce((sum, p) => sum + p.userContribution, BigInt(0)),
    totalPendingYield: userPools.reduce((sum, p) => sum + p.userPendingYield, BigInt(0)),
    totalPools: userPools.length,
  };

  return {
    userPools,
    createdPools,
    statistics,
    isLoading,
  };
}
