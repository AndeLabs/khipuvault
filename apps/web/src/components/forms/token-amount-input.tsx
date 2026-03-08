"use client";

import * as React from "react";
import { UseFormRegisterReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TokenAmountInputProps {
  /** Form register return from react-hook-form */
  register: UseFormRegisterReturn;
  /** Current amount value from watch() */
  amount?: string;
  /** Token symbol to display */
  token?: string;
  /** Balance label (e.g., "Wallet balance", "Deposited") */
  balanceLabel?: string;
  /** Formatted balance value */
  balance: string;
  /** Error message from form validation */
  error?: string;
  /** Additional validation error (e.g., insufficient balance) */
  insufficientBalance?: boolean;
  /** Accent color class for focus states */
  accentClass?: string;
  /** Gradient class for token badge */
  badgeGradient?: string;
  /** Callback when MAX button is clicked */
  onMaxClick: () => void;
  /** Input ID for accessibility */
  id?: string;
  /** Whether to show USD conversion (mUSD is 1:1) */
  showUsdValue?: boolean;
}

/**
 * Reusable token amount input component with DeFi-style design
 *
 * Features:
 * - Large, prominent input field
 * - Token badge with customizable gradient
 * - MAX button for quick balance entry
 * - USD value display
 * - Validation error states
 *
 * @example
 * ```tsx
 * <TokenAmountInput
 *   register={register("amount")}
 *   amount={watch("amount")}
 *   balance={formattedBalance}
 *   balanceLabel="Wallet balance"
 *   error={errors.amount?.message}
 *   onMaxClick={() => setValue("amount", formattedBalance)}
 * />
 * ```
 */
export function TokenAmountInput({
  register,
  amount,
  token = "mUSD",
  balanceLabel = "Balance",
  balance,
  error,
  insufficientBalance = false,
  accentClass = "lavanda",
  badgeGradient = "bg-gradient-lavanda",
  onMaxClick,
  id = "amount",
  showUsdValue = true,
}: TokenAmountInputProps) {
  const hasError = !!error || insufficientBalance;

  return (
    <div className="space-y-2">
      {/* Balance Row */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {balanceLabel}: {balance} {token}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onMaxClick}
          className={cn(
            "h-6 px-2 text-xs font-semibold",
            `text-${accentClass} hover:bg-${accentClass}/10 hover:text-${accentClass}`
          )}
        >
          MAX
        </Button>
      </div>

      {/* Large Input Container - Aave/Uniswap Style */}
      <div
        className={cn(
          "relative rounded-xl border-2 p-4 transition-all",
          "bg-surface-elevated",
          hasError
            ? "border-error focus-within:border-error"
            : `border-border hover:border-${accentClass}/50 focus-within:border-${accentClass}`
        )}
      >
        <div className="flex items-center gap-3">
          {/* Token Badge */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
            <div
              className={cn("flex h-6 w-6 items-center justify-center rounded-full", badgeGradient)}
            >
              <span className="text-xs font-bold">{token.charAt(0).toLowerCase()}</span>
            </div>
            <span className="font-semibold">{token}</span>
          </div>

          {/* Amount Input */}
          <input
            id={id}
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register}
            className={cn(
              "flex-1 border-0 bg-transparent outline-none",
              "text-3xl font-bold tabular-nums placeholder:text-muted-foreground/50",
              "focus:outline-none focus:ring-0",
              // Hide number input spinners
              "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            )}
          />
        </div>

        {/* USD Value - mUSD is pegged 1:1 with USD */}
        {showUsdValue && amount && Number(amount) > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            ≈ ${Number(amount).toFixed(2)} USD
          </div>
        )}
      </div>

      {/* Error Messages */}
      {error && (
        <p className="flex items-center gap-1 text-sm text-error">
          <span className="text-xs">⚠</span> {error}
        </p>
      )}
      {insufficientBalance && !error && (
        <p className="flex items-center gap-1 text-sm text-error">
          <span className="text-xs">⚠</span> Insufficient balance
        </p>
      )}
    </div>
  );
}
