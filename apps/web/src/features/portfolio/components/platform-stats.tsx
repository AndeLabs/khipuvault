"use client";

import { Database, Users, TrendingUp } from "lucide-react";
import { formatUnits } from "viem";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface PlatformStatsProps {
  totalValueLocked?: bigint;
  totalYieldsGenerated?: bigint;
  activeUsers?: number;
  isLoading?: boolean;
}

export function PlatformStats({
  totalValueLocked = BigInt(0),
  totalYieldsGenerated = BigInt(0),
  activeUsers = 0,
  isLoading,
}: PlatformStatsProps) {
  const formatValue = (value: bigint) => {
    try {
      const num = Number(formatUnits(value, 18));
      if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(2)}M`;
      }
      if (num >= 1_000) {
        return `${(num / 1_000).toFixed(2)}K`;
      }
      return num.toFixed(2);
    } catch {
      return "0.00";
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} variant="surface">
            <CardContent className="pt-4">
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      icon: Database,
      label: "Total Value Locked",
      value: formatValue(totalValueLocked),
      suffix: "mUSD",
      color: "text-lavanda",
      bgColor: "bg-lavanda/10",
    },
    {
      icon: TrendingUp,
      label: "Yields Generated",
      value: formatValue(totalYieldsGenerated),
      suffix: "mUSD",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: Users,
      label: "Active Users",
      value: activeUsers.toString(),
      suffix: "",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} variant="surface">
          <CardContent className="flex items-center gap-4 pt-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.bgColor}`}
            >
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold">
                {stat.value}
                {stat.suffix && (
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {stat.suffix}
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
