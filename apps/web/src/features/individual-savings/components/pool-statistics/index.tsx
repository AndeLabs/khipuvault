"use client";

import { Percent, Shield, Info } from "lucide-react";
import { formatUnits } from "viem";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { V3_FEATURES } from "@/lib/web3/contracts-v3";

import { HealthScoreCard } from "./health-score-card";
import { usePoolHealth } from "./use-pool-health";

export interface PoolStatisticsProps {
  totalDeposits?: bigint;
  totalYields?: bigint;
  totalReferralRewards?: bigint;
  poolAPR?: number;
  performanceFee?: bigint | number;
  activeDepositors?: number;
  emergencyMode?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function PoolStatistics({
  totalDeposits = BigInt(0),
  poolAPR = 0,
  performanceFee = BigInt(100),
  activeDepositors = 0,
  emergencyMode = false,
  isLoading,
  className,
}: PoolStatisticsProps) {
  const performanceFeeNumber =
    typeof performanceFee === "bigint" ? Number(performanceFee) : performanceFee;

  // Calculate pool health
  const { healthScore, healthColor, healthLabel } = usePoolHealth({
    totalDeposits,
    poolAPR,
    activeDepositors,
    emergencyMode,
  });

  // Get limits from V3 features
  const minDeposit = Number(formatUnits(BigInt(V3_FEATURES.individualPool.minDeposit), 18));
  const minWithdrawal = Number(formatUnits(BigInt(V3_FEATURES.individualPool.minWithdrawal), 18));

  if (isLoading) {
    return (
      <Card variant="surface" className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="surface" className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Pool Info</CardTitle>
          <HealthScoreCard
            emergencyMode={emergencyMode}
            healthScore={healthScore}
            healthColor={healthColor}
            healthLabel={healthLabel}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* APR & Fee */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-surface-elevated p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Percent className="h-3 w-3" />
              <span>Current APR</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">Annual Percentage Rate you earn on deposits</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-lg font-bold text-success">
              {poolAPR > 0 ? `${poolAPR.toFixed(1)}%` : "—"}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface-elevated p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Fee</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Performance fee on yields only (not principal)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-lg font-bold">{(performanceFeeNumber / 100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Limits */}
        <div className="rounded-lg border border-border bg-surface-elevated p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Limits</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min Deposit</span>
              <span className="font-mono font-medium">{minDeposit} mUSD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min Withdraw</span>
              <span className="font-mono font-medium">{minWithdrawal} mUSD</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
