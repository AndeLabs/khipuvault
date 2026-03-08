/**
 * @fileoverview Performance Observer Utilities
 * @module lib/monitoring/performance-observer
 *
 * Advanced browser performance monitoring:
 * - Long tasks tracking (>50ms)
 * - Resource timing analysis
 * - Navigation timing metrics
 * - Frame rate monitoring
 */

/**
 * Long task entry structure
 */
interface LongTask {
  name: string;
  startTime: number;
  duration: number;
  attribution?: string;
}

/**
 * Resource timing summary
 */
interface ResourceTimingSummary {
  url: string;
  type: string;
  initiatorType: string;
  duration: number;
  size: number;
  cached: boolean;
}

/**
 * Extended PerformanceEntry for long tasks
 */
interface PerformanceLongTaskTiming extends PerformanceEntry {
  attribution?: Array<{ name: string }>;
}

/**
 * Navigation timing metrics
 */
interface NavigationMetrics {
  dns: number;
  tcp: number;
  request: number;
  response: number;
  domProcessing: number;
  domContentLoaded: number;
  loadComplete: number;
  ttfb: number;
}

/**
 * Performance Observer Class
 * Monitors various browser performance APIs
 */
export class PerformanceMonitor {
  private longTasks: LongTask[] = [];
  private resourceTimings: ResourceTimingSummary[] = [];
  private navigationMetrics: NavigationMetrics | null = null;
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;

