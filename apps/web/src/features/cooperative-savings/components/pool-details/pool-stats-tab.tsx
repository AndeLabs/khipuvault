/**
 * @fileoverview Pool Statistics Tab Component
 *
 * Displays calculated pool statistics:
 * - Average contribution per member
 * - Yield per BTC
 * - Pool utilization percentage
 * - Total shares in circulation
 */

"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBTCCompact, formatMUSD } from "@/hooks/web3/use-cooperative-pool";

interface PoolStatsTabProps {
  totalBtcDeposited: bigint;
  totalYieldGenerated: bigint;
  currentMembers: number;
  maxMembers: number;
  totalShares: bigint;
}

export function PoolStatsTab({
  totalBtcDeposited,
  totalYieldGenerated,
  currentMembers,
  maxMembers,
  totalShares,
}: PoolStatsTabProps) {
  // Calculate average contribution
  const avgContribution =
    currentMembers > 0 ? totalBtcDeposited / BigInt(currentMembers) : BigInt(0);

  // Calculate yield per BTC
  const yieldPerBTC =
    totalBtcDeposited > BigInt(0) && totalYieldGenerated > BigInt(0)
      ? (totalYieldGenerated * BigInt(1e18)) / totalBtcDeposited
      : BigInt(0);

  // Calculate pool utilization
  const utilization = maxMembers > 0 ? (currentMembers / maxMembers) * 100 : 0;

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Contribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold">{formatBTCCompact(avgContribution)} BTC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Yield per BTC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-success">
              {yieldPerBTC > BigInt(0) ? formatMUSD(yieldPerBTC) : "0"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pool Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{utilization.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Shares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold">{totalShares.toString()}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
