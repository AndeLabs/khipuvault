/**
 * @fileoverview Portfolio analytics hooks for calculating portfolio changes over time
 * @module hooks/use-portfolio-analytics
 *
 * Provides hooks for:
 * - 24h and 7d portfolio value changes
 * - Recent activity feed from transactions
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";

import { useUserTransactionHistory, type Transaction } from "./web3/use-user-transaction-history";

export interface PortfolioChange {
  change24h: number;
  change7d: number;
  percentChange24h: number;
  percentChange7d: number;
}

export interface ActivityItem {
  id: string;
  type: "deposit" | "withdraw" | "claim" | "join_pool" | "create_pool";
  amount?: string;
  timestamp: number;
  txHash?: string;
  status: "success" | "error" | "pending";
  poolName?: string;
}

/**
 * Calculate portfolio value change over time periods
 *
 * Logic:
 * - Calculates net deposit/withdraw balance at different time points
 * - Compares current value vs historical snapshots
 * - Returns absolute and percentage changes
 *
 * @param currentValue - Current total portfolio value (individual + cooperative)
 * @returns Portfolio changes for 24h and 7d periods
 */
export function usePortfolioChanges(currentValue: number): PortfolioChange {
  const { data: transactions = [] } = useUserTransactionHistory();

  return (
    useQuery({
      queryKey: ["portfolio-changes", currentValue, transactions.length],
      queryFn: () => {
        const now = Date.now() / 1000; // Current time in seconds
        const oneDayAgo = now - 24 * 60 * 60;
        const sevenDaysAgo = now - 7 * 24 * 60 * 60;

        // Calculate net deposits at different time points
        const calculateNetDepositsAfter = (timestamp: number): number => {
          return transactions
            .filter((tx) => tx.timestamp >= timestamp)
            .reduce((sum, tx) => {
              const amount = Number(formatUnits(tx.amount, 18));
              if (tx.type === "deposit" || tx.type === "compound") {
                return sum + amount;
              } else if (tx.type === "withdraw" || tx.type === "claim") {
                return sum - amount;
              }
              return sum;
            }, 0);
        };

        // Value 24h ago = current value - net deposits in last 24h
        const netDeposits24h = calculateNetDepositsAfter(oneDayAgo);
        const value24hAgo = currentValue - netDeposits24h;
        const change24h = currentValue - value24hAgo;
        const percentChange24h = value24hAgo > 0 ? (change24h / value24hAgo) * 100 : 0;

        // Value 7d ago = current value - net deposits in last 7 days
        const netDeposits7d = calculateNetDepositsAfter(sevenDaysAgo);
        const value7dAgo = currentValue - netDeposits7d;
        const change7d = currentValue - value7dAgo;
        const percentChange7d = value7dAgo > 0 ? (change7d / value7dAgo) * 100 : 0;

        return {
          change24h,
          change7d,
          percentChange24h,
          percentChange7d,
        };
      },
      enabled: currentValue > 0 && transactions.length > 0,
      staleTime: 60_000, // 1 minute
    }).data ?? {
      change24h: 0,
      change7d: 0,
      percentChange24h: 0,
      percentChange7d: 0,
    }
  );
}

/**
 * Get recent activities from user transaction history
 *
 * @param limit - Maximum number of activities to return (default: 5)
 * @returns Array of recent activities sorted by timestamp (newest first)
 */
export function useRecentActivities(limit: number = 5): ActivityItem[] {
  const { data: transactions = [] } = useUserTransactionHistory();

  return (
    useQuery({
      queryKey: ["recent-activities", transactions.length, limit],
      queryFn: (): ActivityItem[] => {
        return transactions.slice(0, limit).map((tx: Transaction) => ({
          id: tx.hash,
          type: (tx.type === "compound" ? "claim" : tx.type) as ActivityItem["type"], // Map compound to claim for UI
          amount: formatUnits(tx.amount, 18),
          timestamp: tx.timestamp * 1000, // Convert to milliseconds for JS Date
          txHash: tx.hash,
          status: (tx.status === "failed" ? "error" : tx.status) as ActivityItem["status"],
        }));
      },
      enabled: transactions.length > 0,
      staleTime: 30_000, // 30 seconds
    }).data ?? []
  );
}

/**
 * Combined hook for all portfolio analytics
 *
 * @param currentValue - Current total portfolio value
 * @returns Object with changes and recent activities
 */
export function usePortfolioAnalytics(currentValue: number) {
  const changes = usePortfolioChanges(currentValue);
  const recentActivities = useRecentActivities(5);

  return {
    ...changes,
    recentActivities,
  };
}
