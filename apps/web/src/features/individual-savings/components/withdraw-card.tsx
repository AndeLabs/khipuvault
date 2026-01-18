"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, AlertTriangle } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { formatUnits } from "viem";
import * as z from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useTransactionExecute } from "@/features/transactions";
import { cn } from "@/lib/utils";

const withdrawSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be greater than 0"),
});

type WithdrawFormData = z.infer<typeof withdrawSchema>;

interface WithdrawCardProps {
  availableBalance?: string;
  onWithdraw: (amount: string) => Promise<any>;
  isLoading?: boolean;
  className?: string;
}

export function WithdrawCard({
  availableBalance = "0",
  onWithdraw,
  isLoading,
  className,
}: WithdrawCardProps) {
  const { execute } = useTransactionExecute({ type: "Withdraw mUSD" });
  const [showFullWithdrawConfirm, setShowFullWithdrawConfirm] = React.useState(false);
  const [pendingWithdrawAmount, setPendingWithdrawAmount] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawSchema),
  });

  const amount = watch("amount");

  // Format balance for display
  const formattedBalance = React.useMemo(() => {
    try {
      if (!availableBalance || availableBalance === "0") {
        return "0.00";
      }
      const balanceBigInt =
        typeof availableBalance === "bigint" ? availableBalance : BigInt(availableBalance);
      return Number(formatUnits(balanceBigInt, 18)).toFixed(2);
    } catch (error) {
      console.error("Error formatting balance:", error);
      return "0.00";
    }
  }, [availableBalance]);

  const setMaxAmount = () => {
    setValue("amount", formattedBalance);
  };

  // Check if this is a full withdrawal (withdrawing all or >95% of balance)
  const isFullWithdrawal = (withdrawAmount: string) => {
    const withdrawNum = Number(withdrawAmount);
    const balanceNum = Number(formattedBalance);
    return withdrawNum >= balanceNum * 0.95;
  };

  const executeWithdraw = async (withdrawAmount: string) => {
    await execute(async () => {
      return await onWithdraw(withdrawAmount);
    });
    setPendingWithdrawAmount(null);
  };

  const onSubmit = async (data: WithdrawFormData) => {
    // Show confirmation for full withdrawals
    if (isFullWithdrawal(data.amount)) {
      setPendingWithdrawAmount(data.amount);
      setShowFullWithdrawConfirm(true);
      return;
    }
    await executeWithdraw(data.amount);
  };

  const handleConfirmFullWithdraw = async () => {
    setShowFullWithdrawConfirm(false);
    if (pendingWithdrawAmount) {
      await executeWithdraw(pendingWithdrawAmount);
    }
  };

  const hasBalance = Number(formattedBalance) > 0;

  return (
    <Card variant="surface" className={className}>
      <CardHeader className="pb-4">
        <CardTitle>Withdraw</CardTitle>
        <CardDescription>Withdraw your deposits and yields anytime</CardDescription>
      </CardHeader>

      <CardContent>
        {!hasBalance ? (
          <Alert className="border-amber-500/20 bg-amber-500/5">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm">
              No balance available to withdraw. Deposit mUSD first to start earning.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Amount Input - Modern DeFi Style */}
            <div className="space-y-2">
              {/* Available Balance Row */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Deposited: {formattedBalance} mUSD</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={setMaxAmount}
                  className="h-6 px-2 text-xs font-semibold text-accent hover:bg-accent/10 hover:text-accent"
                >
                  MAX
                </Button>
              </div>

              {/* Large Input Container - Aave/Uniswap Style */}
              <div
                className={cn(
                  "relative rounded-xl border-2 p-4 transition-all",
                  "bg-surface-elevated hover:border-accent/50",
                  (errors.amount ?? (amount && Number(amount) > Number(formattedBalance)))
                    ? "border-error focus-within:border-error"
                    : "border-border focus-within:border-accent"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Token Badge */}
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600">
                      <span className="text-xs font-bold">m</span>
                    </div>
                    <span className="font-semibold">mUSD</span>
                  </div>

                  {/* Amount Input */}
                  <input
                    id="withdraw-amount"
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

                {/* USD Value */}
                {amount && Number(amount) > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    ≈ ${(Number(amount) * 1.0).toFixed(2)} USD
                  </div>
                )}
              </div>

              {/* Error Messages */}
              {errors.amount && (
                <p className="flex items-center gap-1 text-sm text-error">
                  <span className="text-xs">⚠</span> {errors.amount.message}
                </p>
              )}
              {amount && Number(amount) > Number(formattedBalance) && (
                <p className="flex items-center gap-1 text-sm text-error">
                  <span className="text-xs">⚠</span> Insufficient balance
                </p>
              )}
            </div>

            {/* Transaction Details - Only show when amount entered */}
            {amount && Number(amount) > 0 && Number(amount) <= Number(formattedBalance) && (
              <div className="space-y-2 rounded-lg border border-border bg-surface-elevated p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">You will receive</span>
                  <span className="font-semibold">{amount} mUSD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network fee</span>
                  <span className="font-semibold">~$0.30</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">Remaining balance</span>
                  <span className="font-semibold text-accent">
                    {(Number(formattedBalance) - Number(amount)).toFixed(2)} mUSD
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="accent"
              className="w-full"
              size="lg"
              loading={isLoading}
              disabled={!amount || Number(amount) <= 0 || Number(amount) > Number(formattedBalance)}
            >
              {(() => {
                if (!amount || Number(amount) <= 0) {
                  return "Enter amount";
                }
                if (Number(amount) > Number(formattedBalance)) {
                  return "Insufficient balance";
                }
                return `Withdraw ${amount} mUSD`;
              })()}
            </Button>

            {/* Help Text */}
            <p className="text-center text-xs text-muted-foreground">
              No penalties • Instant withdrawal
            </p>
          </form>
        )}
      </CardContent>

      {/* Full Withdrawal Confirmation Dialog */}
      <AlertDialog open={showFullWithdrawConfirm} onOpenChange={setShowFullWithdrawConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm Full Withdrawal
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to withdraw <strong>{pendingWithdrawAmount} mUSD</strong>, which is
                your entire balance.
              </p>
              <div className="rounded-lg border border-warning/20 bg-warning/10 p-3 text-sm">
                <p className="mb-1 font-medium text-foreground">This will:</p>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  <li>Close your position in this pool</li>
                  <li>Stop all yield accumulation</li>
                  <li>Require a new deposit to rejoin</li>
                </ul>
              </div>
              <p className="text-sm">Are you sure you want to proceed?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingWithdrawAmount(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmFullWithdraw}
              className="text-warning-foreground bg-warning hover:bg-warning/90"
            >
              Yes, Withdraw All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
