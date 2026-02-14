/**
 * @fileoverview Buy Tickets Modal Component
 * @module features/prize-pool/components/buy-tickets-modal
 *
 * Modal for purchasing lottery tickets with mUSD
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Ticket, AlertCircle, Wallet, Calculator, CheckCircle2, Loader2 } from "lucide-react";
import * as React from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useBuyTicketsWithApprove } from "@/hooks/web3/lottery/use-buy-tickets-with-approve";
import { formatProbability } from "@/hooks/web3/lottery/use-lottery-pool";
import { useMusdBalance, formatMusd } from "@/hooks/web3/use-musd-balance";

import type { LotteryRound } from "@/lib/blockchain/fetch-lottery-pools";

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
  const { balance: musdBalance, formatted: musdFormatted } = useMusdBalance();
  const {
    buyTickets,
    isProcessing: isPending,
    isSuccess,
    buyHash: hash,
    error,
    step: txStep,
  } = useBuyTicketsWithApprove();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [ticketCount, setTicketCount] = React.useState("1");
  const [modalStep, setModalStep] = React.useState<"input" | "confirming" | "success">("input");

  // Calculate values
  const ticketCountNum = parseInt(ticketCount) || 0;
  const totalCost = roundInfo ? roundInfo.ticketPrice * BigInt(ticketCountNum) : BigInt(0);
  const remainingTickets = Number(maxTicketsPerUser) - Number(currentUserTickets);

  // Calculate probability
  const estimatedTotalTickets = roundInfo
    ? Number(roundInfo.totalTicketsSold) + ticketCountNum
    : ticketCountNum;
  const estimatedProbability =
    estimatedTotalTickets > 0 ? (ticketCountNum / estimatedTotalTickets) * 10000 : 0;

  // Validation
  const hasEnoughBalance = musdBalance >= totalCost;
  const isValidCount = ticketCountNum > 0 && ticketCountNum <= remainingTickets;
  const canPurchase = hasEnoughBalance && isValidCount && !isPending && !!address;

  // Quick select buttons
  const quickSelectOptions = [1, 5, 10].filter((n) => n <= remainingTickets);

  // Handle purchase
  const handlePurchase = async () => {
    if (!roundInfo || !canPurchase) {
      return;
    }

    try {
      setModalStep("confirming");
      await buyTickets(Number(roundInfo.roundId), ticketCountNum, roundInfo.ticketPrice);
    } catch (err) {
      console.error("Purchase error:", err);
      setModalStep("input");
      toast({
        title: "Purchase Failed",
        description: err instanceof Error ? err.message : "Failed to purchase tickets",
        variant: "destructive",
      });
    }
  };

  // Watch for transaction success
  React.useEffect(() => {
    if (isSuccess && hash) {
      setModalStep("success");

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
    setModalStep("input");
    onOpenChange(false);
  };

  if (!roundInfo) {
    return null;
  }

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

        {modalStep === "input" && (
          <div className="space-y-6">
            {/* Ticket Price Info */}
            <div className="rounded-lg border border-border bg-surface-elevated p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ticket Price</span>
                <Badge variant="secondary">{formatMusd(roundInfo.ticketPrice)} mUSD</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Your Tickets</span>
                <span className="text-sm font-medium">
                  {currentUserTickets.toString()} / {maxTicketsPerUser.toString()}
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
            <div className="space-y-2 rounded-lg border border-lavanda/20 bg-lavanda/10 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Calculator className="h-4 w-4 text-lavanda" />
                Purchase Summary
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Cost</span>
                <span className="font-bold">{formatMusd(totalCost)} mUSD</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your Balance</span>
                <span className={hasEnoughBalance ? "text-success" : "text-destructive"}>
                  {musdFormatted} mUSD
                </span>
              </div>

              <div className="my-2 h-px bg-border" />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Win Probability</span>
                <span className="font-medium text-lavanda">
                  {formatProbability(BigInt(Math.floor(estimatedProbability)))}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Potential Prize</span>
                <span className="font-bold text-success">
                  {formatMusd(roundInfo.totalPrize + totalCost)} mUSD
                </span>
              </div>
            </div>

            {/* Validation Errors */}
            {!hasEnoughBalance && ticketCountNum > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient mUSD balance. You need {formatMusd(totalCost)} mUSD.
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
                  {typeof error === "string" ? error : "Transaction failed. Please try again."}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {modalStep === "confirming" && (
          <div className="space-y-4 py-8 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-lavanda" />
            <div>
              <p className="mb-1 font-medium">
                {(() => {
                  switch (txStep) {
                    case "switching-network":
                      return "Switching Network...";
                    case "checking":
                      return "Checking Allowance...";
                    case "approving":
                      return "Approving mUSD...";
                    case "awaiting-approval":
                      return "Waiting for Approval...";
                    case "verifying-allowance":
                      return "Verifying...";
                    case "buying":
                      return "Buying Tickets...";
                    default:
                      return "Processing...";
                  }
                })()}
              </p>
              <p className="text-sm text-muted-foreground">
                {txStep === "approving" || txStep === "buying"
                  ? "Please confirm the transaction in your wallet"
                  : "Please wait..."}
              </p>
            </div>
          </div>
        )}

        {modalStep === "success" && (
          <div className="space-y-4 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <div>
              <p className="mb-1 text-lg font-medium">Tickets Purchased!</p>
              <p className="mb-4 text-sm text-muted-foreground">
                You successfully purchased {ticketCountNum} ticket(s)
              </p>
              <Badge variant="secondary" className="text-xs">
                Transaction: {hash?.slice(0, 10)}...{hash?.slice(-8)}
              </Badge>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          {modalStep === "input" && (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handlePurchase}
                disabled={!canPurchase}
                className="bg-gradient-to-r from-lavanda to-lavanda/80"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Purchase Tickets
              </Button>
            </>
          )}

          {modalStep === "confirming" && (
            <Button variant="ghost" disabled className="w-full">
              Processing...
            </Button>
          )}

          {modalStep === "success" && (
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
