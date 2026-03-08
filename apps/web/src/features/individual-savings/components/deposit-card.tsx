"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { TrendingUp } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

import { TokenAmountInput } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useTransactionExecute } from "@/features/transactions";
import { formatBalance } from "@/lib/format";
import { depositFormSchema, type DepositFormData } from "@/lib/validation";
import type { TransactionCallback } from "@/types";

interface DepositCardProps {
  balance?: string;
  minDeposit?: string;
  apy?: number;
  /** Estimated gas fee in USD (Mezo has very low fees) */
  estimatedGasFee?: string;
  onDeposit: TransactionCallback;
  isLoading?: boolean;
  className?: string;
}

export function DepositCard({
  balance = "0",
  minDeposit = "10",
  apy = 12.5,
  estimatedGasFee = "<$0.01",
  onDeposit,
  isLoading,
  className,
}: DepositCardProps) {
  const { execute } = useTransactionExecute({ type: "Deposit mUSD" });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositFormSchema),
  });

  const amount = watch("amount");

  const onSubmit = async (data: DepositFormData) => {
    await execute(async () => {
      return await onDeposit(data.amount);
    });
  };

  // Format balance for display
  const formattedBalance = React.useMemo(() => formatBalance(balance), [balance]);

  const setMaxAmount = () => {
    setValue("amount", formattedBalance);
  };

  return (
    <Card variant="surface" className={className}>
      <CardHeader className="pb-4">
        <CardTitle>Deposit</CardTitle>
        <CardDescription>Earn ~{apy.toFixed(1)}% APY on your mUSD deposits</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount Input - Using shared component */}
          <TokenAmountInput
            register={register("amount")}
            amount={amount}
            balance={formattedBalance}
            balanceLabel="Wallet balance"
            error={errors.amount?.message}
            accentClass="lavanda"
            badgeGradient="bg-gradient-lavanda"
            onMaxClick={setMaxAmount}
            id="deposit-amount"
          />

          {/* Quick Info */}
          <div className="bg-gradient-lavanda/10 flex items-center justify-between rounded-lg border border-lavanda/20 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-success" />
              <span>Estimated APY</span>
            </div>
            <span className="text-sm font-bold text-success">~{apy.toFixed(1)}%</span>
          </div>

          {/* Transaction Details - Only show when amount entered */}
          {amount && Number(amount) > 0 && (
            <div className="space-y-2 rounded-lg border border-border bg-surface-elevated p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You will deposit</span>
                <span className="font-semibold">{amount} mUSD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network fee</span>
                <span className="font-semibold">{estimatedGasFee}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Min. deposit</span>
                <span className="text-xs text-muted-foreground">{minDeposit} mUSD</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={isLoading}
            disabled={!amount || Number(amount) <= 0}
          >
            {!amount || Number(amount) <= 0 ? "Enter amount" : `Deposit ${amount} mUSD`}
          </Button>

          {/* Help Text */}
          <p className="text-center text-xs text-muted-foreground">
            No lock-up period • Withdraw anytime
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
