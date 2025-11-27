/**
 * @fileoverview In-Memory Cache with TTL support
 *
 * Production-ready caching layer that can be easily swapped for Redis
 * Uses Map-based storage with automatic TTL expiration
 *
 * For production with Redis, install ioredis and update implementation
 */

import { logger } from './logger'

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 1000)
    this.cleanupInterval.unref()
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value as T
  }

  /**
   * Set a value in cache with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000

    this.cache.set(key, {
      value,
      expiresAt,
    })
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  /**
   * Delete all keys matching a pattern (prefix)
   */
  async deletePattern(pattern: string): Promise<number> {
    let deleted = 0
    const keys = Array.from(this.cache.keys())

    for (const key of keys) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key)
        deleted++
      }
    }

    return deleted
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    const cached = await this.get<T>(key)

    if (cached !== null) {
      logger.debug({ key }, 'Cache hit')
      return cached
    }

    logger.debug({ key }, 'Cache miss, fetching')
    const value = await fetcher()
    await this.set(key, value, ttlSeconds)

    return value
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      logger.debug({ cleaned, remaining: this.cache.size }, 'Cache cleanup completed')
    }
  }

  /**
   * Shutdown cache service
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
  }
}

// Singleton instance
export const cache = new CacheService()

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  GLOBAL_STATS: 5 * 60,        // 5 minutes
  TOP_POOLS: 10 * 60,          // 10 minutes
  TOP_USERS: 15 * 60,          // 15 minutes
  TRANSACTION_STATS: 5 * 60,   // 5 minutes
  ACTIVITY_TIMELINE: 10 * 60,  // 10 minutes
  POOL_INFO: 2 * 60,           // 2 minutes
  USER_PORTFOLIO: 1 * 60,      // 1 minute
} as const

// Cache key generators
export const CACHE_KEYS = {
  globalStats: () => 'analytics:global-stats',
  topPools: (limit: number) => `analytics:top-pools:${limit}`,
  topUsers: (limit: number) => `analytics:top-users:${limit}`,
  transactionStats: () => 'transactions:stats',
  activityTimeline: (days: number) => `analytics:timeline:${days}`,
  poolInfo: (address: string) => `pool:${address.toLowerCase()}`,
  userPortfolio: (address: string) => `user:portfolio:${address.toLowerCase()}`,
} as const
