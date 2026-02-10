/**
 * @fileoverview Draw History Component
 * @module features/prize-pool/components/draw-history
 *
 * Table displaying past lottery draws with winners
 */

"use client";

import { Trophy, ExternalLink, Copy, CheckCircle2, Calendar } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatMusd } from "@/hooks/web3/use-musd-balance";

import type { LotteryRound } from "@/lib/blockchain/fetch-lottery-pools";

interface DrawHistoryProps {
  rounds: LotteryRound[];
  isLoading?: boolean;
  userAddress?: string;
}

export function DrawHistory({ rounds, isLoading, userAddress }: DrawHistoryProps) {
  const { toast } = useToast();
  const [copiedAddress, setCopiedAddress] = React.useState<string | null>(null);

  // Filter completed rounds and reverse to show newest first
  const completedRounds = rounds
    .filter((r) => r.status === 1) // COMPLETED status
    .filter((r) => r.winner !== "0x0000000000000000000000000000000000000000")
    .reverse();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const copyAddress = (address: string) => {
    void navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast({
      title: "Address Copied",
      description: "Winner address copied to clipboard",
    });

    setTimeout(() => {
      setCopiedAddress(null);
    }, 2000);
  };

  const openExplorer = (address: string) => {
    window.open(`https://explorer.test.mezo.org/address/${address}`, "_blank");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (completedRounds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-lavanda" />
            Draw History
          </CardTitle>
          <CardDescription>Past lottery draws and winners</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            No completed draws yet. Check back after the first lottery ends!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-lavanda" />
          Draw History
        </CardTitle>
        <CardDescription>
          Showing {completedRounds.length} completed draw
          {completedRounds.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-elevated">
                <TableHead>Round</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Winner</TableHead>
                <TableHead>Prize</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedRounds.map((round) => {
                const isUserWinner =
                  userAddress && round.winner.toLowerCase() === userAddress.toLowerCase();

                return (
                  <TableRow
                    key={round.roundId.toString()}
                    className={isUserWinner ? "bg-success/5" : ""}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        #{round.roundId.toString()}
                        {isUserWinner && (
                          <Badge variant="default" className="text-success-foreground bg-success">
                            You Won!
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {formatDate(round.endTime)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-surface-elevated px-2 py-1 text-xs">
                          {formatAddress(round.winner)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyAddress(round.winner)}
                        >
                          {copiedAddress === round.winner ? (
                            <CheckCircle2 className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-success">
                        {formatMusd(round.totalPrize)} mUSD
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {round.totalTicketsSold.toString()}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openExplorer(round.winner)}>
                        <ExternalLink className="mr-1 h-3 w-3" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-surface-elevated p-3 text-center">
            <div className="text-2xl font-bold text-lavanda">{completedRounds.length}</div>
            <div className="text-xs text-muted-foreground">Total Draws</div>
          </div>

          <div className="rounded-lg border border-border bg-surface-elevated p-3 text-center">
            <div className="text-2xl font-bold text-success">
              {formatMusd(completedRounds.reduce((sum, r) => sum + r.totalPrize, BigInt(0)))} mUSD
            </div>
            <div className="text-xs text-muted-foreground">Total Prizes</div>
          </div>

          <div className="rounded-lg border border-border bg-surface-elevated p-3 text-center">
            <div className="text-2xl font-bold text-accent">
              {completedRounds.reduce((sum, r) => sum + Number(r.totalTicketsSold), 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Tickets</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
