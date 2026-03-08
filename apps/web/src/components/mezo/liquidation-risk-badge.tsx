/**
 * @fileoverview Liquidation Risk Badge Component
 * @module components/mezo/liquidation-risk-badge
 *
 * Visual indicator for Trove liquidation risk level.
 * Uses the useLiquidationMonitor hook for real-time risk assessment.
 */

"use client";

import {
  useLiquidationMonitor,
  LiquidationRisk,
  type LiquidationRiskLevel,
} from "@/hooks/web3/mezo/use-liquidation-monitor";
import { cn } from "@/lib/utils";

interface LiquidationRiskBadgeProps {
  className?: string;
  showDetails?: boolean;
}

const riskConfig: Record<LiquidationRiskLevel, { bg: string; text: string; border: string }> = {
  [LiquidationRisk.SAFE]: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/30",
  },
  [LiquidationRisk.LOW]: {
    bg: "bg-green-500/10",
    text: "text-green-500",
    border: "border-green-500/30",
  },
  [LiquidationRisk.MEDIUM]: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-500",
    border: "border-yellow-500/30",
  },
  [LiquidationRisk.HIGH]: {
    bg: "bg-orange-500/10",
    text: "text-orange-500",
    border: "border-orange-500/30",
  },
  [LiquidationRisk.CRITICAL]: {
    bg: "bg-red-500/10",
    text: "text-red-500",
    border: "border-red-500/30",
  },
  [LiquidationRisk.LIQUIDATABLE]: {
    bg: "bg-red-600/20",
    text: "text-red-400",
    border: "border-red-500/50",
  },
};

export function LiquidationRiskBadge({
  className,
  showDetails = false,
}: LiquidationRiskBadgeProps) {
  const {
    hasActiveTrove,
    riskInfo,
    collateralRatioFormatted,
    priceDropTolerance,
    isLoading,
    isPriceStale,
    priceWarning,
  } = useLiquidationMonitor();

  if (isLoading) {
    return (
      <div className={cn("animate-pulse rounded-lg bg-gray-800 px-3 py-2", className)}>
        <div className="h-5 w-24 rounded bg-gray-700" />
      </div>
    );
  }

  if (!hasActiveTrove) {
    return (
      <div className={cn("rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2", className)}>
        <span className="text-sm text-gray-400">No active Trove</span>
      </div>
    );
  }

  const config = riskConfig[riskInfo.level];

  return (
    <div className={cn("rounded-lg border px-3 py-2", config.bg, config.border, className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className={cn("font-semibold", config.text)}>{riskInfo.label}</span>
          {isPriceStale && (
            <span className="text-xs text-yellow-500" title={priceWarning ?? ""}>
              (stale price)
            </span>
          )}
        </div>
        <span className="font-mono text-sm text-gray-300">CR: {collateralRatioFormatted}</span>
      </div>

      {showDetails && (
        <div className="mt-2 space-y-1 border-t border-gray-700/50 pt-2 text-xs text-gray-400">
          <p>{riskInfo.description}</p>
          {priceDropTolerance.percentage > 0 && (
            <p>
              Price can drop {priceDropTolerance.percentage.toFixed(1)}% (to $
              {priceDropTolerance.liquidationPrice?.toLocaleString()}) before liquidation
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact risk indicator for table rows
 */
export function RiskDot({ level }: { level: LiquidationRiskLevel }) {
  const config = riskConfig[level];

  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 rounded-full", {
        "bg-emerald-500": level === LiquidationRisk.SAFE,
        "bg-green-500": level === LiquidationRisk.LOW,
        "bg-yellow-500": level === LiquidationRisk.MEDIUM,
        "bg-orange-500": level === LiquidationRisk.HIGH,
        "animate-pulse bg-red-500": level === LiquidationRisk.CRITICAL,
        "animate-ping bg-red-600": level === LiquidationRisk.LIQUIDATABLE,
      })}
      title={level}
    />
  );
}

/**
 * Health factor display with visual bar
 */
export function HealthFactorBar({ className }: { className?: string }) {
  const { collateralRatio, riskInfo, mcr, isLoading } = useLiquidationMonitor();

  if (isLoading) {
    return <div className={cn("h-4 w-full animate-pulse rounded bg-gray-700", className)} />;
  }

  // Normalize CR to percentage of "safe" (200%)
  const safeThreshold = mcr * 1.8; // ~200% for 110% MCR
  const fillPercent = Math.min(100, (collateralRatio / safeThreshold) * 100);

  const config = riskConfig[riskInfo.level];

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Health</span>
        <span className={config.text}>{riskInfo.label}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
        <div
          className={cn("h-full rounded-full transition-all duration-300", {
            "bg-emerald-500": riskInfo.level === LiquidationRisk.SAFE,
            "bg-green-500": riskInfo.level === LiquidationRisk.LOW,
            "bg-yellow-500": riskInfo.level === LiquidationRisk.MEDIUM,
            "bg-orange-500": riskInfo.level === LiquidationRisk.HIGH,
            "bg-red-500":
              riskInfo.level === LiquidationRisk.CRITICAL ||
              riskInfo.level === LiquidationRisk.LIQUIDATABLE,
          })}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}
