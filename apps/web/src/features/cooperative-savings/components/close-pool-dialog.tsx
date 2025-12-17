/**
 * @fileoverview Close Pool Confirmation Dialog
 * @module features/cooperative-savings/components/close-pool-dialog
 *
 * Features:
 * - Warning about permanent action
 * - Pool stats summary
 * - Only visible to pool creator
 * - Confirmation required
 */

"use client";

import { Loader2, AlertTriangle, Lock, Users, Bitcoin } from "lucide-react";
import * as React from "react";
import { useAccount } from "wagmi";

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
  useClosePool,
  usePoolInfo,
  formatBTCCompact,
  PoolStatus,
} from "@/hooks/web3/cooperative";

// ============================================================================
// TYPES
// ============================================================================

interface ClosePoolDialogProps {
  poolId: number | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClosePoolDialog({
  poolId,
  open,
  onClose,
  onSuccess,
}: ClosePoolDialogProps) {
  const { toast } = useToast();
  const { address } = useAccount();

  // Hooks
  const { closePool, state, error: txError, reset } = useClosePool();
  const { poolInfo } = usePoolInfo(poolId ?? 0);

  // Check if user is the pool creator
  const isCreator = React.useMemo(() => {
    if (!poolInfo || !address) return false;
    return poolInfo.creator.toLowerCase() === address.toLowerCase();
  }, [poolInfo, address]);

  // Check if pool is already closed
  const isAlreadyClosed = poolInfo?.status === PoolStatus.CLOSED;

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  // Handle success
  React.useEffect(() => {
    if (state === "success") {
      toast({
        title: "Pool Closed",
        description: "The pool has been permanently closed to new members.",
      });
      onSuccess?.();
      handleClose();
    }
  }, [state, toast, onSuccess]);

  // Handlers
  const handleClose = () => {
    reset();
    onClose();
  };

  const handleClosePool = async () => {
    if (!poolId || !isCreator) return;

    try {
      await closePool(poolId);
    } catch (err) {
      console.error("Close pool error:", err);
      toast({
        variant: "destructive",
        title: "Failed to Close Pool",
        description:
          err instanceof Error
            ? err.message
            : "Failed to close pool. Please try again.",
      });
    }
  };

  const isProcessing = state === "executing" || state === "processing";
  const canClose = isCreator && !isProcessing && !isAlreadyClosed;

  if (!poolId || !poolInfo) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Lock className="h-5 w-5" />
            Close Pool?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Closing the pool will prevent any new members from joining. Existing
            members can still withdraw their funds and yields.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Pool Info */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm font-medium">{poolInfo.name}</p>
            <p className="text-xs text-muted-foreground">Pool #{poolId}</p>
          </div>

          <Separator />

          {/* Pool Stats */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Pool Statistics</p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Current Members
                </span>
                <span className="font-mono font-semibold">
                  {poolInfo.currentMembers} / {poolInfo.maxMembers}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Bitcoin className="h-3.5 w-3.5" />
                  Total Deposited
                </span>
                <span className="font-mono font-semibold">
                  {formatBTCCompact(poolInfo.totalBtcDeposited)} BTC
                </span>
              </div>
            </div>
          </div>

          {/* Not Creator Warning */}
          {!isCreator && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Only the pool creator can close this pool.
              </AlertDescription>
            </Alert>
          )}

          {/* Already Closed Warning */}
          {isAlreadyClosed && (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This pool is already closed.
              </AlertDescription>
            </Alert>
          )}

          {/* Warning */}
          {isCreator && !isAlreadyClosed && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Warning:</strong> This action is permanent. The pool
                will be closed and no new members will be able to join. Existing
                members will still be able to leave and withdraw their funds.
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

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClosePool}
            disabled={!canClose}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {state === "executing"
                  ? "Confirm in Wallet..."
                  : "Closing Pool..."}
              </>
            ) : (
              "Yes, Close Pool"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
