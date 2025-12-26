"use client";

export const dynamic = "force-dynamic";

import {
  Wallet,
  Users,
  Trophy,
  ArrowRight,
  Coins,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import nextDynamic from "next/dynamic";
import Link from "next/link";
import * as React from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PortfolioOverview, RecentActivity } from "@/features/portfolio";

// Lazy load chart component to reduce initial bundle size (recharts is ~300KB)
const AllocationChart = nextDynamic(
  () =>
    import("@/features/portfolio/components/allocation-chart").then(
      (mod) => mod.AllocationChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 rounded-lg border border-border bg-card">
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-60 mb-4" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
    ),
  },
);
import { usePortfolioAnalytics } from "@/hooks/use-portfolio-analytics";
import {
  useCooperativePools,
  useUserCooperativeTotal,
} from "@/hooks/web3/use-cooperative-pools";
import { useIndividualPoolV3 } from "@/hooks/web3/use-individual-pool-v3";

/**
 * Dashboard Page - V4 Redesign
 *
 * Features:
 * - Portfolio overview with total value
 * - Asset allocation chart
 * - Recent activity feed
 * - Quick access to features
 */
export default function DashboardPage() {
  const { isConnected, address } = useAccount();

  // Fetch REAL blockchain data
  const { userInfo, isLoading: isLoadingIndividual } = useIndividualPoolV3();
  const { isLoading: isLoadingPools } = useCooperativePools();
  const {
    totalContribution: cooperativeContribution,
    isLoading: isLoadingCoopTotal,
  } = useUserCooperativeTotal(address as `0x${string}` | undefined);

  // Calculate real portfolio data
  const individualSavings = userInfo?.deposit
    ? Number(formatUnits(userInfo.deposit, 18))
    : 0;

  const totalYields = userInfo?.yields
    ? Number(formatUnits(userInfo.yields, 18))
    : 0;

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
    ],
  );

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Welcome to KhipuVault" />
        <Card variant="glass" className="text-center py-12">
          <CardContent>
            <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-heading font-bold mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-muted-foreground mb-6">
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
        <Card variant="glass" className="text-center py-12">
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/2 mx-auto" />
              <div className="h-4 bg-muted rounded w-1/3 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Welcome to KhipuVault - Your Bitcoin Savings Platform"
      />

      {/* Getting Started Alert - Show when user has no savings */}
      {hasNoSavings && (
        <Alert className="border-lavanda/50 bg-lavanda/5">
          <Sparkles className="h-4 w-4 text-lavanda" />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="font-medium text-foreground">
                Ready to start saving?
              </span>{" "}
              <span className="text-muted-foreground">
                Get testnet mUSD tokens to make your first deposit.
              </span>
            </div>
            <a
              href="https://faucet.mezo.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="secondary" className="gap-2 shrink-0">
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

      {/* Charts & Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Allocation Chart - REAL DATA */}
        <AllocationChart
          individualSavings={Number(portfolioData.individualSavings)}
          cooperativeSavings={Number(portfolioData.cooperativeSavings)}
        />

        {/* Recent Activity */}
        <div className="md:col-span-1 lg:col-span-2">
          <RecentActivity activities={portfolioData.recentActivities} />
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/individual-savings">
          <Card
            variant="surface"
            hover="glow-lavanda"
            className="h-full cursor-pointer group"
          >
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-full bg-lavanda/20 flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-lavanda" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-2">
                Individual Savings
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Save individually and earn automatic yields
              </p>
              <div className="flex items-center gap-2 text-lavanda text-sm font-medium group-hover:gap-3 transition-all">
                Open <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/cooperative-savings">
          <Card
            variant="surface"
            hover="glow-orange"
            className="h-full cursor-pointer group"
          >
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-2">
                Cooperative Pools
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Join or create savings groups with friends
              </p>
              <div className="flex items-center gap-2 text-accent text-sm font-medium group-hover:gap-3 transition-all">
                Explore <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/prize-pool">
          <Card
            variant="surface"
            hover="glow-success"
            className="h-full cursor-pointer group"
          >
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-2">
                Prize Pool
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Participate in prize pools and win rewards
              </p>
              <div className="flex items-center gap-2 text-success text-sm font-medium group-hover:gap-3 transition-all">
                Join <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
