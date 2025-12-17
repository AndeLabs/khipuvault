/**
 * @fileoverview Enhanced Pool Card for CooperativePoolV3
 *
 * Displays:
 * - Pool name and creator
 * - Member count and capacity
 * - BTC deposited and MUSD minted
 * - Status badge
 * - Min/max contribution range
 * - Actions based on membership status
 */

"use client";

import {
  Users,
  Bitcoin,
  Coins,
  TrendingUp,
  Calendar,
  Shield,
} from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { type PoolWithMembership } from "@/hooks/web3/use-all-cooperative-pools";
import {
  formatBTCCompact,
  formatMUSD,
  getPoolStatusBadge,
  formatDate,
 PoolStatus } from "@/hooks/web3/use-cooperative-pool";

interface PoolCardV3Props {
  pool: PoolWithMembership;
  onJoin?: (poolId: number) => void;
  onViewDetails?: (poolId: number) => void;
  onManage?: (poolId: number) => void;
}

// Memoized to prevent unnecessary re-renders when parent re-renders
export const PoolCardV3 = React.memo(function PoolCardV3({
  pool,
  onJoin,
  onViewDetails,
  onManage,
}: PoolCardV3Props) {
  const statusBadge = getPoolStatusBadge(pool.status);
  const memberProgress = (pool.currentMembers / pool.maxMembers) * 100;

  const canJoin =
    pool.status === PoolStatus.ACCEPTING &&
    pool.allowNewMembers &&
    pool.currentMembers < pool.maxMembers &&
    !pool.isMember;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-accent/50">
      <CardHeader className="space-y-3">
        {/* Pool Name and Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-lg truncate group-hover:text-accent transition-colors">
              {pool.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              Pool #{pool.poolId}
            </p>
          </div>
          <Badge variant={statusBadge.variant} className="shrink-0">
            {statusBadge.label}
          </Badge>
        </div>

        {/* Member Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>Members</span>
            </div>
            <span className="font-medium">
              {pool.currentMembers} / {pool.maxMembers}
            </span>
          </div>
          <Progress value={memberProgress} className="h-1.5" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Pool Statistics */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total BTC */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Bitcoin className="h-3.5 w-3.5" />
              <span>Total BTC</span>
            </div>
            <p className="font-mono font-semibold text-sm">
              {formatBTCCompact(pool.totalBtcDeposited)}
            </p>
          </div>

          {/* Total MUSD */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Coins className="h-3.5 w-3.5" />
              <span>MUSD Minted</span>
            </div>
            <p className="font-mono font-semibold text-sm">
              {formatMUSD(pool.totalMusdMinted)}
            </p>
          </div>

          {/* Yields Generated */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Yields</span>
            </div>
            <p className="font-mono font-semibold text-sm text-success">
              {formatMUSD(pool.totalYieldGenerated)}
            </p>
          </div>

          {/* Created Date */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Created</span>
            </div>
            <p className="text-xs">{formatDate(pool.createdAt)}</p>
          </div>
        </div>

        <Separator />

        {/* Contribution Range */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Contribution Range
          </p>
          <p className="font-mono text-sm">
            {formatBTCCompact(pool.minContribution)} -{" "}
            {formatBTCCompact(pool.maxContribution)} BTC
          </p>
        </div>

        {/* User Membership Info */}
        {pool.isMember && (
          <>
            <Separator />
            <div className="bg-accent/5 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-accent flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Your Position
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Contributed</p>
                  <p className="font-mono font-semibold">
                    {formatBTCCompact(pool.userContribution)} BTC
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pending Yield</p>
                  <p className="font-mono font-semibold text-success">
                    {formatMUSD(pool.userPendingYield)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onViewDetails?.(pool.poolId)}
        >
          Details
        </Button>

        {pool.isMember ? (
          <Button
            variant="accent"
            size="sm"
            className="flex-1"
            onClick={() => onManage?.(pool.poolId)}
          >
            Manage
          </Button>
        ) : (() => {
          if (canJoin) {
            return (
              <Button
                variant="accent"
                size="sm"
                className="flex-1"
                onClick={() => onJoin?.(pool.poolId)}
              >
                Join Pool
              </Button>
            );
          }
          return (
            <Button variant="ghost" size="sm" className="flex-1" disabled>
              {pool.currentMembers >= pool.maxMembers ? "Full" : "Closed"}
            </Button>
          );
        })()}
      </CardFooter>
    </Card>
  );
});

// Display name for React DevTools
PoolCardV3.displayName = "PoolCardV3";
