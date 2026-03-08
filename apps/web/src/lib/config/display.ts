/**
 * @fileoverview Display Constants
 * @module lib/config/display
 *
 * Centralized constants for UI display formatting.
 * Ensures consistent formatting across the application.
 */

// ============================================================================
// ADDRESS FORMATTING
// ============================================================================

/** Number of characters to show at start of address */
export const ADDRESS_PREFIX_LENGTH = 6;

/** Number of characters to show at end of address */
export const ADDRESS_SUFFIX_LENGTH = 4;

/**
 * Format an Ethereum address for display
 * @example formatAddress("0x1234...5678") => "0x1234...5678"
 */
export function formatAddress(address: string): string {
  if (!address || address.length < ADDRESS_PREFIX_LENGTH + ADDRESS_SUFFIX_LENGTH) {
    return address;
  }
  return `${address.slice(0, ADDRESS_PREFIX_LENGTH)}...${address.slice(-ADDRESS_SUFFIX_LENGTH)}`;
}

// ============================================================================
// DECIMAL PLACES
// ============================================================================

/** Decimal places for USD/stablecoin display */
export const USD_DECIMALS = 2;

/** Decimal places for BTC display */
export const BTC_DECIMALS = 6;

/** Decimal places for percentage display */
export const PERCENT_DECIMALS = 2;

/** Decimal places for APR/APY display */
export const APY_DECIMALS = 2;

/** Decimal places for token amounts (high precision) */
export const TOKEN_DECIMALS_HIGH = 8;

/** Decimal places for yield amounts */
export const YIELD_DECIMALS = 6;

// ============================================================================
// NUMBER LIMITS
// ============================================================================

/** Minimum value to display (below this show "<0.01") */
export const MIN_DISPLAY_VALUE = 0.01;

/** Large number threshold for compact notation */
export const COMPACT_THRESHOLD = 1_000_000;

/** Thousand threshold */
export const THOUSAND = 1_000;

/** Million threshold */
export const MILLION = 1_000_000;

// ============================================================================
// LIST LIMITS
// ============================================================================

/** Default items per page */
export const DEFAULT_PAGE_SIZE = 10;

/** Default recent items to show */
export const DEFAULT_RECENT_ITEMS = 5;

/** Maximum transaction history items */
export const MAX_TRANSACTION_HISTORY = 50;

// ============================================================================
// BLOCKCHAIN CONSTANTS
// ============================================================================

/** Token decimals (18 for most ERC20) */
export const TOKEN_DECIMALS = 18;

/** Conversion factor for 18-decimal tokens */
export const TOKEN_CONVERSION = 1e18;

/** Basis points divisor (100 = 1%) */
export const BASIS_POINTS_DIVISOR = 10_000;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format number with appropriate decimals based on value
 */
export function formatWithDecimals(
  value: number,
  type: "usd" | "btc" | "percent" | "yield"
): string {
  const decimals = {
    usd: USD_DECIMALS,
    btc: BTC_DECIMALS,
    percent: PERCENT_DECIMALS,
    yield: YIELD_DECIMALS,
  }[type];

  return value.toFixed(decimals);
}

/**
 * Format large numbers with compact notation
 */
export function formatCompact(value: number): string {
  if (value >= MILLION) {
    return `${(value / MILLION).toFixed(USD_DECIMALS)}M`;
  }
  if (value >= THOUSAND) {
    return `${(value / THOUSAND).toFixed(USD_DECIMALS)}K`;
  }
  return value.toFixed(USD_DECIMALS);
}

/**
 * Format value with "< min" for very small values
 */
export function formatMinDisplay(value: number, min: number = MIN_DISPLAY_VALUE): string {
  if (value > 0 && value < min) {
    return `<${min}`;
  }
  return value.toFixed(USD_DECIMALS);
}
