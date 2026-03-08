/**
 * @fileoverview i18n Module Entry Point
 * @module lib/i18n
 *
 * Re-exports all i18n functionality
 */

// Configuration
export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  getLocale,
  formatNumber,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatPercentage,
  type Locale,
} from "./config";

// Messages
export { es } from "./messages/es";
export { en } from "./messages/en";
export type { TranslationKeys } from "./messages/es";

// Hooks & Provider
export { I18nProvider, useTranslation, useLocale, useT } from "./hooks";
