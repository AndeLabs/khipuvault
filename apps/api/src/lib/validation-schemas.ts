/**
 * @fileoverview Shared Validation Schemas for API Routes
 * @module api/lib/validation-schemas
 *
 * Centralized Zod schemas for validating request parameters.
 * Reduces duplication across route handlers.
 */

import { z } from "zod";

// ============================================================================
// ETHEREUM ADDRESS VALIDATION
// ============================================================================

/**
 * Ethereum address regex pattern
 */
export const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * Ethereum address schema
 */
export const ethereumAddressSchema = z
  .string()
  .regex(ETH_ADDRESS_REGEX, "Invalid Ethereum address format");

/**
 * Transaction hash schema
 */
export const txHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash format");

// ============================================================================
// COMMON PARAM SCHEMAS
// ============================================================================

/**
 * Address in URL params
 * @example GET /api/users/:address
 */
export const addressParamSchema = z.object({
  params: z.object({
    address: ethereumAddressSchema,
  }),
});

/**
 * Pool ID in URL params (UUID format)
 * @example GET /api/pools/:poolId
 */
export const poolIdParamSchema = z.object({
  params: z.object({
    poolId: z.string().uuid("Invalid pool ID format"),
  }),
});

/**
 * Numeric pool ID in URL params (on-chain ID)
 * @example GET /api/pools/chain/:poolId
 */
export const chainPoolIdParamSchema = z.object({
  params: z.object({
    poolId: z.coerce.number().int().positive("Pool ID must be positive"),
  }),
});

/**
 * Transaction hash in URL params
 * @example GET /api/transactions/:txHash
 */
export const txHashParamSchema = z.object({
  params: z.object({
    txHash: txHashSchema,
  }),
});

// ============================================================================
// PAGINATION SCHEMAS
// ============================================================================

/**
 * Default pagination limits
 */
export const PAGINATION_DEFAULTS = {
  limit: 50,
  maxLimit: 1000,
  offset: 0,
  maxOffset: 100000,
} as const;

/**
 * Standard pagination query params
 * @example GET /api/users?limit=20&offset=0
 */
export const paginationQuerySchema = z.object({
  query: z.object({
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be at least 1")
      .max(PAGINATION_DEFAULTS.maxLimit, `Limit cannot exceed ${PAGINATION_DEFAULTS.maxLimit}`)
      .optional()
      .default(PAGINATION_DEFAULTS.limit),
    offset: z.coerce
      .number()
      .int()
      .min(0, "Offset must be non-negative")
      .max(PAGINATION_DEFAULTS.maxOffset, `Offset cannot exceed ${PAGINATION_DEFAULTS.maxOffset}`)
      .optional()
      .default(PAGINATION_DEFAULTS.offset),
  }),
});

/**
 * Extended pagination with sorting
 */
export const sortedPaginationQuerySchema = z.object({
  query: z.object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(PAGINATION_DEFAULTS.maxLimit)
      .optional()
      .default(PAGINATION_DEFAULTS.limit),
    offset: z.coerce
      .number()
      .int()
      .min(0)
      .max(PAGINATION_DEFAULTS.maxOffset)
      .optional()
      .default(PAGINATION_DEFAULTS.offset),
    sortBy: z.string().max(50, "Sort field name too long").optional(),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

/**
 * Timeline query params for analytics
 * @example GET /api/analytics/timeline?days=30
 */
export const timelineQuerySchema = z.object({
  query: z.object({
    days: z.coerce.number().min(1).max(365).optional().default(30),
  }),
});

/**
 * Top items query params for leaderboards
 * @example GET /api/analytics/top-pools?limit=10
 */
export const topItemsQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().min(1).max(100).optional().default(10),
  }),
});

// ============================================================================
// COMBINED SCHEMAS
// ============================================================================

/**
 * Address param with pagination
 * @example GET /api/users/:address/transactions?limit=20
 */
export const addressWithPaginationSchema = z.object({
  params: z.object({
    address: ethereumAddressSchema,
  }),
  query: z.object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(PAGINATION_DEFAULTS.maxLimit)
      .optional()
      .default(PAGINATION_DEFAULTS.limit),
    offset: z.coerce
      .number()
      .int()
      .min(0)
      .max(PAGINATION_DEFAULTS.maxOffset)
      .optional()
      .default(PAGINATION_DEFAULTS.offset),
  }),
});

/**
 * Pool address param
 * @example GET /api/pools/address/:address
 */
export const poolAddressParamSchema = z.object({
  params: z.object({
    address: ethereumAddressSchema,
  }),
});

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

/**
 * Date range filter
 */
export const dateRangeQuerySchema = z.object({
  query: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});

/**
 * Pool type filter
 */
