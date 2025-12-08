/**
 * @fileoverview Join Pool Modal - V3
 *
 * Features:
 * - Pool information display
 * - BTC amount input with validation
 * - Min/max contribution validation
 * - Native BTC payment
 * - Transaction execution
 */

"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Bitcoin,
  Users,
  Shield,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  useCooperativePool,
  formatBTCCompact,
} from "@/hooks/web3/use-cooperative-pool";
import { usePoolInfo } from "@/hooks/web3/use-cooperative-pool";
import { useToast } from "@/hooks/use-toast";
import { parseEther, formatEther } from "viem";

interface JoinPoolModalV3Props {
  poolId: number | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function JoinPoolModalV3({
  poolId,
  open,
  onClose,
  onSuccess,
}: JoinPoolModalV3Props) {
  const { toast } = useToast();
  const { joinPool, state, error, reset } = useCooperativePool();
  const { poolInfo, isLoading: loadingPool } = usePoolInfo(poolId || 0);

  const [btcAmount, setBtcAmount] = React.useState("");
  const [validationError, setValidationError] = React.useState("");

  // Validate amount
  const validate = React.useCallback(() => {
    if (!poolInfo) return false;

    const amount = parseFloat(btcAmount);

    if (isNaN(amount) || amount <= 0) {
      setValidationError("Please enter a valid BTC amount");
      return false;
    }

    const minBtc = Number(formatEther(poolInfo.minContribution));
    const maxBtc = Number(formatEther(poolInfo.maxContribution));

    if (amount < minBtc) {
      setValidationError(
        `Amount must be at least ${formatBTCCompact(poolInfo.minContribution)} BTC`,
      );
      return false;
    }

    if (amount > maxBtc) {
      setValidationError(
        `Amount must not exceed ${formatBTCCompact(poolInfo.maxContribution)} BTC`,
      );
      return false;
    }

    setValidationError("");
    return true;
  }, [btcAmount, poolInfo]);

  // Handle join
  const handleJoin = async () => {
    if (!poolId || !validate()) return;

    try {
      await joinPool(poolId, btcAmount);
    } catch (err) {
      console.error("Join pool error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "Failed to join pool. Please try again.",
      });
    }
  };

  // Handle success
  React.useEffect(() => {
    if (state === "success") {
      toast({
        title: "Joined Pool!",
        description: "You have successfully joined the cooperative pool.",
      });
      onSuccess?.();
      handleClose();
    }
  }, [state]);

  // Handle close
  const handleClose = () => {
    setBtcAmount("");
    setValidationError("");
    reset();
    onClose();
  };

  // Auto-fill min amount
  React.useEffect(() => {
    if (poolInfo && !btcAmount) {
      setBtcAmount(formatEther(poolInfo.minContribution));
    }
  }, [poolInfo]);

  const isProcessing = state === "executing" || state === "processing";
  const canSubmit = !isProcessing && btcAmount && poolInfo;

  if (!poolId) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">
            Join Cooperative Pool
          </DialogTitle>
          <DialogDescription>
            Contribute BTC to join this pool and start earning yields together
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loadingPool ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : !poolInfo ? (
            <div className="py-8 text-center text-muted-foreground">
              Pool not found
            </div>
          ) : (
            <>
              {/* Pool Info */}
              <Card className="border-accent/20 bg-accent/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-accent">
                    <Shield className="h-4 w-4" />
                    {poolInfo.name}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Members</p>
                      <p className="font-medium flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {poolInfo.currentMembers} / {poolInfo.maxMembers}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total BTC</p>
                      <p className="font-mono font-medium">
                        {formatBTCCompact(poolInfo.totalBtcDeposited)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* BTC Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="btc-amount">Contribution Amount (BTC)</Label>
                <div className="relative">
                  <Bitcoin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="btc-amount"
                    type="number"
                    step="0.001"
                    placeholder="0.0"
                    value={btcAmount}
                    onChange={(e) => setBtcAmount(e.target.value)}
                    disabled={isProcessing}
                    className="pl-9 font-mono"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Min: {formatBTCCompact(poolInfo.minContribution)} BTC
                  </span>
                  <span>
                    Max: {formatBTCCompact(poolInfo.maxContribution)} BTC
                  </span>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setBtcAmount(formatEther(poolInfo.minContribution))
                  }
                  disabled={isProcessing}
                >
                  Min
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const mid =
                      (Number(formatEther(poolInfo.minContribution)) +
                        Number(formatEther(poolInfo.maxContribution))) /
                      2;
                    setBtcAmount(mid.toFixed(8));
                  }}
                  disabled={isProcessing}
                >
                  Mid
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setBtcAmount(formatEther(poolInfo.maxContribution))
                  }
                  disabled={isProcessing}
                >
                  Max
                </Button>
              </div>

              <Separator />

              {/* Summary */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Transaction Summary</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      You contribute
                    </span>
                    <span className="font-mono font-semibold">
                      {btcAmount || "0"} BTC
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Your shares</span>
                    <span className="font-mono font-semibold">
                      {btcAmount ? parseEther(btcAmount).toString() : "0"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Yields earned</span>
                    <span className="font-semibold text-success flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Proportional to shares
                    </span>
                  </div>
                </div>
              </div>

              {/* Validation Error */}
              {validationError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}

              {/* Transaction Error */}
              {error && state === "error" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Info */}
              <Alert>
                <Bitcoin className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Your BTC will be deposited into the Mezo protocol to mint MUSD
                  and generate yields. You can leave the pool at any time to
                  withdraw your contribution plus earned yields.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button variant="accent" onClick={handleJoin} disabled={!canSubmit}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {state === "executing"
                  ? "Confirm in Wallet..."
                  : "Joining Pool..."}
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Join Pool
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
