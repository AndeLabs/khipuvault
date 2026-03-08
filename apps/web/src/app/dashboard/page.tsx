"use client";

export const dynamic = "force-dynamic";

/**
 * @fileoverview Dashboard Page
 * @module app/dashboard/page
 *
 * Main dashboard showing:
 * - Portfolio overview with real blockchain data
 * - Recent activity from contract events
 * - Quick access cards to features
 *
 * All data is fetched from smart contracts - no mocks.
 */

import { Wallet, Users, Trophy, ArrowRight, Coins, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PortfolioOverview, RecentActivity, PlatformStats } from "@/features/portfolio";
import { usePoolStats } from "@/hooks/use-pool-stats";
import { usePortfolioAnalytics } from "@/hooks/use-portfolio-analytics";
import { useAllCooperativePools, useUserCooperativeTotal } from "@/hooks/web3/cooperative/queries";
import { useIndividualPoolV3 } from "@/hooks/web3/use-individual-pool-v3";
import { MEZO_V3_ADDRESSES } from "@/lib/web3/contracts-v3";

/**
 * Dashboard Page
 *
 * Features:
 * - Portfolio overview with real blockchain data
 * - Recent activity from contract events
 * - Quick access to savings features
 */
export default function DashboardPage() {
  const { isConnected, address } = useAccount();

  // Fetch REAL blockchain data
  const { userInfo, poolStats, isLoading: isLoadingIndividual } = useIndividualPoolV3();

  // Fetch platform-wide stats (active users from backend API)
  const { activeDepositors, isLoading: isLoadingPoolStats } = usePoolStats(
    MEZO_V3_ADDRESSES.individualPoolV3
  );
  const { isLoading: isLoadingPools } = useAllCooperativePools();
  const { totalContribution: cooperativeContribution, isLoading: isLoadingCoopTotal } =
    useUserCooperativeTotal(address as `0x${string}` | undefined);

  // Calculate real portfolio data
  const individualSavings = userInfo?.deposit ? Number(formatUnits(userInfo.deposit, 18)) : 0;

  const totalYields = userInfo?.yields ? Number(formatUnits(userInfo.yields, 18)) : 0;

  // Calculate cooperative pools total from user's contributions across all pools
  const cooperativeSavings = cooperativeContribution
    ? Number(formatUnits(cooperativeContribution, 18))
    : 0;

  const totalValue = individualSavings + cooperativeSavings;
  const hasNoSavings = totalValue === 0;

  // Get portfolio analytics (24h/7d changes and recent activities)
  const analytics = usePortfolioAnalytics(totalValue);

  // Memoize portfolio data to prevent unnecessary re-renders
  const portfolioData = React.useMemo(
    () => ({
      totalValue: totalValue.toFixed(2),
      individualSavings: individualSavings.toFixed(2),
      cooperativeSavings: cooperativeSavings.toFixed(2),
      totalYields: totalYields.toFixed(6),
      change24h: analytics.percentChange24h,
      change7d: analytics.percentChange7d,
      recentActivities: analytics.recentActivities,
    }),
    [
      totalValue,
      individualSavings,
      cooperativeSavings,
      totalYields,
      analytics.percentChange24h,
      analytics.percentChange7d,
      analytics.recentActivities,
    ]
  );

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Welcome to KhipuVault" />
        <Card variant="glass" className="py-12 text-center">
          <CardContent>
            <Wallet className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 font-heading text-2xl font-bold">Connect Your Wallet</h2>
            <p className="mb-6 text-muted-foreground">
              Connect your wallet to access your portfolio and start saving
            </p>
            <p className="text-sm text-muted-foreground">
              Use the Connect Wallet button in the header
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while fetching blockchain data
  if (isLoadingIndividual || isLoadingPools || isLoadingCoopTotal) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Loading your portfolio..." />
        <Card variant="glass" className="py-12 text-center">
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="mx-auto h-8 w-1/2 rounded bg-muted" />
              <div className="mx-auto h-4 w-1/3 rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Welcome to KhipuVault - Your Bitcoin Savings Platform"
      />

      {/* Getting Started Alert - Show when user has no savings */}
      {hasNoSavings && (
        <Alert className="border-lavanda/50 bg-lavanda/5">
          <Sparkles className="h-4 w-4 text-lavanda" />
          <AlertDescription className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-medium text-foreground">Ready to start saving?</span>{" "}
              <span className="text-muted-foreground">
                Get testnet mUSD tokens to make your first deposit.
              </span>
            </div>
            <a href="https://faucet.mezo.org" target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="secondary" className="shrink-0 gap-2">
                <Coins className="h-4 w-4" />
                Get Test Tokens
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* Portfolio Overview - REAL DATA */}
      <PortfolioOverview
        totalValue={portfolioData.totalValue}
        individualSavings={portfolioData.individualSavings}
        cooperativeSavings={portfolioData.cooperativeSavings}
        totalYields={portfolioData.totalYields}
        change24h={portfolioData.change24h}
        change7d={portfolioData.change7d}
      />

      {/* Platform Stats - Global metrics */}
      <PlatformStats
        totalValueLocked={poolStats?.totalMusdDeposited}
        totalYieldsGenerated={poolStats?.totalYields}
        activeUsers={activeDepositors}
        isLoading={isLoadingIndividual || isLoadingPoolStats}
      />

      {/* Recent Activity - Real blockchain events */}
      <RecentActivity activities={portfolioData.recentActivities} />

      {/* Quick Access Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/individual-savings">
          <Card variant="surface" hover="glow-lavanda" className="group h-full cursor-pointer">
            <CardContent className="pt-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lavanda/20">
                <Wallet className="h-6 w-6 text-lavanda" />
              </div>
              <h3 className="mb-2 font-heading text-xl font-semibold">Individual Savings</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Save individually and earn automatic yields
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-lavanda transition-all group-hover:gap-3">
                Open <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/cooperative-savings">
          <Card variant="surface" hover="glow-orange" className="group h-full cursor-pointer">
            <CardContent className="pt-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 font-heading text-xl font-semibold">Cooperative Pools</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Join or create savings groups with friends
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-accent transition-all group-hover:gap-3">
                Explore <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/prize-pool">
          <Card variant="surface" hover="glow-success" className="group h-full cursor-pointer">
            <CardContent className="pt-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
                <Trophy className="h-6 w-6 text-success" />
              </div>
              <h3 className="mb-2 font-heading text-xl font-semibold">Prize Pool</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Participate in prize pools and win rewards
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-success transition-all group-hover:gap-3">
                Join <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
