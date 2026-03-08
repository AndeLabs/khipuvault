/**
 * @fileoverview Validation Utilities
 * @module lib/validation
 *
 * Centralized validation schemas and helpers
 */

// ============================================================================
// SCHEMAS - Re-export from new structure
// ============================================================================

// Common schemas
export * from "./schemas/common";

// Pool schemas
export * from "./schemas/pool-schemas";

// Transaction schemas
export * from "./schemas/transaction-schemas";

// User schemas
export * from "./schemas/user-schemas";

// Legacy schemas (for backward compatibility)
export {
  // Base schemas
  amountSchema,
  optionalAmountSchema,
  poolNameSchema,
  addressSchema,
  optionalAddressSchema,
  // Form schemas
  depositFormSchema,
  withdrawFormSchema,
  createPoolFormSchema,
  joinPoolFormSchema,
  buyTicketsFormSchema,
  createRoscaFormSchema,
  // Types
  type DepositFormData,
  type WithdrawFormData,
  type CreatePoolFormData,
  type JoinPoolFormData,
  type BuyTicketsFormData,
  type CreateRoscaFormData,
  // Helpers
  validateAmountAgainstBalance,
  validateAmountRange,
} from "./schemas";

// ============================================================================
// NUMBER HELPERS
// ============================================================================

export {
  safeParseNumber,
  parseNumberOr,
  safeParseEther,
  safeFormatEther,
  isValidPositiveNumber,
  isValidNonNegativeNumber,
  isInRange,
  validateAmount,
  compareBigInt,
  meetsMinimum,
  isWithinBigIntRange,
  calculatePercentage,
  basisPointsToPercent,
  percentToBasisPoints,
  roundTo,
  floorTo,
  ceilTo,
} from "./number-helpers";
