/**
 * @fileoverview My Pools Dashboard - V3
 *
 * Features:
 * - User's active memberships
 * - Pools created by user
 * - Total contributions and yields
 * - Quick actions for each pool
 */

"use client";

import {
  Users,
  Bitcoin,
  TrendingUp,
  Calendar,
  Crown,
  ArrowRight,
  Coins,
  Info,
} from "lucide-react";
import * as React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { SkeletonCard } from "@/components/ui/skeleton";
import {
  useUserPools,
  useCreatedPools,
  type PoolWithMembership,
} from "@/hooks/web3/use-all-cooperative-pools";
import {
  formatBTCCompact,
  formatMUSD,
  getPoolStatusBadge,
  formatDate,
  formatPercentage,
  type PoolInfo,
} from "@/hooks/web3/use-cooperative-pool";
import { usePoolMembers } from "@/hooks/web3/use-cooperative-pool";

// Type definitions for sub-components
interface CreatedPoolCardProps {
  pool: PoolInfo & { poolId: number };
  onViewDetails?: (poolId: number) => void;
  onManagePool?: (poolId: number) => void;
}

interface MembershipCardProps {
  pool: PoolWithMembership;
  onViewDetails?: (poolId: number) => void;
  onClaimYield?: (poolId: number) => void;
  onLeavePool?: (poolId: number) => void;
}

interface MyPoolsDashboardProps {
  onViewDetails?: (poolId: number) => void;
  onClaimYield?: (poolId: number) => void;
  onLeavePool?: (poolId: number) => void;
  onManagePool?: (poolId: number) => void;
}

export function MyPoolsDashboard({
  onViewDetails,
  onClaimYield,
  onLeavePool,
  onManagePool,
}: MyPoolsDashboardProps) {
  const { pools: userPools, isLoading: loadingUserPools } = useUserPools();
  const { pools: createdPools, isLoading: loadingCreatedPools } =
    useCreatedPools();

  const isLoading = loadingUserPools || loadingCreatedPools;

  // Calculate total statistics
  const totalContribution = userPools.reduce(
    (sum, p) => sum + p.userContribution,
    BigInt(0),
  );
  const totalPendingYield = userPools.reduce(
    (sum, p) => sum + p.userPendingYield,
    BigInt(0),
  );
  const totalPools = userPools.length;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Stats Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-surface-elevated animate-shimmer rounded-lg"
            />
          ))}
        </div>

        {/* Cards Skeleton */}
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (totalPools === 0 && createdPools.length === 0) {
    return (
      <div className="text-center py-12 space-y-4 animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-heading font-semibold">No Pools Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            You haven't joined or created any cooperative pools yet. Start by
            browsing available pools or creating your own.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Total Contribution
                </p>
                <p className="text-2xl font-heading font-bold font-mono">
                  {formatBTCCompact(totalContribution)} BTC
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Bitcoin className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Pending Yields</p>
                <p className="text-2xl font-heading font-bold font-mono text-success">
                  {formatMUSD(totalPendingYield)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Active Pools</p>
                <p className="text-2xl font-heading font-bold">{totalPools}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pools Created by User */}
      {createdPools.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-heading font-semibold">
              Pools You Created
            </h3>
            <Badge variant="secondary">{createdPools.length}</Badge>
          </div>

          <div className="grid gap-4">
            {createdPools.map((pool) => (
              <CreatedPoolCard
                key={pool.poolId}
                pool={pool}
                onViewDetails={onViewDetails}
                onManagePool={onManagePool}
              />
            ))}
          </div>
        </div>
      )}

      {/* User Memberships */}
      {userPools.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-heading font-semibold">
              Your Memberships
            </h3>
            <Badge variant="secondary">{userPools.length}</Badge>
          </div>

          <div className="grid gap-4">
            {userPools.map((pool) => (
              <MembershipCard
                key={pool.poolId}
                pool={pool}
                onViewDetails={onViewDetails}
                onClaimYield={onClaimYield}
                onLeavePool={onLeavePool}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS (Memoized for performance)
// ============================================================================

const CreatedPoolCard = React.memo(function CreatedPoolCard({
  pool,
  onViewDetails,
  onManagePool,
}: CreatedPoolCardProps) {
  const statusBadge = getPoolStatusBadge(pool.status);
  const memberProgress = (pool.currentMembers / pool.maxMembers) * 100;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-4 w-4 text-accent shrink-0" />
              <h4 className="font-heading font-semibold truncate">
                {pool.name}
              </h4>
              <Badge variant={statusBadge.variant} className="shrink-0">
                {statusBadge.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Pool #{pool.poolId}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Member Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Members</span>
            <span className="font-medium">
              {pool.currentMembers} / {pool.maxMembers}
            </span>
          </div>
          <Progress value={memberProgress} className="h-1.5" />
        </div>

        {/* Pool Stats */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">BTC Locked</p>
            <p className="font-mono font-semibold">
              {formatBTCCompact(pool.totalBtcDeposited)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">MUSD Minted</p>
            <p className="font-mono font-semibold">
              {formatMUSD(pool.totalMusdMinted)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Yields</p>
            <p className="font-mono font-semibold text-success">
              {formatMUSD(pool.totalYieldGenerated)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails?.(pool.poolId)}
          >
            <Info className="h-4 w-4 mr-1.5" />
            Details
          </Button>
          <Button
            variant="accent"
            size="sm"
            className="flex-1"
            onClick={() => onManagePool?.(pool.poolId)}
          >
            Manage Pool
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

const MembershipCard = React.memo(function MembershipCard({
  pool,
  onViewDetails,
  onClaimYield,
  onLeavePool,
}: MembershipCardProps) {
  const { members } = usePoolMembers(pool.poolId);
  const totalShares = members.reduce((sum, m) => sum + m.shares, BigInt(0));
  const sharePercentage = formatPercentage(pool.userShares, totalShares);
  const hasYield = pool.userPendingYield > BigInt(0);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-heading font-semibold truncate">{pool.name}</h4>
            <p className="text-xs text-muted-foreground">Pool #{pool.poolId}</p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {sharePercentage} Share
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User Position */}
        <div className="bg-accent/5 rounded-lg p-3 space-y-3">
          <p className="text-xs font-medium text-accent">Your Position</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Bitcoin className="h-3 w-3" />
                Contributed
              </p>
              <p className="font-mono font-semibold">
                {formatBTCCompact(pool.userContribution)} BTC
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Coins className="h-3 w-3" />
                Shares
              </p>
              <p className="font-mono font-semibold">
                {pool.userShares.toString()}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Yield */}
        {hasYield && (
          <Alert className="border-success/20 bg-success/5">
            <TrendingUp className="h-4 w-4 text-success" />
            <AlertDescription className="text-sm">
              <span className="text-muted-foreground">Pending Yield: </span>
              <span className="font-mono font-semibold text-success">
                {formatMUSD(pool.userPendingYield)} MUSD
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Pool Info */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Members</p>
            <p className="font-medium">
              {pool.currentMembers}/{pool.maxMembers}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total BTC</p>
            <p className="font-mono font-semibold">
              {formatBTCCompact(pool.totalBtcDeposited)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Joined</p>
            <p className="text-xs">{formatDate(pool.createdAt)}</p>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(pool.poolId)}
          >
            Details
          </Button>
          {hasYield && (
            <Button
              variant="success"
              size="sm"
              onClick={() => onClaimYield?.(pool.poolId)}
            >
              <TrendingUp className="h-4 w-4 mr-1.5" />
              Claim Yield
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onLeavePool?.(pool.poolId)}
          >
            Leave Pool
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
