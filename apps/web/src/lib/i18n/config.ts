/**
 * @fileoverview i18n Configuration
 * @module lib/i18n/config
 *
 * Provides internationalization configuration and utilities.
 * Simple solution without external libraries, using React Context.
 */

export const SUPPORTED_LOCALES = ["es", "en"] as const;
export const DEFAULT_LOCALE = "es" as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Detects browser language and returns supported locale
 * Falls back to DEFAULT_LOCALE if browser language is not supported
 */
export function getLocale(): Locale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  const browserLang = navigator.language.split("-")[0];
  return SUPPORTED_LOCALES.includes(browserLang as Locale)
    ? (browserLang as Locale)
    : DEFAULT_LOCALE;
}

/**
 * Formats number according to locale
 */
export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Formats currency according to locale
 */
export function formatCurrency(
  value: number,
  locale: Locale,
  currency: string = "USD",
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    ...options,
  }).format(value);
}

/**
 * Formats date according to locale
 */
export function formatDate(
  date: Date | string | number,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
) {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(dateObj);
}

/**
 * Formats relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: Locale,
  options?: Intl.RelativeTimeFormatOptions
) {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
    ...options,
  });

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return rtf.format(diffMinutes, "minute");
    }
    return rtf.format(diffHours, "hour");
  }

  if (Math.abs(diffDays) < 7) {
    return rtf.format(diffDays, "day");
  }

  if (Math.abs(diffDays) < 30) {
    const diffWeeks = Math.floor(diffDays / 7);
    return rtf.format(diffWeeks, "week");
  }

  const diffMonths = Math.floor(diffDays / 30);
  return rtf.format(diffMonths, "month");
}

/**
 * Formats percentage
 */
export function formatPercentage(value: number, locale: Locale, decimals: number = 2) {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}
