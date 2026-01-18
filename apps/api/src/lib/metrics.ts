/**
 * @fileoverview Prometheus Metrics Service
 * @module lib/metrics
 *
 * Provides application metrics for Prometheus monitoring.
 *
 * Metrics collected:
 * - HTTP request duration histogram
 * - HTTP request counter by status code
 * - Active connections gauge
 * - Database query duration
 * - Cache hit/miss ratio
 */

import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from "prom-client";

// Create a new registry for our metrics
export const register = new Registry();

// Add default Node.js metrics (CPU, memory, event loop, etc.)
collectDefaultMetrics({
  register,
  prefix: "khipu_api_",
});

// ===== CUSTOM METRICS =====

/**
 * HTTP request duration histogram
 * Measures how long HTTP requests take to complete
 */
export const httpRequestDuration = new Histogram({
  name: "khipu_api_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/**
 * HTTP requests counter
 * Counts total number of HTTP requests
 */
export const httpRequestsTotal = new Counter({
  name: "khipu_api_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

/**
 * Active HTTP connections gauge
 */
export const activeConnections = new Gauge({
  name: "khipu_api_active_connections",
  help: "Number of active HTTP connections",
  registers: [register],
});

/**
 * Database query duration histogram
 */
export const dbQueryDuration = new Histogram({
  name: "khipu_api_db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation", "table"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

/**
 * Cache operations counter
 */
export const cacheOperations = new Counter({
  name: "khipu_api_cache_operations_total",
  help: "Total cache operations",
  labelNames: ["operation", "result"],
  registers: [register],
});

/**
 * Authentication operations counter
 */
export const authOperations = new Counter({
  name: "khipu_api_auth_operations_total",
  help: "Total authentication operations",
  labelNames: ["operation", "result"],
  registers: [register],
});

/**
 * Rate limit hits counter
 */
export const rateLimitHits = new Counter({
  name: "khipu_api_rate_limit_hits_total",
  help: "Total rate limit hits",
  labelNames: ["endpoint"],
  registers: [register],
});

/**
 * Blockchain RPC calls counter
 */
export const rpcCalls = new Counter({
  name: "khipu_api_rpc_calls_total",
  help: "Total blockchain RPC calls",
  labelNames: ["method", "result"],
  registers: [register],
});

/**
 * Application info gauge (for version tracking)
 */
export const appInfo = new Gauge({
  name: "khipu_api_info",
  help: "Application information",
  labelNames: ["version", "node_version", "environment"],
  registers: [register],
});

// Set app info on startup
appInfo.set(
  {
    version: process.env.npm_package_version || "3.1.0",
    node_version: process.version,
    environment: process.env.NODE_ENV || "development",
  },
  1
);

/**
 * Helper to measure async operation duration
 */
export async function measureDuration<T>(
  histogram: Histogram<string>,
  labels: Record<string, string>,
  operation: () => Promise<T>
): Promise<T> {
  const end = histogram.startTimer(labels);
  try {
    const result = await operation();
    end();
    return result;
  } catch (error) {
    end();
    throw error;
  }
}

/**
 * Get all metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

/**
 * Get metrics content type
 */
export function getContentType(): string {
  return register.contentType;
}
