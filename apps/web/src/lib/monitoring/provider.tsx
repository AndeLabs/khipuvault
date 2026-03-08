/**
 * @fileoverview Monitoring Provider Component
 * @module lib/monitoring/provider
 *
 * React Context provider for performance monitoring:
 * - Auto-initializes Web Vitals
 * - Provides access to monitoring data
 * - Initializes Performance Observer
 */

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode, type JSX } from "react";

import { performanceMonitor } from "./performance";
import { performanceObserver } from "./performance-observer";
import { transactionMetrics } from "./transaction-metrics";
import { initWebVitals, getWebVitalsReport } from "./web-vitals";

import type { WebVitalsReport, TransactionMetricsReport } from "./types";

/**
 * Monitoring context data
 */
interface MonitoringContextValue {
  // Web Vitals
  webVitals: WebVitalsReport | null;
  refreshWebVitals: () => void;

  // Transaction Metrics
  transactionMetrics: TransactionMetricsReport | null;
  refreshTransactionMetrics: () => void;

  // Performance Observer
  performanceObserverInitialized: boolean;

  // Performance Marks
  getPerformanceStats: () => ReturnType<typeof performanceMonitor.getStats>;

  // Overall health score (0-100)
  healthScore: number;
}

/**
 * Create monitoring context
 */
const MonitoringContext = createContext<MonitoringContextValue | undefined>(undefined);

/**
 * Monitoring Provider Props
 */
interface MonitoringProviderProps {
  children: ReactNode;
  /**
   * Enable automatic Web Vitals reporting
   * @default true
   */
  enableWebVitals?: boolean;
  /**
   * Enable Performance Observer
   * @default true
   */
  enablePerformanceObserver?: boolean;
  /**
   * Refresh interval for metrics (ms)
   * @default 30000 (30 seconds)
   */
  refreshInterval?: number;
}

/**
 * Monitoring Provider Component
 *
 * Wraps your app to provide monitoring capabilities
 *
 * @example
 * function App() {
 *   return (
 *     <MonitoringProvider>
 *       <YourApp />
 *     </MonitoringProvider>
 *   );
 * }
 */
