"use client";

import {
  TrendingUp,
  Database,
  Award,
  Users,
  PieChart,
  DollarSign,
  Info,
  Activity,
} from "lucide-react";
import * as React from "react";
import { formatUnits } from "viem";

import { AmountDisplay, PercentageDisplay } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { V3_FEATURES } from "@/lib/web3/contracts-v3";

interface PoolStatisticsProps {
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
      if (num >= 1_000_000) {return `${(num / 1_000_000).toFixed(2)}M`;}
      if (num >= 1_000) {return `${(num / 1_000).toFixed(2)}K`;}
      return num.toFixed(2);
    } catch {
      return "0.00";
    }
  };

  const formattedTotalDeposits = formatValue(totalDeposits);
  const formattedTotalYields = formatValue(totalYields);
  const formattedReferralRewards = formatValue(totalReferralRewards);
  const formattedPerformanceFee = (performanceFee / 100).toFixed(2);

  // Calculate pool health score (0-100)
  const healthScore = React.useMemo(() => {
    if (emergencyMode) {return 0;}
    const depositsScore =
      Math.min(Number(formatUnits(totalDeposits, 18)) / 100000, 1) * 40;
    const aprScore = Math.min(poolAPR / 10, 1) * 30;
    const depositorsScore = Math.min(activeDepositors / 100, 1) * 30;
    return Math.round(depositsScore + aprScore + depositorsScore);
  }, [totalDeposits, poolAPR, activeDepositors, emergencyMode]);

  const healthColor =
    healthScore >= 70
      ? "text-success"
      : healthScore >= 40
        ? "text-warning"
        : "text-error";
  const healthLabel =
    healthScore >= 70 ? "Excellent" : healthScore >= 40 ? "Good" : "Fair";

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
              <div key={i} className="space-y-2">
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
            <div className="h-10 w-10 rounded-full bg-gradient-success flex items-center justify-center">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Pool Statistics</CardTitle>
              <CardDescription>
                Real-time metrics from IndividualPoolV3
              </CardDescription>
            </div>
          </div>

          {emergencyMode ? (
            <Badge variant="error" className="gap-1.5">
              <Activity className="h-3 w-3" />
              Emergency Mode
            </Badge>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="success" className={`gap-1.5 ${healthColor}`}>
                    <Activity className="h-3 w-3" />
                    {healthLabel}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    Pool Health Score: {healthScore}/100
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Value Locked */}
          <div className="space-y-2 p-4 rounded-lg bg-gradient-success/10 border border-success/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="h-4 w-4" />
                <span>Total Value Locked</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm max-w-xs">
                      Total amount of mUSD deposited by all users in the
                      Individual Savings Pool. This represents the total capital
                      earning yields through Mezo's Stability Pool.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold tabular-nums text-success">
                {formattedTotalDeposits}
              </div>
              <p className="text-xs text-muted-foreground">
                mUSD across all depositors
              </p>
            </div>
          </div>

          {/* Total Yields Generated */}
          <div className="space-y-2 p-4 rounded-lg bg-gradient-lavanda/10 border border-lavanda/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Total Yields</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm max-w-xs">
                      Lifetime yields generated for all users. This is the total
                      profit earned from Mezo's Stability Pool since the
                      contract was deployed.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold tabular-nums text-lavanda">
                {formattedTotalYields}
              </div>
              <p className="text-xs text-muted-foreground">
                mUSD earned lifetime
              </p>
            </div>
          </div>

          {/* Total Referral Rewards */}
          <div className="space-y-2 p-4 rounded-lg bg-gradient-accent/10 border border-accent/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Award className="h-4 w-4" />
                <span>Referral Rewards</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm max-w-xs">
                      Total referral bonuses distributed to users who referred
                      others. Referrers earn 0.5% of each deposit from their
                      referred users.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold tabular-nums text-accent">
                {formattedReferralRewards}
              </div>
              <p className="text-xs text-muted-foreground">
                mUSD paid to referrers
              </p>
            </div>
          </div>

          {/* Pool APR */}
          <div className="space-y-2 p-4 rounded-lg bg-surface-elevated border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PieChart className="h-4 w-4" />
                <span>Current APR</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm max-w-xs">
                      Current Annual Percentage Rate based on recent yield
                      performance. This rate can fluctuate based on Stability
                      Pool activity.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold tabular-nums">
                {poolAPR.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Estimated annual return
              </p>
            </div>
          </div>

          {/* Performance Fee */}
          <div className="space-y-2 p-4 rounded-lg bg-surface-elevated border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Performance Fee</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm max-w-xs">
                      Fee charged on yields only (not on deposits). This fee
                      goes to the KhipuVault treasury to support protocol
                      development and operations.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold tabular-nums">
                {formattedPerformanceFee}%
              </div>
              <p className="text-xs text-muted-foreground">On yields only</p>
            </div>
          </div>

          {/* Active Depositors */}
          <div className="space-y-2 p-4 rounded-lg bg-surface-elevated border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Active Users</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm max-w-xs">
                      Number of unique addresses with active deposits in the
                      pool. More depositors indicates higher trust and adoption.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold tabular-nums">
                {activeDepositors}
              </div>
              <p className="text-xs text-muted-foreground">Unique depositors</p>
            </div>
          </div>
        </div>

        {/* V3 Features Banner */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-lavanda/10 to-accent/10 border border-lavanda/20">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-lavanda/20 flex items-center justify-center shrink-0">
              <Activity className="h-4 w-4 text-lavanda" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="font-semibold text-sm">V3 Features Active</h4>
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
                This pool uses the latest V3 smart contract with enhanced
                security and gas optimization
              </p>
            </div>
          </div>
        </div>

        {/* Contract Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center justify-between">
            <span>Min Deposit:</span>
            <span className="font-mono">
              {Number(
                formatUnits(BigInt(V3_FEATURES.individualPool.minDeposit), 18),
              )}{" "}
              mUSD
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Min Withdrawal:</span>
            <span className="font-mono">
              {Number(
                formatUnits(
                  BigInt(V3_FEATURES.individualPool.minWithdrawal),
                  18,
                ),
              )}{" "}
              mUSD
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Auto-Compound Threshold:</span>
            <span className="font-mono">
              {Number(
                formatUnits(
                  BigInt(V3_FEATURES.individualPool.autoCompoundThreshold),
                  18,
                ),
              )}{" "}
              mUSD
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