  /**
   * Initialize all performance observers
   */
  public init(): void {
    if (this.isInitialized || typeof window === "undefined") {
      return;
    }

    try {
      this.observeLongTasks();
      this.observeResourceTiming();
      this.observeNavigationTiming();
      this.isInitialized = true;

      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("[PerformanceObserver] Initialized");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn("[PerformanceObserver] Failed to initialize:", error);
      }
    }
  }

  /**
   * Observe long tasks (>50ms)
   * These can cause janky user experience
   */
  private observeLongTasks(): void {
    if (!("PerformanceObserver" in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const longTask: LongTask = {
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
            attribution: (entry as PerformanceLongTaskTiming).attribution?.[0]?.name,
          };

          this.longTasks.push(longTask);

          // Keep only last 50 long tasks
          if (this.longTasks.length > 50) {
            this.longTasks.shift();
          }

          // Log in development if task is particularly long
          if (process.env.NODE_ENV === "development" && entry.duration > 100) {
            // eslint-disable-next-line no-console
            console.warn(
              `[LongTask] ${entry.name}: ${entry.duration.toFixed(2)}ms (${longTask.attribution || "unknown"})`
            );
          }
        }
      });

      observer.observe({ entryTypes: ["longtask"] });
      this.observers.push(observer);
    } catch {
      // Long task API not supported
    }
  }

  /**
   * Observe resource timing
   * Track performance of loaded resources (scripts, images, etc.)
   */
  private observeResourceTiming(): void {
    if (!("PerformanceObserver" in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;

          const resource: ResourceTimingSummary = {
            url: resourceEntry.name,
            type: resourceEntry.initiatorType,
            initiatorType: resourceEntry.initiatorType,
            duration: resourceEntry.duration,
            size: resourceEntry.transferSize || 0,
            cached: resourceEntry.transferSize === 0 && resourceEntry.decodedBodySize > 0,
          };

          this.resourceTimings.push(resource);

          // Keep only last 100 resources
          if (this.resourceTimings.length > 100) {
            this.resourceTimings.shift();
          }

          // Log slow resources in development
          if (process.env.NODE_ENV === "development" && resourceEntry.duration > 1000) {
            // eslint-disable-next-line no-console
            console.warn(
              `[SlowResource] ${resourceEntry.initiatorType}: ${resourceEntry.name} (${resourceEntry.duration.toFixed(2)}ms)`
            );
          }
        }
      });

      observer.observe({ entryTypes: ["resource"] });
      this.observers.push(observer);
    } catch {
      // Resource timing API not supported
    }
  }

  /**
   * Observe navigation timing
   * Capture page load performance metrics
   */
  private observeNavigationTiming(): void {
    if (!("PerformanceObserver" in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming;

          this.navigationMetrics = {
            dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
            tcp: navEntry.connectEnd - navEntry.connectStart,
            request: navEntry.responseStart - navEntry.requestStart,
            response: navEntry.responseEnd - navEntry.responseStart,
            domProcessing: navEntry.domInteractive - navEntry.responseEnd,
            domContentLoaded:
              navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
            ttfb: navEntry.responseStart - navEntry.requestStart,
          };

          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.log("[Navigation]", this.navigationMetrics);
          }
        }
      });

      observer.observe({ entryTypes: ["navigation"] });
      this.observers.push(observer);
    } catch {
      // Navigation timing API not supported
    }
  }

  /**
   * Get all long tasks
   */
  public getLongTasks(): LongTask[] {
    return [...this.longTasks];
  }

  /**
   * Get count of long tasks
   */
  public getLongTaskCount(): number {
    return this.longTasks.length;
  }

  /**
   * Get average long task duration
   */
  public getAverageLongTaskDuration(): number {
    if (this.longTasks.length === 0) {
      return 0;
    }
    const total = this.longTasks.reduce((sum, task) => sum + task.duration, 0);
    return total / this.longTasks.length;
  }

  /**
   * Get resource timings
   */
  public getResourceTimings(): ResourceTimingSummary[] {
    return [...this.resourceTimings];
  }

  /**
   * Get resources by type
   */
  public getResourcesByType(type: string): ResourceTimingSummary[] {
    return this.resourceTimings.filter((r) => r.initiatorType === type);
  }

  /**
   * Get slow resources (>1000ms)
   */
  public getSlowResources(): ResourceTimingSummary[] {
    return this.resourceTimings.filter((r) => r.duration > 1000);
  }

  /**
   * Get total resource size
   */
  public getTotalResourceSize(): number {
    return this.resourceTimings.reduce((sum, r) => sum + r.size, 0);
  }

  /**
   * Get cache hit rate
   */
  public getCacheHitRate(): number {
    if (this.resourceTimings.length === 0) {
      return 0;
    }
    const cached = this.resourceTimings.filter((r) => r.cached).length;
    return (cached / this.resourceTimings.length) * 100;
  }

  /**
   * Get navigation metrics
   */
  public getNavigationMetrics(): NavigationMetrics | null {
    return this.navigationMetrics;
  }

  /**
   * Generate summary report
   */
  public getSummaryReport(): {
    longTasks: {
      count: number;
      avgDuration: number;
      total: number;
    };
    resources: {
      count: number;
      totalSize: number;
      cacheHitRate: number;
      slowCount: number;
      byType: Record<string, number>;
    };
    navigation: NavigationMetrics | null;
  } {
    const resourcesByType: Record<string, number> = {};
    for (const resource of this.resourceTimings) {
      resourcesByType[resource.type] = (resourcesByType[resource.type] || 0) + 1;
    }

    return {
      longTasks: {
        count: this.longTasks.length,
        avgDuration: this.getAverageLongTaskDuration(),
        total: this.longTasks.reduce((sum, task) => sum + task.duration, 0),
      },
      resources: {
        count: this.resourceTimings.length,
        totalSize: this.getTotalResourceSize(),
        cacheHitRate: this.getCacheHitRate(),
        slowCount: this.getSlowResources().length,
        byType: resourcesByType,
      },
      navigation: this.navigationMetrics,
    };
  }

  /**
   * Log summary to console (development only)
   */
  public logSummary(): void {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const report = this.getSummaryReport();
    // eslint-disable-next-line no-console
    console.group("[PerformanceObserver] Summary");
    // eslint-disable-next-line no-console
    console.log("Long Tasks:", report.longTasks);
    // eslint-disable-next-line no-console
    console.log("Resources:", report.resources);
    // eslint-disable-next-line no-console
    console.log("Navigation:", report.navigation);
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  /**
   * Clear all stored data
   */
  public clear(): void {
    this.longTasks = [];
    this.resourceTimings = [];
    this.navigationMetrics = null;
  }

  /**
   * Disconnect all observers
   */
  public disconnect(): void {
    for (const observer of this.observers) {
      observer.disconnect();
    }
    this.observers = [];
    this.isInitialized = false;
  }
}

/**
 * Singleton instance
 */
export const performanceObserver = new PerformanceMonitor();

/**
 * Export types
 */
export type { LongTask, ResourceTimingSummary, NavigationMetrics };
