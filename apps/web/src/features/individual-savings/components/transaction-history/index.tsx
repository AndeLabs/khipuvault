"use client";

import { FileText, RefreshCw } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { TransactionFilters } from "./transaction-filters";
import { TransactionMobileList } from "./transaction-mobile-list";
import { TransactionPagination } from "./transaction-pagination";
import { TransactionTable } from "./transaction-table";
import { usePaginatedTransactions } from "./use-paginated-transactions";
import { useTransactionFilters } from "./use-transaction-filters";

import type { Transaction } from "./types";

interface TransactionHistoryProps {
  transactions?: Transaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function TransactionHistory({
  transactions = [],
  isLoading,
  onRefresh,
  className,
}: TransactionHistoryProps) {
  const { filter, filteredTransactions, handleFilterChange } = useTransactionFilters(transactions);
  const { page, totalPages, paginatedTransactions, goToNextPage, goToPreviousPage, resetPage } =
    usePaginatedTransactions(filteredTransactions);

  // Reset to page 1 when filter changes
  React.useEffect(() => {
    resetPage();
  }, [filter, resetPage]);

  if (isLoading) {
    return (
      <Card variant="surface" className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
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
            <div className="bg-gradient-lavanda flex h-10 w-10 items-center justify-center rounded-full">
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

          {hasTransactions && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasTransactions ? (
          <>
            <TransactionFilters value={filter} onChange={handleFilterChange} />
            <TransactionTable transactions={paginatedTransactions} />
            <TransactionMobileList transactions={paginatedTransactions} />
            <TransactionPagination
              currentPage={page}
              totalPages={totalPages}
              onPrevious={goToPreviousPage}
              onNext={goToNextPage}
            />
          </>
        ) : (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No Transactions Yet</h3>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Your transaction history will appear here after you make your first deposit,
              withdrawal, or claim.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Re-export types for convenience
export type { Transaction, TransactionType } from "./types";
