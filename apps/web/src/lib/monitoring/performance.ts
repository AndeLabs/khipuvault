/**
 * @fileoverview Performance Monitoring Utilities
 * @module lib/monitoring/performance
 *
 * Utilities for measuring and tracking performance:
 * - Custom timing marks
 * - Async operation timing
 * - RPC call performance
 * - Component render timing
 */

import type { PerformanceMark } from "./types";

// Store for custom performance marks
const marks: Map<string, PerformanceMark> = new Map();
const measures: Map<string, number[]> = new Map();

/**
 * Start a performance mark
 */
function startMark(name: string): void {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  marks.set(name, {
    name,
    startTime,
  });

  if (process.env.NODE_ENV === "development") {
    // Use Performance API if available
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark(`${name}-start`);
    }
  }
}

/**
 * End a performance mark and return duration
 */
function endMark(name: string): number | null {
  const mark = marks.get(name);
  if (!mark) {
    return null;
  }

  const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const duration = endTime - mark.startTime;

  // Store measurement for aggregation
  const existing = measures.get(name) ?? [];
  existing.push(duration);
  // Keep only last 100 measurements
  if (existing.length > 100) {
    existing.shift();
  }
  measures.set(name, existing);

  marks.delete(name);

  if (process.env.NODE_ENV === "development") {
    if (typeof performance !== "undefined" && performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }
    // eslint-disable-next-line no-console
    console.log(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
  }

  return duration;
}

/**
 * Measure an async operation
 */
async function measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
  startMark(name);
  try {
    const result = await operation();
    endMark(name);
    return result;
  } catch (error) {
    endMark(name);
    throw error;
  }
}

/**
 * Get average duration for a mark
 */
function getAverageDuration(name: string): number | null {
  const measurements = measures.get(name);
  if (!measurements || measurements.length === 0) {
    return null;
  }

  const sum = measurements.reduce((a, b) => a + b, 0);
  return sum / measurements.length;
}

/**
 * Get P95 duration for a mark
 */
function getP95Duration(name: string): number | null {
  const measurements = measures.get(name);
  if (!measurements || measurements.length === 0) {
    return null;
  }

  const sorted = [...measurements].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * 0.95);
  return sorted[index];
}

/**
 * Get all performance stats
 */
function getStats(): Record<
  string,
  {
    count: number;
    avg: number;
    p95: number;
    min: number;
    max: number;
  }
> {
  const stats: Record<
    string,
    {
      count: number;
      avg: number;
      p95: number;
      min: number;
      max: number;
    }
  > = {};

  for (const [name, measurements] of Array.from(measures.entries())) {
    if (measurements.length === 0) {
      continue;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = measurements.reduce((a, b) => a + b, 0);

    stats[name] = {
      count: measurements.length,
      avg: sum / measurements.length,
      p95: sorted[Math.floor(sorted.length * 0.95)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  return stats;
}

/**
 * Clear all performance data
 */
function clear(): void {
  marks.clear();
  measures.clear();
}

/**
 * Common performance mark names
 */
export const PerfMarks = {
  // RPC calls
  RPC_READ_CONTRACT: "rpc:readContract",
  RPC_WRITE_CONTRACT: "rpc:writeContract",
  RPC_WAIT_TX: "rpc:waitForTransaction",

  // Page loads
  PAGE_LOAD: "page:load",
  PAGE_HYDRATE: "page:hydrate",

  // Data fetching
  FETCH_POOL_INFO: "fetch:poolInfo",
  FETCH_USER_DATA: "fetch:userData",
  FETCH_ANALYTICS: "fetch:analytics",

  // UI interactions
  MODAL_OPEN: "ui:modalOpen",
  FORM_SUBMIT: "ui:formSubmit",
  WALLET_CONNECT: "wallet:connect",
} as const;

/**
 * Performance monitor API
 */
export const performanceMonitor = {
  startMark,
  endMark,
  measureAsync,
  getAverageDuration,
  getP95Duration,
  getStats,
  clear,
  marks: PerfMarks,

  // Convenience method for timing RPC calls
  async timeRPC<T>(name: string, rpcCall: () => Promise<T>): Promise<T> {
    return measureAsync(`rpc:${name}`, rpcCall);
  },

  // Log current stats to console (dev only)
  logStats(): void {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const stats = getStats();
    // eslint-disable-next-line no-console
    console.table(stats);
  },
};
