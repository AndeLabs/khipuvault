"use client";

import { TrendingUp, Wallet, Users, Award, DollarSign } from "lucide-react";
import * as React from "react";

import { AmountDisplay, PercentageDisplay } from "@/components/common";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  StatValue,
  StatLabel,
} from "@/components/ui/card";

interface PortfolioOverviewProps {
  totalValue?: string;
  individualSavings?: string;
  cooperativeSavings?: string;
  totalYields?: string;
  change24h?: number;
  change7d?: number;
  isLoading?: boolean;
}

export function PortfolioOverview({
  totalValue = "0",
  individualSavings = "0",
  cooperativeSavings = "0",
  totalYields = "0",
  change24h = 0,
  change7d = 0,
  isLoading,
}: PortfolioOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, _i) => (
          <div
            key={`skeleton-${_i}`}
            className="h-32 animate-shimmer rounded-lg bg-surface-elevated"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Portfolio Value */}
      <Card variant="surface" hover="glow-lavanda" className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Total Portfolio Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <AmountDisplay amount={totalValue} symbol="mUSD" size="xl" />
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">24h:</span>
                <PercentageDisplay value={change24h} />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">7d:</span>
                <PercentageDisplay value={change7d} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Yields */}
      <StatCard>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
            <Award className="h-5 w-5 text-success" />
          </div>
        </div>
        <StatLabel>Total Yields Earned</StatLabel>
        <StatValue trend="up">
          <AmountDisplay amount={totalYields} symbol="mUSD" size="lg" />
        </StatValue>
      </StatCard>

      {/* Active Positions */}
      <StatCard>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavanda/20">
            <DollarSign className="h-5 w-5 text-lavanda" />
          </div>
        </div>
        <StatLabel>Active Positions</StatLabel>
        <StatValue>
          <span className="text-2xl font-bold tabular-nums">
            {(() => {
              const individualCount = Number(individualSavings) > 0 ? 1 : 0;
              const cooperativeCount = Number(cooperativeSavings) > 0 ? 1 : 0;
              return individualCount + cooperativeCount;
            })()}
          </span>
        </StatValue>
      </StatCard>

      {/* Individual Savings */}
      <Card variant="surface" className="border-l-4 border-l-lavanda">
        <CardContent className="pt-6">
          <div className="mb-3 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-lavanda" />
            <StatLabel>Individual Savings</StatLabel>
          </div>
          <AmountDisplay amount={individualSavings} symbol="mUSD" size="lg" />
        </CardContent>
      </Card>

      {/* Cooperative Savings */}
      <Card variant="surface" className="border-l-4 border-l-accent">
        <CardContent className="pt-6">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            <StatLabel>Cooperative Pools</StatLabel>
          </div>
          <AmountDisplay amount={cooperativeSavings} symbol="mUSD" size="lg" />
        </CardContent>
      </Card>
    </div>
  );
}
