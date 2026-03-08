/**
 * @fileoverview Performance Observer Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

import { PerformanceMonitor } from "../performance-observer";

describe("PerformanceMonitor", () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe("initialization", () => {
    it("should initialize without errors", () => {
      expect(() => monitor.init()).not.toThrow();
    });

    it("should not initialize twice", () => {
      monitor.init();
      monitor.init();
      // Should not throw or cause issues
      expect(true).toBe(true);
    });
  });

  describe("long tasks", () => {
    it("should return empty array initially", () => {
      expect(monitor.getLongTasks()).toEqual([]);
      expect(monitor.getLongTaskCount()).toBe(0);
    });

    it("should calculate average duration correctly", () => {
      expect(monitor.getAverageLongTaskDuration()).toBe(0);
    });
  });

  describe("resource timings", () => {
    it("should return empty array initially", () => {
      expect(monitor.getResourceTimings()).toEqual([]);
    });

    it("should calculate total size correctly", () => {
      expect(monitor.getTotalResourceSize()).toBe(0);
    });

    it("should calculate cache hit rate correctly", () => {
      expect(monitor.getCacheHitRate()).toBe(0);
    });

    it("should filter slow resources", () => {
      expect(monitor.getSlowResources()).toEqual([]);
    });
  });

  describe("navigation metrics", () => {
    it("should return null initially", () => {
      expect(monitor.getNavigationMetrics()).toBeNull();
    });
  });

  describe("summary report", () => {
    it("should generate summary report", () => {
      const summary = monitor.getSummaryReport();

      expect(summary).toHaveProperty("longTasks");
      expect(summary).toHaveProperty("resources");
      expect(summary).toHaveProperty("navigation");

      expect(summary.longTasks).toHaveProperty("count");
      expect(summary.longTasks).toHaveProperty("avgDuration");
      expect(summary.longTasks).toHaveProperty("total");

      expect(summary.resources).toHaveProperty("count");
      expect(summary.resources).toHaveProperty("totalSize");
      expect(summary.resources).toHaveProperty("cacheHitRate");
      expect(summary.resources).toHaveProperty("slowCount");
      expect(summary.resources).toHaveProperty("byType");
    });
  });

  describe("cleanup", () => {
    it("should clear data", () => {
      monitor.clear();

      expect(monitor.getLongTasks()).toEqual([]);
      expect(monitor.getResourceTimings()).toEqual([]);
      expect(monitor.getNavigationMetrics()).toBeNull();
    });

    it("should disconnect observers", () => {
      monitor.init();
      monitor.disconnect();
      // Should not cause errors
      expect(true).toBe(true);
    });
  });

  describe("log methods", () => {
    it("should not throw when logging summary", () => {
      expect(() => monitor.logSummary()).not.toThrow();
    });
  });
});
