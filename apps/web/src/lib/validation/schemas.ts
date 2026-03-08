/**
 * @fileoverview Shared Zod Validation Schemas
 * @module lib/validation/schemas
 *
 * Centralized validation schemas for forms across the application.
 * Eliminates duplicate validation logic in components.
 *
 * @deprecated Este archivo se mantiene por retrocompatibilidad.
 * Usa los schemas desde ./schemas/ para nuevos componentes.
 */

import * as z from "zod";

// Re-exportar schemas desde la nueva estructura
export {
  amountSchema,
  optionalAmountSchema,
  addressSchema,
  optionalAddressSchema,
  poolNameSchema,
} from "./schemas/common";

export {
  depositSchema as depositFormSchema,
  withdrawSchema as withdrawFormSchema,
  type DepositFormData,
  type WithdrawFormData,
  createCooperativePoolSchema as createPoolFormSchema,
  joinCooperativePoolSchema as joinPoolFormSchema,
  type CreateCooperativePoolFormData as CreatePoolFormData,
  type JoinCooperativePoolFormData as JoinPoolFormData,
} from "./schemas/pool-schemas";

export { buyTicketsSchema as buyTicketsFormSchema } from "./schemas/transaction-schemas";

// ============================================================================
// LEGACY SCHEMAS (mantener por retrocompatibilidad)
// ============================================================================

/**
 * Buy tickets form schema
 * @deprecated Usa buyTicketsSchema desde schemas/transaction-schemas
 */
export const buyTicketsFormSchema_LEGACY = z.object({
  ticketCount: z.number().int("Must be a whole number").min(1, "Must buy at least 1 ticket"),
});

export type BuyTicketsFormData = z.infer<typeof buyTicketsFormSchema_LEGACY>;

/**
 * ROSCA creation form schema
 * @deprecated Usa createRotatingPoolSchema desde schemas/pool-schemas
 */
export const createRoscaFormSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9\s-_]+$/,
      "Name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
  contributionAmount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be greater than 0"),
  frequency: z.enum(["weekly", "biweekly", "monthly"], {
    errorMap: () => ({ message: "Select a valid frequency" }),
  }),
  maxParticipants: z
    .number()
    .int("Must be a whole number")
    .min(2, "Must have at least 2 participants")
    .max(50, "Cannot exceed 50 participants"),
});

export type CreateRoscaFormData = z.infer<typeof createRoscaFormSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate amount against balance
 *
 * @param amount - Amount to validate (string)
 * @param balance - Available balance (string or bigint representation)
 * @returns Object with isValid boolean and optional error message
 */
export function validateAmountAgainstBalance(
  amount: string,
  balance: string
): { isValid: boolean; error?: string } {
  const amountNum = Number(amount);
  const balanceNum = Number(balance);

  if (isNaN(amountNum) || amountNum <= 0) {
    return { isValid: false, error: "Amount must be greater than 0" };
  }

  if (amountNum > balanceNum) {
    return { isValid: false, error: "Insufficient balance" };
  }

  return { isValid: true };
}

/**
 * Validate amount within min/max range
 *
 * @param amount - Amount to validate
 * @param min - Minimum allowed
 * @param max - Maximum allowed
 * @returns Object with isValid boolean and optional error message
 */
export function validateAmountRange(
  amount: string,
  min: string,
  max: string
): { isValid: boolean; error?: string } {
  const amountNum = Number(amount);
  const minNum = Number(min);
  const maxNum = Number(max);

  if (isNaN(amountNum) || amountNum <= 0) {
    return { isValid: false, error: "Amount must be greater than 0" };
  }

  if (amountNum < minNum) {
    return { isValid: false, error: `Minimum amount is ${min}` };
  }

  if (amountNum > maxNum) {
    return { isValid: false, error: `Maximum amount is ${max}` };
  }

  return { isValid: true };
}
