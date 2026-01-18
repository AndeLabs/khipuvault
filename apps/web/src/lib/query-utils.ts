/**
 * @fileoverview Utility functions for TanStack Query
 * @module lib/query-utils
 *
 * Handles special cases like BigInt serialization
 */

/**
 * Normalize BigInt to string for query keys
 * TanStack Query uses JSON.stringify internally, which doesn't support BigInt
 *
 * Usage:
 * ```tsx
 * queryKey: ['pool', normalizeBigInt(poolId)]
 * ```
 *
 * @param value - Value that might be BigInt
 * @returns Normalized value (BigInt -> string, rest unchanged)
 */
export function normalizeBigInt(
  value: bigint | number | string | null | undefined
): string | number | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

/**
 * Normalize entire object for query keys
 * Recursively converts all BigInt values to strings
 *
 * @param obj - Object to normalize
 * @returns Normalized object
 */
export function normalizeForQueryKey(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "bigint") {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(normalizeForQueryKey);
  }

  if (typeof obj === "object") {
    return Object.entries(obj).reduce(
      (acc, [key, value]) => {
        acc[key] = normalizeForQueryKey(value);
        return acc;
      },
      {} as Record<string, any>
    );
  }

  return obj;
}

/**
 * Helper to safely stringify BigInt values
 * Useful for logging or display
 *
 * @param value - Value that might be BigInt
 * @returns String representation
 */
export function stringifyBigInt(value: any): string {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v));
  }
  return String(value);
}
