"use client";

import { AlertCircle, Coins, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { formatEther } from "viem";
import { useAccount, useBalance } from "wagmi";

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
import { useContributeNative, useContributeWBTC, useMemberInfo } from "@/hooks/web3/rotating";

interface ContributeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolId: bigint;
  contributionAmount: bigint;
  useNativeBtc?: boolean;
}

export function ContributeModal({
  open,
  onOpenChange,
  poolId,
  contributionAmount,
  useNativeBtc = true,
}: ContributeModalProps) {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: memberData } = useMemberInfo(poolId);

  // Use appropriate hook based on pool type
  const nativeContribute = useContributeNative(poolId, contributionAmount);
  const wbtcContribute = useContributeWBTC(poolId);

  const { contribute, isPending, isConfirmed, error } = useNativeBtc
    ? nativeContribute
    : wbtcContribute;

  // Parse member data
  const contributionsMade = memberData ? ((memberData as unknown[])[2] as bigint) : 0n;

  // Format amounts for display
  const requiredAmount = formatEther(contributionAmount);
  const userBalance = balance ? formatEther(balance.value) : "0";
  const hasEnoughBalance = balance && balance.value >= contributionAmount;

  // Close modal on success
  useEffect(() => {
    if (isConfirmed) {
      onOpenChange(false);
    }
  }, [isConfirmed, onOpenChange]);

  const handleContribute = () => {
    contribute();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Make Contribution
          </AlertDialogTitle>
          <AlertDialogDescription>
            Contribute BTC to the pool for this period. All members must contribute before the
            payout can be distributed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Contribution Status */}
          <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Contribution Amount</span>
              <span className="font-code font-medium">{requiredAmount} BTC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your Balance</span>
              <span className="font-code font-medium">
                {parseFloat(userBalance).toFixed(6)} BTC
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Contributions Made</span>
              <span className="font-medium">{contributionsMade.toString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Type</span>
              <span className="font-medium">{useNativeBtc ? "Native BTC" : "WBTC"}</span>
            </div>
          </div>

          {/* Warnings */}
          {!hasEnoughBalance && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Insufficient balance for this contribution</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error.message || "Transaction failed"}</span>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleContribute}
            disabled={!hasEnoughBalance || isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <Coins className="h-4 w-4" />
                Contribute
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