export const poolTypeQuerySchema = z.object({
  query: z.object({
    poolType: z.enum(["INDIVIDUAL", "COOPERATIVE", "LOTTERY", "ROTATING"]).optional(),
  }),
});

/**
 * Transaction type filter
 */
export const transactionTypeQuerySchema = z.object({
  query: z.object({
    type: z.enum(["DEPOSIT", "WITHDRAW", "YIELD_CLAIM", "COMPOUND"]).optional(),
  }),
});

// ============================================================================
// POOL-SPECIFIC SCHEMAS
// ============================================================================

/**
 * Pool ID that can be either UUID or Ethereum address
 * @example GET /api/pools/:poolId (UUID or 0x address)
 */
export const flexiblePoolIdParamSchema = z.object({
  params: z.object({
    poolId: z
      .string()
      .min(1)
      .max(66)
      .refine((val) => /^[0-9a-f-]{36}$/i.test(val) || /^0x[a-fA-F0-9]{40}$/.test(val), {
        message: "poolId must be a valid UUID or Ethereum address",
      }),
  }),
});

/**
 * Pool analytics query params
 */
export const poolAnalyticsSchema = z.object({
  params: z.object({
    poolId: z
      .string()
      .min(1)
      .max(66)
      .refine((val) => /^[0-9a-f-]{36}$/i.test(val) || /^0x[a-fA-F0-9]{40}$/.test(val), {
        message: "poolId must be a valid UUID or Ethereum address",
      }),
  }),
  query: z.object({
    days: z.coerce.number().min(1).max(365).optional().default(30),
  }),
});

// ============================================================================
// COMMON STRING FIELD LIMITS
// ============================================================================

/**
 * Common field length limits (prevents DoS via large payloads)
 */
export const STRING_LIMITS = {
  // Short fields
  name: 100,
  title: 200,
  ensName: 100,

  // Medium fields
  description: 500,
  avatar: 500,
  url: 2000,

  // Long fields
  message: 1000,
  content: 5000,

  // Technical fields
  txHash: 66, // 0x + 64 hex chars
  address: 42, // 0x + 40 hex chars
  uuid: 36,
  sortField: 50,
} as const;

// ============================================================================
// REUSABLE STRING SCHEMAS
// ============================================================================

/**
 * Name field (pool name, user display name, etc.)
 */
export const nameSchema = z.string().min(1).max(STRING_LIMITS.name);

/**
 * Title field (notification titles, etc.)
 */
export const titleSchema = z.string().min(1).max(STRING_LIMITS.title);

/**
 * Description field
 */
export const descriptionSchema = z.string().max(STRING_LIMITS.description);

/**
 * URL field (avatar URLs, external links, etc.)
 */
export const urlSchema = z.string().url().max(STRING_LIMITS.url);

/**
 * ENS name field
 */
export const ensNameSchema = z.string().max(STRING_LIMITS.ensName);

/**
 * Message/content field
 */
export const messageSchema = z.string().min(1).max(STRING_LIMITS.message);

// ============================================================================
// BODY SCHEMAS
// ============================================================================

/**
 * Create notification request body
 */
export const createNotificationBodySchema = z.object({
  body: z.object({
    title: titleSchema,
    message: messageSchema,
    type: z.enum(["INFO", "WARNING", "SUCCESS", "ERROR"]).optional().default("INFO"),
  }),
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize and validate Ethereum address
 */
export function normalizeAddress(address: string): string {
  const parsed = ethereumAddressSchema.safeParse(address);
  if (!parsed.success) {
    throw new Error("Invalid Ethereum address");
  }
  return address.toLowerCase();
}

/**
 * Check if string is valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return ETH_ADDRESS_REGEX.test(address);
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AddressParam = z.infer<typeof addressParamSchema>;
export type PoolIdParam = z.infer<typeof poolIdParamSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type AddressWithPagination = z.infer<typeof addressWithPaginationSchema>;

/**
 * Validated query types - use these in route handlers for type safety
 */
export type ValidatedPaginationQuery = z.infer<typeof paginationQuerySchema>["query"];
export type ValidatedTimelineQuery = z.infer<typeof timelineQuerySchema>["query"];
export type ValidatedTopItemsQuery = z.infer<typeof topItemsQuerySchema>["query"];
export type ValidatedSortedPaginationQuery = z.infer<typeof sortedPaginationQuerySchema>["query"];

/**
 * Validated params types
 */
export type ValidatedAddressParams = z.infer<typeof addressParamSchema>["params"];
export type ValidatedPoolIdParams = z.infer<typeof poolIdParamSchema>["params"];
export type ValidatedTxHashParams = z.infer<typeof txHashParamSchema>["params"];
