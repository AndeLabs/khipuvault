"use client";

import { useQuery } from "@tanstack/react-query";

interface PriceData {
  bitcoin: {
    usd: number;
    usd_24h_change?: number;
  };
}

/**
 * Fetch BTC price from CoinGecko API
 * Free tier: 30 calls/minute
 */
async function fetchBTCPrice(): Promise<number> {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
    {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    },
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data: PriceData = await response.json();
  return data.bitcoin.usd;
}

/**
 * Hook to get real-time BTC price
 *
 * Features:
 * - Fetches from CoinGecko API
 * - Caches for 60 seconds
 * - Falls back to 95000 if API fails
 * - Automatic retry on failure
 */
export function useBTCPrice() {
  const {
    data: price,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["btc-price"],
    queryFn: fetchBTCPrice,
    staleTime: 60 * 1000, // Consider fresh for 60 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 2,
    retryDelay: 1000,
  });

  // Fallback price if API fails (approximate current market price)
  const FALLBACK_PRICE = 95000;

  return {
    price: price ?? FALLBACK_PRICE,
    isLoading,
    error,
    refetch,
    isFallback: !price && !isLoading,
  };
}

/**
 * Format USD amount with locale-aware formatting
 */
export function formatUSD(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Calculate USD value from BTC amount (18 decimals on Mezo)
 */
export function btcToUSD(btcAmountWei: bigint, btcPrice: number): number {
  const btc = Number(btcAmountWei) / 1e18;
  return btc * btcPrice;
}

/**
 * Format BTC to USD display string
 */
export function formatBTCtoUSD(btcAmountWei: bigint, btcPrice: number): string {
  const usd = btcToUSD(btcAmountWei, btcPrice);
  return formatUSD(usd);
}
