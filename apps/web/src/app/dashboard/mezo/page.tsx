"use client";

export const dynamic = "force-dynamic";

import { TrendingUp, Shield, Coins, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { PriceDisplay, PriceBadge } from "@/components/mezo/price-display";
import { LiquidationRiskBadge, HealthFactorBar } from "@/components/mezo/liquidation-risk-badge";
import { PageHeader, PageSection } from "@/components/layout";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Web3ErrorBoundary } from "@/components/web3-error-boundary";
import {
  useMezoPriceFeed,
  useTroveManagerStats,
  useUserTrove,
  useUserStabilityPoolPosition,
  useStabilityPoolStats,
  TroveStatus,
} from "@/hooks/web3/mezo";
import { cn } from "@/lib/utils";

/**
 * Mezo Protocol Dashboard - Overview Page
 *
 * Shows:
 * - User's Trove status (if any)
 * - User's Stability Pool position (if any)
 * - BTC price with staleness indicator
 * - System stats (TCR, total troves, etc.)
 */
export default function MezoDashboardPage() {
  const { address, isConnected } = useAccount();

  // Price feed
  const { price: btcPrice, priceFormatted, isLoading: isPriceLoading } = useMezoPriceFeed();

  // System stats
  const { troveCount, mcr, ccr, isLoading: isSystemLoading } = useTroveManagerStats();

  // User's Trove
  const {
    hasActiveTrove,
    collateral,
    debt,
    collateralRatio,
    collateralRatioFormatted,
    isLoading: isTroveLoading,
  } = useUserTrove();

  // User's Stability Pool position
  const {
    compoundedDeposit,
    collateralGain,
    isLoading: isSpLoading,
  } = useUserStabilityPoolPosition();

  // Derived values
  const hasDeposit = compoundedDeposit > 0n;
  const btcGain = collateralGain;

  // Stability Pool stats
  const { totalDeposits, isLoading: isSpStatsLoading } = useStabilityPoolStats();

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Mezo Protocol"
          description="Connect your wallet to access Mezo's decentralized borrowing and stability pool"
        />
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            Please connect your wallet to access Mezo Protocol
          </p>
        </div>
      </div>
    );
  }

  return (
    <Web3ErrorBoundary
      onError={(error, _errorInfo) => {
        console.error("Mezo Dashboard Error:", error, _errorInfo);
      }}
    >
      <div className="animate-slide-up space-y-8">
        {/* Page Header with Price Badge */}
        <div className="flex items-start justify-between">
          <PageHeader
            title="Mezo Protocol"
            description="Borrow MUSD against BTC or earn rewards in the Stability Pool"
          />
          <PriceBadge className="mt-2" />
        </div>

        {/* BTC Price Section */}
        <PageSection>
          <Card variant="glass" hover="glow-lavanda">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <StatLabel>BTC/USD Price</StatLabel>
                <PriceDisplay showStatus compact={false} />
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lavanda/20">
                <TrendingUp className="h-6 w-6 text-lavanda" />
              </div>
            </CardContent>
          </Card>
        </PageSection>

        {/* User Positions Overview */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Trove Position */}
          <Card variant="surface" hover="glow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Trove</CardTitle>
                  <CardDescription>Borrowing Position</CardDescription>
                </div>
                {hasActiveTrove && (
                  <Badge variant="success" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isTroveLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : hasActiveTrove ? (
                <div className="space-y-4">
                  {/* Trove Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <StatLabel>Collateral (BTC)</StatLabel>
                      <StatValue trend="neutral">
                        <AmountDisplay
                          amount={formatUnits(collateral, 18)}
                          symbol="BTC"
                          size="sm"
                        />
                      </StatValue>
                    </div>
                    <div>
                      <StatLabel>Debt (MUSD)</StatLabel>
                      <StatValue trend="neutral">
                        <AmountDisplay amount={formatUnits(debt, 18)} symbol="MUSD" size="sm" />
                      </StatValue>
                    </div>
                  </div>

                  {/* Health Bar */}
                  <HealthFactorBar />

                  {/* Risk Badge */}
                  <LiquidationRiskBadge showDetails={false} />

                  {/* Action Button */}
                  <Link href="/dashboard/mezo/borrow">
                    <Button variant="primary" className="w-full" size="sm">
                      Manage Trove
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated">
                    <Shield className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="mb-1 font-medium">No Active Trove</p>
                    <p className="text-sm text-muted-foreground">
                      Open a Trove to borrow MUSD against your BTC
                    </p>
                  </div>
                  <Link href="/dashboard/mezo/borrow">
                    <Button variant="primary" className="w-full" size="sm">
                      Open Trove
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stability Pool Position */}
          <Card variant="surface" hover="glow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stability Pool</CardTitle>
                  <CardDescription>Your Position</CardDescription>
                </div>
                {hasDeposit && (
                  <Badge variant="success" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isSpLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : hasDeposit ? (
                <div className="space-y-4">
                  {/* SP Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <StatLabel>Deposited</StatLabel>
                      <StatValue trend="neutral">
                        <AmountDisplay
                          amount={formatUnits(compoundedDeposit, 18)}
                          symbol="MUSD"
                          size="sm"
                        />
                      </StatValue>
                    </div>
                    <div>
                      <StatLabel>BTC Rewards</StatLabel>
                      <StatValue trend={collateralGain > 0n ? "up" : "neutral"}>
                        <AmountDisplay
                          amount={formatUnits(collateralGain, 18)}
                          symbol="BTC"
                          size="sm"
                          className="text-success"
                        />
                      </StatValue>
                    </div>
                  </div>

                  {/* Reward Info */}
                  {collateralGain > 0n && (
                    <div className="rounded-lg border border-success/20 bg-success/5 p-3">
                      <div className="flex items-center gap-2 text-sm text-success">
                        <Coins className="h-4 w-4" />
                        <span>You have pending BTC rewards to claim</span>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Link href="/dashboard/mezo/stability-pool">
                    <Button variant="primary" className="w-full" size="sm">
                      Manage Position
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated">
                    <Coins className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="mb-1 font-medium">No Active Position</p>
                    <p className="text-sm text-muted-foreground">
                      Deposit MUSD to earn BTC from liquidations
                    </p>
                  </div>
                  <Link href="/dashboard/mezo/stability-pool">
                    <Button variant="primary" className="w-full" size="sm">
                      Deposit to Pool
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Statistics */}
        <PageSection>
          <Card variant="surface">
            <CardHeader>
              <CardTitle>System Statistics</CardTitle>
              <CardDescription>Mezo Protocol global metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {isSystemLoading || isSpStatsLoading ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={`skeleton-${i}`} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-8 w-32" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Min Collateral Ratio */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <StatLabel>Min Collateral Ratio (MCR)</StatLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <AlertCircle className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-sm">
                            Minimum collateral ratio before liquidation. Keep your CR above this.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <StatValue trend="neutral">
                      <PercentageDisplay value={mcr} decimals={0} />
                    </StatValue>
                  </div>

                  {/* Total Troves */}
                  <div className="space-y-1">
                    <StatLabel>Total Troves</StatLabel>
                    <StatValue trend="neutral">
                      <span className="text-2xl font-bold tabular-nums">{troveCount}</span>
                    </StatValue>
                  </div>

                  {/* Stability Pool TVL */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <StatLabel>Stability Pool TVL</StatLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <AlertCircle className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-sm">
                            Total value locked in the Stability Pool, used to absorb debt from
                            liquidations.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <StatValue trend="neutral">
                      <AmountDisplay
                        amount={formatUnits(totalDeposits, 18)}
                        symbol="MUSD"
                        size="md"
                      />
                    </StatValue>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </PageSection>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Borrow Card */}
          <Card variant="glass" className="border-lavanda/20 bg-lavanda/5">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lavanda/20">
                  <Shield className="h-6 w-6 text-lavanda" />
                </div>
                <div>
                  <h3 className="font-semibold">Borrow MUSD</h3>
                  <p className="text-sm text-muted-foreground">Against your BTC collateral</p>
                </div>
              </div>
              <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-lavanda" />
                  <span>0% interest rate</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-lavanda" />
                  <span>110% minimum collateral ratio</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-lavanda" />
                  <span>One-time 0.5% borrowing fee</span>
                </li>
              </ul>
              <Link href="/dashboard/mezo/borrow">
                <Button variant="primary" className="w-full">
                  {hasActiveTrove ? "Manage Trove" : "Open Trove"}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Stability Pool Card */}
          <Card variant="glass" className="border-success/20 bg-success/5">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
                  <Coins className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">Stability Pool</h3>
                  <p className="text-sm text-muted-foreground">Earn BTC from liquidations</p>
                </div>
              </div>
              <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-success" />
                  <span>Earn BTC rewards automatically</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-success" />
                  <span>No impermanent loss</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-success" />
                  <span>Withdraw anytime</span>
                </li>
              </ul>
              <Link href="/dashboard/mezo/stability-pool">
                <Button variant="primary" className="w-full">
                  {hasDeposit ? "Manage Position" : "Deposit MUSD"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Web3ErrorBoundary>
  );
}
