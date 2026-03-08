/**
 * @fileoverview Transaction Metrics Monitoring
 * @module lib/monitoring/transaction-metrics
 *
 * Track blockchain transaction performance:
 * - Transaction start/end timing
 * - Success/failure rates
 * - Gas usage tracking
 * - Average transaction times
 * - Transaction type categorization
 */

import { logger } from "./logger";

import type { TransactionMetric, TransactionMetricsReport, TransactionType } from "./types";

// ============================================================================
// STORAGE
// ============================================================================

/** Active transactions (pending) */
const activeTransactions: Map<string, TransactionMetric> = new Map();

/** Completed transactions (last 100) */
const completedTransactions: TransactionMetric[] = [];
const MAX_COMPLETED = 100;

// ============================================================================
// CORE TRACKING
// ============================================================================

/**
 * Start tracking a transaction
 * @returns Transaction ID for tracking
 */
export function trackTransactionStart(
  type: TransactionType,
  metadata?: Record<string, unknown>
): string {
  const id = generateTransactionId();
  const startTime = Date.now();

  const metric: TransactionMetric = {
    id,
    type,
    status: "pending",
    startTime,
    metadata,
  };

  activeTransactions.set(id, metric);

  if (process.env.NODE_ENV === "development") {
    logger.debug(`Transaction started: ${type}`, {
      category: "transaction",
      metadata: { id, type },
    });
  }

  return id;
}

/**
 * End tracking a transaction
 */
export function trackTransactionEnd(
  id: string,
  status: "success" | "failed" | "rejected",
  options?: {
    gasUsed?: bigint;
    txHash?: string;
    error?: Error | unknown;
  }
): void {
  const metric = activeTransactions.get(id);
  if (!metric) {
    logger.warn(`Attempted to end non-existent transaction: ${id}`, {
      category: "transaction",
    });
    return;
  }

  const endTime = Date.now();
  const duration = endTime - metric.startTime;

  // Update metric
  metric.status = status;
  metric.endTime = endTime;
  metric.duration = duration;
  metric.gasUsed = options?.gasUsed ? Number(options.gasUsed) : undefined;
  metric.txHash = options?.txHash;

  // Move to completed
  activeTransactions.delete(id);
  completedTransactions.unshift(metric);

  // Keep only last MAX_COMPLETED
  if (completedTransactions.length > MAX_COMPLETED) {
    completedTransactions.pop();
  }

  // Log result
  if (process.env.NODE_ENV === "development") {
    const color =
      status === "success" ? "\x1b[32m" : status === "rejected" ? "\x1b[33m" : "\x1b[31m";
    // eslint-disable-next-line no-console
    console.log(
      `${color}[Tx] ${metric.type} ${status} in ${duration}ms${metric.txHash ? ` (${metric.txHash.slice(0, 10)}...)` : ""}\x1b[0m`
    );
  }

  // Log errors
  if (status === "failed" && options?.error) {
    logger.txError(`Transaction failed: ${metric.type}`, options.error, options.txHash);
  }
}

/**
 * Cancel/abort a pending transaction
 */
export function trackTransactionCancel(id: string): void {
  const metric = activeTransactions.get(id);
  if (!metric) {
    return;
  }

  trackTransactionEnd(id, "rejected");
}

// ============================================================================
// METRICS AGGREGATION
// ============================================================================

/**
 * Get aggregated transaction metrics
 */
