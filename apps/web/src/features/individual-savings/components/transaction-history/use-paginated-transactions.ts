import * as React from "react";

import { ITEMS_PER_PAGE } from "./constants";

import type { Transaction } from "./types";

export function usePaginatedTransactions(transactions: Transaction[]) {
  const [page, setPage] = React.useState(1);

  const paginatedTransactions = React.useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return transactions.slice(start, end);
  }, [transactions, page]);

  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);

  const goToNextPage = () => {
    setPage((p) => Math.min(totalPages, p + 1));
  };

  const goToPreviousPage = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const resetPage = () => {
    setPage(1);
  };

  return {
    page,
    totalPages,
    paginatedTransactions,
    goToNextPage,
    goToPreviousPage,
    resetPage,
  };
}
