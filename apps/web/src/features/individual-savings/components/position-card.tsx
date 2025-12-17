"use client";

import { TrendingUp, Wallet, Clock, Info } from "lucide-react";
import * as React from "react";
import { formatUnits } from "viem";

import { AmountDisplay, PercentageDisplay } from "@/components/common";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatValue,
  StatLabel,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";


interface PositionCardProps {
  totalDeposited?: string;
  currentValue?: string;
  totalYields?: string;
  referralRewards?: string;
  apy?: number;
  change24h?: number;
  lastUpdate?: number;
  isLoading?: boolean;
  className?: string;
}

export function PositionCard({
  totalDeposited = "0",
  currentValue = "0",
  totalYields = "0",
  referralRewards = "0",
  apy = 12.5,
  change24h = 0,
  lastUpdate,
  isLoading,
  className,
}: PositionCardProps) {
  // Format values from wei to decimal
  const formatBalance = (value: string) => {
    try {
      if (!value || value === "0") {return "0.00";}
      const valueBigInt = typeof value === "bigint" ? value : BigInt(value);
      return Number(formatUnits(valueBigInt, 18)).toFixed(2);
    } catch (error) {
      console.error("Error formatting balance:", error);
      return "0.00";
    }
  };

  const formattedDeposited = formatBalance(totalDeposited);
  const formattedValue = formatBalance(currentValue);
  const formattedYields = formatBalance(totalYields);
  const formattedRewards = formatBalance(referralRewards);

  if (isLoading) {
    return (
      <Card variant="surface" className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={`skeleton-${i}`} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasPosition = Number(formattedDeposited) > 0;

  if (!hasPosition) {
    return (
      <Card variant="glass" className={cn("text-center", className)}>
        <CardContent className="py-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Active Position</h3>
          <p className="text-muted-foreground">
            Start earning yields by depositing mUSD
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="surface" hover="glow-lavanda" className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Your Position</CardTitle>
            <CardDescription>Individual Savings Pool</CardDescription>
          </div>
          {lastUpdate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Updated {new Date(lastUpdate).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Deposited */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <StatLabel>Total Deposited</StatLabel>
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
                      The total amount of mUSD you've deposited into the
                      Individual Savings Pool, excluding yields and
                      auto-compounded returns.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <StatValue trend="neutral">
              <AmountDisplay
                amount={formattedDeposited}
                symbol="mUSD"
                size="lg"
              />
            </StatValue>
          </div>

          {/* Current Value */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <StatLabel>Current Value</StatLabel>
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
                      Your total position value = deposits + accumulated yields.
                      This is the amount you can withdraw at any time without
                      penalties.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <StatValue
              trend={
                Number(formattedValue) > Number(formattedDeposited)
                  ? "up"
                  : "neutral"
              }
            >
              <AmountDisplay amount={formattedValue} symbol="mUSD" size="lg" />
            </StatValue>
            {change24h !== 0 && (
              <div className="flex items-center gap-1">
                <PercentageDisplay value={change24h} decimals={2} />
                <span className="text-xs text-muted-foreground">24h</span>
              </div>
            )}
          </div>

          {/* Total Yields */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <StatLabel>Total Yields</StatLabel>
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
                      Total profits earned from Mezo's Stability Pool since you
                      started saving. You can claim these or enable
                      auto-compound to reinvest them automatically.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <StatValue trend={Number(formattedYields) > 0 ? "up" : "neutral"}>
              <AmountDisplay amount={formattedYields} symbol="mUSD" size="lg" />
            </StatValue>
          </div>

          {/* Referral Rewards */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <StatLabel>Referral Rewards</StatLabel>
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
                      Earn 0.5% of deposits from users you refer to KhipuVault.
                      Share your referral link to start earning passive rewards!
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <StatValue trend={Number(formattedRewards) > 0 ? "up" : "neutral"}>
              <AmountDisplay
                amount={formattedRewards}
                symbol="mUSD"
                size="lg"
              />
            </StatValue>
          </div>
        </div>

        {/* APY Banner */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-lavanda border border-lavanda/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-lavanda/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-lavanda" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm text-muted-foreground">Current APY</p>
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
                    <TooltipContent className="max-w-sm">
                      <p className="font-semibold mb-2">
                        Annual Percentage Yield (APY)
                      </p>
                      <div className="space-y-2 text-sm">
                        <p>
                          Your expected annual return from Mezo's Stability
                          Pool, ranging from 5-8% APY.
                        </p>
                        <p>
                          This is the real rate you earn after all protocol
                          fees. Enable auto-compound to maximize your returns
                          with compound interest!
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-bold text-lavanda tabular-nums">
                {apy.toFixed(2)}%
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <p className="text-xs text-muted-foreground">
                Est. Monthly Yield
              </p>
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
                      Estimated monthly earnings based on your current position
                      and APY. Actual yields may vary depending on Stability
                      Pool performance.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <AmountDisplay
              amount={((Number(formattedValue) * apy) / 100 / 12).toFixed(2)}
              symbol="mUSD"
              size="sm"
              className="text-success"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
