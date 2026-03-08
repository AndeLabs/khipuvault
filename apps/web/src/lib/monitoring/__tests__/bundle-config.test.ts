/**
 * @fileoverview Bundle Configuration Tests
 */

import { describe, it, expect } from "vitest";

import {
  BUNDLE_BUDGETS,
  PERFORMANCE_THRESHOLDS,
  checkBundleSize,
  formatBytes,
  calculateCompressionRatio,
  generateBundleReport,
  shouldCodeSplit,
  getWarningColor,
} from "../bundle-config";

describe("Bundle Configuration", () => {
  describe("BUNDLE_BUDGETS", () => {
    it("should have all required budgets", () => {
      expect(BUNDLE_BUDGETS.mainBundle).toBeDefined();
      expect(BUNDLE_BUDGETS.vendorBundle).toBeDefined();
      expect(BUNDLE_BUDGETS.pageChunk).toBeDefined();
      expect(BUNDLE_BUDGETS.initialLoad).toBeDefined();
    });

    it("should have reasonable budget values", () => {
      expect(BUNDLE_BUDGETS.mainBundle).toBeGreaterThan(0);
      expect(BUNDLE_BUDGETS.vendorBundle).toBeGreaterThan(0);
      expect(BUNDLE_BUDGETS.initialLoad).toBeGreaterThan(BUNDLE_BUDGETS.mainBundle);
    });
  });

  describe("PERFORMANCE_THRESHOLDS", () => {
    it("should have all required thresholds", () => {
      expect(PERFORMANCE_THRESHOLDS.initialLoad).toBeDefined();
      expect(PERFORMANCE_THRESHOLDS.lazyChunkLoad).toBeDefined();
      expect(PERFORMANCE_THRESHOLDS.maxLongTasks).toBeDefined();
    });
  });

  describe("checkBundleSize", () => {
    it("should return info level when under 80% of budget", () => {
      const result = checkBundleSize("test", 100, 150);
      expect(result.level).toBe("info");
      expect(result.percentage).toBeCloseTo(66.67, 1);
    });

    it("should return warning level between 80-100% of budget", () => {
      const result = checkBundleSize("test", 90, 100);
      expect(result.level).toBe("warning");
      expect(result.percentage).toBe(90);
    });

    it("should return critical level when over budget", () => {
      const result = checkBundleSize("test", 120, 100);
      expect(result.level).toBe("critical");
      expect(result.percentage).toBe(120);
    });

    it("should include all required properties", () => {
      const result = checkBundleSize("test", 100, 200);
      expect(result).toHaveProperty("name", "test");
      expect(result).toHaveProperty("size", 100);
      expect(result).toHaveProperty("budget", 200);
      expect(result).toHaveProperty("percentage");
      expect(result).toHaveProperty("level");
      expect(result).toHaveProperty("message");
    });
  });

  describe("formatBytes", () => {
    it("should format 0 bytes", () => {
      expect(formatBytes(0)).toBe("0 Bytes");
    });

    it("should format bytes", () => {
      expect(formatBytes(500)).toContain("Bytes");
    });

    it("should format kilobytes", () => {
      expect(formatBytes(1024)).toContain("KB");
      expect(formatBytes(1024)).toBe("1 KB");
    });

    it("should format megabytes", () => {
      expect(formatBytes(1024 * 1024)).toContain("MB");
      expect(formatBytes(1024 * 1024)).toBe("1 MB");
    });

    it("should format gigabytes", () => {
      expect(formatBytes(1024 * 1024 * 1024)).toContain("GB");
      expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
    });

    it("should respect decimal places", () => {
      const result = formatBytes(1500, 1);
      expect(result).toContain("1.5");
    });
  });

  describe("calculateCompressionRatio", () => {
    it("should return 0 for zero original size", () => {
      expect(calculateCompressionRatio(0, 0)).toBe(0);
    });

    it("should calculate compression ratio correctly", () => {
      // 100 bytes compressed to 50 bytes = 50% compression
      expect(calculateCompressionRatio(100, 50)).toBe(50);
    });

    it("should handle no compression", () => {
      expect(calculateCompressionRatio(100, 100)).toBe(0);
    });

    it("should handle full compression", () => {
      expect(calculateCompressionRatio(100, 0)).toBe(100);
    });
  });

  describe("generateBundleReport", () => {
    it("should generate empty report for no bundles", () => {
      const report = generateBundleReport([]);
      expect(report.total).toBe(0);
      expect(report.byType).toEqual({});
      expect(report.byVendor).toEqual({});
      expect(report.largest).toEqual([]);
    });

    it("should calculate total size", () => {
      const bundles = [
        { name: "a", size: 100, type: "js" },
        { name: "b", size: 200, type: "js" },
      ];
      const report = generateBundleReport(bundles);
      expect(report.total).toBe(300);
    });

    it("should group by type", () => {
      const bundles = [
        { name: "a", size: 100, type: "js" },
        { name: "b", size: 200, type: "js" },
        { name: "c", size: 50, type: "css" },
      ];
      const report = generateBundleReport(bundles);
      expect(report.byType.js).toBe(300);
      expect(report.byType.css).toBe(50);
    });

    it("should group by vendor", () => {
      const bundles = [
        { name: "a", size: 100, type: "js", vendor: "react" },
        { name: "b", size: 200, type: "js", vendor: "react" },
        { name: "c", size: 50, type: "js", vendor: "vue" },
      ];
      const report = generateBundleReport(bundles);
      expect(report.byVendor.react).toBe(300);
      expect(report.byVendor.vue).toBe(50);
    });

    it("should list largest bundles", () => {
      const bundles = [
        { name: "small", size: 10, type: "js" },
        { name: "large", size: 1000, type: "js" },
        { name: "medium", size: 100, type: "js" },
      ];
      const report = generateBundleReport(bundles);
      expect(report.largest[0].name).toBe("large");
      expect(report.largest[1].name).toBe("medium");
      expect(report.largest[2].name).toBe("small");
    });

    it("should limit largest to 10 items", () => {
      const bundles = Array.from({ length: 20 }, (_, i) => ({
        name: `bundle-${i}`,
        size: i * 10,
        type: "js",
      }));
      const report = generateBundleReport(bundles);
      expect(report.largest.length).toBe(10);
    });
  });

  describe("shouldCodeSplit", () => {
    it("should not split small chunks", () => {
      const result = shouldCodeSplit(5 * 1024, "low", false);
      expect(result.shouldSplit).toBe(false);
      expect(result.reason).toContain("too small");
    });

    it("should not split critical high-frequency code", () => {
      const result = shouldCodeSplit(100 * 1024, "high", true);
      expect(result.shouldSplit).toBe(false);
      expect(result.reason).toContain("critical");
    });

    it("should split large low-frequency code", () => {
      const result = shouldCodeSplit(100 * 1024, "low", false);
      expect(result.shouldSplit).toBe(true);
      expect(result.reason).toContain("low usage");
    });

    it("should split very large medium-frequency code", () => {
      const result = shouldCodeSplit(150 * 1024, "medium", false);
      expect(result.shouldSplit).toBe(true);
      expect(result.reason).toContain("lazy-loaded");
    });
  });

  describe("getWarningColor", () => {
    it("should return green for info", () => {
      expect(getWarningColor("info")).toBe("\x1b[32m");
    });

    it("should return yellow for warning", () => {
      expect(getWarningColor("warning")).toBe("\x1b[33m");
    });

    it("should return red for critical", () => {
      expect(getWarningColor("critical")).toBe("\x1b[31m");
    });
  });
});
