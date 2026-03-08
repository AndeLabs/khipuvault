/**
 * @fileoverview Token-Specific Formatting Utilities
 * @module lib/format/token
 *
 * Convenience formatters for specific tokens (mUSD, BTC, MEZO).
 * Built on top of generic balance formatters.
 */

import { formatBalanceCompact, formatBalance, formatBalanceFull } from "./balance";

// ============================================================================
// mUSD FORMATTERS
// ============================================================================

/**
 * Format mUSD amount with smart precision (compact notation for large amounts)
 *
 * @example
 * formatMusd(1000000000000000000n) // "1.00"
 * formatMusd(1000000000000000000000n) // "1.00k"
 * formatMusd(1000000000000000000000000n) // "1.00M"
 */
export function formatMusd(amount: bigint | string | undefined | null): string {
  return formatBalanceCompact(amount, 18);
}

/**
 * Format mUSD with fixed 2 decimal places
 *
 * @example
 * formatMusdFixed(1234567890000000000n) // "1.23"
 */
export function formatMusdFixed(amount: bigint | string | undefined | null): string {
  return formatBalance(amount, 18, 2);
}

/**
 * Format mUSD with full precision
 *
 * @example
 * formatMusdFull(1234567890000000000n) // "1.23456789"
 */
export function formatMusdFull(amount: bigint | string | undefined | null): string {
  return formatBalanceFull(amount, 18);
}

// ============================================================================
// BTC FORMATTERS
// ============================================================================

/**
 * Format BTC amount with smart precision
 *
 * @example
 * formatBtc(100000000000000000n) // "0.100000"
 * formatBtc(1000000000000000000n) // "1.00"
 */
export function formatBtc(amount: bigint | string | undefined | null): string {
  return formatBalanceCompact(amount, 18);
}

/**
 * Format BTC with 8 decimal places (satoshi precision)
 *
 * @example
 * formatBtcFull(123456780000000000n) // "0.12345678"
 */
export function formatBtcFull(amount: bigint | string | undefined | null): string {
  return formatBalance(amount, 18, 8);
}

/**
 * Format BTC with 4 decimal places (common display)
 *
 * @example
 * formatBtcShort(123456780000000000n) // "0.1235"
 */
export function formatBtcShort(amount: bigint | string | undefined | null): string {
  return formatBalance(amount, 18, 4);
}

// ============================================================================
// PERCENTAGE FORMATTERS
// ============================================================================

/**
 * Format basis points to percentage string
 *
 * @param basisPoints - Value in basis points (10000 = 100%)
 * @returns Formatted percentage string
 *
 * @example
 * formatBasisPoints(500n) // "5.00%"
 * formatBasisPoints(10000n) // "100.00%"
 */
export function formatBasisPoints(basisPoints: bigint | number): string {
  const bp = typeof basisPoints === "bigint" ? Number(basisPoints) : basisPoints;
  return `${(bp / 100).toFixed(2)}%`;
}

/**
 * Format APR/APY value
 *
 * @param apr - APR value (e.g., 5 for 5%)
 * @returns Formatted APR string
 *
 * @example
 * formatApr(5.25) // "5.25%"
 */
export function formatApr(apr: number): string {
  return `${apr.toFixed(2)}%`;
}

// ============================================================================
// USD FORMATTERS
// ============================================================================

/**
 * Format USD amount with currency symbol
 *
 * @example
 * formatUsd(1234.56) // "$1,234.56"
 */
export function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format USD amount compact
 *
 * @example
 * formatUsdCompact(1234567) // "$1.23M"
 */
export function formatUsdCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(2)}k`;
  }
  return formatUsd(amount);
}