export function getTransactionMetrics(): TransactionMetricsReport {
  const allTransactions = [...Array.from(activeTransactions.values()), ...completedTransactions];

  // Overall stats
  const total = completedTransactions.length;
  const successful = completedTransactions.filter((tx) => tx.status === "success").length;
  const failed = completedTransactions.filter((tx) => tx.status === "failed").length;
  const rejected = completedTransactions.filter((tx) => tx.status === "rejected").length;
  const pending = activeTransactions.size;

  // Calculate success rate
  const successRate = total > 0 ? (successful / total) * 100 : 0;

  // Calculate average times
  const successfulTxs = completedTransactions.filter(
    (tx) => tx.status === "success" && tx.duration !== undefined
  );
  const avgTime =
    successfulTxs.length > 0
      ? successfulTxs.reduce((sum, tx) => sum + (tx.duration || 0), 0) / successfulTxs.length
      : 0;

  // Calculate average gas
  const txsWithGas = completedTransactions.filter(
    (tx) => tx.status === "success" && tx.gasUsed !== undefined
  );
  const avgGasUsed =
    txsWithGas.length > 0
      ? txsWithGas.reduce((sum, tx) => sum + (tx.gasUsed || 0), 0) / txsWithGas.length
      : 0;

  // Stats by type
  const byType: Record<
    TransactionType,
    {
      total: number;
      successful: number;
      failed: number;
      avgTime: number;
      avgGasUsed: number;
    }
  > = {} as Record<
    TransactionType,
    {
      total: number;
      successful: number;
      failed: number;
      avgTime: number;
      avgGasUsed: number;
    }
  >;

  const types: TransactionType[] = [
    "deposit",
    "withdraw",
    "approve",
    "claim",
    "create_pool",
    "join_pool",
    "leave_pool",
    "buy_tickets",
    "stake",
    "unstake",
    "borrow",
    "repay",
    "other",
  ];

  for (const type of types) {
    const typeTxs = completedTransactions.filter((tx) => tx.type === type);
    const typeSuccessful = typeTxs.filter((tx) => tx.status === "success");
    const typeFailed = typeTxs.filter((tx) => tx.status === "failed");

    const typeWithTime = typeSuccessful.filter((tx) => tx.duration !== undefined);
    const typeAvgTime =
      typeWithTime.length > 0
        ? typeWithTime.reduce((sum, tx) => sum + (tx.duration || 0), 0) / typeWithTime.length
        : 0;

    const typeWithGas = typeSuccessful.filter((tx) => tx.gasUsed !== undefined);
    const typeAvgGas =
      typeWithGas.length > 0
        ? typeWithGas.reduce((sum, tx) => sum + (tx.gasUsed || 0), 0) / typeWithGas.length
        : 0;

    byType[type] = {
      total: typeTxs.length,
      successful: typeSuccessful.length,
      failed: typeFailed.length,
      avgTime: typeAvgTime,
      avgGasUsed: typeAvgGas,
    };
  }

  return {
    total,
    successful,
    failed,
    rejected,
    pending,
    successRate,
    avgTime,
    avgGasUsed,
    byType,
    recentTransactions: completedTransactions.slice(0, 10),
  };
}

/**
 * Get metrics for a specific transaction type
 */
export function getMetricsByType(type: TransactionType) {
  const metrics = getTransactionMetrics();
  return metrics.byType[type];
}

/**
 * Get all recent transactions
 */
export function getRecentTransactions(limit = 10): TransactionMetric[] {
  return completedTransactions.slice(0, limit);
}

/**
 * Get pending transactions
 */
export function getPendingTransactions(): TransactionMetric[] {
  return Array.from(activeTransactions.values());
}

/**
 * Clear all transaction metrics (useful for testing)
 */
export function clearTransactionMetrics(): void {
  activeTransactions.clear();
  completedTransactions.length = 0;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate unique transaction ID (not for security purposes)
 */
function generateTransactionId(): string {
  // Use crypto.randomUUID if available, fallback to timestamp-based
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `tx_${crypto.randomUUID()}`;
  }
  return `tx_${Date.now()}_${performance.now().toString(36).replace(".", "")}`;
}

/**
 * Log transaction metrics summary (dev only)
 */
export function logTransactionMetrics(): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const metrics = getTransactionMetrics();

  // eslint-disable-next-line no-console
  console.log("\n📊 Transaction Metrics Summary");
  // eslint-disable-next-line no-console
  console.log("================================");
  // eslint-disable-next-line no-console
  console.log(`Total: ${metrics.total}`);
  // eslint-disable-next-line no-console
  console.log(`Success: ${metrics.successful} (${metrics.successRate.toFixed(1)}%)`);
  // eslint-disable-next-line no-console
  console.log(`Failed: ${metrics.failed}`);
  // eslint-disable-next-line no-console
  console.log(`Rejected: ${metrics.rejected}`);
  // eslint-disable-next-line no-console
  console.log(`Pending: ${metrics.pending}`);
  // eslint-disable-next-line no-console
  console.log(`Avg Time: ${metrics.avgTime.toFixed(0)}ms`);
  // eslint-disable-next-line no-console
  console.log(`Avg Gas: ${metrics.avgGasUsed.toFixed(0)}`);
  // eslint-disable-next-line no-console
  console.log("\nBy Type:");

  // Filter out types with no transactions
  const typeStats = Object.entries(metrics.byType).filter(([, stats]) => stats.total > 0);

  if (typeStats.length > 0) {
    // eslint-disable-next-line no-console
    console.table(
      Object.fromEntries(
        typeStats.map(([type, stats]) => [
          type,
          {
            total: stats.total,
            success: stats.successful,
            failed: stats.failed,
            "avg time (ms)": stats.avgTime.toFixed(0),
            "avg gas": stats.avgGasUsed.toFixed(0),
          },
        ])
      )
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const transactionMetrics = {
  trackStart: trackTransactionStart,
  trackEnd: trackTransactionEnd,
  trackCancel: trackTransactionCancel,
  getMetrics: getTransactionMetrics,
  getByType: getMetricsByType,
  getRecent: getRecentTransactions,
  getPending: getPendingTransactions,
  clear: clearTransactionMetrics,
  logSummary: logTransactionMetrics,
};
