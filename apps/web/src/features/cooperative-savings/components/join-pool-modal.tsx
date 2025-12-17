"use client";

import { Users, Calendar, TrendingUp, Info, AlertCircle } from "lucide-react";
import * as React from "react";

import { AmountDisplay } from "@/components/common";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTransactionExecute } from "@/features/transactions";

interface JoinPoolModalProps {
  open: boolean;
  onClose: () => void;
  poolId?: string;
  poolName?: string;
  depositAmount?: string;
  maxMembers?: number;
  currentMembers?: number;
  cycleLength?: number;
  currentCycle?: number;
  apy?: number;
  onJoinPool?: (poolId: string) => Promise<any>;
}

export function JoinPoolModal({
  open,
  onClose,
  poolId,
  poolName = "Unnamed Pool",
  depositAmount = "0",
  maxMembers = 10,
  currentMembers = 0,
  cycleLength = 30,
  currentCycle = 1,
  apy = 15.0,
  onJoinPool,
}: JoinPoolModalProps) {
  const { execute } = useTransactionExecute({ type: "Join Cooperative Pool" });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const spotsLeft = maxMembers - currentMembers;
  const isFull = spotsLeft <= 0;

  const handleJoin = async () => {
    if (!poolId || !onJoinPool) {return;}

    setIsSubmitting(true);
    try {
      await execute(async () => {
        return await onJoinPool(poolId);
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Join Pool
            <Badge variant="orange">{poolName}</Badge>
          </DialogTitle>
          <DialogDescription>
            Review the pool details before joining
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pool Stats */}
          <div className="grid grid-cols-2 gap-4">
            {/* Members */}
            <div className="p-4 rounded-lg bg-surface-elevated border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">Members</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{currentMembers}</span>
                <span className="text-sm text-muted-foreground">
                  / {maxMembers}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {spotsLeft} spots left
              </p>
            </div>

            {/* Cycle Info */}
            <div className="p-4 rounded-lg bg-surface-elevated border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Cycle</span>
              </div>
              <div className="text-2xl font-bold">{currentCycle}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {cycleLength} days each
              </p>
            </div>
          </div>

          {/* Deposit Amount */}
          <div className="p-4 rounded-lg bg-gradient-orange border border-accent/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Required Deposit
              </span>
              <Badge variant="orange">Per Member</Badge>
            </div>
            <AmountDisplay amount={depositAmount} symbol="mUSD" size="xl" />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-accent/20">
              <span className="text-xs text-muted-foreground">
                Estimated APY
              </span>
              <span className="text-sm font-semibold text-success tabular-nums">
                {apy.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* How it Works */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4 text-lavanda" />
              How Cooperative Pools Work
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-lavanda mt-0.5">•</span>
                <span>All members deposit the same amount</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lavanda mt-0.5">•</span>
                <span>
                  Each cycle, one member receives the total pool + yields
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lavanda mt-0.5">•</span>
                <span>Rotation continues until all members benefit</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lavanda mt-0.5">•</span>
                <span>Everyone earns yields on their deposits</span>
              </li>
            </ul>
          </div>

          {/* Warning if full */}
          {isFull && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This pool is currently full. Please choose another pool.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="accent"
            onClick={handleJoin}
            loading={isSubmitting}
            disabled={isFull}
          >
            {isFull ? "Pool Full" : `Join & Deposit ${depositAmount} mUSD`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
