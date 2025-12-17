"use client";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Award,
  RefreshCw,
  FileText,
  Filter,
} from "lucide-react";
import * as React from "react";
import { formatUnits } from "viem";

import { AmountDisplay } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { TransactionLink } from "@/components/ui/transaction-link";
import { cn } from "@/lib/utils";

export type TransactionType =
  | "deposit"
  | "withdraw"
  | "claim"
  | "claim_yield"
  | "claim_referral"
  | "compound"
  | "auto_compound"
  | "toggle_auto_compound";

export interface Transaction {
  hash: string;
  type: TransactionType;
  amount: bigint;
  timestamp: number;
  status: "success" | "pending" | "failed";
  gasUsed?: bigint;
  referrer?: string;
}

interface TransactionHistoryProps {
  transactions?: Transaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const TRANSACTION_LABELS: Record<
  TransactionType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  deposit: {
    label: "Deposit",
    icon: <ArrowDownCircle className="h-4 w-4" />,
    color: "text-success",
  },
  withdraw: {
    label: "Withdraw",
    icon: <ArrowUpCircle className="h-4 w-4" />,
    color: "text-error",
  },
  claim: {
    label: "Claim Yield",
    icon: <Award className="h-4 w-4" />,
    color: "text-lavanda",
  },
  claim_yield: {
    label: "Claim Yield",
    icon: <Award className="h-4 w-4" />,
    color: "text-lavanda",
  },
  claim_referral: {
    label: "Claim Referral",
    icon: <Award className="h-4 w-4" />,
    color: "text-accent",
  },
  compound: {
    label: "Compound",
    icon: <RefreshCw className="h-4 w-4" />,
    color: "text-lavanda",
  },
  auto_compound: {
    label: "Auto-Compound",
    icon: <RefreshCw className="h-4 w-4" />,
    color: "text-lavanda",
  },
  toggle_auto_compound: {
    label: "Toggle Auto-Compound",
    icon: <RefreshCw className="h-4 w-4" />,
    color: "text-muted-foreground",
  },
};

export function TransactionHistory({
  transactions = [],
  isLoading,
  onRefresh,
  className,
}: TransactionHistoryProps) {
  const [filter, setFilter] = React.useState<TransactionType | "all">("all");
  const [page, setPage] = React.useState(1);
  const itemsPerPage = 10;

  // Filter transactions
  const filteredTransactions = React.useMemo(() => {
    if (filter === "all") {
      return transactions;
    }
    return transactions.filter((tx) => tx.type === filter);
  }, [transactions, filter]);

  // Paginate
  const paginatedTransactions = React.useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredTransactions.slice(start, end);
  }, [filteredTransactions, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Format amount
  const formatAmount = (amount: bigint, type: TransactionType) => {
    try {
      const formatted = Number(formatUnits(amount, 18)).toFixed(4);
      const isNegative = type === "withdraw";
      return isNegative ? `-${formatted}` : `+${formatted}`;
    } catch {
      return "0.0000";
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "Just now";
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card variant="surface" className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={`skeleton-${i}`} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasTransactions = transactions.length > 0;

  return (
    <Card variant="surface" className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-lavanda flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                {hasTransactions
                  ? `${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? "s" : ""}`
                  : "No transactions yet"}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasTransactions && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
                />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasTransactions ? (
          <>
            {/* Filters */}
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={filter}
                onValueChange={(value) => {
                  setFilter(value as TransactionType | "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdraw">Withdrawals</SelectItem>
                  <SelectItem value="claim_yield">Yield Claims</SelectItem>
                  <SelectItem value="claim_referral">
                    Referral Claims
                  </SelectItem>
                  <SelectItem value="auto_compound">Auto-Compounds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((tx) => {
                      const txInfo = TRANSACTION_LABELS[tx.type];
                      return (
                        <TableRow key={tx.hash}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "h-8 w-8 rounded-full bg-surface-elevated flex items-center justify-center",
                                  txInfo.color,
                                )}
                              >
                                {txInfo.icon}
                              </div>
                              <span className="font-medium">
                                {txInfo.label}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "font-mono font-semibold",
                                txInfo.color,
                              )}
                            >
                              {tx.amount > BigInt(0) ? (
                                <AmountDisplay
                                  amount={formatAmount(tx.amount, tx.type)}
                                  symbol="mUSD"
                                  size="sm"
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatTimestamp(tx.timestamp)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={(() => {
                                if (tx.status === "success") {
                                  return "success";
                                }
                                if (tx.status === "pending") {
                                  return "secondary";
                                }
                                return "error";
                              })()}
                              className="text-xs"
                            >
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <TransactionLink txHash={tx.hash} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-8"
                      >
                        No transactions found for this filter
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden space-y-3">
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((tx) => {
                  const txInfo = TRANSACTION_LABELS[tx.type];
                  return (
                    <div
                      key={tx.hash}
                      className="p-4 rounded-lg border border-border bg-surface-elevated space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-full bg-surface flex items-center justify-center",
                              txInfo.color,
                            )}
                          >
                            {txInfo.icon}
                          </div>
                          <div>
                            <p className="font-medium">{txInfo.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimestamp(tx.timestamp)}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={(() => {
                            if (tx.status === "success") {
                              return "success";
                            }
                            if (tx.status === "pending") {
                              return "secondary";
                            }
                            return "error";
                          })()}
                          className="text-xs"
                        >
                          {tx.status}
                        </Badge>
                      </div>

                      {tx.amount > BigInt(0) && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Amount
                          </span>
                          <span
                            className={cn(
                              "font-mono font-semibold",
                              txInfo.color,
                            )}
                          >
                            <AmountDisplay
                              amount={formatAmount(tx.amount, tx.type)}
                              symbol="mUSD"
                              size="sm"
                            />
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-border">
                        <TransactionLink txHash={tx.hash} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No transactions found for this filter
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Your transaction history will appear here after you make your
              first deposit, withdrawal, or claim.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
