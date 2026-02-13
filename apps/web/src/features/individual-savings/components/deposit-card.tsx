"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { formatUnits } from "viem";
import { useSwitchChain } from "wagmi";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNetworkStatus } from "@/components/web3/network-switcher";
import { useTransactionExecute } from "@/features/transactions";
import { cn } from "@/lib/utils";

const depositSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be greater than 0"),
});

type DepositFormData = z.infer<typeof depositSchema>;

interface DepositCardProps {
  balance?: string;
  minDeposit?: string;
  apy?: number;
  onDeposit: (amount: string) => Promise<any>;
  isLoading?: boolean;
  className?: string;
}

export function DepositCard({
  balance = "0",
  minDeposit = "10",
  apy = 12.5,
  onDeposit,
  isLoading,
  className,
}: DepositCardProps) {
  const { execute } = useTransactionExecute({ type: "Deposit mUSD" });
  const { isWrongNetwork, currentChain, expectedChain } = useNetworkStatus();
  const { switchChain, isPending: isSwitchingNetwork } = useSwitchChain();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
  });

  const amount = watch("amount");

  const onSubmit = async (data: DepositFormData) => {
    await execute(async () => {
      return await onDeposit(data.amount);
    });
  };

  // Format balance for display
  const formattedBalance = React.useMemo(() => {
    try {
      if (!balance || balance === "0") {
        return "0.00";
      }
      const balanceBigInt = typeof balance === "bigint" ? balance : BigInt(balance);
      return Number(formatUnits(balanceBigInt, 18)).toFixed(2);
    } catch (error) {
      console.error("Error formatting balance:", error);
      return "0.00";
    }
  }, [balance]);

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
          {/* Amount Input - Modern DeFi Style */}
          <div className="space-y-2">
            {/* Balance Row */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Wallet balance: {formattedBalance} mUSD</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={setMaxAmount}
                className="h-6 px-2 text-xs font-semibold text-lavanda hover:bg-lavanda/10 hover:text-lavanda"
              >
                MAX
              </Button>
            </div>

            {/* Large Input Container - Aave/Uniswap Style */}
            <div
              className={cn(
                "relative rounded-xl border-2 p-4 transition-all",
                "bg-surface-elevated hover:border-lavanda/50",
                errors.amount
                  ? "border-error focus-within:border-error"
                  : "border-border focus-within:border-lavanda"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Token Badge */}
                <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
                  <div className="bg-gradient-lavanda flex h-6 w-6 items-center justify-center rounded-full">
                    <span className="text-xs font-bold">m</span>
                  </div>
                  <span className="font-semibold">mUSD</span>
                </div>

                {/* Amount Input */}
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("amount")}
                  className={cn(
                    "flex-1 border-0 bg-transparent outline-none",
                    "text-3xl font-bold tabular-nums placeholder:text-muted-foreground/50",
                    "focus:outline-none focus:ring-0"
                  )}
                />
              </div>

              {/* USD Value (optional - can show conversion) */}
              {amount && Number(amount) > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  ≈ ${(Number(amount) * 1.0).toFixed(2)} USD
                </div>
              )}
            </div>

            {errors.amount && (
              <p className="flex items-center gap-1 text-sm text-error">
                <span className="text-xs">⚠</span> {errors.amount.message}
              </p>
            )}
          </div>

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
                <span className="font-semibold">~$0.50</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Min. deposit</span>
                <span className="text-xs text-muted-foreground">{minDeposit} mUSD</span>
              </div>
            </div>
          )}

          {/* Submit Button or Network Switch */}
          {isWrongNetwork ? (
            <div className="space-y-3">
              {/* Wrong Network Warning */}
              <div className="flex items-center gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Wrong Network</p>
                  <p className="text-muted-foreground">
                    You&apos;re on <strong>{currentChain?.name || "Unknown"}</strong>. Switch to{" "}
                    <strong>{expectedChain.name}</strong> to deposit.
                  </p>
                </div>
              </div>

              {/* Switch Network Button */}
              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={() => switchChain?.({ chainId: expectedChain.id })}
                disabled={isSwitchingNetwork}
              >
                {isSwitchingNetwork ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Switching...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Switch to {expectedChain.name}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isLoading}
              disabled={!amount || Number(amount) <= 0}
            >
              {!amount || Number(amount) <= 0 ? "Enter amount" : `Deposit ${amount} mUSD`}
            </Button>
          )}

          {/* Help Text */}
          <p className="text-center text-xs text-muted-foreground">
            No lock-up period • Withdraw anytime
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
