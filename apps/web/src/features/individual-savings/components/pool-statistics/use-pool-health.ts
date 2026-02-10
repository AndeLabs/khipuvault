import * as React from "react";
import { formatUnits } from "viem";

interface UsePoolHealthProps {
  totalDeposits: bigint;
  poolAPR: number;
  activeDepositors: number;
  emergencyMode: boolean;
}

interface PoolHealthResult {
  healthScore: number;
  healthColor: string;
  healthLabel: string;
}

/**
 * Hook to calculate pool health metrics based on deposits, APR, and active users.
 *
 * Health Score Calculation (0-100):
 * - Deposits: 40 points (normalized to 100K mUSD max)
 * - APR: 30 points (normalized to 10% APR max)
 * - Depositors: 30 points (normalized to 100 users max)
 *
 * Health Levels:
 * - Excellent: 70-100
 * - Good: 40-69
 * - Fair: 0-39
 */
export function usePoolHealth({
  totalDeposits,
  poolAPR,
  activeDepositors,
  emergencyMode,
}: UsePoolHealthProps): PoolHealthResult {
  const healthScore = React.useMemo(() => {
    if (emergencyMode) {
      return 0;
    }

    // Deposits score: 40 points max (normalized to 100K mUSD)
    const depositsInMUSD = Number(formatUnits(totalDeposits, 18));
    const depositsScore = Math.min(depositsInMUSD / 100_000, 1) * 40;

    // APR score: 30 points max (normalized to 10% APR)
    const aprScore = Math.min(poolAPR / 10, 1) * 30;

    // Depositors score: 30 points max (normalized to 100 users)
    const depositorsScore = Math.min(activeDepositors / 100, 1) * 30;

    return Math.round(depositsScore + aprScore + depositorsScore);
  }, [totalDeposits, poolAPR, activeDepositors, emergencyMode]);

  const healthColor = React.useMemo(() => {
    if (healthScore >= 70) {
      return "text-success";
    }
    if (healthScore >= 40) {
      return "text-warning";
    }
    return "text-error";
  }, [healthScore]);

  const healthLabel = React.useMemo(() => {
    if (healthScore >= 70) {
      return "Excellent";
    }
    if (healthScore >= 40) {
      return "Good";
    }
    return "Fair";
  }, [healthScore]);

  return {
    healthScore,
    healthColor,
    healthLabel,
  };
}
