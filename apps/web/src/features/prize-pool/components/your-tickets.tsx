/**
 * @fileoverview Your Tickets Component
 * @module features/prize-pool/components/your-tickets
 *
 * Display user's purchased tickets for current round
 */

"use client";

import { Ticket, TrendingUp, Trophy, Wallet } from "lucide-react";
import * as React from "react";
import { formatEther } from "viem";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatProbability } from "@/hooks/web3/use-lottery-pool";

interface YourTicketsProps {
  ticketCount?: bigint;
  investment?: bigint;
  probability?: bigint;
  isWinner?: boolean;
  isLoading?: boolean;
}

export function YourTickets({
  ticketCount = BigInt(0),
  investment = BigInt(0),
  probability = BigInt(0),
  isWinner = false,
  isLoading,
}: YourTicketsProps) {
  const hasTickets = ticketCount > BigInt(0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isWinner ? "border-success/50 bg-success/5" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-lavanda" />
              Your Tickets
            </CardTitle>
            <CardDescription>Current round participation</CardDescription>
          </div>

          {isWinner && (
            <Badge
              variant="default"
              className="bg-success text-success-foreground"
            >
              <Trophy className="h-3 w-3 mr-1" />
              Winner!
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasTickets ? (
          <div className="text-center py-8">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              You haven't purchased any tickets yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Buy tickets to participate in the lottery!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Tickets Count */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-lavanda/10 to-lavanda/5 border border-lavanda/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-lavanda/20 flex items-center justify-center">
                    <Ticket className="h-5 w-5 text-lavanda" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {ticketCount.toString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Tickets Purchased
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Investment */}
            <div className="p-4 rounded-lg bg-surface-elevated border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">
                      {formatEther(investment)} BTC
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Invested
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Win Probability */}
            <div className="p-4 rounded-lg bg-surface-elevated border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-success">
                      {formatProbability(probability)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Win Probability
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-3 rounded-lg bg-info/10 border border-info/20">
              <p className="text-xs text-info-foreground">
                <strong>Remember:</strong> You never lose your capital! If you
                don't win, you get your BTC back.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
