/**
 * @fileoverview Common Validation Schemas
 * @module lib/validation/schemas/common
 *
 * Schemas reutilizables para validaciones comunes en toda la aplicación.
 */

import { isAddress, getAddress } from "viem";
import * as z from "zod";

// ============================================================================
// ADDRESS SCHEMAS
// ============================================================================

/**
 * Validación de dirección Ethereum
 * - Acepta formato 0x seguido de 40 caracteres hexadecimales
 * - Normaliza a checksum address
 */
export const addressSchema = z
  .string()
  .trim()
  .refine((val) => isAddress(val), {
    message: "Dirección Ethereum inválida",
  })
  .transform((val) => getAddress(val) as `0x${string}`);

/**
 * Dirección Ethereum opcional
 */
export const optionalAddressSchema = z
  .string()
  .trim()
  .optional()
  .refine((val) => !val || isAddress(val), {
    message: "Dirección Ethereum inválida",
  })
  .transform((val) => (val ? (getAddress(val) as `0x${string}`) : undefined));

// ============================================================================
// AMOUNT SCHEMAS
// ============================================================================

/**
 * Validación de monto positivo
 * - Debe ser un número mayor a 0
 * - Soporta decimales
 */
export const amountSchema = z
  .string()
  .trim()
  .min(1, "El monto es requerido")
  .refine((val) => !isNaN(Number(val)), "Debe ser un número válido")
  .refine((val) => Number(val) > 0, "El monto debe ser mayor a 0");

/**
 * Monto opcional (puede ser 0 o positivo)
 */
export const optionalAmountSchema = z
  .string()
  .trim()
  .optional()
  .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Debe ser un número válido",
  });

/**
 * Monto con validación de rango personalizable
 * Uso: amountRangeSchema(min, max, "BTC")
 */
export const createAmountRangeSchema = (min: number, max: number, token = "mUSD") =>
  z
    .string()
    .trim()
    .min(1, "El monto es requerido")
    .refine((val) => !isNaN(Number(val)), "Debe ser un número válido")
    .refine((val) => Number(val) > 0, "El monto debe ser mayor a 0")
    .refine((val) => Number(val) >= min, `El monto mínimo es ${min} ${token}`)
    .refine((val) => Number(val) <= max, `El monto máximo es ${max} ${token}`);

// ============================================================================
// HASH SCHEMAS
// ============================================================================

/**
 * Validación de transaction hash
 * - Debe ser formato 0x seguido de 64 caracteres hexadecimales
 */
export const hashSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Transaction hash inválido");

/**
 * Transaction hash opcional
 */
export const optionalHashSchema = z
  .string()
  .trim()
  .optional()
  .refine((val) => !val || /^0x[a-fA-F0-9]{64}$/.test(val), {
    message: "Transaction hash inválido",
  });

// ============================================================================
// ID SCHEMAS
// ============================================================================

/**
 * Validación de Pool ID
 * - Debe ser un número entero positivo
 */
export const poolIdSchema = z
  .number()
  .int("El ID debe ser un número entero")
  .positive("El ID debe ser positivo")
  .or(
    z
      .string()
      .regex(/^\d+$/, "El ID debe ser numérico")
      .transform((val) => parseInt(val, 10))
  );

/**
 * Validación de Round ID para lotteries
 */
export const roundIdSchema = z
  .number()
  .int("El ID de ronda debe ser un número entero")
  .nonnegative("El ID de ronda debe ser mayor o igual a 0")
  .or(
    z
      .string()
      .regex(/^\d+$/, "El ID debe ser numérico")
      .transform((val) => parseInt(val, 10))
  );

// ============================================================================
// PERCENTAGE SCHEMAS
// ============================================================================

/**
 * Validación de porcentaje (0-100)
 */
export const percentageSchema = z
  .number()
  .min(0, "El porcentaje debe ser mayor o igual a 0")
  .max(100, "El porcentaje debe ser menor o igual a 100")
  .or(
    z
      .string()
      .refine((val) => !isNaN(Number(val)), "Debe ser un número válido")
      .refine((val) => Number(val) >= 0 && Number(val) <= 100, "Debe estar entre 0 y 100")
      .transform((val) => Number(val))
  );

/**
 * Validación de basis points (0-10000)
 * 100 basis points = 1%
 */
export const basisPointsSchema = z
  .number()
  .int("Debe ser un número entero")
  .min(0, "Debe ser mayor o igual a 0")
  .max(10000, "Debe ser menor o igual a 10000")
  .or(
    z
      .string()
      .regex(/^\d+$/, "Debe ser un número entero")
      .refine((val) => Number(val) >= 0 && Number(val) <= 10000, "Debe estar entre 0 y 10000")
      .transform((val) => parseInt(val, 10))
  );

// ============================================================================
// STRING SCHEMAS
// ============================================================================

/**
 * Nombre de pool con validaciones
 * - Mínimo 3 caracteres
 * - Máximo 50 caracteres
 * - Solo letras, números, espacios, guiones y guiones bajos
 */
export const poolNameSchema = z
  .string()
  .trim()
  .min(3, "El nombre debe tener al menos 3 caracteres")
  .max(50, "El nombre debe tener menos de 50 caracteres")
  .regex(
    /^[a-zA-Z0-9\s\-_]+$/,
    "El nombre solo puede contener letras, números, espacios, guiones y guiones bajos"
  );

/**
 * Descripción opcional con límite de caracteres
 */
export const descriptionSchema = z
  .string()
  .trim()
  .max(500, "La descripción debe tener menos de 500 caracteres")
  .optional();

// ============================================================================
// COUNT/QUANTITY SCHEMAS
// ============================================================================

/**
 * Validación de cantidad entera positiva
 */
export const countSchema = z
  .number()
  .int("Debe ser un número entero")
  .positive("Debe ser mayor a 0")
  .or(
    z
      .string()
      .regex(/^\d+$/, "Debe ser un número entero positivo")
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, "Debe ser mayor a 0")
  );

/**
 * Validación de miembros con rango personalizable
 */
export const createMemberCountSchema = (min = 2, max = 100) =>
  z
    .number()
    .int("Debe ser un número entero")
    .min(min, `Debe haber al menos ${min} miembros`)
    .max(max, `No puede exceder ${max} miembros`)
    .or(
      z
        .string()
        .regex(/^\d+$/, "Debe ser un número entero")
        .transform((val) => parseInt(val, 10))
        .refine((val) => val >= min, `Debe haber al menos ${min} miembros`)
        .refine((val) => val <= max, `No puede exceder ${max} miembros`)
    );

// ============================================================================
// TIME/DURATION SCHEMAS
// ============================================================================

/**
 * Unidades de tiempo para períodos
 */
export const timeUnitSchema = z.enum(["days", "weeks", "months"], {
  errorMap: () => ({ message: "Unidad de tiempo inválida" }),
});

/**
 * Duración en días/semanas/meses
 */
export const durationSchema = z
  .number()
  .int("Debe ser un número entero")
  .positive("Debe ser mayor a 0")
  .or(
    z
      .string()
      .regex(/^\d+$/, "Debe ser un número entero positivo")
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, "Debe ser mayor a 0")
  );

/**
 * Timestamp Unix (segundos desde epoch)
 */
export const timestampSchema = z
  .number()
  .int("Debe ser un timestamp válido")
  .nonnegative("El timestamp debe ser mayor o igual a 0");

// ============================================================================
// BOOLEAN SCHEMAS
// ============================================================================

/**
 * Validación de booleano con valor por defecto
 */
export const optionalBooleanSchema = (defaultValue = false) => z.boolean().default(defaultValue);
