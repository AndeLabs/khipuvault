import { describe, it, expect } from "vitest";

import { safeBigIntToNumber, safeDivide } from "../utils/validation";

/**
 * Tests for price feed calculations
 *
 * These tests focus on pure functions and business logic rather than
 * hook mocking, which avoids complex wagmi type mocking issues.
 */

describe("Price conversion utilities", () => {
  describe("safeBigIntToNumber", () => {
    it("should convert 18-decimal BigInt to Number correctly", () => {
      // 100,000 with 18 decimals
      const price = BigInt("100000000000000000000000");
      const result = safeBigIntToNumber(price, 18);
      expect(result).toBeCloseTo(100000, 2);
    });

    it("should handle zero", () => {
      expect(safeBigIntToNumber(0n, 18)).toBe(0);
    });

    it("should handle fractional values", () => {
      // 0.5 with 18 decimals
      const half = BigInt("500000000000000000");
      const result = safeBigIntToNumber(half, 18);
      expect(result).toBeCloseTo(0.5, 6);
    });

    it("should handle very large values without overflow", () => {
      // $1 trillion with 18 decimals
      const trillion = BigInt("1000000000000000000000000000000");
      const result = safeBigIntToNumber(trillion, 18);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("safeDivide", () => {
    it("should divide numbers correctly", () => {
      expect(safeDivide(100, 10)).toBe(10);
      expect(safeDivide(50, 4)).toBe(12.5);
    });

    it("should return default value for division by zero", () => {
      expect(safeDivide(100, 0)).toBe(0);
      expect(safeDivide(100, 0, -1)).toBe(-1);
    });

    it("should handle Infinity denominator", () => {
      expect(safeDivide(100, Infinity)).toBe(0);
    });
  });
});

describe("BTC to USD conversion logic", () => {
  it("should calculate correct USD value", () => {
    const btcPrice = 100000; // $100k per BTC
    const btcAmount = BigInt("1000000000000000000"); // 1 BTC

    const btcValue = safeBigIntToNumber(btcAmount, 18);
    const usdValue = btcValue * btcPrice;

    expect(usdValue).toBe(100000);
  });

  it("should handle partial BTC amounts", () => {
    const btcPrice = 100000;
    const halfBtc = BigInt("500000000000000000"); // 0.5 BTC

    const btcValue = safeBigIntToNumber(halfBtc, 18);
    const usdValue = btcValue * btcPrice;

    expect(usdValue).toBe(50000);
  });
});

describe("USD to BTC conversion logic", () => {
  it("should calculate correct BTC value", () => {
    const btcPrice = 100000;
    const usdAmount = 50000;

    const btcValue = safeDivide(usdAmount, btcPrice);

    expect(btcValue).toBe(0.5);
  });

  it("should handle zero price gracefully", () => {
    const usdAmount = 50000;

    const btcValue = safeDivide(usdAmount, 0);

    expect(btcValue).toBe(0);
  });
});

describe("Price staleness logic", () => {
  const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
  const WARNING_THRESHOLD_MS = 60 * 1000; // 1 minute

  function calculateStaleness(dataUpdatedAt: number | undefined) {
    if (!dataUpdatedAt) return { isStale: false, isWarning: false, ageMs: 0 };

    const ageMs = Date.now() - dataUpdatedAt;
    return {
      isStale: ageMs > STALE_THRESHOLD_MS,
      isWarning: ageMs > WARNING_THRESHOLD_MS && ageMs <= STALE_THRESHOLD_MS,
      ageMs,
    };
  }

  it("should detect fresh prices", () => {
    const recentUpdate = Date.now() - 30000; // 30 seconds ago
    const result = calculateStaleness(recentUpdate);

    expect(result.isStale).toBe(false);
    expect(result.isWarning).toBe(false);
  });

  it("should detect warning state", () => {
    const oldUpdate = Date.now() - 90000; // 90 seconds ago
    const result = calculateStaleness(oldUpdate);

    expect(result.isStale).toBe(false);
    expect(result.isWarning).toBe(true);
  });

  it("should detect stale prices", () => {
    const veryOldUpdate = Date.now() - 150000; // 2.5 minutes ago
    const result = calculateStaleness(veryOldUpdate);

    expect(result.isStale).toBe(true);
    expect(result.isWarning).toBe(false);
  });

  it("should handle undefined dataUpdatedAt", () => {
    const result = calculateStaleness(undefined);

    expect(result.isStale).toBe(false);
    expect(result.isWarning).toBe(false);
    expect(result.ageMs).toBe(0);
  });
});

describe("Price formatting", () => {
  it("should format large prices with locale separators", () => {
    const price = 100000;
    const formatted = `$${price.toLocaleString()}`;

    expect(formatted).toBe("$100,000");
  });

  it("should format prices with decimals", () => {
    const price = 97543.21;
    const formatted = `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

    expect(formatted).toContain("97");
    expect(formatted).toContain("543");
  });
});
