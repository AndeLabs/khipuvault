/**
 * @fileoverview Partial Withdrawal Modal for Cooperative Pools
 * @module features/cooperative-savings/components/withdraw-partial-modal
 *
 * Features:
 * - Withdraw portion of contribution while staying in pool
 * - Real-time validation (min contribution check)
 * - Amount input with max button
 * - Preview of remaining balance
 */

"use client";

import { Loader2, AlertTriangle, Bitcoin, ArrowDown } from "lucide-react";
import * as React from "react";
import { formatEther, parseEther } from "viem";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  useWithdrawPartial,
  useMemberInfo,
  usePoolInfo,
  formatBTCCompact,
  type PoolInfo,
  type MemberInfo,
} from "@/hooks/web3/cooperative";

// ============================================================================
// TYPES
// ============================================================================

interface WithdrawPartialModalProps {
  poolId: number | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ValidationResult {
  isValid: boolean;
  error: string | null;
  remainingBalance: bigint;
  withdrawAmount: bigint;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates the withdrawal amount against pool and member constraints
 */
function validateWithdrawal(
  amountStr: string,
  poolInfo: PoolInfo | null | undefined,
  memberInfo: MemberInfo | null | undefined
): ValidationResult {
  const defaultResult: ValidationResult = {
    isValid: false,
    error: null,
    remainingBalance: BigInt(0),
    withdrawAmount: BigInt(0),
  };

  if (!poolInfo || !memberInfo) {
    return { ...defaultResult, error: "Pool or member data not available" };
  }

  if (!amountStr || amountStr.trim() === "") {
    return { ...defaultResult, error: null }; // Empty is not an error, just invalid
  }

  let withdrawAmount: bigint;
  try {
    withdrawAmount = parseEther(amountStr);
  } catch {
    return { ...defaultResult, error: "Invalid amount format" };
  }

  if (withdrawAmount <= BigInt(0)) {
    return { ...defaultResult, error: "Amount must be greater than 0" };
  }

  const currentBalance = memberInfo.btcContributed;

  if (withdrawAmount >= currentBalance) {
    return {
      ...defaultResult,
      error: "Cannot withdraw full amount. Use 'Leave Pool' instead.",
    };
  }

  const remainingBalance = currentBalance - withdrawAmount;
  const minContribution = poolInfo.minContribution;

  if (remainingBalance < minContribution) {
    const minRequired = formatEther(minContribution);
    return {
      ...defaultResult,
      error: `Remaining balance must be at least ${minRequired} BTC (pool minimum)`,
      remainingBalance,
      withdrawAmount,
    };
  }

  return {
    isValid: true,
    error: null,
    remainingBalance,
    withdrawAmount,
  };
}

/**
 * Calculates the maximum withdrawable amount
 */
function calculateMaxWithdrawable(
  poolInfo: PoolInfo | null | undefined,
  memberInfo: MemberInfo | null | undefined
): bigint {
  if (!poolInfo || !memberInfo) {
    return BigInt(0);
  }

  const currentBalance = memberInfo.btcContributed;
  const minContribution = poolInfo.minContribution;

  if (currentBalance <= minContribution) {
    return BigInt(0);
  }

  return currentBalance - minContribution;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function WithdrawPartialModal({
  poolId,
  open,
  onClose,
  onSuccess,
}: WithdrawPartialModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = React.useState("");

  // Hooks
  const { withdrawPartial, state, error: txError, reset } = useWithdrawPartial();
  const { poolInfo } = usePoolInfo(poolId ?? 0);
  const { memberInfo } = useMemberInfo(poolId ?? 0);

  // Validation
  const validation = React.useMemo(
    () => validateWithdrawal(amount, poolInfo, memberInfo),
    [amount, poolInfo, memberInfo]
  );

  const maxWithdrawable = React.useMemo(
    () => calculateMaxWithdrawable(poolInfo, memberInfo),
    [poolInfo, memberInfo]
  );

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      setAmount("");
      reset();
    }
  }, [open, reset]);

  // Handle success
  React.useEffect(() => {
    if (state === "success") {
      toast({
        title: "Withdrawal Successful",
        description: `Successfully withdrew ${amount} BTC from the pool.`,
      });
      onSuccess?.();
      handleClose();
    }
  }, [state, amount, toast, onSuccess]);

  // Handlers
  const handleClose = () => {
    setAmount("");
    reset();
    onClose();
  };

  const handleMaxClick = () => {
    if (maxWithdrawable > BigInt(0)) {
      setAmount(formatEther(maxWithdrawable));
    }
  };

  const handleWithdraw = async () => {
    if (!poolId || !validation.isValid) {
      return;
    }

    try {
      await withdrawPartial(poolId, amount);
    } catch (err) {
      console.error("Partial withdrawal error:", err);
      toast({
        variant: "destructive",
        title: "Withdrawal Failed",
        description: err instanceof Error ? err.message : "Failed to withdraw. Please try again.",
      });
    }
  };

  const isProcessing = state === "executing" || state === "processing";
  const canWithdraw = validation.isValid && !isProcessing && maxWithdrawable > BigInt(0);

  if (!poolId || !memberInfo || !poolInfo) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDown className="h-5 w-5 text-primary" />
            Partial Withdrawal
          </DialogTitle>
          <DialogDescription>
            Withdraw a portion of your contribution while remaining in the pool.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pool Info */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm font-medium">{poolInfo.name}</p>
            <p className="text-xs text-muted-foreground">Pool #{poolId}</p>
          </div>

          {/* Current Balance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Bitcoin className="h-3.5 w-3.5" />
                Your Current Balance
              </span>
              <span className="font-mono font-semibold">
                {formatBTCCompact(memberInfo.btcContributed)} BTC
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pool Minimum</span>
              <span className="font-mono text-muted-foreground">
                {formatBTCCompact(poolInfo.minContribution)} BTC
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Max Withdrawable</span>
              <span className="font-mono text-primary">
                {formatBTCCompact(maxWithdrawable)} BTC
              </span>
            </div>
          </div>

          <Separator />

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Withdrawal Amount (BTC)</Label>
            <div className="flex gap-2">
              <Input
                id="withdraw-amount"
                type="number"
                step="0.001"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isProcessing || maxWithdrawable === BigInt(0)}
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMaxClick}
                disabled={isProcessing || maxWithdrawable === BigInt(0)}
              >
                Max
              </Button>
            </div>
            {validation.error && <p className="text-xs text-destructive">{validation.error}</p>}
          </div>

          {/* Preview */}
          {validation.isValid && (
            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-medium text-primary">After Withdrawal</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Remaining Balance</span>
                <span className="font-mono font-semibold">
                  {formatBTCCompact(validation.remainingBalance)} BTC
                </span>
              </div>
            </div>
          )}

          {/* No withdrawable amount warning */}
          {maxWithdrawable === BigInt(0) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Your current balance equals the pool minimum. You cannot make a partial withdrawal.
                Use &quot;Leave Pool&quot; to withdraw all funds.
              </AlertDescription>
            </Alert>
          )}

          {/* Transaction Error */}
          {txError && state === "error" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{txError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleWithdraw} disabled={!canWithdraw}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {state === "executing" ? "Confirm in Wallet..." : "Withdrawing..."}
              </>
            ) : (
              "Withdraw"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
