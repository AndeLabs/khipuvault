"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface AllocationChartProps {
  individualSavings?: number;
  cooperativeSavings?: number;
  isLoading?: boolean;
}

export function AllocationChart({
  individualSavings = 0,
  cooperativeSavings = 0,
  isLoading,
}: AllocationChartProps) {
  const data = [
    {
      name: "Individual Savings",
      value: individualSavings,
      color: "rgb(191, 164, 255)", // lavanda
    },
    {
      name: "Cooperative Pools",
      value: cooperativeSavings,
      color: "rgb(255, 199, 125)", // orange
    },
  ].filter((item) => item.value > 0);

  const total = individualSavings + cooperativeSavings;

  if (isLoading) {
    return (
      <Card variant="surface">
        <CardHeader>
          <div className="h-6 w-32 bg-surface-elevated animate-shimmer rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-surface-elevated animate-shimmer rounded" />
        </CardContent>
      </Card>
    );
  }

  if (total === 0) {
    return (
      <Card variant="surface">
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
          <CardDescription>Your portfolio distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>No assets yet. Start saving to see your allocation.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="surface">
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
        <CardDescription>Your portfolio distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) =>
                `${value.toLocaleString()} mUSD (${((value / total) * 100).toFixed(1)}%)`
              }
              contentStyle={{
                backgroundColor: "rgb(20, 20, 25)",
                border: "1px solid rgb(39, 39, 42)",
                borderRadius: "8px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend with amounts */}
        <div className="mt-6 space-y-3">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm">{item.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {item.value.toLocaleString()} mUSD
                </p>
                <p className="text-xs text-muted-foreground">
                  {((item.value / total) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
