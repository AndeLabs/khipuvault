/**
 * @fileoverview Tests for Transaction Metrics
 */

import { describe, it, expect, beforeEach } from "vitest";

import {
  trackTransactionStart,
  trackTransactionEnd,
  trackTransactionCancel,
  getTransactionMetrics,
  getMetricsByType,
  getRecentTransactions,
  getPendingTransactions,
  clearTransactionMetrics,
} from "../transaction-metrics";

describe("Transaction Metrics", () => {
  beforeEach(() => {
    clearTransactionMetrics();
  });

  describe("trackTransactionStart", () => {
    it("should create a pending transaction", () => {
      const id = trackTransactionStart("deposit", { amount: "100" });

      expect(id).toBeDefined();
      expect(typeof id).toBe("string");

      const pending = getPendingTransactions();
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(id);
      expect(pending[0].type).toBe("deposit");
      expect(pending[0].status).toBe("pending");
    });

    it("should track metadata", () => {
      const metadata = { amount: "100", pool: "0x123" };
      const id = trackTransactionStart("deposit", metadata);

      const pending = getPendingTransactions();
      expect(pending[0].metadata).toEqual(metadata);
    });
  });

  describe("trackTransactionEnd", () => {
    it("should mark transaction as successful", () => {
      const id = trackTransactionStart("deposit");
      trackTransactionEnd(id, "success", {
        gasUsed: BigInt(21000),
        txHash: "0xabc123",
      });

      const metrics = getTransactionMetrics();
      expect(metrics.successful).toBe(1);
      expect(metrics.pending).toBe(0);
      expect(metrics.total).toBe(1);

      const recent = getRecentTransactions(1);
      expect(recent[0].status).toBe("success");
      expect(recent[0].gasUsed).toBe(21000);
      expect(recent[0].txHash).toBe("0xabc123");
      expect(recent[0].duration).toBeGreaterThanOrEqual(0);
    });

    it("should mark transaction as failed", () => {
      const id = trackTransactionStart("deposit");
      trackTransactionEnd(id, "failed", {
        error: new Error("Transaction reverted"),
      });

      const metrics = getTransactionMetrics();
      expect(metrics.failed).toBe(1);
      expect(metrics.successful).toBe(0);
      expect(metrics.successRate).toBe(0);
    });

    it("should mark transaction as rejected", () => {
      const id = trackTransactionStart("approve");
      trackTransactionEnd(id, "rejected");

      const metrics = getTransactionMetrics();
      expect(metrics.rejected).toBe(1);
      expect(metrics.successful).toBe(0);
    });

    it("should handle non-existent transaction ID gracefully", () => {
      // Should not throw
      expect(() => {
        trackTransactionEnd("non-existent-id", "success");
      }).not.toThrow();
    });
  });

  describe("trackTransactionCancel", () => {
    it("should cancel pending transaction", () => {
      const id = trackTransactionStart("deposit");
      trackTransactionCancel(id);

      const metrics = getTransactionMetrics();
      expect(metrics.pending).toBe(0);
      expect(metrics.rejected).toBe(1);
    });
  });

  describe("getTransactionMetrics", () => {
    it("should calculate success rate correctly", () => {
      const id1 = trackTransactionStart("deposit");
      const id2 = trackTransactionStart("withdraw");
      const id3 = trackTransactionStart("approve");

      trackTransactionEnd(id1, "success");
      trackTransactionEnd(id2, "success");
      trackTransactionEnd(id3, "failed");

      const metrics = getTransactionMetrics();
      expect(metrics.total).toBe(3);
      expect(metrics.successful).toBe(2);
      expect(metrics.failed).toBe(1);
      expect(metrics.successRate).toBeCloseTo(66.67, 1);
    });

    it("should calculate average time correctly", () => {
      const id = trackTransactionStart("deposit");
      // Simulate some time passing
      trackTransactionEnd(id, "success");

      const metrics = getTransactionMetrics();
      expect(metrics.avgTime).toBeGreaterThanOrEqual(0);
      expect(metrics.successful).toBe(1);
    });

    it("should calculate average gas correctly", () => {
      const id1 = trackTransactionStart("deposit");
      const id2 = trackTransactionStart("withdraw");

      trackTransactionEnd(id1, "success", { gasUsed: BigInt(21000) });
      trackTransactionEnd(id2, "success", { gasUsed: BigInt(30000) });

      const metrics = getTransactionMetrics();
      expect(metrics.avgGasUsed).toBe(25500);
    });

    it("should track metrics by type", () => {
      const depositId = trackTransactionStart("deposit");
      const withdrawId = trackTransactionStart("withdraw");
      const approveId = trackTransactionStart("approve");

      trackTransactionEnd(depositId, "success");
      trackTransactionEnd(withdrawId, "failed");
      trackTransactionEnd(approveId, "success");

      const metrics = getTransactionMetrics();

      expect(metrics.byType.deposit.total).toBe(1);
      expect(metrics.byType.deposit.successful).toBe(1);
      expect(metrics.byType.deposit.failed).toBe(0);

      expect(metrics.byType.withdraw.total).toBe(1);
      expect(metrics.byType.withdraw.successful).toBe(0);
      expect(metrics.byType.withdraw.failed).toBe(1);

      expect(metrics.byType.approve.total).toBe(1);
      expect(metrics.byType.approve.successful).toBe(1);
    });

    it("should limit recent transactions to 10", () => {
      const metrics = getTransactionMetrics();
      expect(metrics.recentTransactions.length).toBeLessThanOrEqual(10);
    });
  });

  describe("getMetricsByType", () => {
    it("should return metrics for specific type", () => {
      const id1 = trackTransactionStart("deposit");
      const id2 = trackTransactionStart("deposit");

      trackTransactionEnd(id1, "success", { gasUsed: BigInt(21000) });
      trackTransactionEnd(id2, "failed");

      const depositMetrics = getMetricsByType("deposit");
      expect(depositMetrics.total).toBe(2);
      expect(depositMetrics.successful).toBe(1);
      expect(depositMetrics.failed).toBe(1);
      expect(depositMetrics.avgGasUsed).toBe(21000);
    });
  });

  describe("getRecentTransactions", () => {
    it("should return recent transactions in reverse chronological order", () => {
      const id1 = trackTransactionStart("deposit");
      const id2 = trackTransactionStart("withdraw");
      trackTransactionEnd(id1, "success");
      trackTransactionEnd(id2, "success");

      const recent = getRecentTransactions(2);
      expect(recent).toHaveLength(2);
      // Most recent should be first
      expect(recent[0].type).toBe("withdraw");
      expect(recent[1].type).toBe("deposit");
    });

    it("should respect limit parameter", () => {
      for (let i = 0; i < 5; i++) {
        const id = trackTransactionStart("deposit");
        trackTransactionEnd(id, "success");
      }

      const recent = getRecentTransactions(3);
      expect(recent).toHaveLength(3);
    });
  });

  describe("getPendingTransactions", () => {
    it("should return only pending transactions", () => {
      const id1 = trackTransactionStart("deposit");
      const id2 = trackTransactionStart("withdraw");
      const id3 = trackTransactionStart("approve");

      trackTransactionEnd(id1, "success");
      // id2 and id3 remain pending

      const pending = getPendingTransactions();
      expect(pending).toHaveLength(2);
      expect(pending.every((tx) => tx.status === "pending")).toBe(true);
    });
  });

  describe("clearTransactionMetrics", () => {
    it("should clear all metrics", () => {
      const id = trackTransactionStart("deposit");
      trackTransactionEnd(id, "success");

      clearTransactionMetrics();

      const metrics = getTransactionMetrics();
      expect(metrics.total).toBe(0);
      expect(metrics.pending).toBe(0);
      expect(getPendingTransactions()).toHaveLength(0);
      expect(getRecentTransactions()).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("should handle maximum completed transactions (100)", () => {
      // Create 150 transactions
      for (let i = 0; i < 150; i++) {
        const id = trackTransactionStart("deposit");
        trackTransactionEnd(id, "success");
      }

      const recent = getRecentTransactions(200);
      // Should only keep last 100
      expect(recent.length).toBeLessThanOrEqual(100);
    });

    it("should handle empty state correctly", () => {
      const metrics = getTransactionMetrics();
      expect(metrics.total).toBe(0);
      expect(metrics.successful).toBe(0);
      expect(metrics.failed).toBe(0);
      expect(metrics.rejected).toBe(0);
      expect(metrics.pending).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.avgTime).toBe(0);
      expect(metrics.avgGasUsed).toBe(0);
    });

    it("should handle transactions with no gas data", () => {
      const id = trackTransactionStart("deposit");
      trackTransactionEnd(id, "success"); // No gasUsed provided

      const metrics = getTransactionMetrics();
      expect(metrics.avgGasUsed).toBe(0);
    });
  });
});
