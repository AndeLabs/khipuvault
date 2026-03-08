"use client";

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

// Import specialized sub-hooks
import { usePoolStatistics } from "./individual/use-pool-statistics";
import { useUserPoolInfo } from "./individual/use-user-pool-info";
import { useReferralStats } from "./individual/use-referral-stats";
import { usePoolConfig } from "./individual/use-pool-config";

/**
 * Production hook for IndividualPoolV3 with all V3 features
 *
 * V3 Features:
 * ✅ Auto-Compound
 * ✅ Referral System
 * ✅ Incremental Deposits
 * ✅ Partial Withdrawals
 * ✅ Enhanced View Functions
 *
 * NOTE: For better performance, consider using the specialized sub-hooks directly:
 * - usePoolStatistics()  - Pool TVL, yields, referral rewards
 * - useUserPoolInfo()    - User deposits, balances, permissions
 * - useReferralStats()   - Referral count, rewards, referrer
 * - usePoolConfig()      - Contract config (fees, emergency mode)
 *
 * This combined hook is provided for backwards compatibility and convenience
 * when you need all data at once.
 */
export function useIndividualPoolV3() {
  const queryClient = useQueryClient();

  // Use specialized sub-hooks
  const poolStats = usePoolStatistics();
  const userInfo = useUserPoolInfo();
  const referral = useReferralStats();
  const config = usePoolConfig();

  // Combine loading states
  const isLoading =
    poolStats.isLoading || userInfo.isLoading || referral.isLoading || config.isLoading;

  // Combined refetch/invalidate functions
  const refetchAll = () => {
    return queryClient.refetchQueries({ queryKey: queryKeys.individualPool.all });
  };

  const invalidateAll = () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.individualPool.all });
  };

  return {
    // Pool Statistics
    poolStats: {
      totalMusdDeposited: poolStats.totalMusdDeposited,
      totalYields: poolStats.totalYieldsGenerated,
      totalReferralRewards: poolStats.totalReferralRewards,
      poolAPR: userInfo.userInfo?.estimatedAPR ? Number(userInfo.userInfo.estimatedAPR) / 100 : 0,
      emergencyMode: config.emergencyMode,
    },
    poolTVL: poolStats.totalMusdDeposited,

    // User Data
    userInfo: userInfo.userInfo,
    userTotalBalance: userInfo.userTotalBalance,
    hasActiveDeposit: userInfo.hasActiveDeposit,

    // Referral System
    referralStats: referral.referralStats,
    hasReferralRewards: referral.hasReferralRewards,
    referralCount: referral.referralCount,

    // Wallet
    walletBalances: {
      musdBalance: userInfo.musdBalance,
    },

    // Contract Config
    performanceFee: config.performanceFee,
    emergencyMode: config.emergencyMode,

    // UI Helpers
    canWithdrawPartial: userInfo.canWithdrawPartial,
    shouldShowAutoCompound: userInfo.shouldShowAutoCompound,
    autoCompoundEnabled: userInfo.autoCompoundEnabled,

    // V3 Features Info
    features: config.features,

    // Loading States
    isLoading,
    isConnected: userInfo.isConnected,
    address: userInfo.address,

    // Actions
    refetchAll,
    invalidateAll,
    refetchUserInfo: userInfo.refetchUserInfo,

    // Contract Addresses
    contracts: config.contracts,
  };
}

// Re-export formatters from centralized location
export {
  formatMUSD,
  formatMUSDCompact,
  formatAPR,
  formatDays,
  formatReferralBonus,
  calculateFee,
  calculateNetAmount,
} from "./individual/formatters";

// Backward compatibility
export { useIndividualPoolV3 as useIndividualPoolData };
