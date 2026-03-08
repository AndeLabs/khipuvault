/**
 * @fileoverview Price Display Component with Staleness Indicator
 * @module components/mezo/price-display
 *
 * Displays BTC/USD price from Mezo oracle with visual indicators
 * for price health status (fresh, warning, stale).
 */

"use client";

import { useMezoPriceFeed, type PriceStatus } from "@/hooks/web3/mezo/use-mezo-price-feed";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  className?: string;
  showStatus?: boolean;
  compact?: boolean;
}

const statusConfig: Record<PriceStatus, { color: string; label: string; icon: string }> = {
  fresh: { color: "text-green-500", label: "Live", icon: "●" },
  warning: { color: "text-yellow-500", label: "Updating...", icon: "○" },
  stale: { color: "text-red-500", label: "Stale", icon: "◌" },
  loading: { color: "text-gray-400", label: "Loading", icon: "◌" },
  error: { color: "text-red-500", label: "Error", icon: "✕" },
};

export function PriceDisplay({ className, showStatus = true, compact = false }: PriceDisplayProps) {
  const { priceFormatted, priceStatus, priceAgeFormatted, isLoading, error } = useMezoPriceFeed();

  const config = statusConfig[priceStatus];

  if (error) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-red-500">Price unavailable</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={cn("font-mono font-semibold", compact ? "text-sm" : "text-lg")}>
            {isLoading ? "Loading..." : priceFormatted}
          </span>
          {showStatus && !isLoading && (
            <span
              className={cn("text-xs", config.color)}
              title={`${config.label} - ${priceAgeFormatted}`}
            >
              {config.icon}
            </span>
          )}
        </div>
        {!compact && showStatus && !isLoading && (
          <span className={cn("text-xs", config.color)}>{priceAgeFormatted}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Minimal price badge for use in headers
 */
export function PriceBadge({ className }: { className?: string }) {
  const { price, priceStatus, isLoading } = useMezoPriceFeed();
  const config = statusConfig[priceStatus];

  if (isLoading) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded bg-gray-800 px-2 py-1 text-xs",
          className
        )}
      >
        <span className="animate-pulse">BTC: --</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded bg-gray-800 px-2 py-1 font-mono text-xs",
        className
      )}
      title={config.label}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-green-500": priceStatus === "fresh",
          "animate-pulse bg-yellow-500": priceStatus === "warning",
          "bg-red-500": priceStatus === "stale" || priceStatus === "error",
          "bg-gray-500": priceStatus === "loading",
        })}
      />
      <span>BTC: ${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
    </div>
  );
}
