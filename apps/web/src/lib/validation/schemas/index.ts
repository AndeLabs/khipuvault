/**
 * @fileoverview Validation Schemas Index
 * @module lib/validation/schemas
 *
 * Re-exporta todos los schemas de validación centralizados.
 */

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export {
  // Address schemas
  addressSchema,
  optionalAddressSchema,
  // Amount schemas
  amountSchema,
  optionalAmountSchema,
  createAmountRangeSchema,
  // Hash schemas
  hashSchema,
  optionalHashSchema,
  // ID schemas
  poolIdSchema,
  roundIdSchema,
  // Percentage schemas
  percentageSchema,
  basisPointsSchema,
  // String schemas
  poolNameSchema,
  descriptionSchema,
  // Count schemas
  countSchema,
  createMemberCountSchema,
  // Time schemas
  timeUnitSchema,
  durationSchema,
  timestampSchema,
  // Boolean schemas
  optionalBooleanSchema,
} from "./common";

// ============================================================================
// POOL SCHEMAS
// ============================================================================

export {
  // Individual pool schemas
  depositSchema,
  withdrawSchema,
  type DepositFormData,
  type WithdrawFormData,
  // Cooperative pool schemas
  createCooperativePoolSchema,
  joinCooperativePoolSchema,
  type CreateCooperativePoolFormData,
  type JoinCooperativePoolFormData,
  // Rotating pool schemas
  createRotatingPoolSchema,
  joinRotatingPoolSchema,
  contributeToRotatingPoolSchema,
  type CreateRotatingPoolFormData,
  type JoinRotatingPoolFormData,
  type ContributeToRotatingPoolFormData,
  // Pool validation helpers
  createDepositSchemaWithBalance,
  createWithdrawSchemaWithBalance,
  createContributionSchema,
} from "./pool-schemas";

// ============================================================================
// TRANSACTION SCHEMAS
// ============================================================================

export {
  // Transaction types
  transactionTypeSchema,
  transactionStatusSchema,
  type TransactionType,
  type TransactionStatus,
  // Transaction schemas
  recordTransactionSchema,
  transactionFiltersSchema,
  transactionPaginationSchema,
  type RecordTransactionFormData,
  type TransactionFilters,
  type TransactionPagination,
  // Approval schemas
  approveTokenSchema,
  approveMaxSchema,
  type ApproveTokenFormData,
  type ApproveMaxFormData,
  // Lottery transaction schemas
  buyTicketsSchema,
  claimPrizeSchema,
  type BuyTicketsFormData,
  type ClaimPrizeFormData,
  // Transaction validation helpers
  isFinalTransactionStatus,
  isPendingTransaction,
  createBuyTicketsSchema,
} from "./transaction-schemas";

// ============================================================================
// USER SCHEMAS
// ============================================================================

export {
  // User profile schemas
  userProfileSchema,
  updateUserProfileSchema,
  type UserProfileFormData,
  type UpdateUserProfileFormData,
  // User preferences schemas
  notificationPreferencesSchema,
  uiPreferencesSchema,
  userSettingsSchema,
  type NotificationPreferencesFormData,
  type UIPreferencesFormData,
  type UserSettingsFormData,
  // Referral schemas
  referralCodeSchema,
  applyReferralSchema,
  createCustomReferralSchema,
  type ApplyReferralFormData,
  type CreateCustomReferralFormData,
  // Watchlist schemas
  addToWatchlistSchema,
  removeFromWatchlistSchema,
  type AddToWatchlistFormData,
  type RemoveFromWatchlistFormData,
  // User validation helpers
  isValidUsername,
  normalizeTwitterHandle,
  normalizeTelegramHandle,
  emailSchema,
} from "./user-schemas";
