"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useConfig } from "wagmi";
import { readContract } from "wagmi/actions";

import { queryKeys } from "@/lib/query-keys";
import {
  MEZO_TESTNET_ADDRESSES,
  INDIVIDUAL_POOL_ABI,
  ERC20_ABI,
  V3_FEATURES,
  type UserInfoV3,
} from "@/lib/web3/contracts-v3";

/**
 * Hook for fetching user-specific data from IndividualPool
 * Only subscribes to user-related queries for minimal re-renders
 */
export function useUserPoolInfo() {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const queryClient = useQueryClient();

  const poolAddress = MEZO_TESTNET_ADDRESSES.individualPoolV3 as `0x${string}`;
  const musdAddress = MEZO_TESTNET_ADDRESSES.musd as `0x${string}`;

  // User Info (V3 Enhanced)
  const {
    data: userInfoRaw,
    isLoading: loadingUserInfo,
    refetch: refetchUserInfo,
  } = useQuery({
    queryKey: address
      ? queryKeys.individualPool.userInfo(address)
      : ["individual-pool", "user-info", "none"],
    queryFn: async () => {
      if (!address) return null;
      try {
        const result = await readContract(config, {
          address: poolAddress,
          abi: INDIVIDUAL_POOL_ABI,
          functionName: "getUserInfo",
          args: [address],
        });
        if (!result || !Array.isArray(result)) return null;
        return result as unknown as [bigint, bigint, bigint, bigint, bigint, boolean];
      } catch {
        return null;
      }
    },
    enabled: isConnected && !!address,
    staleTime: 5_000,
    refetchInterval: 10_000,
  });

  // Parse getUserInfo result
  const userInfo: UserInfoV3 | null = userInfoRaw
    ? {
        deposit: userInfoRaw[0],
        yields: userInfoRaw[1],
        netYields: userInfoRaw[2],
        daysActive: userInfoRaw[3],
        estimatedAPR: userInfoRaw[4],
        autoCompoundEnabled: userInfoRaw[5],
      }
    : null;

  // Get user total balance (principal + net yields)
  const { data: userTotalBalance, isLoading: loadingBalance } = useQuery({
    queryKey: address
      ? [...queryKeys.individualPool.userInfo(address), "total-balance"]
      : ["individual-pool", "user-info", "none", "total-balance"],
    queryFn: async () => {
      if (!address) return null;
      return await readContract(config, {
        address: poolAddress,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: "getUserTotalBalance",
        args: [address],
      });
    },
    enabled: isConnected && !!address,
    staleTime: 5_000,
    refetchInterval: 10_000,
  });

  // MUSD Wallet Balance
  const { data: musdBalance, isLoading: loadingMusd } = useQuery({
    queryKey: address ? queryKeys.tokens.musdBalance(address) : ["tokens", "musd-balance", "none"],
    queryFn: async () => {
      if (!address) return null;
      return await readContract(config, {
        address: musdAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      });
    },
    enabled: isConnected && !!address,
    staleTime: 5_000,
    refetchInterval: 10_000,
  });

  // Computed values
  const hasActiveDeposit = userInfo ? userInfo.deposit > BigInt(0) : false;
  const canWithdrawPartial =
    hasActiveDeposit && userInfo
      ? userInfo.deposit >= BigInt(V3_FEATURES.individualPool.minWithdrawal)
      : false;
  const shouldShowAutoCompound =
    hasActiveDeposit && userInfo
      ? userInfo.yields >= BigInt(V3_FEATURES.individualPool.autoCompoundThreshold)
      : false;

  const invalidateUserData = () => {
    if (address) {
      return queryClient.invalidateQueries({
        queryKey: queryKeys.individualPool.userInfo(address),
      });
    }
  };

  return {
    // User Info
    userInfo,
    userTotalBalance: BigInt((userTotalBalance as unknown as bigint) || 0n),
    hasActiveDeposit,

    // Wallet
    musdBalance: BigInt((musdBalance as unknown as bigint) || 0n),

    // UI Helpers
    canWithdrawPartial,
    shouldShowAutoCompound,
    autoCompoundEnabled: userInfo?.autoCompoundEnabled ?? false,

    // Loading
    isLoading: loadingUserInfo || loadingBalance || loadingMusd,

    // Actions
    refetchUserInfo,
    invalidateUserData,

    // Identity
    address,
    isConnected,
  };
}
