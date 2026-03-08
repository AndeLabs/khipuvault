/**
 * @fileoverview Balance Formatting Utilities
 * @module lib/format/balance
 *
 * Centralized utilities for formatting blockchain token balances.
 * Eliminates code duplication across components.
 */

import { formatUnits } from "viem";

/**
 * Format a bigint or string balance to a human-readable string
 *
 * @param balance - The balance as bigint, string (of bigint), or undefined
 * @param decimals - Token decimals (default 18)
 * @param displayDecimals - Number of decimal places to show (default 2)
 * @returns Formatted balance string (e.g., "1,234.56")
 *
 * @example
 * formatBalance(1000000000000000000n) // "1.00"
 * formatBalance("1000000000000000000") // "1.00"
 * formatBalance(undefined) // "0.00"
 */
export function formatBalance(
  balance: bigint | string | undefined | null,
  decimals: number = 18,
  displayDecimals: number = 2
): string {
  try {
    if (!balance || balance === "0" || balance === "0n") {
      return "0.00";
    }

    const balanceBigInt = typeof balance === "bigint" ? balance : BigInt(balance);
    const formatted = formatUnits(balanceBigInt, decimals);
    return Number(formatted).toFixed(displayDecimals);
  } catch {
    return "0.00";
  }
}

/**
 * Format balance with compact notation for large numbers
 *
 * @param balance - The balance as bigint or string
 * @param decimals - Token decimals (default 18)
 * @returns Compact formatted string (e.g., "1.23M", "456.78k", "123.45")
 *
 * @example
 * formatBalanceCompact(1000000000000000000000000n) // "1.00M"
 * formatBalanceCompact(1000000000000000000000n) // "1.00k"
 */
export function formatBalanceCompact(
  balance: bigint | string | undefined | null,
  decimals: number = 18
): string {
  try {
    if (!balance || balance === "0" || balance === "0n") {
      return "0.00";
    }

    const balanceBigInt = typeof balance === "bigint" ? balance : BigInt(balance);
    const formatted = formatUnits(balanceBigInt, decimals);
    const num = parseFloat(formatted);

    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}k`;
    }
    if (num >= 1) {
      return num.toFixed(2);
    }
    if (num >= 0.01) {
      return num.toFixed(4);
    }
    return num.toFixed(6);
  } catch {
    return "0.00";
  }
}

/**
 * Format balance with full precision (up to 18 decimals, trimmed)
 *
 * @param balance - The balance as bigint or string
 * @param decimals - Token decimals (default 18)
 * @returns Full precision formatted string with trailing zeros removed
 *
 * @example
 * formatBalanceFull(1234567890000000000n) // "1.23456789"
 */
export function formatBalanceFull(
  balance: bigint | string | undefined | null,
  decimals: number = 18
): string {
  try {
    if (!balance || balance === "0" || balance === "0n") {
      return "0";
    }

    const balanceBigInt = typeof balance === "bigint" ? balance : BigInt(balance);
    const formatted = formatUnits(balanceBigInt, decimals);

    // Remove trailing zeros after decimal point
    const trimmed = formatted.replace(/\.?0+$/, "");
    return trimmed || "0";
  } catch {
    return "0";
  }
}

/**
 * Parse a user-entered string amount to bigint
 *
 * @param amount - User-entered amount string (e.g., "1.5")
 * @param decimals - Token decimals (default 18)
 * @returns Parsed bigint or null if invalid
 *
 * @example
 * parseBalanceInput("1.5") // 1500000000000000000n
 * parseBalanceInput("invalid") // null
 */
export function parseBalanceInput(amount: string, decimals: number = 18): bigint | null {
  try {
    if (!amount || amount.trim() === "") {
      return null;
    }

    const cleanAmount = amount.trim().replace(/,/g, "");
    const num = parseFloat(cleanAmount);

    if (isNaN(num) || num < 0) {
      return null;
    }

    // Convert to smallest unit
    const factor = BigInt(10) ** BigInt(decimals);
    const [whole, fraction = ""] = cleanAmount.split(".");

    const wholeBigInt = BigInt(whole || "0") * factor;
    const fractionPadded = fraction.padEnd(decimals, "0").slice(0, decimals);
    const fractionBigInt = BigInt(fractionPadded);

    return wholeBigInt + fractionBigInt;
  } catch {
    return null;
  }
}

/**
 * Format balance for display with currency symbol
 *
 * @param balance - The balance as bigint or string
 * @param symbol - Currency symbol (e.g., "mUSD", "BTC")
 * @param decimals - Token decimals (default 18)
 * @returns Formatted string with symbol (e.g., "1,234.56 mUSD")
 */
export function formatBalanceWithSymbol(
  balance: bigint | string | undefined | null,
  symbol: string,
  decimals: number = 18
): string {
  return `${formatBalance(balance, decimals)} ${symbol}`;
}

/**
 * Check if balance is greater than zero
 */
export function hasBalance(balance: bigint | string | undefined | null): boolean {
  if (!balance) return false;
  try {
    const balanceBigInt = typeof balance === "bigint" ? balance : BigInt(balance);
    return balanceBigInt > BigInt(0);
  } catch {
    return false;
  }
}
