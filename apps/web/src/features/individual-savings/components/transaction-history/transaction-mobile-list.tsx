"use client";

import { TransactionMobileCard } from "./transaction-mobile-card";

import type { Transaction } from "./types";

interface TransactionMobileListProps {
  transactions: Transaction[];
}

export function TransactionMobileList({ transactions }: TransactionMobileListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {transactions.length > 0 ? (
        transactions.map((tx) => <TransactionMobileCard key={tx.hash} transaction={tx} />)
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          No transactions found for this filter
        </div>
      )}
    </div>
  );
}
