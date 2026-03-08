/**
 * @fileoverview Pagination Utilities
 * @module api/lib/pagination
 *
 * Centralized pagination utilities for consistent behavior across all services.
 * Eliminates duplicated pagination logic.
 */

import type { PrismaClient } from "@prisma/client";

// Import PAGINATION_DEFAULTS from validation-schemas (Single Source of Truth)
import { PAGINATION_DEFAULTS } from "./validation-schemas";

// Re-export for backwards compatibility
export { PAGINATION_DEFAULTS };

// ============================================================================
// TYPES
// ============================================================================

/**
 * Standard pagination response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Normalize pagination parameters with defaults and bounds
 */
export function normalizePaginationParams(
  params: PaginationParams,
  defaults: { limit: number; maxLimit: number } = {
    limit: PAGINATION_DEFAULTS.limit,
    maxLimit: PAGINATION_DEFAULTS.maxLimit,
  }
): { limit: number; offset: number } {
  const limit = Math.min(Math.max(1, params.limit ?? defaults.limit), defaults.maxLimit);
  const offset = Math.max(0, params.offset ?? 0);

  return { limit, offset };
}

/**
 * Build pagination metadata from query results
 */
export function buildPaginationMeta(
  total: number,
  limit: number,
  offset: number
): PaginatedResponse<never>["pagination"] {
  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

/**
 * Execute a paginated Prisma query with automatic count
 *
 * @example
 * ```typescript
 * const result = await paginatedQuery(
 *   prisma.deposit,
 *   { where: { userAddress: "0x..." } },
 *   { limit: 20, offset: 0 }
 * );
 * // Returns: { data: [...], pagination: { total, limit, offset, hasMore } }
 * ```
 */
export async function paginatedQuery<T, WhereInput>(
  model: {
    findMany: (args: {
      where?: WhereInput;
      orderBy?: unknown;
      take?: number;
      skip?: number;
      select?: unknown;
      include?: unknown;
    }) => Promise<T[]>;
    count: (args: { where?: WhereInput }) => Promise<number>;
  },
  queryOptions: {
    where?: WhereInput;
    orderBy?: unknown;
    select?: unknown;
    include?: unknown;
  },
  pagination: PaginationParams
): Promise<PaginatedResponse<T>> {
  const { limit, offset } = normalizePaginationParams(pagination);

  const [data, total] = await Promise.all([
    model.findMany({
      ...queryOptions,
      take: limit,
      skip: offset,
    }),
    model.count({ where: queryOptions.where }),
  ]);

  return {
    data,
    pagination: buildPaginationMeta(total, limit, offset),
  };
}

/**
 * Simple pagination wrapper for pre-fetched data
 * Useful when data is already loaded and just needs to be sliced
 */
export function paginateArray<T>(data: T[], pagination: PaginationParams): PaginatedResponse<T> {
  const { limit, offset } = normalizePaginationParams(pagination);
  const total = data.length;
  const paginatedData = data.slice(offset, offset + limit);

  return {
    data: paginatedData,
    pagination: buildPaginationMeta(total, limit, offset),
  };
}

/**
 * Type-safe wrapper for paginated Prisma queries with explicit model binding
 *
 * @example
 * ```typescript
 * const paginateDeposits = createPaginatedQuery(prisma.deposit);
 *
 * const result = await paginateDeposits(
 *   { where: { userAddress: "0x..." }, orderBy: { timestamp: "desc" } },
 *   { limit: 20 }
 * );
 * ```
 */
export function createPaginatedQuery<
  Model extends {
    findMany: (args: unknown) => Promise<unknown[]>;
    count: (args: { where?: unknown }) => Promise<number>;
  },
>(model: Model) {
  return async <T>(
    queryOptions: Parameters<Model["findMany"]>[0] & { where?: unknown },
    pagination: PaginationParams
  ): Promise<PaginatedResponse<T>> => {
    const { limit, offset } = normalizePaginationParams(pagination);

    const [data, total] = await Promise.all([
      model.findMany({
        ...(queryOptions as object),
        take: limit,
        skip: offset,
      }) as Promise<T[]>,
      model.count({ where: (queryOptions as { where?: unknown }).where }),
    ]);

    return {
      data,
      pagination: buildPaginationMeta(total, limit, offset),
    };
  };
}
