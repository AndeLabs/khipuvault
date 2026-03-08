/**
 * @fileoverview Transaction Validation Schemas
 * @module lib/validation/schemas/transaction-schemas
 *
 * Schemas para validación de datos relacionados con transacciones.
 */

import * as z from "zod";

import { addressSchema, hashSchema, amountSchema, optionalAddressSchema } from "./common";

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

/**
 * Tipos de transacciones soportados
 */
export const transactionTypeSchema = z.enum([
  "DEPOSIT",
  "WITHDRAW",
  "CLAIM_YIELD",
  "JOIN_POOL",
  "CREATE_POOL",
  "BUY_TICKETS",
  "CLAIM_PRIZE",
  "CONTRIBUTE",
  "APPROVE",
  "STAKE",
  "UNSTAKE",
]);

export type TransactionType = z.infer<typeof transactionTypeSchema>;

/**
 * Estados de transacción
 */
export const transactionStatusSchema = z.enum(["PENDING", "CONFIRMED", "FAILED", "CANCELLED"]);

export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

// ============================================================================
// TRANSACTION SCHEMAS
// ============================================================================

/**
 * Schema para registrar una transacción
 */
export const recordTransactionSchema = z.object({
  hash: hashSchema,
  type: transactionTypeSchema,
  amount: amountSchema.optional(),
  from: addressSchema,
  to: optionalAddressSchema,
  status: transactionStatusSchema.default("PENDING"),
  metadata: z.record(z.unknown()).optional(),
});

export type RecordTransactionFormData = z.infer<typeof recordTransactionSchema>;

/**
 * Schema para filtros de transacciones
 */
export const transactionFiltersSchema = z.object({
  address: addressSchema.optional(),
  type: transactionTypeSchema.optional(),
  status: transactionStatusSchema.optional(),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
  minAmount: amountSchema.optional(),
  maxAmount: amountSchema.optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

/**
 * Schema para paginación de transacciones
 */
export const transactionPaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(["timestamp", "amount", "type", "status"]).default("timestamp"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type TransactionPagination = z.infer<typeof transactionPaginationSchema>;

// ============================================================================
// APPROVAL SCHEMAS
// ============================================================================

/**
 * Schema para aprobar tokens
 */
export const approveTokenSchema = z.object({
  tokenAddress: addressSchema,
  spenderAddress: addressSchema,
  amount: amountSchema,
});

export type ApproveTokenFormData = z.infer<typeof approveTokenSchema>;

/**
 * Schema para aprobar monto máximo
 */
export const approveMaxSchema = z.object({
  tokenAddress: addressSchema,
  spenderAddress: addressSchema,
  maxApproval: z.boolean().default(true),
});

export type ApproveMaxFormData = z.infer<typeof approveMaxSchema>;

// ============================================================================
// LOTTERY TRANSACTION SCHEMAS
// ============================================================================

/**
 * Schema para comprar tickets de lotería
 */
export const buyTicketsSchema = z.object({
  ticketCount: z
    .number()
    .int("Debe ser un número entero")
    .min(1, "Debe comprar al menos 1 ticket")
    .max(100, "No puede comprar más de 100 tickets a la vez"),
  roundId: z.number().int().nonnegative("ID de ronda inválido"),
});

export type BuyTicketsFormData = z.infer<typeof buyTicketsSchema>;

/**
 * Schema para reclamar premio de lotería
 */
export const claimPrizeSchema = z.object({
  roundId: z.number().int().nonnegative("ID de ronda inválido"),
  ticketIds: z.array(z.number().int().nonnegative()).min(1, "Debe seleccionar al menos 1 ticket"),
});

export type ClaimPrizeFormData = z.infer<typeof claimPrizeSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Valida que una transacción esté en estado final
 */
export const isFinalTransactionStatus = (status: TransactionStatus): boolean => {
  return status === "CONFIRMED" || status === "FAILED" || status === "CANCELLED";
};

/**
 * Valida que una transacción esté pendiente
 */
export const isPendingTransaction = (status: TransactionStatus): boolean => {
  return status === "PENDING";
};

/**
 * Crea schema de compra de tickets con validación de límite
 */
export const createBuyTicketsSchema = (maxTicketsPerUser: number, currentTickets: number) => {
  const remainingTickets = maxTicketsPerUser - currentTickets;

  return z.object({
    ticketCount: z
      .number()
      .int("Debe ser un número entero")
      .min(1, "Debe comprar al menos 1 ticket")
      .max(
        remainingTickets,
        `Solo puedes comprar ${remainingTickets} tickets más (límite: ${maxTicketsPerUser})`
      ),
    roundId: z.number().int().nonnegative("ID de ronda inválido"),
  });
};
