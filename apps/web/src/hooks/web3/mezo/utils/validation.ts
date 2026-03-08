/**
 * @fileoverview Input Validation Utilities for Mezo Hooks
 * @module hooks/web3/mezo/utils/validation
 *
 * Secure input validation for transaction amounts and addresses.
 */

import { parseUnits, isAddress } from "viem";

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  value?: bigint;
}

/**
 * Validate and parse a string amount to bigint
 *
 * @param amount - String amount to validate
 * @param decimals - Token decimals (default 18)
 * @param options - Validation options
 * @returns ValidationResult with parsed value or error
 */
export function validateAmount(
  amount: string,
  decimals: number = 18,
  options: {
    minAmount?: bigint;
    maxAmount?: bigint;
    fieldName?: string;
  } = {}
): ValidationResult {
  const { minAmount = 0n, maxAmount, fieldName = "Amount" } = options;

  // Check for empty or whitespace
  if (!amount || amount.trim() === "") {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const trimmed = amount.trim();

  // Check for valid number format (positive decimal)
  const numberRegex = /^\d+\.?\d*$/;
  if (!numberRegex.test(trimmed)) {
    return { isValid: false, error: `${fieldName} must be a valid positive number` };
  }

  // Check for negative (should not match regex, but double-check)
  if (trimmed.startsWith("-")) {
    return { isValid: false, error: `${fieldName} cannot be negative` };
  }

  // Check for reasonable decimal places
  const parts = trimmed.split(".");
  if (parts[1] && parts[1].length > decimals) {
    return {
      isValid: false,
      error: `${fieldName} has too many decimal places (max ${decimals})`,
    };
  }

  try {
    const parsed = parseUnits(trimmed, decimals);

    // Check minimum
    if (parsed < minAmount) {
      const minFormatted = Number(minAmount) / 10 ** decimals;
      return {
        isValid: false,
        error: `${fieldName} must be at least ${minFormatted}`,
      };
    }

    // Check maximum if provided
    if (maxAmount !== undefined && parsed > maxAmount) {
      const maxFormatted = Number(maxAmount) / 10 ** decimals;
      return {
        isValid: false,
        error: `${fieldName} cannot exceed ${maxFormatted}`,
      };
    }

    return { isValid: true, value: parsed };
  } catch {
    return { isValid: false, error: `${fieldName} is invalid` };
  }
}

/**
 * Validate an Ethereum address
 */
export function validateAddress(address: string, fieldName: string = "Address"): ValidationResult {
  if (!address || address.trim() === "") {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (!isAddress(address)) {
    return { isValid: false, error: `${fieldName} is not a valid address` };
  }

  return { isValid: true };
}

/**
 * Safe BigInt to Number conversion with overflow check
 */
export function safeBigIntToNumber(value: bigint, decimals: number = 18): number {
  const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

  // Scale down by decimals first to avoid overflow
  const scaled = value / BigInt(10 ** Math.max(0, decimals - 6));

  if (scaled > MAX_SAFE) {
    // For very large numbers, use approximation
    return Number(value / BigInt(10 ** decimals));
  }

  return Number(value) / 10 ** decimals;
}

/**
 * Safe division that handles zero divisor
 */
export function safeDivide(
  numerator: number,
  denominator: number,
  defaultValue: number = 0
): number {
  if (denominator === 0 || !Number.isFinite(denominator)) {
    return defaultValue;
  }

  const result = numerator / denominator;

  if (!Number.isFinite(result)) {
    return defaultValue;
  }

  return result;
}

/**
 * Format validation errors for display
 */
export function formatValidationError(result: ValidationResult): string | null {
  return result.isValid ? null : (result.error ?? "Validation failed");
}

/**
 * Transaction error types for better UX
 */
export enum TxErrorType {
  USER_REJECTED = "USER_REJECTED",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  CONTRACT_REVERT = "CONTRACT_REVERT",
  GAS_ESTIMATION = "GAS_ESTIMATION",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN = "UNKNOWN",
}

/**
 * Parse transaction error to user-friendly type
 */
export function parseTxError(error: unknown): { type: TxErrorType; message: string } {
  if (!error) {
    return { type: TxErrorType.UNKNOWN, message: "Unknown error occurred" };
  }

  const errorString = String(error).toLowerCase();
  const errorMessage = error instanceof Error ? error.message : String(error);

  // User rejected
  if (
    errorString.includes("user rejected") ||
    errorString.includes("user denied") ||
    errorString.includes("rejected by user")
  ) {
    return { type: TxErrorType.USER_REJECTED, message: "Transaction was rejected" };
  }

  // Insufficient funds
  if (
    errorString.includes("insufficient funds") ||
    errorString.includes("insufficient balance") ||
    errorString.includes("exceeds balance")
  ) {
    return { type: TxErrorType.INSUFFICIENT_FUNDS, message: "Insufficient balance" };
  }

  // Gas estimation failed
  if (
    errorString.includes("gas") ||
    errorString.includes("execution reverted") ||
    errorString.includes("estimategas")
  ) {
    return {
      type: TxErrorType.GAS_ESTIMATION,
      message: "Transaction would fail. Check your inputs.",
    };
  }

  // Contract revert
  if (errorString.includes("revert") || errorString.includes("require")) {
    // Try to extract revert reason
    const revertMatch = errorMessage.match(/reason="([^"]+)"/);
    const reason = revertMatch ? revertMatch[1] : "Transaction reverted by contract";
    return { type: TxErrorType.CONTRACT_REVERT, message: reason };
  }

  // Network error
  if (
    errorString.includes("network") ||
    errorString.includes("timeout") ||
    errorString.includes("connection")
  ) {
    return { type: TxErrorType.NETWORK_ERROR, message: "Network error. Please try again." };
  }

  return { type: TxErrorType.UNKNOWN, message: errorMessage };
}
