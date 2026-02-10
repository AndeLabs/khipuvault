import { formatUnits } from "viem";

import type { TransactionType } from "./types";

export function formatAmount(amount: bigint, type: TransactionType): string {
  try {
    const formatted = Number(formatUnits(amount, 18)).toFixed(4);
    const isNegative = type === "withdraw";
    return isNegative ? `-${formatted}` : `+${formatted}`;
  } catch {
    return "0.0000";
  }
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "Just now";
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return date.toLocaleDateString();
}
