/**
 * @fileoverview Monitoring Types
 * @module lib/monitoring/types
 */

/**
 * Web Vitals metric structure
 */
export interface WebVitalsMetric {
  id: string;
  /** FID is deprecated in web-vitals v4+, replaced by INP */
  name: "CLS" | "FCP" | "INP" | "LCP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  navigationType: string;
}

/**
 * Analytics event structure
 */
export interface AnalyticsEvent {
  name: string;
  category: "user" | "wallet" | "transaction" | "navigation" | "error" | "performance";
  properties?: Record<string, string | number | boolean>;
  timestamp: number;
}

/**
 * Performance mark structure
 */
export interface PerformanceMark {
  name: string;
  startTime: number;
  duration?: number;
}

/**
 * Aggregated Web Vitals report
 */
export interface WebVitalsReport {
  CLS: number | null;
  FCP: number | null;
  INP: number | null;
  LCP: number | null;
  TTFB: number | null;
  ratings: {
    CLS: string | null;
    FCP: string | null;
    INP: string | null;
    LCP: string | null;
    TTFB: string | null;
  };
  timestamp: number;
}

/**
 * Transaction types for categorization
 */
export type TransactionType =
  | "deposit"
  | "withdraw"
  | "approve"
  | "claim"
  | "create_pool"
  | "join_pool"
  | "leave_pool"
  | "buy_tickets"
  | "stake"
  | "unstake"
  | "borrow"
  | "repay"
  | "other";

/**
 * Transaction metric structure
 */
export interface TransactionMetric {
  id: string;
  type: TransactionType;
  status: "pending" | "success" | "failed" | "rejected";
  startTime: number;
  endTime?: number;
  duration?: number;
  gasUsed?: number;
  txHash?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Aggregated transaction metrics report
 */
export interface TransactionMetricsReport {
  total: number;
  successful: number;
  failed: number;
  rejected: number;
  pending: number;
  successRate: number;
  avgTime: number;
  avgGasUsed: number;
  byType: Record<
    TransactionType,
    {
      total: number;
      successful: number;
      failed: number;
      avgTime: number;
      avgGasUsed: number;
    }
  >;
  recentTransactions: TransactionMetric[];
}
