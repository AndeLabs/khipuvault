/**
 * @fileoverview Bundle Analysis Configuration
 * @module lib/monitoring/bundle-config
 *
 * Configuration for bundle size monitoring and analysis:
 * - Size budgets for chunks
 * - Warning thresholds
 * - Analysis helpers
 */

/**
 * Bundle size budgets (in KB)
 * Based on recommended limits for good performance
 */
export const BUNDLE_BUDGETS = {
  // Main bundles
  mainBundle: 250, // Main app bundle
  vendorBundle: 350, // Third-party libraries

  // Page chunks
  pageChunk: 150, // Individual page chunks

  // Feature chunks
  featureChunk: 100, // Feature-specific chunks

  // Component chunks
  componentChunk: 50, // Lazy-loaded components

  // Total initial load
  initialLoad: 600, // Combined size of initial bundles

  // Images and assets
  image: 100, // Individual images
  font: 50, // Font files

  // CSS
  css: 50, // CSS bundles
} as const;

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  // Time budgets (in ms)
  initialLoad: 3000, // Time to interactive
  lazyChunkLoad: 1000, // Time to load lazy chunk

  // Size thresholds
  criticalCSS: 14, // Critical CSS should be <14KB for first packet

  // Resource counts
  maxRequests: 50, // Max HTTP requests for initial load
  maxScripts: 10, // Max script tags in initial HTML

  // JavaScript execution
  maxJSExecutionTime: 2000, // Max time for JS execution
  maxLongTasks: 5, // Max long tasks during load
} as const;

/**
 * Warning levels
 */
export type WarningLevel = "info" | "warning" | "critical";

/**
 * Bundle analysis result
 */
export interface BundleAnalysis {
  name: string;
  size: number;
  budget: number;
  percentage: number;
  level: WarningLevel;
  message: string;
}

/**
 * Check if bundle size exceeds budget
 */
export function checkBundleSize(name: string, actualSize: number, budget: number): BundleAnalysis {
  const percentage = (actualSize / budget) * 100;

  let level: WarningLevel;
  let message: string;

  if (percentage <= 80) {
    level = "info";
    message = `Bundle size is within budget (${percentage.toFixed(1)}%)`;
  } else if (percentage <= 100) {
    level = "warning";
    message = `Bundle size is approaching budget (${percentage.toFixed(1)}%)`;
  } else {
    level = "critical";
    message = `Bundle size exceeds budget by ${(percentage - 100).toFixed(1)}%`;
  }

  return {
    name,
    size: actualSize,
    budget,
    percentage,
    level,
    message,
  };
}

/**
 * Get warning color for console output
 */
export function getWarningColor(level: WarningLevel): string {
  switch (level) {
    case "info":
      return "\x1b[32m"; // Green
    case "warning":
      return "\x1b[33m"; // Yellow
    case "critical":
      return "\x1b[31m"; // Red
    default:
      return "\x1b[0m"; // Reset
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Calculate compression ratio
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  if (originalSize === 0) {
    return 0;
  }
  return ((originalSize - compressedSize) / originalSize) * 100;
}

/**
 * Analyze bundle composition
 */
export interface BundleComposition {
  total: number;
  byType: Record<string, number>;
  byVendor: Record<string, number>;
  largest: Array<{ name: string; size: number }>;
}

/**
 * Generate bundle report
 */
export function generateBundleReport(
  bundles: Array<{ name: string; size: number; type: string; vendor?: string }>
): BundleComposition {
  const byType: Record<string, number> = {};
  const byVendor: Record<string, number> = {};
  let total = 0;

  for (const bundle of bundles) {
    total += bundle.size;
    byType[bundle.type] = (byType[bundle.type] || 0) + bundle.size;

    if (bundle.vendor) {
      byVendor[bundle.vendor] = (byVendor[bundle.vendor] || 0) + bundle.size;
    }
  }

  // Get top 10 largest bundles
  const largest = bundles
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .map((b) => ({ name: b.name, size: b.size }));

  return {
    total,
    byType,
    byVendor,
    largest,
  };
}

/**
 * Check if chunk should be code-split
 * Based on size and usage patterns
 */
export function shouldCodeSplit(
  chunkSize: number,
  usageFrequency: "high" | "medium" | "low",
  isAboveTheFold: boolean
): { shouldSplit: boolean; reason: string } {
  // Don't split small chunks
  if (chunkSize < 10 * 1024) {
    return {
      shouldSplit: false,
      reason: "Chunk is too small, splitting would add overhead",
    };
  }

  // Don't split high-frequency above-the-fold code
  if (usageFrequency === "high" && isAboveTheFold) {
    return {
      shouldSplit: false,
      reason: "Code is critical for initial render",
    };
  }

  // Split large low-frequency code
  if (chunkSize > 50 * 1024 && usageFrequency === "low") {
    return {
      shouldSplit: true,
      reason: "Large chunk with low usage frequency",
    };
  }

  // Split medium-frequency code if it's large enough
  if (chunkSize > 100 * 1024 && usageFrequency === "medium") {
    return {
      shouldSplit: true,
      reason: "Large chunk that can be lazy-loaded",
    };
  }

  return {
    shouldSplit: false,
    reason: "Chunk size and usage don't warrant splitting",
  };
}

/**
 * Webpack bundle analyzer configuration
 * Use with @next/bundle-analyzer
 */
export const webpackBundleAnalyzerConfig = {
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true,
  analyzerMode: "static" as const,
  reportFilename: "../analyze/bundle-report.html",
  defaultSizes: "gzip" as const,
  generateStatsFile: true,
  statsFilename: "../analyze/bundle-stats.json",
  logLevel: "info" as const,
};

/**
 * Recommended Next.js bundle optimizations
 */
export const NEXT_BUNDLE_OPTIMIZATIONS = {
  // Minimize main bundle
  modularizeImports: {
    // Tree-shake icon libraries
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{member}}",
    },
    // Tree-shake lodash
    lodash: {
      transform: "lodash/{{member}}",
    },
  },

  // Split chunks config
  splitChunks: {
    chunks: "all" as const,
    cacheGroups: {
      // Separate vendor bundle for third-party code
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: "vendor",
        priority: 10,
      },
      // Separate common code
      common: {
        minChunks: 2,
        priority: 5,
        reuseExistingChunk: true,
      },
      // Separate Web3 libraries (usually large)
      web3: {
        test: /[\\/]node_modules[\\/](wagmi|viem|@wagmi|@tanstack)[\\/]/,
        name: "web3",
        priority: 15,
      },
    },
  },
} as const;

/**
 * Log bundle analysis to console (development only)
 */
export function logBundleAnalysis(analysis: BundleAnalysis[]): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  // eslint-disable-next-line no-console
  console.group("[Bundle Analysis]");

  for (const item of analysis) {
    const color = getWarningColor(item.level);
    const reset = "\x1b[0m";

    // eslint-disable-next-line no-console
    console.log(
      `${color}${item.name}:${reset} ${formatBytes(item.size)} / ${formatBytes(item.budget)} (${item.percentage.toFixed(1)}%)`
    );
    // eslint-disable-next-line no-console
    console.log(`  ${item.message}`);
  }

  // eslint-disable-next-line no-console
  console.groupEnd();
}
