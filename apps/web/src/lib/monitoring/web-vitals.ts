/**
 * @fileoverview Web Vitals Monitoring
 * @module lib/monitoring/web-vitals
 *
 * Tracks Core Web Vitals metrics:
 * - LCP (Largest Contentful Paint) - Loading performance
 * - FID (First Input Delay) - Interactivity
 * - CLS (Cumulative Layout Shift) - Visual stability
 * - INP (Interaction to Next Paint) - Responsiveness
 * - FCP (First Contentful Paint) - Initial render
 * - TTFB (Time to First Byte) - Server response
 *
 * @see https://web.dev/vitals/
 */

import type { WebVitalsMetric, WebVitalsReport } from "./types";

// Thresholds based on Google's recommendations
// Note: FID is deprecated in web-vitals v4+, replaced by INP
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

// Store metrics in memory
const metricsStore: Map<string, WebVitalsMetric> = new Map();

/**
 * Get rating based on metric value and thresholds
 */
function getRating(
  name: WebVitalsMetric["name"],
  value: number
): "good" | "needs-improvement" | "poor" {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) {
    return "good";
  }
  if (value <= threshold.poor) {
    return "needs-improvement";
  }
  return "poor";
}

/**
 * Report a Web Vitals metric
 * Call this from Next.js reportWebVitals or web-vitals library
 */
export function reportWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  delta?: number;
  navigationType?: string;
}): void {
  // Only track known metrics
  const validMetrics = ["CLS", "FCP", "FID", "INP", "LCP", "TTFB"];
  if (!validMetrics.includes(metric.name)) {
    return;
  }

  const name = metric.name as WebVitalsMetric["name"];
  const rating = getRating(name, metric.value);

  const vitalsMetric: WebVitalsMetric = {
    id: metric.id,
    name,
    value: metric.value,
    rating,
    delta: metric.delta ?? metric.value,
    navigationType: metric.navigationType ?? "navigate",
  };

  // Store the metric
  metricsStore.set(name, vitalsMetric);

  // Log in development
  if (process.env.NODE_ENV === "development") {
    const color =
      rating === "good" ? "\x1b[32m" : rating === "needs-improvement" ? "\x1b[33m" : "\x1b[31m";
    // eslint-disable-next-line no-console
    console.log(
      `${color}[WebVitals] ${name}: ${metric.value.toFixed(name === "CLS" ? 3 : 0)}ms (${rating})\x1b[0m`
    );
  }

  // Send to analytics endpoint in production
  if (process.env.NODE_ENV === "production") {
    sendToAnalytics(vitalsMetric);
  }
}

/**
 * Send metric to analytics endpoint
 */
async function sendToAnalytics(metric: WebVitalsMetric): Promise<void> {
  // Skip if no analytics endpoint configured
  const analyticsEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  if (!analyticsEndpoint) {
    return;
  }

  try {
    // Use sendBeacon for reliability during page unload
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob(
        [
          JSON.stringify({
            type: "web-vitals",
            metric: metric.name,
            value: metric.value,
            rating: metric.rating,
            page: typeof window !== "undefined" ? window.location.pathname : "/",
            timestamp: Date.now(),
          }),
        ],
        { type: "application/json" }
      );
      navigator.sendBeacon(analyticsEndpoint, blob);
    } else {
      // Fallback to fetch
      await fetch(analyticsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "web-vitals",
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
          page: typeof window !== "undefined" ? window.location.pathname : "/",
          timestamp: Date.now(),
        }),
        keepalive: true,
      });
    }
  } catch {
    // Silently fail - don't break the app for analytics
  }
}

/**
 * Get current Web Vitals report
 * Useful for debugging or displaying in UI
 */
export function getWebVitalsReport(): WebVitalsReport {
  const getValue = (name: WebVitalsMetric["name"]): number | null => {
    const metric = metricsStore.get(name);
    return metric?.value ?? null;
  };

  const getRatingValue = (name: WebVitalsMetric["name"]): string | null => {
    const metric = metricsStore.get(name);
    return metric?.rating ?? null;
  };

  return {
    CLS: getValue("CLS"),
    FCP: getValue("FCP"),
    INP: getValue("INP"),
    LCP: getValue("LCP"),
    TTFB: getValue("TTFB"),
    ratings: {
      CLS: getRatingValue("CLS"),
      FCP: getRatingValue("FCP"),
      INP: getRatingValue("INP"),
      LCP: getRatingValue("LCP"),
      TTFB: getRatingValue("TTFB"),
    },
    timestamp: Date.now(),
  };
}

/**
 * Initialize Web Vitals tracking using web-vitals library
 * Call this in your app's entry point
 */
export async function initWebVitals(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    // Dynamically import web-vitals to reduce bundle size
    // Note: FID is deprecated in web-vitals v4+, replaced by INP
    const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import("web-vitals");

    onCLS(reportWebVitals);
    onFCP(reportWebVitals);
    onINP(reportWebVitals);
    onLCP(reportWebVitals);
    onTTFB(reportWebVitals);

    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[WebVitals] Monitoring initialized");
    }
  } catch {
    // web-vitals not installed - that's ok
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("[WebVitals] web-vitals package not installed. Run: pnpm add web-vitals");
    }
  }
}
