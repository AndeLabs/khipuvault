/**
 * @fileoverview Individual pool card components
 */

"use client";

import * as React from "react";
import { Crown, Bitcoin, Coins, TrendingUp } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { PoolWithMembership } from "@/hooks/web3/use-all-cooperative-pools";
import {
  formatBTCCompact,
  formatMUSD,
  getPoolStatusBadge,
  formatDate,
  formatPercentage,
  type PoolInfo,
} from "@/hooks/web3/use-cooperative-pool";
import { usePoolMembers } from "@/hooks/web3/use-cooperative-pool";

import { PoolCardActions } from "./pool-card-actions";

interface CreatedPoolCardProps {
  pool: PoolInfo & { poolId: number };
  onViewDetails?: (poolId: number) => void;
  onManagePool?: (poolId: number) => void;
}

export const CreatedPoolCard = React.memo(function CreatedPoolCard({
  pool,
  onViewDetails,
  onManagePool,
}: CreatedPoolCardProps) {
  const statusBadge = getPoolStatusBadge(pool.status);
  const memberProgress = (pool.currentMembers / pool.maxMembers) * 100;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Crown className="h-4 w-4 shrink-0 text-accent" />
              <h4 className="truncate font-heading font-semibold">{pool.name}</h4>
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
            <p className="font-mono font-semibold">{formatBTCCompact(pool.totalBtcDeposited)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">MUSD Minted</p>
            <p className="font-mono font-semibold">{formatMUSD(pool.totalMusdMinted)}</p>
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
        <PoolCardActions
          variant="created"
          poolId={pool.poolId}
          onViewDetails={onViewDetails}
          onManagePool={onManagePool}
        />
      </CardContent>
    </Card>
  );
});

interface MembershipCardProps {
  pool: PoolWithMembership;
  onViewDetails?: (poolId: number) => void;
  onClaimYield?: (poolId: number) => void;
  onLeavePool?: (poolId: number) => void;
}

export const MembershipCard = React.memo(function MembershipCard({
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
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-heading font-semibold">{pool.name}</h4>
            <p className="text-xs text-muted-foreground">Pool #{pool.poolId}</p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {sharePercentage} Share
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User Position */}
        <div className="space-y-3 rounded-lg bg-accent/5 p-3">
          <p className="text-xs font-medium text-accent">Your Position</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Bitcoin className="h-3 w-3" />
                Contributed
              </p>
              <p className="font-mono font-semibold">
                {formatBTCCompact(pool.userContribution)} BTC
              </p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Coins className="h-3 w-3" />
                Shares
              </p>
              <p className="font-mono font-semibold">{pool.userShares.toString()}</p>
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
            <p className="font-mono font-semibold">{formatBTCCompact(pool.totalBtcDeposited)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Joined</p>
            <p className="text-xs">{formatDate(pool.createdAt)}</p>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <PoolCardActions
          variant="membership"
          poolId={pool.poolId}
          hasYield={hasYield}
          onViewDetails={onViewDetails}
          onClaimYield={onClaimYield}
          onLeavePool={onLeavePool}
        />
      </CardContent>
    </Card>
  );
});
