/**
 * @fileoverview Active Lottery Hero Component
 * @module features/prize-pool/components/active-lottery-hero
 *
 * Large hero card showcasing the current active lottery round
 * Handles all edge cases: no participants, expired, admin actions
 */

"use client";

import {
  Trophy,
  Ticket,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  PlayCircle,
  PlusCircle,
  Loader2,
} from "lucide-react";
import * as React from "react";
import { formatEther } from "viem";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getTimeRemaining, getRoundStatus } from "@/hooks/web3/lottery/use-lottery-pool";

import type { LotteryRound } from "@/lib/blockchain/fetch-lottery-pools";

interface ActiveLotteryHeroProps {
  roundInfo: LotteryRound | null | undefined;
  userTicketCount?: bigint;
  isLoading?: boolean;
  onBuyTickets: () => void;
  /** Admin functions */
  isAdmin?: boolean;
  onDrawWinner?: () => Promise<void>;
  onCreateNewRound?: () => void;
  isDrawing?: boolean;
}

export function ActiveLotteryHero({
  roundInfo,
  userTicketCount = BigInt(0),
  isLoading,
  onBuyTickets,
  isAdmin = false,
  onDrawWinner,
  onCreateNewRound,
  isDrawing = false,
}: ActiveLotteryHeroProps) {
  const [timeRemaining, setTimeRemaining] = React.useState(
    roundInfo
      ? getTimeRemaining(roundInfo.endTime)
      : { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  );

  // Update countdown every second
  React.useEffect(() => {
    if (!roundInfo) {
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(roundInfo.endTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [roundInfo]);

  if (isLoading) {
    return (
      <Card className="border-lavanda/20 bg-gradient-to-br from-lavanda/5 to-lavanda/10">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!roundInfo) {
    return (
      <Card className="border-border/50 bg-surface-elevated">
        <CardContent className="py-12 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No Active Lottery</h3>
          <p className="text-sm text-muted-foreground">
            There is no active lottery round at the moment. Check back soon!
          </p>
        </CardContent>
      </Card>
    );
  }

  const ticketsSoldPercentage =
    Number(roundInfo.maxTickets) > 0
      ? (Number(roundInfo.totalTicketsSold) / Number(roundInfo.maxTickets)) * 100
      : 0;

  const isExpired = timeRemaining.total <= 0;
  const statusText = getRoundStatus(roundInfo.status);

  return (
    <Card className="overflow-hidden border-lavanda/20 bg-gradient-to-br from-lavanda/5 via-lavanda/10 to-lavanda/5">
      <div className="absolute right-0 top-0 -z-10 h-96 w-96 rounded-full bg-lavanda/10 blur-3xl" />

      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Trophy className="h-8 w-8 text-lavanda" />
              <CardTitle className="text-3xl">
                Prize Pool Round #{roundInfo.roundId.toString()}
              </CardTitle>
            </div>
            <Badge
              variant={(() => {
                if (roundInfo.status === 0) {
                  return "default";
                }
                if (roundInfo.status === 1) {
                  return "secondary";
                }
                return "outline";
              })()}
            >
              {statusText}
            </Badge>
          </div>

          {/* Countdown */}
          <div className="text-right">
            <div className="mb-1 text-sm text-muted-foreground">
              {isExpired ? "Ended" : "Time Remaining"}
            </div>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Clock className="h-5 w-5 text-lavanda" />
              {isExpired ? (
                <span className="text-muted-foreground">00:00:00</span>
              ) : (
                <span>
                  {timeRemaining.days > 0 && `${timeRemaining.days}d `}
                  {String(timeRemaining.hours).padStart(2, "0")}:
                  {String(timeRemaining.minutes).padStart(2, "0")}:
                  {String(timeRemaining.seconds).padStart(2, "0")}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Prize Pool Amount */}
        <div className="rounded-lg border border-lavanda/20 bg-gradient-to-br from-lavanda/20 to-lavanda/10 p-6 text-center">
          <div className="mb-2 text-sm text-muted-foreground">Total Prize Pool</div>
          <div className="mb-1 text-5xl font-bold text-lavanda">
            {formatEther(roundInfo.totalPrize)} BTC
          </div>
          <div className="text-sm text-muted-foreground">
            ≈ $
            {(Number(formatEther(roundInfo.totalPrize)) * 95000).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            USD
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-surface-elevated p-4 text-center">
            <Ticket className="mx-auto mb-2 h-5 w-5 text-lavanda" />
            <div className="text-2xl font-bold">{roundInfo.totalTicketsSold.toString()}</div>
            <div className="text-xs text-muted-foreground">Tickets Sold</div>
          </div>

          <div className="rounded-lg border border-border bg-surface-elevated p-4 text-center">
            <Users className="mx-auto mb-2 h-5 w-5 text-accent" />
            <div className="text-2xl font-bold">{userTicketCount.toString()}</div>
            <div className="text-xs text-muted-foreground">Your Tickets</div>
          </div>

          <div className="rounded-lg border border-border bg-surface-elevated p-4 text-center">
            <TrendingUp className="mx-auto mb-2 h-5 w-5 text-success" />
            <div className="text-2xl font-bold">{formatEther(roundInfo.ticketPrice)}</div>
            <div className="text-xs text-muted-foreground">BTC per Ticket</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tickets Progress</span>
            <span className="font-medium">{ticketsSoldPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={ticketsSoldPercentage} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{roundInfo.totalTicketsSold.toString()} sold</span>
            <span>{roundInfo.maxTickets.toString()} max</span>
          </div>
        </div>

        {/* CTA Button - Active round */}
        {roundInfo.status === 0 && !isExpired && (
          <Button
            onClick={onBuyTickets}
            className="h-14 w-full bg-gradient-to-r from-lavanda to-lavanda/80 text-lg hover:from-lavanda/90 hover:to-lavanda/70"
          >
            <Ticket className="mr-2 h-5 w-5" />
            Buy Tickets Now
          </Button>
        )}

        {/* Expired with NO participants - needs new round */}
        {isExpired && roundInfo.status === 0 && Number(roundInfo.totalTicketsSold) === 0 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
              <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">
                Round ended without participants
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                No tickets were sold. A new round needs to be created.
              </p>
            </div>
            {isAdmin && onCreateNewRound && (
              <Button
                onClick={onCreateNewRound}
                className="h-12 w-full bg-gradient-to-r from-accent to-accent/80"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Create New Round
              </Button>
            )}
          </div>
        )}

        {/* Expired WITH participants - needs draw */}
        {isExpired && roundInfo.status === 0 && Number(roundInfo.totalTicketsSold) > 0 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-warning/20 bg-warning/10 p-4 text-center">
              <Clock className="mx-auto mb-2 h-6 w-6 text-warning" />
              <p className="text-warning-foreground text-sm font-medium">
                Round ended - Draw pending
              </p>
              <p className="text-warning-foreground/80 mt-1 text-xs">
                {roundInfo.totalTicketsSold.toString()} tickets sold. Waiting for winner selection.
              </p>
            </div>
            {isAdmin && onDrawWinner && (
              <Button
                onClick={onDrawWinner}
                disabled={isDrawing}
                className="h-12 w-full bg-gradient-to-r from-success to-success/80"
              >
                {isDrawing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Drawing...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Draw Winner
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Drawing in progress */}
        {roundInfo.status === 1 && (
          <div className="rounded-lg border border-info/20 bg-info/10 p-4 text-center">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-info" />
            <p className="text-info-foreground text-sm font-medium">Drawing in progress...</p>
            <p className="text-info-foreground/80 mt-1 text-xs">Winner will be announced soon!</p>
          </div>
        )}

        {/* Completed - show winner */}
        {roundInfo.status === 2 &&
          roundInfo.winner !== "0x0000000000000000000000000000000000000000" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-success/20 bg-success/10 p-4 text-center">
                <Trophy className="mx-auto mb-2 h-6 w-6 text-success" />
                <p className="text-success-foreground text-sm font-medium">
                  Winner: {roundInfo.winner.slice(0, 6)}...
                  {roundInfo.winner.slice(-4)}
                </p>
                <p className="text-success-foreground/80 mt-1 text-xs">
                  Prize: {formatEther(roundInfo.totalPrize)} BTC
                </p>
              </div>
              {isAdmin && onCreateNewRound && (
                <Button onClick={onCreateNewRound} variant="outline" className="h-12 w-full">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Start Next Round
                </Button>
              )}
            </div>
          )}

        {/* Cancelled */}
        {roundInfo.status === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center">
              <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-destructive" />
              <p className="text-sm font-medium text-destructive">Round Cancelled</p>
              <p className="mt-1 text-xs text-destructive/80">
                Participants can withdraw their capital.
              </p>
            </div>
            {isAdmin && onCreateNewRound && (
              <Button onClick={onCreateNewRound} className="h-12 w-full">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create New Round
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
