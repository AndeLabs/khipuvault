/**
 * @fileoverview Pool Overview Tab Component
 *
 * Displays:
 * - Pool capacity progress bar
 * - Pool statistics (BTC, MUSD, Yields, Created date)
 * - Contribution requirements
 * - Join button (if eligible)
 */

"use client";

import { Bitcoin, Coins, TrendingUp, Calendar, Shield, Users } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBTCCompact, formatMUSD, formatDate } from "@/hooks/web3/use-cooperative-pool";

interface PoolOverviewTabProps {
  // Pool info
  currentMembers: number;
  maxMembers: number;
  totalBtcDeposited: bigint;
  totalMusdMinted: bigint;
  totalYieldGenerated: bigint;
  createdAt: number;
  minContribution: bigint;
  maxContribution: bigint;
  allowNewMembers: boolean;
  // User state
  isMember: boolean;
  // Actions
  poolId: number;
  onJoin?: (poolId: number) => void;
}

export function PoolOverviewTab({
  currentMembers,
  maxMembers,
  totalBtcDeposited,
  totalMusdMinted,
  totalYieldGenerated,
  createdAt,
  minContribution,
  maxContribution,
  allowNewMembers,
  isMember,
  poolId,
  onJoin,
}: PoolOverviewTabProps) {
  const canJoin = !isMember && allowNewMembers && currentMembers < maxMembers;

  return (
    <div className="mt-4 space-y-4">
      {/* Pool Capacity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Pool Capacity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Members</span>
            <span className="font-medium">
              {currentMembers} / {maxMembers}
            </span>
          </div>
          <Progress value={(currentMembers / maxMembers) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Pool Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                <Bitcoin className="h-5 w-5 text-orange-500" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Total BTC</p>
                <p className="font-mono font-semibold">{formatBTCCompact(totalBtcDeposited)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <Coins className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">MUSD Minted</p>
                <p className="font-mono font-semibold">{formatMUSD(totalMusdMinted)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Total Yields</p>
                <p className="font-mono font-semibold text-success">
                  {formatMUSD(totalYieldGenerated)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{formatDate(createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contribution Range */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4" />
            Contribution Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Minimum</span>
            <span className="font-mono font-semibold">{formatBTCCompact(minContribution)} BTC</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Maximum</span>
            <span className="font-mono font-semibold">{formatBTCCompact(maxContribution)} BTC</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Accepting New Members</span>
            <Badge variant={allowNewMembers ? "success" : "error"}>
              {allowNewMembers ? "Yes" : "No"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Join Button */}
      {canJoin && (
        <Button variant="accent" className="w-full" onClick={() => onJoin?.(poolId)}>
          <Users className="mr-2 h-4 w-4" />
          Join This Pool
        </Button>
      )}
    </div>
  );
}
