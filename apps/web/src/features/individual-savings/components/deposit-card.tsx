"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { TrendingUp, Gift } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { formatUnits, isAddress } from "viem";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTransactionExecute } from "@/features/transactions";
import { cn } from "@/lib/utils";

const depositSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Amount must be greater than 0",
    ),
  referralCode: z.string().optional(),
});

type DepositFormData = z.infer<typeof depositSchema>;

interface DepositCardProps {
  balance?: string;
  minDeposit?: string;
  apy?: number;
  onDeposit: (amount: string, referralCode?: string) => Promise<any>;
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
  const [showReferral, setShowReferral] = React.useState(false);
  const { execute } = useTransactionExecute({ type: "Deposit mUSD" });

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
  const referralCode = watch("referralCode");

  // Validate referral code is a valid address
  const isValidReferral = referralCode ? isAddress(referralCode) : true;
  const referralBonus = 0.5; // 0.5%

  const onSubmit = async (data: DepositFormData) => {
    await execute(async () => {
      return await onDeposit(data.amount, data.referralCode);
    });
  };

  // Format balance for display
  const formattedBalance = React.useMemo(() => {
    try {
      if (!balance || balance === "0") {return "0.00";}
      const balanceBigInt =
        typeof balance === "bigint" ? balance : BigInt(balance);
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
        <CardDescription>
          Earn ~{apy.toFixed(1)}% APY on your mUSD deposits
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount Input - Modern DeFi Style */}
          <div className="space-y-2">
            {/* Balance Row */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Wallet balance: {formattedBalance} mUSD
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={setMaxAmount}
                className="h-6 px-2 text-xs font-semibold text-lavanda hover:text-lavanda hover:bg-lavanda/10"
              >
                MAX
              </Button>
            </div>

            {/* Large Input Container - Aave/Uniswap Style */}
            <div
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all",
                "bg-surface-elevated hover:border-lavanda/50",
                errors.amount
                  ? "border-error focus-within:border-error"
                  : "border-border focus-within:border-lavanda",
              )}
            >
              <div className="flex items-center gap-3">
                {/* Token Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border">
                  <div className="w-6 h-6 rounded-full bg-gradient-lavanda flex items-center justify-center">
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
                    "flex-1 bg-transparent border-0 outline-none",
                    "text-3xl font-bold tabular-nums placeholder:text-muted-foreground/50",
                    "focus:outline-none focus:ring-0",
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
              <p className="text-sm text-error flex items-center gap-1">
                <span className="text-xs">⚠</span> {errors.amount.message}
              </p>
            )}
          </div>

          {/* Referral Code (Optional) */}
          <Collapsible open={showReferral} onOpenChange={setShowReferral}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-accent hover:text-accent hover:bg-accent/10"
              >
                <Gift className="h-4 w-4" />
                <span className="text-sm">
                  {showReferral ? "Hide" : "Have a"} referral code? Get{" "}
                  {referralBonus}% bonus!
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              <Label
                htmlFor="referralCode"
                className="text-xs text-muted-foreground"
              >
                Referral Code (Wallet Address)
              </Label>
              <Input
                id="referralCode"
                placeholder="0x..."
                {...register("referralCode")}
                className={cn(
                  "font-mono text-sm",
                  referralCode && !isValidReferral && "border-error",
                )}
              />
              {referralCode && !isValidReferral && (
                <p className="text-xs text-error">Invalid wallet address</p>
              )}
              {referralCode && isValidReferral && (
                <p className="text-xs text-success flex items-center gap-1">
                  <Gift className="h-3 w-3" />
                  Referrer will earn {referralBonus}% of your deposit!
                </p>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Quick Info */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-lavanda/10 border border-lavanda/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-success" />
              <span>Estimated APY</span>
            </div>
            <span className="text-sm font-bold text-success">
              ~{apy.toFixed(1)}%
            </span>
          </div>

          {/* Transaction Details - Only show when amount entered */}
          {amount && Number(amount) > 0 && (
            <div className="space-y-2 p-3 rounded-lg bg-surface-elevated border border-border text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You will deposit</span>
                <span className="font-semibold">{amount} mUSD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network fee</span>
                <span className="font-semibold">~$0.50</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">Min. deposit</span>
                <span className="text-xs text-muted-foreground">
                  {minDeposit} mUSD
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={isLoading}
            disabled={
              !amount ||
              Number(amount) <= 0 ||
              Boolean(referralCode && !isValidReferral)
            }
          >
            {!amount || Number(amount) <= 0
              ? "Enter amount"
              : `Deposit ${amount} mUSD`}
          </Button>

          {/* Help Text */}
          <p className="text-xs text-center text-muted-foreground">
            No lock-up period • Withdraw anytime
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
