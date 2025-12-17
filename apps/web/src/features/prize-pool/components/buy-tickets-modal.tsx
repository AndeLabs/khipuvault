/**
 * @fileoverview Buy Tickets Modal Component
 * @module features/prize-pool/components/buy-tickets-modal
 *
 * Modal for purchasing lottery tickets with BTC
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Ticket,
  AlertCircle,
  Wallet,
  Calculator,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { formatEther, parseEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import {
  useBuyTickets,
  formatProbability,
} from "@/hooks/web3/use-lottery-pool";
import type { LotteryRound } from "@/lib/blockchain/fetch-lottery-pools";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface BuyTicketsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roundInfo: LotteryRound | null;
  currentUserTickets?: bigint;
  maxTicketsPerUser?: bigint;
}

export function BuyTicketsModal({
  open,
  onOpenChange,
  roundInfo,
  currentUserTickets = BigInt(0),
  maxTicketsPerUser = BigInt(10),
}: BuyTicketsModalProps) {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const { buyTickets, isPending, isSuccess, hash, error } = useBuyTickets();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [ticketCount, setTicketCount] = React.useState("1");
  const [step, setStep] = React.useState<"input" | "confirming" | "success">(
    "input",
  );

  // Calculate values
  const ticketCountNum = parseInt(ticketCount) || 0;
  const totalCost = roundInfo
    ? roundInfo.ticketPrice * BigInt(ticketCountNum)
    : BigInt(0);
  const remainingTickets =
    Number(maxTicketsPerUser) - Number(currentUserTickets);

  // Calculate probability
  const estimatedTotalTickets = roundInfo
    ? Number(roundInfo.totalTicketsSold) + ticketCountNum
    : ticketCountNum;
  const estimatedProbability =
    estimatedTotalTickets > 0
      ? (ticketCountNum / estimatedTotalTickets) * 10000
      : 0;

  // Validation
  const hasEnoughBalance = balance ? balance.value >= totalCost : false;
  const isValidCount = ticketCountNum > 0 && ticketCountNum <= remainingTickets;
  const canPurchase = hasEnoughBalance && isValidCount && !isPending;

  // Quick select buttons
  const quickSelectOptions = [1, 5, 10].filter((n) => n <= remainingTickets);

  // Handle purchase
  const handlePurchase = async () => {
    if (!roundInfo || !canPurchase) return;

    try {
      setStep("confirming");
      await buyTickets(
        Number(roundInfo.roundId),
        ticketCountNum,
        roundInfo.ticketPrice,
      );
    } catch (err) {
      console.error("Purchase error:", err);
      setStep("input");
      toast({
        title: "Purchase Failed",
        description:
          err instanceof Error ? err.message : "Failed to purchase tickets",
        variant: "destructive",
      });
    }
  };

  // Watch for transaction success
  React.useEffect(() => {
    if (isSuccess && hash) {
      setStep("success");

      // Refetch lottery data after successful purchase
      setTimeout(() => {
        void queryClient.refetchQueries({ type: "active" });
      }, 3000);

      toast({
        title: "Tickets Purchased!",
        description: `Successfully purchased ${ticketCountNum} ticket(s)`,
      });
    }
  }, [isSuccess, hash, ticketCountNum, queryClient, toast]);

  // Reset on close
  const handleClose = () => {
    setTicketCount("1");
    setStep("input");
    onOpenChange(false);
  };

  if (!roundInfo) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-lavanda" />
            Buy Lottery Tickets
          </DialogTitle>
          <DialogDescription>
            Purchase tickets for Round #{roundInfo.roundId.toString()}
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-6">
            {/* Ticket Price Info */}
            <div className="p-4 rounded-lg bg-surface-elevated border border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  Ticket Price
                </span>
                <Badge variant="secondary">
                  {formatEther(roundInfo.ticketPrice)} BTC
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Your Tickets
                </span>
                <span className="text-sm font-medium">
                  {currentUserTickets.toString()} /{" "}
                  {maxTicketsPerUser.toString()}
                </span>
              </div>
            </div>

            {/* Ticket Count Input */}
            <div className="space-y-3">
              <Label htmlFor="ticketCount">Number of Tickets</Label>
              <Input
                id="ticketCount"
                type="number"
                min="1"
                max={remainingTickets.toString()}
                value={ticketCount}
                onChange={(e) => setTicketCount(e.target.value)}
                placeholder="Enter number of tickets"
              />

              {/* Quick Select */}
              <div className="flex gap-2">
                {quickSelectOptions.map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    size="sm"
                    onClick={() => setTicketCount(num.toString())}
                    className="flex-1"
                  >
                    {num}
                  </Button>
                ))}
                {remainingTickets <= Number(maxTicketsPerUser) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTicketCount(remainingTickets.toString())}
                    className="flex-1"
                  >
                    Max ({remainingTickets})
                  </Button>
                )}
              </div>
            </div>

            {/* Cost Calculator */}
            <div className="p-4 rounded-lg bg-lavanda/10 border border-lavanda/20 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium mb-3">
                <Calculator className="h-4 w-4 text-lavanda" />
                Purchase Summary
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Cost</span>
                <span className="font-bold">{formatEther(totalCost)} BTC</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your Wallet</span>
                <span
                  className={
                    hasEnoughBalance ? "text-success" : "text-destructive"
                  }
                >
                  {balance ? formatEther(balance.value) : "0"} BTC
                </span>
              </div>

              <div className="h-px bg-border my-2" />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Win Probability</span>
                <span className="font-medium text-lavanda">
                  {formatProbability(BigInt(Math.floor(estimatedProbability)))}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Potential Prize</span>
                <span className="font-bold text-success">
                  {formatEther(roundInfo.totalPrize + totalCost)} BTC
                </span>
              </div>
            </div>

            {/* Validation Errors */}
            {!hasEnoughBalance && ticketCountNum > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient BTC balance. You need {formatEther(totalCost)}{" "}
                  BTC.
                </AlertDescription>
              </Alert>
            )}

            {ticketCountNum > remainingTickets && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You can only purchase {remainingTickets} more ticket(s).
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.message || "Transaction failed. Please try again."}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === "confirming" && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-lavanda mx-auto" />
            <div>
              <p className="font-medium mb-1">Confirming Transaction...</p>
              <p className="text-sm text-muted-foreground">
                Please confirm the transaction in your wallet
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <div>
              <p className="font-medium text-lg mb-1">Tickets Purchased!</p>
              <p className="text-sm text-muted-foreground mb-4">
                You successfully purchased {ticketCountNum} ticket(s)
              </p>
              <Badge variant="secondary" className="text-xs">
                Transaction: {hash?.slice(0, 10)}...{hash?.slice(-8)}
              </Badge>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          {step === "input" && (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handlePurchase}
                disabled={!canPurchase}
                className="bg-gradient-to-r from-lavanda to-lavanda/80"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Purchase Tickets
              </Button>
            </>
          )}

          {step === "confirming" && (
            <Button variant="ghost" disabled className="w-full">
              Processing...
            </Button>
          )}

          {step === "success" && (
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
