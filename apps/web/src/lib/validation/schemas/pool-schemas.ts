/**
 * @fileoverview Pool Form Validation Schemas
 * @module lib/validation/schemas/pool-schemas
 *
 * Schemas para formularios relacionados con pools (individual, cooperative, rotating).
 */

import * as z from "zod";

import {
  amountSchema,
  poolNameSchema,
  createMemberCountSchema,
  durationSchema,
  timeUnitSchema,
  optionalBooleanSchema,
  createAmountRangeSchema,
} from "./common";

// ============================================================================
// INDIVIDUAL POOL SCHEMAS
// ============================================================================

/**
 * Schema para depósito individual
 */
export const depositSchema = z.object({
  amount: amountSchema,
});

export type DepositFormData = z.infer<typeof depositSchema>;

/**
 * Schema para retiro individual
 */
export const withdrawSchema = z.object({
  amount: amountSchema,
});

export type WithdrawFormData = z.infer<typeof withdrawSchema>;

// ============================================================================
// COOPERATIVE POOL SCHEMAS
// ============================================================================

/**
 * Schema para crear pool cooperativo
 */
export const createCooperativePoolSchema = z
  .object({
    name: poolNameSchema,
    minContribution: amountSchema,
    maxContribution: amountSchema,
    maxMembers: createMemberCountSchema(2, 100),
  })
  .refine((data) => Number(data.minContribution) <= Number(data.maxContribution), {
    message: "La contribución mínima debe ser menor o igual a la máxima",
    path: ["minContribution"],
  });

export type CreateCooperativePoolFormData = z.infer<typeof createCooperativePoolSchema>;

/**
 * Schema para unirse a pool cooperativo
 */
export const joinCooperativePoolSchema = z.object({
  amount: amountSchema,
  poolId: z.number().int().positive("ID de pool inválido"),
});

export type JoinCooperativePoolFormData = z.infer<typeof joinCooperativePoolSchema>;

// ============================================================================
// ROTATING POOL (ROSCA) SCHEMAS
// ============================================================================

/**
 * Schema para crear pool rotativo (ROSCA)
 */
export const createRotatingPoolSchema = z.object({
  name: poolNameSchema,
  memberCount: createMemberCountSchema(3, 50),
  contributionAmount: amountSchema,
  periodDuration: durationSchema,
  periodUnit: timeUnitSchema,
  useNativeBtc: optionalBooleanSchema(false),
});

export type CreateRotatingPoolFormData = z.infer<typeof createRotatingPoolSchema>;

/**
 * Schema para unirse a pool rotativo
 */
export const joinRotatingPoolSchema = z.object({
  poolId: z.number().int().nonnegative("ID de pool inválido"),
  contributionAmount: amountSchema,
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos para continuar",
  }),
});

export type JoinRotatingPoolFormData = z.infer<typeof joinRotatingPoolSchema>;

/**
 * Schema para contribución a pool rotativo
 */
export const contributeToRotatingPoolSchema = z.object({
  poolId: z.number().int().nonnegative("ID de pool inválido"),
  amount: amountSchema,
});

export type ContributeToRotatingPoolFormData = z.infer<typeof contributeToRotatingPoolSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Crea schema de depósito con validación de balance
 */
export const createDepositSchemaWithBalance = (balance: string) =>
  z.object({
    amount: amountSchema.refine((val) => Number(val) <= Number(balance), {
      message: `El monto no puede exceder tu balance de ${balance} mUSD`,
    }),
  });

/**
 * Crea schema de retiro con validación de balance disponible
 */
export const createWithdrawSchemaWithBalance = (availableBalance: string) =>
  z.object({
    amount: amountSchema.refine((val) => Number(val) <= Number(availableBalance), {
      message: `El monto no puede exceder tu balance disponible de ${availableBalance} mUSD`,
    }),
  });

/**
 * Crea schema de contribución con rango de montos
 */
export const createContributionSchema = (
  minContribution: string,
  maxContribution: string,
  token = "mUSD"
) =>
  z.object({
    amount: createAmountRangeSchema(Number(minContribution), Number(maxContribution), token),
  });
