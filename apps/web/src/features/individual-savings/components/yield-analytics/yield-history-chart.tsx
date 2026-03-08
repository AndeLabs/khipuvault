"use client";

import { BarChart3 } from "lucide-react";
import * as React from "react";

import { AmountDisplay } from "@/components/common";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ============================================================================
// TYPES
// ============================================================================

export interface YieldDataPoint {
  date: string;
  yield: number;
  cumulative: number;
}

interface YieldHistoryChartProps {
  currentDeposit: string;
  currentAPR: number;
}

// ============================================================================
// HOOK: useYieldHistory
// ============================================================================

function useYieldHistory(currentDeposit: string, currentAPR: number): YieldDataPoint[] {
  return React.useMemo(() => {
    const now = Date.now();
    const days = 30;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(now - (days - i) * 24 * 60 * 60 * 1000);
      // Simulate yield growth with some variance
      const baseYield = ((Number(currentDeposit) * currentAPR) / 100 / 365) * i;
      const variance = Math.sin(i * 0.5) * baseYield * 0.1;
      return {
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        yield: Math.max(0, baseYield + variance),
        cumulative: baseYield,
      };
    });
  }, [currentDeposit, currentAPR]);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function YieldHistoryChart({ currentDeposit, currentAPR }: YieldHistoryChartProps) {
  const yieldHistory = useYieldHistory(currentDeposit, currentAPR);
  const maxYield = Math.max(...yieldHistory.map((d) => d.cumulative));

  if (Number(currentDeposit) <= 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Simple Bar Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last 30 Days</span>
          <span className="font-semibold">
            Total: <AmountDisplay amount={maxYield.toFixed(4)} symbol="mUSD" size="sm" />
          </span>
        </div>

        <div className="flex h-64 items-end gap-1 rounded-lg border border-border bg-surface-elevated p-4">
          {yieldHistory.map((data) => (
            <ChartBar key={data.date} data={data} maxYield={maxYield} />
          ))}
        </div>

        {/* X-axis labels (showing every 7th day) */}
        <div className="flex justify-between px-4 text-xs text-muted-foreground">
          {yieldHistory
            .filter((_, i) => i % 7 === 0)
            .map((data) => (
              <span key={`label-${data.date}`}>{data.date}</span>
            ))}
        </div>
      </div>

      {/* Stats */}
      <YieldStats yieldHistory={yieldHistory} maxYield={maxYield} />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ChartBar({ data, maxYield }: { data: YieldDataPoint; maxYield: number }) {
  const heightPercent = maxYield > 0 ? (data.cumulative / maxYield) * 100 : 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex h-full flex-1 flex-col justify-end">
          <div
            className="bg-gradient-lavanda w-full cursor-pointer rounded-t transition-opacity hover:opacity-80"
            style={{
              height: `${heightPercent}%`,
              minHeight: "2px",
            }}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1 text-xs">
          <p className="font-semibold">{data.date}</p>
          <p>Yield: {data.cumulative.toFixed(4)} mUSD</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function YieldStats({
  yieldHistory,
  maxYield,
}: {
  yieldHistory: YieldDataPoint[];
  maxYield: number;
}) {
  const sevenDayYield =
    yieldHistory[yieldHistory.length - 1].cumulative -
    (yieldHistory[yieldHistory.length - 8]?.cumulative || 0);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-lg border border-border bg-surface-elevated p-3">
        <p className="mb-1 text-xs text-muted-foreground">7-Day Yield</p>
        <AmountDisplay
          amount={sevenDayYield.toFixed(4)}
          symbol="mUSD"
          size="sm"
          className="font-bold"
        />
      </div>
      <div className="rounded-lg border border-border bg-surface-elevated p-3">
        <p className="mb-1 text-xs text-muted-foreground">30-Day Yield</p>
        <AmountDisplay amount={maxYield.toFixed(4)} symbol="mUSD" size="sm" className="font-bold" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated">
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">No Yield History</h3>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">
        Make your first deposit to start tracking your yield performance over time.
      </p>
    </div>
  );
}
