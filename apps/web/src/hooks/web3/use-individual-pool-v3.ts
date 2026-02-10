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
  type ReferralStats,
} from "@/lib/web3/contracts-v3";

/**
 * Production hook for IndividualPoolV3 with all V3 features
 *
 * V3 Features:
 * ✅ Auto-Compound
 * ✅ Referral System
 * ✅ Incremental Deposits
 * ✅ Partial Withdrawals
 * ✅ Enhanced View Functions
 */
export function useIndividualPoolV3() {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const queryClient = useQueryClient();

  const poolAddress = MEZO_TESTNET_ADDRESSES.individualPoolV3 as `0x${string}`;
  const musdAddress = MEZO_TESTNET_ADDRESSES.musd as `0x${string}`;

  // ========================================================================
  // POOL STATISTICS
  // ========================================================================

  const { data: totalMusdDeposited } = useQuery({
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

  const { data: totalYieldsGenerated } = useQuery({
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

  const { data: totalReferralRewards } = useQuery({
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

  // ========================================================================
  // USER DATA (V3 Enhanced)
  // ========================================================================

  // Use getUserInfo() instead of userDeposits - V3 feature!
  const {
    data: userInfoRaw,
    isLoading: loadingUserInfo,
    refetch: refetchUserInfo,
  } = useQuery({
    queryKey: address
      ? queryKeys.individualPool.userInfo(address)
      : ["individual-pool", "user-info", "none"],
    queryFn: async () => {
      if (!address) {
        return null;
      }
      try {
        const result = await readContract(config, {
          address: poolAddress,
          abi: INDIVIDUAL_POOL_ABI,
          functionName: "getUserInfo",
          args: [address],
        });
        if (!result || !Array.isArray(result)) {
          return null;
        }
        return result as unknown as [bigint, bigint, bigint, bigint, bigint, boolean];
      } catch (error) {
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
  const { data: userTotalBalance } = useQuery({
    queryKey: address
      ? [...queryKeys.individualPool.userInfo(address), "total-balance"]
      : ["individual-pool", "user-info", "none", "total-balance"],
    queryFn: async () => {
      if (!address) {
        return null;
      }
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

  // ========================================================================
  // REFERRAL SYSTEM
  // ========================================================================

  const { data: referralStatsRaw } = useQuery({
    queryKey: address
      ? [...queryKeys.individualPool.userInfo(address), "referral-stats"]
      : ["individual-pool", "user-info", "none", "referral-stats"],
    queryFn: async () => {
      if (!address) {
        return null;
      }
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

  // ========================================================================
  // WALLET BALANCES
  // ========================================================================

  const { data: musdBalance } = useQuery({
    queryKey: address ? queryKeys.tokens.musdBalance(address) : ["tokens", "musd-balance", "none"],
    queryFn: async () => {
      if (!address) {
        return null;
      }
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

  // ========================================================================
  // CONTRACT CONFIGURATION
  // ========================================================================

  const { data: performanceFee } = useQuery({
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
    staleTime: 60_000,
  });

  const { data: emergencyMode } = useQuery({
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

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================

  const poolStats = {
    totalMusdDeposited: BigInt((totalMusdDeposited as unknown as bigint) || 0n),
    totalYields: BigInt((totalYieldsGenerated as unknown as bigint) || 0n),
    totalReferralRewards: BigInt((totalReferralRewards as unknown as bigint) || 0n),
    poolAPR: userInfo?.estimatedAPR ? Number(userInfo.estimatedAPR) / 100 : 0,
    emergencyMode: Boolean(emergencyMode),
  };

  const walletBalances = {
    musdBalance: BigInt((musdBalance as unknown as bigint) || 0n),
  };

  const hasActiveDeposit = userInfo ? userInfo.deposit > BigInt(0) : false;
  const canWithdrawPartial =
    hasActiveDeposit && userInfo
      ? userInfo.deposit >= BigInt(V3_FEATURES.individualPool.minWithdrawal)
      : false;
  const shouldShowAutoCompound =
    hasActiveDeposit && userInfo
      ? userInfo.yields >= BigInt(V3_FEATURES.individualPool.autoCompoundThreshold)
      : false;

  // ========================================================================
  // HELPER FUNCTIONS
  // ========================================================================

  const refetchAll = () => {
    return queryClient.refetchQueries({ queryKey: queryKeys.individualPool.all });
  };

  const invalidateAll = () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.individualPool.all });
  };

  return {
    // Pool Statistics
    poolStats,
    poolTVL: BigInt((totalMusdDeposited as unknown as bigint) || 0n),

    // User Data
    userInfo,
    userTotalBalance: BigInt((userTotalBalance as unknown as bigint) || 0n),
    hasActiveDeposit,

    // Referral System
    referralStats,
    hasReferralRewards: referralStats ? referralStats.rewards > BigInt(0) : false,
    referralCount: referralStats?.count ?? BigInt(0),

    // Wallet
    walletBalances,

    // Contract Config
    performanceFee:
      Number((performanceFee as unknown as bigint) || 0n) ||
      V3_FEATURES.individualPool.performanceFee,
    emergencyMode: poolStats.emergencyMode,

    // UI Helpers
    canWithdrawPartial,
    shouldShowAutoCompound,
    autoCompoundEnabled: userInfo?.autoCompoundEnabled ?? false,

    // V3 Features Info
    features: V3_FEATURES.individualPool,

    // Loading States
    isLoading: loadingUserInfo,
    isConnected,
    address,

    // Actions
    refetchAll,
    invalidateAll,
    refetchUserInfo,

    // Contract Addresses
    contracts: {
      pool: poolAddress,
      musd: musdAddress,
    },
  };
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

export function formatMUSD(value: bigint | undefined): string {
  if (!value) {
    return "0.00";
  }
  const num = Number(value) / 1e18;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatMUSDCompact(value: bigint | undefined): string {
  if (!value) {
    return "0";
  }
  const num = Number(value) / 1e18;
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toFixed(2);
}

export function formatAPR(apr: bigint | number): string {
  const value = typeof apr === "bigint" ? Number(apr) / 100 : apr;
  return `${value.toFixed(2)}%`;
}

export function formatDays(days: bigint | number): string {
  const value = typeof days === "bigint" ? Number(days) : days;
  if (value === 0) {
    return "Hoy";
  }
  if (value === 1) {
    return "1 día";
  }
  return `${value} días`;
}

export function formatReferralBonus(): string {
  return `${(V3_FEATURES.individualPool.referralBonus / 100).toFixed(2)}%`;
}

export function calculateFee(amount: bigint, feeBps: number): bigint {
  return (amount * BigInt(feeBps)) / BigInt(10000);
}

export function calculateNetAmount(gross: bigint, feeBps: number): bigint {
  const fee = calculateFee(gross, feeBps);
  return gross - fee;
}

// Backward compatibility
export { useIndividualPoolV3 as useIndividualPoolData };
