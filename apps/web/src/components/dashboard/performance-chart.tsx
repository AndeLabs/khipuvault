"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const chartData = [
  { date: "2024-05-01", value: 200 },
  { date: "2024-05-02", value: 210 },
  { date: "2024-05-03", value: 220 },
  { date: "2024-05-04", value: 215 },
  { date: "2024-05-05", value: 230 },
  { date: "2024-05-06", value: 240 },
  { date: "2024-05-07", value: 235 },
  { date: "2024-05-08", value: 250 },
  { date: "2024-05-09", value: 260 },
  { date: "2024-05-10", value: 255 },
  { date: "2024-05-11", value: 270 },
  { date: "2024-05-12", value: 280 },
  { date: "2024-05-13", value: 275 },
  { date: "2024-05-14", value: 290 },
  { date: "2024-05-15", value: 300 },
  { date: "2024-05-16", value: 295 },
  { date: "2024-05-17", value: 310 },
  { date: "2024-05-18", value: 320 },
  { date: "2024-05-19", value: 315 },
  { date: "2024-05-20", value: 330 },
  { date: "2024-05-21", value: 340 },
  { date: "2024-05-22", value: 335 },
  { date: "2024-05-23", value: 350 },
  { date: "2024-05-24", value: 360 },
  { date: "2024-05-25", value: 355 },
  { date: "2024-05-26", value: 370 },
  { date: "2024-05-27", value: 380 },
  { date: "2024-05-28", value: 375 },
  { date: "2024-05-29", value: 390 },
  { date: "2024-05-30", value: 400 },
];

export function PerformanceChart() {
  return (
    <Card className="bg-card border-primary/20 shadow-custom">
      <CardHeader>
        <CardTitle>Rendimiento Acumulado</CardTitle>
        <CardDescription>Últimos 30 días</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--secondary))"
                    stopOpacity={0.2}
                  />
                </linearGradient>
                <linearGradient id="colorStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="5%" stopColor="hsl(var(--primary))" />
                  <stop offset="95%" stopColor="hsl(var(--secondary))" />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).getDate().toString()}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{
                  stroke: "hsl(var(--muted-foreground))",
                  opacity: 0.2,
                }}
                tickLine={{
                  stroke: "hsl(var(--muted-foreground))",
                  opacity: 0.2,
                }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{
                  stroke: "hsl(var(--muted-foreground))",
                  opacity: 0.2,
                }}
                tickLine={{
                  stroke: "hsl(var(--muted-foreground))",
                  opacity: 0.2,
                }}
              />
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--muted-foreground))"
                opacity={0.1}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--primary) / 0.2)",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                itemStyle={{ color: "hsl(var(--primary))" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="url(#colorStroke)"
                strokeWidth={2}
                fill="url(#colorUv)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
