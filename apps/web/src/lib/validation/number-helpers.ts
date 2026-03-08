/**
 * @fileoverview Number Validation and Parsing Helpers
 * @module lib/validation/number-helpers
 *
 * Centralized utilities for parsing, validating, and formatting
 * numeric values used in forms and blockchain interactions.
 */

import { parseEther, formatEther } from "viem";

// ============================================================================
// PARSING HELPERS
// ============================================================================

/**
 * Safely parse a string to a number, returning undefined on failure
 */
export function safeParseNumber(value: string | undefined | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

/**
 * Parse string to number with a default fallback
 */
export function parseNumberOr(value: string | undefined | null, fallback: number): number {
  const num = safeParseNumber(value);
  return num ?? fallback;
}

/**
 * Safely parse a BTC/ETH amount string to bigint (wei)
 * Returns 0n on invalid input
 */
export function safeParseEther(value: string | undefined | null): bigint {
  if (!value) {
    return 0n;
  }
  try {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return 0n;
    }
    return parseEther(value);
  } catch {
    return 0n;
  }
}

/**
 * Safely format wei to string, returning "0" on error
 */
export function safeFormatEther(value: bigint | undefined | null): string {
  if (!value) {
    return "0";
  }
  try {
    return formatEther(value);
  } catch {
    return "0";
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if a string represents a valid positive number
 */
export function isValidPositiveNumber(value: string | undefined | null): boolean {
  if (!value) {
    return false;
  }
  const num = Number(value);
  return !isNaN(num) && num > 0 && isFinite(num);
}

/**
 * Check if a string represents a valid non-negative number
 */
export function isValidNonNegativeNumber(value: string | undefined | null): boolean {
  if (!value) {
    return false;
  }
  const num = Number(value);
  return !isNaN(num) && num >= 0 && isFinite(num);
}

/**
 * Check if value is within a range
 */
export function isInRange(
  value: number | string | undefined | null,
  min: number,
  max: number
): boolean {
  const num = typeof value === "string" ? safeParseNumber(value) : value;
  if (num === undefined || num === null) {
    return false;
  }
  return num >= min && num <= max;
}

/**
 * Validate an amount against min/max constraints
 */
export function validateAmount(
  value: string | undefined | null,
  options: {
    min?: number;
    max?: number;
    minMessage?: string;
    maxMessage?: string;
  } = {}
): { valid: boolean; error?: string } {
  const { min = 0, max = Infinity, minMessage, maxMessage } = options;

  if (!value) {
    return { valid: false, error: "Amount is required" };
  }

  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, error: "Invalid number" };
  }

  if (num < min) {
    return {
      valid: false,
      error: minMessage || `Amount must be at least ${min}`,
    };
  }

  if (num > max) {
    return {
      valid: false,
      error: maxMessage || `Amount cannot exceed ${max}`,
    };
  }

  return { valid: true };
}

// ============================================================================
// COMPARISON HELPERS
// ============================================================================

/**
 * Compare two bigint values, handling undefined
 */
export function compareBigInt(
  a: bigint | undefined | null,
  b: bigint | undefined | null
): -1 | 0 | 1 {
  const aVal = a ?? 0n;
  const bVal = b ?? 0n;
  if (aVal < bVal) {
    return -1;
  }
  if (aVal > bVal) {
    return 1;
  }
  return 0;
}

/**
 * Check if value meets minimum
 */
export function meetsMinimum(value: bigint | undefined | null, minimum: bigint | string): boolean {
  const val = value ?? 0n;
  const min = typeof minimum === "string" ? BigInt(minimum) : minimum;
  return val >= min;
}

/**
 * Check if value is within bigint range
 */
export function isWithinBigIntRange(
  value: bigint | undefined | null,
  min: bigint | string,
  max: bigint | string
): boolean {
  const val = value ?? 0n;
  const minVal = typeof min === "string" ? BigInt(min) : min;
  const maxVal = typeof max === "string" ? BigInt(max) : max;
  return val >= minVal && val <= maxVal;
}

// ============================================================================
// PERCENTAGE HELPERS
// ============================================================================

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number | bigint, total: number | bigint): number {
  const numValue = typeof value === "bigint" ? Number(value) : value;
  const numTotal = typeof total === "bigint" ? Number(total) : total;

  if (numTotal === 0) {
    return 0;
  }
  return (numValue / numTotal) * 100;
}

/**
 * Format basis points to percentage string
 */
export function basisPointsToPercent(basisPoints: number | bigint): string {
  const bp = typeof basisPoints === "bigint" ? Number(basisPoints) : basisPoints;
  return (bp / 100).toFixed(2);
}

/**
 * Convert percentage to basis points
 */
export function percentToBasisPoints(percent: number): number {
  return Math.round(percent * 100);
}

// ============================================================================
// ROUNDING HELPERS
// ============================================================================

/**
 * Round to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Floor to specified decimal places
 */
export function floorTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.floor(value * factor) / factor;
}

/**
 * Ceil to specified decimal places
 */
export function ceilTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.ceil(value * factor) / factor;
}
