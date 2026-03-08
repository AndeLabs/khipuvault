/**
 * @fileoverview Language Selector Component
 * @module components/ui/language-selector
 *
 * Dropdown component to switch between supported locales.
 * Persists selection to localStorage.
 */

"use client";

import * as React from "react";
import { Check, Languages } from "lucide-react";

import { useTranslation } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/config";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { cn } from "@/lib/utils";

// Language display names
const LANGUAGE_NAMES: Record<Locale, string> = {
  es: "Español",
  en: "English",
};

// Language flags (emoji or ISO codes)
const LANGUAGE_FLAGS: Record<Locale, string> = {
  es: "🇪🇸",
  en: "🇺🇸",
};

interface LanguageSelectorProps {
  /**
   * Show language name in button
   * @default false
   */
  showLabel?: boolean;
  /**
   * Show flag icon
   * @default true
   */
  showFlag?: boolean;
  /**
   * Variant of the button
   * @default "ghost"
   */
  variant?: "default" | "ghost" | "outline";
  /**
   * Size of the button
   * @default "default"
   */
  size?: "default" | "sm" | "lg" | "icon";
  /**
   * Custom className
   */
  className?: string;
  /**
   * Callback when language changes
   */
  onLanguageChange?: (locale: Locale) => void;
}

/**
 * LanguageSelector - Dropdown to switch app language
 * Automatically persists to localStorage via i18n context
 *
 * @example
 * ```tsx
 * // Icon only (default)
 * <LanguageSelector />
 *
 * // With label
 * <LanguageSelector showLabel />
 *
 * // Custom variant
 * <LanguageSelector variant="outline" size="sm" />
 *
 * // With callback
 * <LanguageSelector onLanguageChange={(locale) => console.log(locale)} />
 * ```
 */
export function LanguageSelector({
  showLabel = false,
  showFlag = true,
  variant = "ghost",
  size = "default",
  className,
  onLanguageChange,
}: LanguageSelectorProps) {
  const { locale, setLocale } = useTranslation();

  const handleLanguageChange = React.useCallback(
    (newLocale: Locale) => {
      setLocale(newLocale);
      onLanguageChange?.(newLocale);
    },
    [setLocale, onLanguageChange]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
          aria-label="Select language"
        >
          <Languages className="h-4 w-4" />
          {showFlag && <span className="text-base">{LANGUAGE_FLAGS[locale]}</span>}
          {showLabel && <span className="hidden sm:inline">{LANGUAGE_NAMES[locale]}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className="cursor-pointer gap-2"
          >
            <span className="text-base">{LANGUAGE_FLAGS[lang]}</span>
            <span className="flex-1">{LANGUAGE_NAMES[lang]}</span>
            {locale === lang && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Compact Language Toggle - Simple button to toggle between languages
 * Best for apps with only 2 supported languages
 *
 * @example
 * ```tsx
 * <LanguageToggle />
 * ```
 */
export function LanguageToggle({
  className,
  onLanguageChange,
}: Pick<LanguageSelectorProps, "className" | "onLanguageChange">) {
  const { locale, setLocale } = useTranslation();

  const toggleLanguage = React.useCallback(() => {
    const newLocale = locale === "es" ? "en" : "es";
    setLocale(newLocale);
    onLanguageChange?.(newLocale);
  }, [locale, setLocale, onLanguageChange]);

  const nextLanguage = locale === "es" ? "en" : "es";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={cn("gap-2", className)}
      aria-label={`Switch to ${LANGUAGE_NAMES[nextLanguage]}`}
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs font-medium uppercase">{nextLanguage}</span>
    </Button>
  );
}

/**
 * Language Switcher with Radio Buttons - For settings pages
 *
 * @example
 * ```tsx
 * <LanguageSwitcher />
 * ```
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <label className="text-sm font-medium text-foreground">Language / Idioma</label>
      <div className="flex gap-3">
        {SUPPORTED_LOCALES.map((lang) => (
          <button
            key={lang}
            onClick={() => setLocale(lang)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2 transition-all",
              locale === lang
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50"
            )}
          >
            <span className="text-base">{LANGUAGE_FLAGS[lang]}</span>
            <span className="text-sm font-medium">{LANGUAGE_NAMES[lang]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
