/**
 * @fileoverview User Position Card Component
 *
 * Displays the user's position in the pool including:
 * - BTC contributed
 * - Shares owned
 * - Share percentage
 * - Pending yield
 * - Actions (claim/leave)
 */

"use client";

import { TrendingUp } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBTCCompact, formatMUSD, formatPercentage } from "@/hooks/web3/use-cooperative-pool";

interface UserPositionCardProps {
  btcContributed: bigint;
  shares: bigint;
  totalShares: bigint;
  pendingYield: bigint;
  poolId: number;
  onClaim?: (poolId: number) => void;
  onLeave?: (poolId: number) => void;
}

export function UserPositionCard({
  btcContributed,
  shares,
  totalShares,
  pendingYield,
  poolId,
  onClaim,
  onLeave,
}: UserPositionCardProps) {
  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-accent">Your Position</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Contributed</p>
            <p className="font-mono font-semibold">{formatBTCCompact(btcContributed)} BTC</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Shares</p>
            <p className="font-mono font-semibold">{shares.toString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Share %</p>
            <p className="font-semibold">{formatPercentage(shares, totalShares)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Pending Yield</p>
            <p className="font-mono font-semibold text-success">{formatMUSD(pendingYield)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {pendingYield > BigInt(0) && (
            <Button variant="success" size="sm" onClick={() => onClaim?.(poolId)}>
              <TrendingUp className="mr-1.5 h-4 w-4" />
              Claim Yield
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={() => onLeave?.(poolId)}>
            Leave Pool
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
