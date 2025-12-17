import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Amount Display Component
 * Displays crypto amounts with proper formatting and styling
 */

interface AmountDisplayProps {
  amount: string | number;
  symbol?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  valueClassName?: string;
  symbolClassName?: string;
  showZero?: boolean;
  trend?: "up" | "down" | "neutral";
  size?: "sm" | "md" | "lg" | "xl";
}

export function AmountDisplay({
  amount,
  symbol = "mUSD",
  prefix,
  suffix,
  decimals = 2,
  className,
  valueClassName,
  symbolClassName,
  showZero = true,
  trend,
  size = "md",
}: AmountDisplayProps) {
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;
  const isZero = numericAmount === 0;

  if (isZero && !showZero) {
    return <span className={cn("text-muted-foreground", className)}>-</span>;
  }

  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numericAmount);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl font-bold",
  };

  const trendColor = {
    up: "text-success",
    down: "text-error",
    neutral: "text-foreground",
  };

  return (
    <span
      className={cn(
        "tabular-nums font-medium",
        // eslint-disable-next-line security/detect-object-injection -- safe: size is typed enum
        sizeClasses[size],
        // eslint-disable-next-line security/detect-object-injection -- safe: trend is typed enum
        trend && trendColor[trend],
        className,
      )}
    >
      {prefix && <span className="mr-1">{prefix}</span>}
      <span className={valueClassName}>{formattedAmount}</span>
      {symbol && (
        <span
          className={cn(
            "ml-1.5 text-muted-foreground font-normal",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base",
            size === "xl" && "text-lg",
            symbolClassName,
          )}
        >
          {symbol}
        </span>
      )}
      {suffix && <span className="ml-1">{suffix}</span>}
    </span>
  );
}

/**
 * Percentage Display - Shows percentage values with trend
 */
interface PercentageDisplayProps {
  value: number;
  decimals?: number;
  showSign?: boolean;
  className?: string;
}

export function PercentageDisplay({
  value,
  decimals = 2,
  showSign = true,
  className,
}: PercentageDisplayProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isZero = value === 0;

  const getTrend = (): "up" | "down" | "neutral" => {
    if (isPositive) {
      return "up";
    }
    if (isNegative) {
      return "down";
    }
    return "neutral";
  };

  const trend = getTrend();

  return (
    <span
      className={cn(
        "tabular-nums font-medium inline-flex items-center gap-1",
        isPositive && "text-success",
        isNegative && "text-error",
        isZero && "text-muted-foreground",
        className,
      )}
    >
      {showSign && !isZero && (
        <span className="text-xs">
          {isPositive && "▲"}
          {isNegative && "▼"}
        </span>
      )}
      {showSign && (isPositive ? "+" : "")}
      {value.toFixed(decimals)}%
    </span>
  );
}

/**
 * Balance Card - Shows balance with label
 */
interface BalanceCardProps {
  label: string;
  amount: string | number;
  symbol?: string;
  trend?: "up" | "down" | "neutral";
  change?: number;
  loading?: boolean;
  className?: string;
}

export function BalanceCard({
  label,
  amount,
  symbol = "mUSD",
  trend,
  change,
  loading,
  className,
}: BalanceCardProps) {
  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="h-4 w-20 bg-surface-elevated animate-shimmer rounded" />
        <div className="h-8 w-32 bg-surface-elevated animate-shimmer rounded" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <p className="label">{label}</p>
      <div className="flex items-baseline gap-2">
        <AmountDisplay
          amount={amount}
          symbol={symbol}
          trend={trend}
          size="xl"
        />
        {change !== undefined && <PercentageDisplay value={change} />}
      </div>
    </div>
  );
}