export function MonitoringProvider({
  children,
  enableWebVitals = true,
  enablePerformanceObserver = true,
  refreshInterval = 30000,
}: MonitoringProviderProps): JSX.Element {
  const [webVitals, setWebVitals] = useState<WebVitalsReport | null>(null);
  const [txMetrics, setTxMetrics] = useState<TransactionMetricsReport | null>(null);
  const [perfObserverInitialized, setPerfObserverInitialized] = useState(false);
  const [healthScore, setHealthScore] = useState(100);

  // Initialize monitoring on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Initialize Web Vitals
    if (enableWebVitals) {
      void initWebVitals();
      setWebVitals(getWebVitalsReport());
    }

    // Initialize Performance Observer
    if (enablePerformanceObserver) {
      performanceObserver.init();
      setPerfObserverInitialized(true);
    }

    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[MonitoringProvider] Initialized");
    }
  }, [enableWebVitals, enablePerformanceObserver]);

  // Periodically refresh metrics
  useEffect(() => {
    if (!refreshInterval) {
      return;
    }

    const interval = setInterval(() => {
      if (enableWebVitals) {
        setWebVitals(getWebVitalsReport());
      }
      setTxMetrics(transactionMetrics.getMetrics());
      updateHealthScore();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, enableWebVitals]);

  // Calculate health score based on metrics
  const updateHealthScore = () => {
    let score = 100;

    // Deduct points for poor Web Vitals
    const vitals = getWebVitalsReport();
    if (vitals.ratings.LCP === "poor") {
      score -= 15;
    }
    if (vitals.ratings.INP === "poor") {
      score -= 15;
    }
    if (vitals.ratings.CLS === "poor") {
      score -= 10;
    }
    if (vitals.ratings.FCP === "poor") {
      score -= 5;
    }
    if (vitals.ratings.TTFB === "poor") {
      score -= 5;
    }

    // Deduct points for long tasks
    const longTaskCount = performanceObserver.getLongTaskCount();
    if (longTaskCount > 10) {
      score -= 10;
    }
    if (longTaskCount > 20) {
      score -= 20;
    }

    // Deduct points for failed transactions
    const metrics = transactionMetrics.getMetrics();
    if (metrics.successRate < 90) {
      score -= 10;
    }
    if (metrics.successRate < 75) {
      score -= 20;
    }

    setHealthScore(Math.max(0, score));
  };

  const refreshWebVitals = () => {
    setWebVitals(getWebVitalsReport());
  };

  const refreshTransactionMetrics = () => {
    setTxMetrics(transactionMetrics.getMetrics());
  };

  const getPerformanceStats = () => {
    return performanceMonitor.getStats();
  };

  const value: MonitoringContextValue = {
    webVitals,
    refreshWebVitals,
    transactionMetrics: txMetrics,
    refreshTransactionMetrics,
    performanceObserverInitialized: perfObserverInitialized,
    getPerformanceStats,
    healthScore,
  };

  return <MonitoringContext.Provider value={value}>{children}</MonitoringContext.Provider>;
}

/**
 * Hook to access monitoring data
 *
 * @throws Error if used outside MonitoringProvider
 *
 * @example
 * function PerformanceWidget() {
 *   const { webVitals, healthScore } = useMonitoring();
 *   return (
 *     <div>
 *       <p>Health Score: {healthScore}</p>
 *       <p>LCP: {webVitals?.LCP}ms</p>
 *     </div>
 *   );
 * }
 */
export function useMonitoring(): MonitoringContextValue {
  const context = useContext(MonitoringContext);

  if (!context) {
    throw new Error("useMonitoring must be used within MonitoringProvider");
  }

  return context;
}

/**
 * Hook to access Web Vitals data
 *
 * @example
 * function WebVitalsWidget() {
 *   const webVitals = useWebVitals();
 *   if (!webVitals) return null;
 *   return <div>LCP: {webVitals.LCP}ms</div>;
 * }
 */
export function useWebVitals(): WebVitalsReport | null {
  const { webVitals } = useMonitoring();
  return webVitals;
}

/**
 * Hook to access transaction metrics
 *
 * @example
 * function TransactionStats() {
 *   const metrics = useTransactionMetrics();
 *   if (!metrics) return null;
 *   return <div>Success Rate: {metrics.successRate}%</div>;
 * }
 */
export function useTransactionMetrics(): TransactionMetricsReport | null {
  const { transactionMetrics: metrics } = useMonitoring();
  return metrics;
}

/**
 * Hook to access health score
 *
 * @example
 * function HealthIndicator() {
 *   const score = useHealthScore();
 *   return (
 *     <div className={score > 80 ? 'text-green-500' : 'text-red-500'}>
 *       Health: {score}/100
 *     </div>
 *   );
 * }
 */
export function useHealthScore(): number {
  const { healthScore } = useMonitoring();
  return healthScore;
}

/**
 * Hook to access performance stats
 *
 * @example
 * function PerformanceStats() {
 *   const { getPerformanceStats } = useMonitoring();
 *   const stats = getPerformanceStats();
 *   return <pre>{JSON.stringify(stats, null, 2)}</pre>;
 * }
 */
export function usePerformanceStats(): ReturnType<typeof performanceMonitor.getStats> {
  const { getPerformanceStats } = useMonitoring();
  return getPerformanceStats();
}

/**
 * Performance Debug Panel (development only)
 * Shows real-time monitoring data
 */
export function PerformanceDebugPanel(): JSX.Element | null {
  const { webVitals, transactionMetrics: txMetrics, healthScore } = useMonitoring();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        right: 10,
        background: "rgba(0, 0, 0, 0.9)",
        color: "white",
        padding: "10px",
        borderRadius: "8px",
        fontSize: "11px",
        fontFamily: "monospace",
        maxWidth: "300px",
        zIndex: 9999,
        maxHeight: "400px",
        overflow: "auto",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>Performance Monitor</div>

      <div style={{ marginBottom: "8px" }}>
        <div
          style={{ color: healthScore > 80 ? "#4ade80" : healthScore > 60 ? "#fbbf24" : "#ef4444" }}
        >
          Health Score: {healthScore}/100
        </div>
      </div>

      {webVitals && (
        <div style={{ marginBottom: "8px" }}>
          <div style={{ fontWeight: "bold", fontSize: "10px", marginBottom: "4px" }}>
            Web Vitals:
          </div>
          {Object.entries(webVitals).map(([key, value]) => {
            if (key === "timestamp" || key === "ratings") {
              return null;
            }
            const rating = webVitals.ratings[key as keyof typeof webVitals.ratings];
            const color =
              rating === "good"
                ? "#4ade80"
                : rating === "needs-improvement"
                  ? "#fbbf24"
                  : "#ef4444";
            return (
              <div key={key} style={{ color }}>
                {key}:{" "}
                {value !== null ? `${typeof value === "number" ? value.toFixed(0) : value}` : "N/A"}
              </div>
            );
          })}
        </div>
      )}

      {txMetrics && (
        <div>
          <div style={{ fontWeight: "bold", fontSize: "10px", marginBottom: "4px" }}>
            Transactions:
          </div>
          <div>Total: {txMetrics.total}</div>
          <div style={{ color: txMetrics.successRate > 90 ? "#4ade80" : "#fbbf24" }}>
            Success: {txMetrics.successRate.toFixed(1)}%
          </div>
          <div>Avg Time: {txMetrics.avgTime.toFixed(0)}ms</div>
          <div>Pending: {txMetrics.pending}</div>
        </div>
      )}
    </div>
  );
}
