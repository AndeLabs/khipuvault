/**
 * @fileoverview BTC Price Hook with Multiple Fallbacks
 * @module hooks/use-btc-price
 *
 * Fetches real-time BTC price from multiple sources with automatic fallback:
 * 1. CoinGecko API (primary)
 * 2. Binance API (fallback 1)
 * 3. Cached value (fallback 2)
 * 4. Default value (last resort)
 */

'use client'

import { useQuery } from '@tanstack/react-query'

/**
 * BTC Price Response
 */
interface BTCPriceData {
  price: number
  source: 'coingecko' | 'binance' | 'cache' | 'default'
  timestamp: number
}

/**
 * Fetch BTC price from CoinGecko
 */
async function fetchFromCoinGecko(): Promise<number> {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
  )

  if (!response.ok) {
    throw new Error('CoinGecko API failed')
  }

  const data = await response.json()
  return data.bitcoin.usd
}

/**
 * Fetch BTC price from Binance (fallback)
 */
async function fetchFromBinance(): Promise<number> {
  const response = await fetch(
    'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'
  )

  if (!response.ok) {
    throw new Error('Binance API failed')
  }

  const data = await response.json()
  return parseFloat(data.price)
}

/**
 * Fetch BTC price with automatic fallback
 */
async function fetchBTCPrice(): Promise<BTCPriceData> {
  // Try CoinGecko first
  try {
    const price = await fetchFromCoinGecko()
    return {
      price,
      source: 'coingecko',
      timestamp: Date.now(),
    }
  } catch (error) {
    console.warn('CoinGecko failed, trying Binance...', error)
  }

  // Fallback to Binance
  try {
    const price = await fetchFromBinance()
    return {
      price,
      source: 'binance',
      timestamp: Date.now(),
    }
  } catch (error) {
    console.warn('Binance failed, using cached/default value...', error)
  }

  // Try to get from localStorage cache
  try {
    const cached = localStorage.getItem('btc-price-cache')
    if (cached) {
      const parsedCache = JSON.parse(cached)
      const cacheAge = Date.now() - parsedCache.timestamp

      // Use cache if less than 1 hour old
      if (cacheAge < 1000 * 60 * 60) {
        return {
          ...parsedCache,
          source: 'cache' as const,
        }
      }
    }
  } catch (error) {
    console.warn('Cache read failed', error)
  }

  // Last resort: return reasonable default
  return {
    price: 60000,
    source: 'default',
    timestamp: Date.now(),
  }
}

/**
 * Hook to fetch and cache BTC price
 *
 * Features:
 * - Automatic fallback between multiple APIs
 * - Local storage caching
 * - Stale-while-revalidate pattern
 * - Type-safe return value
 *
 * @example
 * ```tsx
 * function Component() {
 *   const { data: btcPrice, isLoading, error } = useBTCPrice()
 *
 *   if (isLoading) return <Loader />
 *   if (error) return <Error />
 *
 *   return <div>BTC: ${btcPrice.price.toLocaleString()}</div>
 * }
 * ```
 */
export function useBTCPrice() {
  return useQuery({
    queryKey: ['btc-price'],
    queryFn: async () => {
      const data = await fetchBTCPrice()

      // Cache the result in localStorage
      try {
        localStorage.setItem('btc-price-cache', JSON.stringify(data))
      } catch (error) {
        console.warn('Failed to cache BTC price', error)
      }

      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh
    gcTime: 1000 * 60 * 60, // 1 hour - cache time
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Hook to get just the price number (convenience wrapper)
 *
 * @example
 * ```tsx
 * const btcPrice = useBTCPriceValue()
 * // returns: 65432 (number)
 * ```
 */
export function useBTCPriceValue(): number {
  const { data } = useBTCPrice()
  return data?.price ?? 60000 // Default to 60k if not loaded
}

/**
 * Format USD value
 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format BTC amount
 */
export function formatBTC(value: bigint | number): string {
  const btc = typeof value === 'bigint' ? Number(value) / 1e18 : value
  return `${btc.toFixed(8)} BTC`
}

/**
 * Convert BTC to USD
 */
export function btcToUSD(btcAmount: bigint | number, btcPrice: number): number {
  const btc = typeof btcAmount === 'bigint' ? Number(btcAmount) / 1e18 : btcAmount
  return btc * btcPrice
}
