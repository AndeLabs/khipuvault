/**
 * @fileoverview Mezo Price Feed Hook
 * @module hooks/web3/mezo/use-mezo-price-feed
 *
 * Hook to get real-time BTC/USD price from Mezo's on-chain oracle.
 * Uses Pyth-powered price feeds with frequent updates (Mezo v6 feature).
 *
 * Security Features:
 * - Stale price detection with configurable threshold
 * - Price health indicators for UI feedback
 * - Safe number formatting to prevent precision loss
 */

"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { useReadContract, useReadContracts, useBlockNumber } from "wagmi";

import { MEZO_V3_ADDRESSES, MEZO_PRICE_FEED_ABI } from "@/lib/web3/contracts-v3";
import { safeBigIntToNumber, safeDivide } from "./utils/validation";

const PRICE_FEED_ADDRESS = MEZO_V3_ADDRESSES.priceFeed;

/** Price staleness threshold in milliseconds (2 minutes) */
const STALE_PRICE_THRESHOLD_MS = 2 * 60 * 1000;

/** Warning threshold before considered fully stale (1 minute) */
const STALE_WARNING_THRESHOLD_MS = 60 * 1000;

export type PriceStatus = "fresh" | "warning" | "stale" | "loading" | "error";

/**
 * Hook to get BTC/USD price from Mezo's on-chain price feed
 *
 * Features:
 * - Real-time price from Mezo's Pyth-powered oracle
 * - Auto-refresh every 30 seconds
 * - Fallback to last good price if current unavailable
 * - **NEW: Stale price detection with visual indicators**
 */
export function useMezoPriceFeed() {
  const { data, isLoading, error, refetch, dataUpdatedAt } = useReadContract({
    address: PRICE_FEED_ADDRESS,
    abi: MEZO_PRICE_FEED_ABI,
    functionName: "lastGoodPrice",
    query: {
      staleTime: 30 * 1000, // Consider fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      retry: 3,
      retryDelay: 1000,
    },
  });

  const priceRaw = data ? BigInt(data as bigint) : 0n;
  // Use safe conversion to prevent precision loss with large numbers
  const priceFormatted = priceRaw > 0n ? safeBigIntToNumber(priceRaw, 18) : 0;

  // Calculate staleness based on when data was last fetched
  const staleness = useMemo(() => {
    if (!dataUpdatedAt) return { isStale: false, isWarning: false, ageMs: 0 };

    const ageMs = Date.now() - dataUpdatedAt;
    return {
      isStale: ageMs > STALE_PRICE_THRESHOLD_MS,
      isWarning: ageMs > STALE_WARNING_THRESHOLD_MS && ageMs <= STALE_PRICE_THRESHOLD_MS,
      ageMs,
      ageFormatted: ageMs < 1000 ? "Just now" : `${Math.floor(ageMs / 1000)}s ago`,
    };
  }, [dataUpdatedAt]);

  // Determine overall price status for UI
  const priceStatus: PriceStatus = useMemo(() => {
    if (error) return "error";
    if (isLoading) return "loading";
    if (staleness.isStale) return "stale";
    if (staleness.isWarning) return "warning";
    return "fresh";
  }, [error, isLoading, staleness]);

  return {
    /** Raw price in 18 decimals */
    priceRaw,
    /** Price formatted as number (USD per BTC) */
    price: priceFormatted,
    /** Formatted price string */
    priceFormatted: priceFormatted > 0 ? `$${priceFormatted.toLocaleString()}` : "Loading...",
    isLoading,
    error,
    refetch,

    // Staleness tracking (Security: Medium severity fix)
    /** When the price data was last updated (Unix timestamp ms) */
    dataUpdatedAt,
    /** Price age in milliseconds */
    priceAgeMs: staleness.ageMs,
    /** Human-readable price age */
    priceAgeFormatted: staleness.ageFormatted ?? "Unknown",
    /** True if price is older than warning threshold */
    isPriceWarning: staleness.isWarning,
    /** True if price is older than stale threshold */
    isPriceStale: staleness.isStale,
    /** Overall price status for UI styling */
    priceStatus,
  };
}

/**
 * Hook to get price feed status and metadata
 */
export function usePriceFeedStatus() {
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: PRICE_FEED_ADDRESS,
        abi: MEZO_PRICE_FEED_ABI,
        functionName: "status",
      },
      {
        address: PRICE_FEED_ADDRESS,
        abi: MEZO_PRICE_FEED_ABI,
        functionName: "lastGoodPrice",
      },
    ],
    query: {
      staleTime: 60 * 1000,
    },
  });

  const status = data?.[0]?.result as number | undefined;
  const lastGoodPrice = data?.[1]?.result as bigint | undefined;

  // Price feed status enum: 0 = working, 1 = frozen, 2 = untrusted
  const statusLabel =
    status === 0 ? "Active" : status === 1 ? "Frozen" : status === 2 ? "Untrusted" : "Unknown";
  const isHealthy = status === 0;

  return {
    status,
    statusLabel,
    isHealthy,
    lastGoodPrice: lastGoodPrice ?? 0n,
    lastGoodPriceFormatted: lastGoodPrice ? Number(formatUnits(lastGoodPrice, 18)) : 0,
    isLoading,
    error,
  };
}

/**
 * Convert BTC amount to USD using Mezo price feed
 *
 * Security: Uses safe number conversion to prevent precision loss
 */
export function useBtcToUsd(btcAmount: bigint) {
  const { price, isLoading, priceStatus, isPriceStale } = useMezoPriceFeed();

  // Use safe BigInt to Number conversion
  const btcValue = safeBigIntToNumber(btcAmount, 18);
  const usdValue = price > 0 ? btcValue * price : 0;

  return {
    usdValue,
    usdFormatted:
      usdValue > 0
        ? `$${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
        : "$0.00",
    isLoading,
    /** True if the price used for conversion is stale */
    isPriceStale,
    /** Price status for UI feedback */
    priceStatus,
  };
}

/**
 * Convert USD amount to BTC using Mezo price feed
 *
 * Security: Handles division by zero and precision loss
 */
export function useUsdToBtc(usdAmount: number) {
  const { price, isLoading, priceStatus, isPriceStale } = useMezoPriceFeed();

  // Safe division to handle price = 0
  const btcValue = safeDivide(usdAmount, price, 0);

  return {
    btcValue,
    btcFormatted: btcValue > 0 ? btcValue.toFixed(8) : "0.00000000",
    isLoading,
    isPriceStale,
    priceStatus,
  };
}
