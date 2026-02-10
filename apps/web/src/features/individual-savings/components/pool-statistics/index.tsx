"use client";

import { TrendingUp, Database, Award, Activity } from "lucide-react";
import { formatUnits } from "viem";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { V3_FEATURES } from "@/lib/web3/contracts-v3";

import { HealthScoreCard } from "./health-score-card";
import { PerformanceMetrics } from "./performance-metrics";
import { StatCard } from "./stat-card";
import { usePoolHealth } from "./use-pool-health";

export interface PoolStatisticsProps {
  totalDeposits?: bigint;
  totalYields?: bigint;
  totalReferralRewards?: bigint;
  poolAPR?: number;
  performanceFee?: number;
  activeDepositors?: number;
  emergencyMode?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function PoolStatistics({
  totalDeposits = BigInt(0),
  totalYields = BigInt(0),
  totalReferralRewards = BigInt(0),
  poolAPR = 6.2,
  performanceFee = 100, // basis points
  activeDepositors = 0,
  emergencyMode = false,
  isLoading,
  className,
}: PoolStatisticsProps) {
  // Format values
  const formatValue = (value: bigint) => {
    try {
      const num = Number(formatUnits(value, 18));
      if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(2)}M`;
      }
      if (num >= 1_000) {
        return `${(num / 1_000).toFixed(2)}K`;
      }
      return num.toFixed(2);
    } catch {
      return "0.00";
    }
  };

  const formattedTotalDeposits = formatValue(totalDeposits);
  const formattedTotalYields = formatValue(totalYields);
  const formattedReferralRewards = formatValue(totalReferralRewards);

  // Calculate pool health
  const { healthScore, healthColor, healthLabel } = usePoolHealth({
    totalDeposits,
    poolAPR,
    activeDepositors,
    emergencyMode,
  });

  if (isLoading) {
    return (
      <Card variant="surface" className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={`skeleton-${i}`} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="surface" hover="glow-success" className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-success flex h-10 w-10 items-center justify-center rounded-full">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Pool Statistics</CardTitle>
              <CardDescription>Real-time metrics from IndividualPoolV3</CardDescription>
            </div>
          </div>

          <HealthScoreCard
            emergencyMode={emergencyMode}
            healthScore={healthScore}
            healthColor={healthColor}
            healthLabel={healthLabel}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<Database className="h-4 w-4" />}
            label="Total Value Locked"
            value={formattedTotalDeposits}
            description="mUSD across all depositors"
            tooltipText="Total amount of mUSD deposited by all users in the Individual Savings Pool. This represents the total capital earning yields through Mezo's Stability Pool."
            variant="success"
          />

          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Total Yields"
            value={formattedTotalYields}
            description="mUSD earned lifetime"
            tooltipText="Lifetime yields generated for all users. This is the total profit earned from Mezo's Stability Pool since the contract was deployed."
            variant="lavanda"
          />

          <StatCard
            icon={<Award className="h-4 w-4" />}
            label="Referral Rewards"
            value={formattedReferralRewards}
            description="mUSD paid to referrers"
            tooltipText="Total referral bonuses distributed to users who referred others. Referrers earn 0.5% of each deposit from their referred users."
            variant="accent"
          />

          <PerformanceMetrics
            poolAPR={poolAPR}
            performanceFee={performanceFee}
            activeDepositors={activeDepositors}
          />
        </div>

        {/* V3 Features Banner */}
        <div className="rounded-lg border border-lavanda/20 bg-gradient-to-r from-lavanda/10 to-accent/10 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lavanda/20">
              <Activity className="h-4 w-4 text-lavanda" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-semibold">V3 Features Active</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  Auto-Compound
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Referral System
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Partial Withdrawals
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Flash Loan Protection
                </Badge>
                <Badge variant="outline" className="text-xs">
                  UUPS Upgradeable
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                This pool uses the latest V3 smart contract with enhanced security and gas
                optimization
              </p>
            </div>
          </div>
        </div>

        {/* Contract Info */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Min Deposit:</span>
            <span className="font-mono">
              {Number(formatUnits(BigInt(V3_FEATURES.individualPool.minDeposit), 18))} mUSD
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Min Withdrawal:</span>
            <span className="font-mono">
              {Number(formatUnits(BigInt(V3_FEATURES.individualPool.minWithdrawal), 18))} mUSD
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Auto-Compound Threshold:</span>
            <span className="font-mono">
              {Number(formatUnits(BigInt(V3_FEATURES.individualPool.autoCompoundThreshold), 18))}{" "}
              mUSD
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
