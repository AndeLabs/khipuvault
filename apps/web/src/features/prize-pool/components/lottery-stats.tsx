/**
 * @fileoverview Lottery Statistics Component
 * @module features/prize-pool/components/lottery-stats
 *
 * Display aggregate statistics for current lottery round
 */

"use client";

import {
  Trophy,
  Ticket,
  Clock,
  DollarSign,
} from "lucide-react";
import * as React from "react";
import { formatEther } from "viem";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTimeRemaining } from "@/hooks/web3/use-lottery-pool";

import type { LotteryRound } from "@/lib/blockchain/fetch-lottery-pools";

interface LotteryStatsProps {
  roundInfo: LotteryRound | null;
  isLoading?: boolean;
}

export function LotteryStats({ roundInfo, isLoading }: LotteryStatsProps) {
  const [timeRemaining, setTimeRemaining] = React.useState(
    roundInfo
      ? getTimeRemaining(roundInfo.endTime)
      : { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 },
  );

  // Update countdown
  React.useEffect(() => {
    if (!roundInfo) {return;}

    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(roundInfo.endTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [roundInfo]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!roundInfo) {
    return null;
  }

  const stats = [
    {
      title: "Total Prize Pool",
      value: `${formatEther(roundInfo.totalPrize)} BTC`,
      subtitle: `≈ $${(Number(formatEther(roundInfo.totalPrize)) * 95000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Trophy,
      color: "text-lavanda",
      bgColor: "bg-lavanda/10",
    },
    {
      title: "Tickets Sold",
      value: roundInfo.totalTicketsSold.toString(),
      subtitle: `${roundInfo.maxTickets.toString()} max capacity`,
      icon: Ticket,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Ticket Price",
      value: `${formatEther(roundInfo.ticketPrice)} BTC`,
      subtitle:
        `≈ $${  (Number(formatEther(roundInfo.ticketPrice)) * 95000).toFixed(2)}`,
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Time Remaining",
      value:
        timeRemaining.total > 0
          ? `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`
          : "Ended",
      subtitle:
        roundInfo.status === 0
          ? "Open for entries"
          : roundInfo.status === 1
            ? "Drawing..."
            : "Completed",
      icon: Clock,
      color: timeRemaining.total > 0 ? "text-warning" : "text-muted-foreground",
      bgColor: timeRemaining.total > 0 ? "bg-warning/10" : "bg-muted/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div
                className={`h-8 w-8 rounded-full ${stat.bgColor} flex items-center justify-center`}
              >
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
