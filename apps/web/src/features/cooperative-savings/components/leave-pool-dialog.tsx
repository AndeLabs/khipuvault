/**
 * @fileoverview Leave Pool Confirmation Dialog
 *
 * Features:
 * - Warning about permanent action
 * - Show withdrawal amount preview
 * - Confirmation required
 */

"use client";

import { Loader2, AlertTriangle, Bitcoin, TrendingUp } from "lucide-react";
import * as React from "react";

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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  useCooperativePool,
  formatBTCCompact,
  formatMUSD,
  calculateNetYield,

  useMemberInfo,
  useMemberYield,
  usePoolInfo} from "@/hooks/web3/use-cooperative-pool";

interface LeavePoolDialogProps {
  poolId: number | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LeavePoolDialog({
  poolId,
  open,
  onClose,
  onSuccess,
}: LeavePoolDialogProps) {
  const { toast } = useToast();
  const { leavePool, state, error, reset, performanceFee } =
    useCooperativePool();
  const { poolInfo } = usePoolInfo(poolId || 0);
  const { memberInfo } = useMemberInfo(poolId || 0);
  const { pendingYield } = useMemberYield(poolId || 0);

  // Handle leave
  const handleLeave = async () => {
    if (!poolId) {return;}

    try {
      await leavePool(poolId);
    } catch (err) {
      console.error("Leave pool error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "Failed to leave pool. Please try again.",
      });
    }
  };

  // Handle success
  React.useEffect(() => {
    if (state === "success") {
      toast({
        title: "Left Pool",
        description:
          "You have successfully left the pool and withdrawn your funds.",
      });
      onSuccess?.();
      handleClose();
    }
  }, [state]);

  // Handle close
  const handleClose = () => {
    reset();
    onClose();
  };

  const isProcessing = state === "executing" || state === "processing";

  if (!poolId || !memberInfo) {return null;}

  const grossYield = pendingYield;
  const netYield = calculateNetYield(grossYield, performanceFee);
  const feeAmount = grossYield - netYield;
  const totalWithdrawal = memberInfo.btcContributed;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Leave Pool?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action will remove you from the pool and withdraw your
            contribution plus any earned yields. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Pool Info */}
          {poolInfo && (
            <div>
              <p className="text-sm font-medium mb-1">{poolInfo.name}</p>
              <p className="text-xs text-muted-foreground">Pool #{poolId}</p>
            </div>
          )}

          <Separator />

          {/* Withdrawal Summary */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Withdrawal Summary</p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Bitcoin className="h-3.5 w-3.5" />
                  Your Contribution
                </span>
                <span className="font-mono font-semibold">
                  {formatBTCCompact(memberInfo.btcContributed)} BTC
                </span>
              </div>

              {grossYield > BigInt(0) && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Gross Yield
                    </span>
                    <span className="font-mono font-semibold text-success">
                      {formatMUSD(grossYield)} MUSD
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      Performance Fee ({(performanceFee / 100).toFixed(2)}%)
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      -{formatMUSD(feeAmount)} MUSD
                    </span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between font-semibold">
                    <span>Net Yield</span>
                    <span className="font-mono text-success">
                      {formatMUSD(netYield)} MUSD
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Warning:</strong> Leaving the pool will permanently remove
              you from this cooperative. You will need to rejoin to participate
              again.
            </AlertDescription>
          </Alert>

          {/* Transaction Error */}
          {error && state === "error" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLeave}
            disabled={isProcessing}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {state === "executing"
                  ? "Confirm in Wallet..."
                  : "Leaving Pool..."}
              </>
            ) : (
              "Yes, Leave Pool"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
