/**
 * @fileoverview User Data Validation Schemas
 * @module lib/validation/schemas/user-schemas
 *
 * Schemas para validación de datos de usuario, perfil y configuración.
 */

import * as z from "zod";

import { addressSchema, optionalAddressSchema, descriptionSchema } from "./common";

// ============================================================================
// USER PROFILE SCHEMAS
// ============================================================================

/**
 * Schema para perfil de usuario
 */
export const userProfileSchema = z.object({
  address: addressSchema,
  displayName: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "El nombre debe tener menos de 50 caracteres")
    .optional(),
  bio: descriptionSchema,
  avatar: z.string().url("URL de avatar inválida").optional(),
  twitter: z
    .string()
    .trim()
    .regex(/^@?[a-zA-Z0-9_]{1,15}$/, "Usuario de Twitter inválido")
    .optional(),
  discord: z
    .string()
    .trim()
    .regex(/^.{2,32}#\d{4}$/, "Usuario de Discord inválido (formato: usuario#1234)")
    .optional(),
  telegram: z
    .string()
    .trim()
    .regex(/^@?[a-zA-Z0-9_]{5,32}$/, "Usuario de Telegram inválido")
    .optional(),
});

export type UserProfileFormData = z.infer<typeof userProfileSchema>;

/**
 * Schema para actualizar perfil (todos los campos opcionales excepto address)
 */
export const updateUserProfileSchema = z.object({
  address: addressSchema,
  displayName: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "El nombre debe tener menos de 50 caracteres")
    .optional(),
  bio: descriptionSchema,
  avatar: z.string().url("URL de avatar inválida").optional(),
  twitter: z
    .string()
    .trim()
    .regex(/^@?[a-zA-Z0-9_]{1,15}$/, "Usuario de Twitter inválido")
    .optional(),
  discord: z
    .string()
    .trim()
    .regex(/^.{2,32}#\d{4}$/, "Usuario de Discord inválido")
    .optional(),
  telegram: z
    .string()
    .trim()
    .regex(/^@?[a-zA-Z0-9_]{5,32}$/, "Usuario de Telegram inválido")
    .optional(),
});

export type UpdateUserProfileFormData = z.infer<typeof updateUserProfileSchema>;

// ============================================================================
// USER PREFERENCES SCHEMAS
// ============================================================================

/**
 * Schema para preferencias de notificaciones
 */
export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  transactionAlerts: z.boolean().default(true),
  lotteryDrawAlerts: z.boolean().default(true),
  poolUpdates: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

export type NotificationPreferencesFormData = z.infer<typeof notificationPreferencesSchema>;

/**
 * Schema para preferencias de UI
 */
export const uiPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.enum(["en", "es"]).default("en"),
  currency: z.enum(["USD", "BTC", "ETH"]).default("USD"),
  compactMode: z.boolean().default(false),
  showTestnets: z.boolean().default(false),
});

export type UIPreferencesFormData = z.infer<typeof uiPreferencesSchema>;

/**
 * Schema para configuración de usuario completa
 */
export const userSettingsSchema = z.object({
  profile: updateUserProfileSchema.optional(),
  notifications: notificationPreferencesSchema.optional(),
  ui: uiPreferencesSchema.optional(),
});

export type UserSettingsFormData = z.infer<typeof userSettingsSchema>;

// ============================================================================
// REFERRAL SCHEMAS
// ============================================================================

/**
 * Schema para código de referido
 */
export const referralCodeSchema = z
  .string()
  .trim()
  .min(6, "El código debe tener al menos 6 caracteres")
  .max(20, "El código debe tener menos de 20 caracteres")
  .regex(/^[A-Z0-9-]+$/, "El código solo puede contener letras mayúsculas, números y guiones");

/**
 * Schema para aplicar código de referido
 */
export const applyReferralSchema = z.object({
  userAddress: addressSchema,
  referralCode: referralCodeSchema,
});

export type ApplyReferralFormData = z.infer<typeof applyReferralSchema>;

/**
 * Schema para generar código de referido personalizado
 */
export const createCustomReferralSchema = z.object({
  userAddress: addressSchema,
  customCode: referralCodeSchema,
});

export type CreateCustomReferralFormData = z.infer<typeof createCustomReferralSchema>;

// ============================================================================
// WATCHLIST SCHEMAS
// ============================================================================

/**
 * Schema para agregar a watchlist
 */
export const addToWatchlistSchema = z.object({
  userAddress: addressSchema,
  itemType: z.enum(["POOL", "LOTTERY", "USER"]),
  itemId: z.union([z.number().int().nonnegative(), addressSchema]),
  notes: descriptionSchema,
});

export type AddToWatchlistFormData = z.infer<typeof addToWatchlistSchema>;

/**
 * Schema para remover de watchlist
 */
export const removeFromWatchlistSchema = z.object({
  userAddress: addressSchema,
  itemType: z.enum(["POOL", "LOTTERY", "USER"]),
  itemId: z.union([z.number().int().nonnegative(), addressSchema]),
});

export type RemoveFromWatchlistFormData = z.infer<typeof removeFromWatchlistSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Valida formato de username (sin caracteres especiales)
 */
export const isValidUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9_-]{3,50}$/.test(username);
};

/**
 * Normaliza handle de Twitter (elimina @)
 */
export const normalizeTwitterHandle = (handle: string): string => {
  return handle.startsWith("@") ? handle.slice(1) : handle;
};

/**
 * Normaliza handle de Telegram (elimina @)
 */
export const normalizeTelegramHandle = (handle: string): string => {
  return handle.startsWith("@") ? handle.slice(1) : handle;
};

/**
 * Valida que un email sea válido (opcional, para futuros features)
 */
export const emailSchema = z.string().email("Email inválido").optional();
