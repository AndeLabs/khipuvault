/**
 * @fileoverview i18n React Hooks
 * @module lib/i18n/hooks
 *
 * Provides React hooks for accessing translations.
 * Uses React Context for simple state management.
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  createElement,
  type ReactNode,
} from "react";

import { DEFAULT_LOCALE, getLocale as detectLocale } from "./config";
import { en } from "./messages/en";
import { es } from "./messages/es";

import type { Locale } from "./config";
import type { TranslationKeys } from "./messages/es";

const translations: Record<Locale, TranslationKeys> = {
  es,
  en,
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationFunction;
}

type TranslationFunction = (key: string) => string;

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

/**
 * i18n Provider Component
 * Wraps app with translation context
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  // Detect browser language on mount (client-side only)
  useEffect(() => {
    const detectedLocale = detectLocale();
    setLocaleState(detectedLocale);
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    // Persist to localStorage for future visits
    if (typeof window !== "undefined") {
      localStorage.setItem("khipuvault-locale", newLocale);
    }
  };

  // Translation function
  const t: TranslationFunction = (key: string) => {
    const keys = key.split(".");
    let value: any = translations[locale];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    return typeof value === "string" ? value : key;
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return children;
  }

  return createElement(I18nContext.Provider, { value: { locale, setLocale, t } }, children);
}

/**
 * useTranslation Hook
 * Returns current locale, setLocale function, and translation function
 *
 * @example
 * const { t, locale, setLocale } = useTranslation();
 * const greeting = t('common.connect'); // "Conectar" or "Connect"
 */
export function useTranslation() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useTranslation must be used within I18nProvider");
  }

  return context;
}

/**
 * useLocale Hook
 * Returns only the current locale (lighter hook)
 */
export function useLocale() {
  const { locale } = useTranslation();
  return locale;
}

/**
 * Helper hook to get translation function with type safety
 * Provides better autocomplete support
 *
 * @example
 * const { t } = useT();
 * const deposit = t('pool.deposit'); // Type-safe
 */
export function useT() {
  const { t, locale } = useTranslation();

  // Return typed translation function
  const typedT = (key: string): string => {
    return t(key);
  };

  return { t: typedT, locale };
}
