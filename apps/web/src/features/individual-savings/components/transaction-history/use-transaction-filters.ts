import * as React from "react";

import type { Transaction, TransactionType } from "./types";

export function useTransactionFilters(transactions: Transaction[]) {
  const [filter, setFilter] = React.useState<TransactionType | "all">("all");

  const filteredTransactions = React.useMemo(() => {
    if (filter === "all") {
      return transactions;
    }
    return transactions.filter((tx) => tx.type === filter);
  }, [transactions, filter]);

  const handleFilterChange = (newFilter: TransactionType | "all") => {
    setFilter(newFilter);
  };

  return {
    filter,
    filteredTransactions,
    handleFilterChange,
  };
}
