/**
 * @fileoverview Cooperative Pool V3 Helper Functions
 * @module hooks/web3/cooperative/use-pool-helpers
 */

import { formatEther } from "viem";
import { PoolStatus } from "./constants";

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format BTC amount with full precision (8 decimals)
 */
export function formatBTC(value: bigint | undefined): string {
  if (!value) return "0.00000000";
  return formatEther(value);
}

/**
 * Format BTC amount with compact precision
 */
export function formatBTCCompact(value: bigint | undefined): string {
  if (!value) return "0";
  const num = Number(formatEther(value));
  if (num >= 1) return num.toFixed(4);
  if (num >= 0.001) return num.toFixed(6);
  return num.toFixed(8);
}

/**
 * Format MUSD amount with 2 decimal places
 */
export function formatMUSD(value: bigint | undefined): string {
  if (!value) return "0.00";
  const num = Number(formatEther(value));
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format date from Unix timestamp
 */
export function formatDate(timestamp: number): string {
  if (!timestamp) return "Unknown";
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format date and time from Unix timestamp
 */
export function formatDateTime(timestamp: number): string {
  if (!timestamp) return "Unknown";
  return new Date(timestamp * 1000).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

/**
 * Calculate fee amount based on BPS (basis points)
 * @param amount - The amount to calculate fee for
 * @param feeBps - Fee in basis points (100 = 1%)
 */
export function calculateFeeAmount(amount: bigint, feeBps: number): bigint {
  return (amount * BigInt(feeBps)) / BigInt(10000);
}

/**
 * Calculate net yield after fees
 * @param grossYield - Gross yield before fees
 * @param feeBps - Fee in basis points (100 = 1%)
 */
export function calculateNetYield(grossYield: bigint, feeBps: number): bigint {
  const fee = calculateFeeAmount(grossYield, feeBps);
  return grossYield - fee;
}

/**
 * Format percentage of shares
 * @param shares - User's shares
 * @param totalShares - Total shares in pool
 */
export function formatPercentage(shares: bigint, totalShares: bigint): string {
  if (totalShares === BigInt(0)) return "0%";
  const percentage = (Number(shares) * 100) / Number(totalShares);
  return `${percentage.toFixed(2)}%`;
}

// ============================================================================
// POOL STATUS HELPERS
// ============================================================================

/**
 * Get badge configuration for pool status
 */
export function getPoolStatusBadge(status: PoolStatus): {
  label: string;
  variant: "default" | "success" | "warning" | "error";
} {
  switch (status) {
    case PoolStatus.ACCEPTING:
      return { label: "Accepting", variant: "success" };
    case PoolStatus.ACTIVE:
      return { label: "Active", variant: "default" };
    case PoolStatus.CLOSED:
      return { label: "Closed", variant: "error" };
    default:
      return { label: "Unknown", variant: "warning" };
  }
}

// ============================================================================
// ERROR PARSING
// ============================================================================

/**
 * Parse contract error messages to user-friendly strings
 */
export function parsePoolError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes("User rejected")) {
    return "Transaction rejected by user";
  } else if (msg.includes("insufficient funds")) {
    return "Insufficient BTC balance";
  } else if (msg.includes("PoolFull")) {
    return "Pool is full";
  } else if (msg.includes("ContributionTooLow")) {
    return "Contribution amount too low";
  } else if (msg.includes("ContributionTooHigh")) {
    return "Contribution amount too high";
  } else if (msg.includes("AlreadyMember")) {
    return "Already a member of this pool";
  } else if (msg.includes("NotMember")) {
    return "Not a member of this pool";
  } else if (msg.includes("NoYieldToClaim")) {
    return "No yield available to claim";
  } else {
    return "Transaction failed";
  }
}
