import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createWrapper } from "@/test/test-providers";

import { useBTCPrice, formatUSD, btcToUSD, formatBTCtoUSD } from "../use-btc-price";

describe("useBTCPrice", () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should return loading state initially", () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useBTCPrice(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.price).toBe(95000); // Fallback while loading
  });

  it("should fetch and return BTC price", async () => {
    const mockPrice = 98500;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ bitcoin: { usd: mockPrice } }),
    });

    const { result } = renderHook(() => useBTCPrice(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.price).toBe(mockPrice);
    expect(result.current.error).toBeNull();
    expect(result.current.isFallback).toBe(false);
  });

  it("should return fallback price on API error", async () => {
    // Mock all retries to fail
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useBTCPrice(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 }
    );

    expect(result.current.price).toBe(95000); // Fallback
    expect(result.current.isFallback).toBe(true);
  });

  it("should handle network errors gracefully", async () => {
    // Mock all retries to fail
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useBTCPrice(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 }
    );

    expect(result.current.price).toBe(95000);
    expect(result.current.isFallback).toBe(true);
  });

  it("should have refetch function", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bitcoin: { usd: 100000 } }),
    });

    const { result } = renderHook(() => useBTCPrice(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe("function");
  });
});

describe("formatUSD", () => {
  it("should format small amounts correctly", () => {
    expect(formatUSD(100)).toBe("$100");
    expect(formatUSD(999)).toBe("$999");
  });

  it("should format large amounts with thousand separators", () => {
    expect(formatUSD(1000)).toBe("$1,000");
    expect(formatUSD(1000000)).toBe("$1,000,000");
  });

  it("should round decimal amounts", () => {
    expect(formatUSD(1234.56)).toBe("$1,235");
    expect(formatUSD(1234.4)).toBe("$1,234");
  });

  it("should handle zero", () => {
    expect(formatUSD(0)).toBe("$0");
  });
});

describe("btcToUSD", () => {
  const BTC_PRICE = 100000; // $100k per BTC for easy math

  it("should convert 1 BTC to USD correctly", () => {
    const oneBTC = BigInt("1000000000000000000"); // 1e18 wei
    expect(btcToUSD(oneBTC, BTC_PRICE)).toBe(100000);
  });

  it("should convert 0.5 BTC to USD correctly", () => {
    const halfBTC = BigInt("500000000000000000"); // 0.5e18 wei
    expect(btcToUSD(halfBTC, BTC_PRICE)).toBe(50000);
  });

  it("should handle zero amount", () => {
    expect(btcToUSD(BigInt(0), BTC_PRICE)).toBe(0);
  });

  it("should handle very small amounts", () => {
    // 1e12 wei = 1e12 / 1e18 = 0.000001 BTC
    // 0.000001 BTC * $100,000 = $0.1
    const smallAmount = BigInt("1000000000000"); // 0.000001 BTC
    const result = btcToUSD(smallAmount, BTC_PRICE);
    expect(result).toBeCloseTo(0.1, 4);
  });
});

describe("formatBTCtoUSD", () => {
  it("should format BTC amount as USD string", () => {
    const oneBTC = BigInt("1000000000000000000");
    expect(formatBTCtoUSD(oneBTC, 95000)).toBe("$95,000");
  });

  it("should handle partial BTC amounts", () => {
    const halfBTC = BigInt("500000000000000000");
    expect(formatBTCtoUSD(halfBTC, 100000)).toBe("$50,000");
  });
});
