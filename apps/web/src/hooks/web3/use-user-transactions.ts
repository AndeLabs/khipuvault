"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";

import {
  fetchUserTransactions,
  type Transaction,
} from "@/lib/blockchain/fetch-user-transactions";

/**
 * Hook to fetch user's transaction history from blockchain events
 *
 * Uses TanStack Query for:
 * - Automatic caching and deduplication
 * - Integration with refetchQueries() for real-time updates
 * - Background refetching based on staleTime
 * - Consistent error handling
 *
 * @returns Object with transactions, isLoading, and error states
 */
export function useUserTransactions() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const {
    data: transactions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["individual-pool", "user-transactions", address],
    queryFn: () => {
      if (!publicClient || !address) {
        return Promise.resolve([]);
      }
      return fetchUserTransactions(publicClient, address);
    },
    enabled: !!address && !!publicClient && isConnected,
    staleTime: 30000, // 30 seconds - reasonable for transaction history
    gcTime: 5 * 60 * 1000, // 5 minutes - keep cached data for 5 min
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    transactions,
    isLoading,
    error,
  };
}

/**
 * Re-export types for consumers
 */
export type { Transaction };

/**
 * Format timestamp to readable date
 */
export function formatTransactionDate(timestamp: number): string {
  if (!timestamp) {
    return "-";
  }
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Shorten transaction hash for display
 */
export function shortenTxHash(hash: string): string {
  if (!hash || hash === "0x") {
    return "-";
  }
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/**
 * Get Mezo testnet block explorer URL
 */
export function getExplorerUrl(txHash: string): string {
  // Mezo testnet explorer (update with actual URL when available)
  return `https://explorer.test.mezo.org/tx/${txHash}`;
}
