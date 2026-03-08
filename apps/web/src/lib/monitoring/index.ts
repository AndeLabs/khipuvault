/**
 * @fileoverview Production Monitoring Module
 * @module lib/monitoring
 *
 * Centralized monitoring for:
 * - Web Vitals (Core Web Vitals)
 * - User Analytics Events
 * - Performance Metrics
 * - Performance Observer (Long Tasks, Resource Timing)
 * - Transaction Metrics
 * - React Performance Hooks
 * - Bundle Analysis
 * - Error Aggregation
 */

// Web Vitals
export { reportWebVitals, getWebVitalsReport, initWebVitals } from "./web-vitals";

// Analytics
export { analytics, AnalyticsEvents } from "./analytics";

// Performance Monitoring
export { performanceMonitor, PerfMarks } from "./performance";

// Performance Observer
export {
  performanceObserver,
  type LongTask,
  type ResourceTimingSummary,
  type NavigationMetrics,
} from "./performance-observer";

// Transaction Metrics
export {
  transactionMetrics,
  trackTransactionStart,
  trackTransactionEnd,
  trackTransactionCancel,
  getTransactionMetrics,
  getMetricsByType,
  getRecentTransactions,
  getPendingTransactions,
  clearTransactionMetrics,
  logTransactionMetrics,
} from "./transaction-metrics";

// React Performance Hooks
export {
  useRenderCount,
  usePerformanceMark,
  useMeasure,
  useWhyDidYouRender,
  useComponentLifecycle,
  useAsyncPerformance,
  useLongRunningEffect,
} from "./hooks";

// Bundle Configuration
export {
  BUNDLE_BUDGETS,
  PERFORMANCE_THRESHOLDS,
  NEXT_BUNDLE_OPTIMIZATIONS,
  checkBundleSize,
  formatBytes,
  calculateCompressionRatio,
  generateBundleReport,
  shouldCodeSplit,
  logBundleAnalysis,
  webpackBundleAnalyzerConfig,
  type WarningLevel,
  type BundleAnalysis,
  type BundleComposition,
} from "./bundle-config";

// Monitoring Provider
export {
  MonitoringProvider,
  useMonitoring,
  useWebVitals,
  useTransactionMetrics,
  useHealthScore,
  usePerformanceStats,
  PerformanceDebugPanel,
} from "./provider";

// Logger
export { logger, getUserErrorMessage, isUserRejection } from "./logger";

// Types
export type {
  WebVitalsMetric,
  WebVitalsReport,
  AnalyticsEvent,
  PerformanceMark,
  TransactionType,
  TransactionMetric,
  TransactionMetricsReport,
} from "./types";
export type { LogLevel, LogCategory, LogContext } from "./logger";
