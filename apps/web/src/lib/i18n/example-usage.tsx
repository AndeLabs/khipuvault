/**
 * @fileoverview i18n Usage Examples
 * @module lib/i18n/example-usage
 *
 * Example components demonstrating i18n usage.
 * This file is for documentation purposes only.
 */

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercentage,
  formatRelativeTime,
  useTranslation,
  type Locale,
} from "./index";

/**
 * Language Switcher Component
 * Allows users to switch between supported languages
 */
export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="es">Español</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </SelectContent>
    </Select>
  );
}

/**
 * Example: Basic Translation
 */
export function BasicTranslationExample() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("common.connect")}</CardTitle>
        <CardDescription>{t("wallet.connectWallet")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button>{t("common.confirm")}</Button>
      </CardContent>
    </Card>
  );
}

/**
 * Example: Number Formatting
 */
export function NumberFormattingExample() {
  const { t, locale } = useTranslation();
  const amount = 1234567.89;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("stats.totalValueLocked")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <span className="text-muted-foreground">Number: </span>
          <span className="font-bold">{formatNumber(amount, locale)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Currency: </span>
          <span className="font-bold">{formatCurrency(amount, locale, "USD")}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Percentage: </span>
          <span className="font-bold">{formatPercentage(12.5, locale)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example: Date Formatting
 */
export function DateFormattingExample() {
  const { t, locale } = useTranslation();
  const now = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("stats.history")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <span className="text-muted-foreground">Full date: </span>
          <span className="font-bold">{formatDate(now, locale)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Relative time: </span>
          <span className="font-bold">{formatRelativeTime(yesterday, locale)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Short date: </span>
          <span className="font-bold">
            {formatDate(now, locale, { month: "short", day: "numeric" })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example: Pool Actions with Translations
 */
export function PoolActionsExample() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleDeposit = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pool.deposit")}</CardTitle>
        <CardDescription>{t("pool.enterAmount")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("pool.estimatedApy")}</span>
            <span className="font-bold">12.5%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("pool.minDeposit")}</span>
            <span>10 mUSD</span>
          </div>
        </div>

        <Button onClick={handleDeposit} disabled={isLoading} className="w-full">
          {isLoading ? t("pool.depositing") : t("pool.deposit")}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {t("pool.noLockupPeriod")} • {t("pool.withdrawAnytime")}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Example: Error Messages
 */
export function ErrorMessagesExample() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const handleAction = (errorType: string) => {
    setError(errorType);
    setTimeout(() => setError(null), 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("common.error")}</CardTitle>
        <CardDescription>Click buttons to see translated error messages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleAction("errors.insufficientFunds")}>
            Insufficient Funds
          </Button>
          <Button variant="outline" onClick={() => handleAction("errors.transactionFailed")}>
            TX Failed
          </Button>
          <Button variant="outline" onClick={() => handleAction("errors.walletNotConnected")}>
            Not Connected
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {t(error)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Demo Page: Showcase all i18n features
 */
export function I18nDemoPage() {
  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">i18n Demo</h1>
          <p className="text-muted-foreground">
            Demonstrating internationalization features in KhipuVault
          </p>
        </div>
        <LanguageSwitcher />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <BasicTranslationExample />
        <NumberFormattingExample />
        <DateFormattingExample />
        <PoolActionsExample />
      </div>

      <ErrorMessagesExample />
    </div>
  );
}
