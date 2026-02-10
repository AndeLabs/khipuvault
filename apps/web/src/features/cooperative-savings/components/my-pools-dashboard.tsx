/**
 * @fileoverview My Pools Dashboard - V3 (Refactored)
 *
 * Features:
 * - User's active memberships
 * - Pools created by user
 * - Total contributions and yields
 * - Quick actions for each pool
 */

"use client";

import { Users, Bitcoin, TrendingUp, Crown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatBTCCompact, formatMUSD } from "@/hooks/web3/use-cooperative-pool";

import {
  CreatedPoolCard,
  MembershipCard,
  PoolsEmptyState,
  PoolsLoadingSkeleton,
  useUserPools,
} from "./my-pools";

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
  const { userPools, createdPools, statistics, isLoading } = useUserPools();

  if (isLoading) {
    return <PoolsLoadingSkeleton />;
  }

  if (statistics.totalPools === 0 && createdPools.length === 0) {
    return <PoolsEmptyState />;
  }

  return (
    <div className="animate-slide-up space-y-6">
      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Contribution</p>
                <p className="font-heading font-mono text-2xl font-bold">
                  {formatBTCCompact(statistics.totalContribution)} BTC
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
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
                <p className="font-heading font-mono text-2xl font-bold text-success">
                  {formatMUSD(statistics.totalPendingYield)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
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
                <p className="font-heading text-2xl font-bold">{statistics.totalPools}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
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
            <h3 className="font-heading text-lg font-semibold">Pools You Created</h3>
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
            <h3 className="font-heading text-lg font-semibold">Your Memberships</h3>
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
