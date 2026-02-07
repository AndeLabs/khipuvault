"use client";

import { Users, Calendar, Coins, ArrowRight } from "lucide-react";
import { formatEther } from "viem";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { usePoolInfo, PoolStatus } from "@/hooks/web3/rotating";

interface RoscaCardProps {
  poolId: bigint;
}

export function RoscaCard({ poolId }: RoscaCardProps) {
  const { data: poolData, isPending } = usePoolInfo(poolId);

  if (isPending) {
    return (
      <Card className="shadow-custom animate-pulse border-primary/20 bg-card">
        <CardHeader>
          <div className="h-6 w-3/4 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!poolData) {
    return null;
  }

  // Parse pool data (tuple returned from contract)
  const [
    _id,
    rawName,
    _creator,
    rawMemberCount,
    rawContributionAmount,
    rawPeriodDuration,
    rawCurrentPeriod,
    rawTotalPeriods,
    _startTime,
    _totalBtcCollected,
    _totalMusdMinted,
    rawTotalYieldGenerated,
    _yieldDistributed,
    rawStatus,
    _autoAdvance,
  ] = poolData as unknown[];

  // Type assertions for contract return values
  const name = rawName as string;
  const memberCount = rawMemberCount as bigint;
  const contributionAmount = rawContributionAmount as bigint;
  const periodDuration = rawPeriodDuration as bigint;
  const currentPeriod = rawCurrentPeriod as bigint;
  const totalPeriods = rawTotalPeriods as bigint;
  const totalYieldGenerated = rawTotalYieldGenerated as bigint;
  const status = rawStatus as PoolStatus;

  const getStatusBadge = (status: PoolStatus) => {
    switch (status) {
      case PoolStatus.FORMING:
        return <Badge variant="warning">Forming</Badge>;
      case PoolStatus.ACTIVE:
        return <Badge variant="success">Active</Badge>;
      case PoolStatus.COMPLETED:
        return <Badge variant="secondary">Completed</Badge>;
      case PoolStatus.CANCELLED:
        return <Badge variant="error">Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getStatusColor = (status: PoolStatus) => {
    switch (status) {
      case PoolStatus.FORMING:
        return "border-warning/50";
      case PoolStatus.ACTIVE:
        return "border-success/50";
      case PoolStatus.COMPLETED:
        return "border-secondary/50";
      case PoolStatus.CANCELLED:
        return "border-error/50";
      default:
        return "border-primary/20";
    }
  };

  const periodInDays = Number(periodDuration) / (24 * 60 * 60);

  return (
    <Card
      className={`shadow-custom hover:shadow-glow bg-card transition-all ${getStatusColor(status)}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          {getStatusBadge(status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Members */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Members:</span>
          <span className="font-medium">{memberCount.toString()} members</span>
        </div>

        {/* Contribution */}
        <div className="flex items-center gap-2 text-sm">
          <Coins className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Contribution:</span>
          <span className="font-code font-medium">
            {parseFloat(formatEther(contributionAmount)).toFixed(4)} BTC
          </span>
        </div>

        {/* Period */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Period:</span>
          <span className="font-medium">
            Every {periodInDays} {periodInDays === 1 ? "day" : "days"}
          </span>
        </div>

        {/* Progress */}
        {status === PoolStatus.ACTIVE && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium">
                Period {(Number(currentPeriod) + 1).toString()} / {totalPeriods.toString()}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${((Number(currentPeriod) + 1) / Number(totalPeriods)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Total Yield */}
        {Number(totalYieldGenerated) > 0 && (
          <div className="border-t border-muted pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Yield:</span>
              <span className="font-code font-medium text-success">
                +{parseFloat(formatEther(totalYieldGenerated)).toFixed(6)} MUSD
              </span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {status === PoolStatus.FORMING ? (
          <Button className="w-full" size="sm">
            Join Pool
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : status === PoolStatus.ACTIVE ? (
          <Button variant="outline" className="w-full" size="sm">
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button variant="secondary" className="w-full" size="sm" disabled>
            {status === PoolStatus.COMPLETED ? "Completed" : "Cancelled"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
