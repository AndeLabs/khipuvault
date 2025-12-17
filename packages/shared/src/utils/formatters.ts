/**
 * @fileoverview Shared Formatters for KhipuVault
 * @module shared/utils/formatters
 *
 * Centralized formatting utilities used across web, api, and blockchain packages.
 * All BTC values on Mezo have 18 decimals (native token).
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const DECIMALS_18 = 1e18;

// ============================================================================
// MUSD FORMATTERS
// ============================================================================

/**
 * Format BigInt wei amount to human-readable MUSD string
 */
export function formatMUSD(
  weiAmount: string | bigint,
  decimals: number = 2,
): string {
  const amount = typeof weiAmount === "string" ? BigInt(weiAmount) : weiAmount;
  const formatted = Number(amount) / DECIMALS_18;
  return formatted.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format MUSD with currency symbol
 */
export function formatMUSDWithSymbol(
  weiAmount: string | bigint,
  decimals: number = 2,
): string {
  return `${formatMUSD(weiAmount, decimals)} MUSD`;
}

// ============================================================================
// BTC FORMATTERS (Native token on Mezo - 18 decimals)
// ============================================================================

/**
 * Format BTC amount - full precision (8 decimals like real BTC)
 */
export function formatBTC(weiAmount: string | bigint): string {
  const amount = typeof weiAmount === "string" ? BigInt(weiAmount) : weiAmount;
  const formatted = Number(amount) / DECIMALS_18;
  return formatted.toFixed(8);
}

/**
 * Format BTC amount - compact for UI (dynamic precision 4-8 decimals)
 */
export function formatBTCCompact(weiAmount: string | bigint): string {
  const amount = typeof weiAmount === "string" ? BigInt(weiAmount) : weiAmount;
  const btcValue = Number(amount) / DECIMALS_18;

  if (btcValue === 0) return "0";
  if (btcValue >= 1) return btcValue.toFixed(4);
  if (btcValue >= 0.01) return btcValue.toFixed(6);
  return btcValue.toFixed(8);
}

/**
 * Format BTC with symbol
 */
export function formatBTCWithSymbol(
  weiAmount: string | bigint,
  compact: boolean = true,
): string {
  const formatted = compact
    ? formatBTCCompact(weiAmount)
    : formatBTC(weiAmount);
  return `${formatted} BTC`;
}

/**
 * Format BTC for display with localization
 */
export function formatBTCLocalized(
  weiAmount: string | bigint,
  decimals: number = 6,
): string {
  const amount = typeof weiAmount === "string" ? BigInt(weiAmount) : weiAmount;
  const formatted = Number(amount) / DECIMALS_18;
  return formatted.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

/**
 * Parse human-readable MUSD amount to wei
 */
export function parseMUSD(amount: string): bigint {
  const parsed = parseFloat(amount);
  if (isNaN(parsed)) throw new Error("Invalid amount");
  return BigInt(Math.floor(parsed * 1e18));
}

/**
 * Format address to shortened version
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return "";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

/**
 * Format APR percentage
 */
export function formatAPR(apr: number, decimals: number = 2): string {
  return `${apr.toFixed(decimals)}%`;
}

/**
 * Format timestamp to date string
 */
export function formatDate(timestamp: Date | number): string {
  const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: Date | number): string {
  const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  return "just now";
}

// ============================================================================
// PARSERS
// ============================================================================

/**
 * Parse human-readable BTC amount to wei (18 decimals)
 */
export function parseBTC(amount: string): bigint {
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed < 0) throw new Error("Invalid BTC amount");
  return BigInt(Math.floor(parsed * DECIMALS_18));
}

// ============================================================================
// YIELD & FEE CALCULATIONS
// ============================================================================

/**
 * Calculate fee amount from gross yield
 * @param grossYield - Gross yield amount in wei
 * @param feePercent - Fee percentage in basis points (100 = 1%)
 */
export function calculateFeeAmount(
  grossYield: bigint,
  feePercent: number,
): bigint {
  return (grossYield * BigInt(feePercent)) / BigInt(10000);
}

/**
 * Calculate net yield after fee deduction
 * @param grossYield - Gross yield amount in wei
 * @param feePercent - Fee percentage in basis points (100 = 1%)
 */
export function calculateNetYield(
  grossYield: bigint,
  feePercent: number,
): bigint {
  const feeAmount = calculateFeeAmount(grossYield, feePercent);
  return grossYield - feeAmount;
}

/**
 * Format percentage from basis points
 * @param basisPoints - Fee in basis points (100 = 1%)
 */
export function formatPercentage(
  basisPoints: number,
  decimals: number = 2,
): string {
  return `${(basisPoints / 100).toFixed(decimals)}%`;
}

/**
 * Format datetime with time
 */
export function formatDateTime(timestamp: Date | number): string {
  const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================================
// VALIDATION HELPERS (re-exported from validators.ts)
// ============================================================================

// Note: isValidAddress is in validators.ts - use that for validation
// This normalizeAddress uses the regex directly to avoid circular dependency

/**
 * Normalize Ethereum address to lowercase
 */
export function normalizeAddress(address: string): string {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("Invalid Ethereum address");
  }
  return address.toLowerCase();
}
