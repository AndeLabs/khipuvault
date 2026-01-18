/**
 * @fileoverview In-Memory LRU Cache with TTL support
 *
 * Production-ready caching layer with:
 * - LRU eviction when max size reached
 * - TTL-based expiration
 * - Memory-safe with bounded size
 *
 * For production with Redis, install ioredis and update implementation
 */

import { logger } from "./logger";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

// Maximum cache entries to prevent memory exhaustion
const MAX_CACHE_SIZE = 5000;
// When at max, evict this percentage of least recently used entries
const EVICTION_PERCENTAGE = 0.1;

class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      if (!this.isShuttingDown) {
        this.cleanup();
      }
    }, 60 * 1000);
    this.cleanupInterval.unref();
  }

  /**
   * Evict least recently used entries when at capacity
   */
  private evictLRU(): void {
    if (this.cache.size < MAX_CACHE_SIZE) {
      return;
    }

    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].lastAccessed - b[1].lastAccessed
    );

    const toEvict = Math.ceil(entries.length * EVICTION_PERCENTAGE);
    for (let i = 0; i < toEvict; i++) {
      this.cache.delete(entries[i][0]);
    }

    logger.debug({ evicted: toEvict, remaining: this.cache.size }, "LRU cache eviction completed");
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update last accessed for LRU
    entry.lastAccessed = now;

    return entry.value as T;
  }

  /**
   * Set a value in cache with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    // Evict LRU entries if at capacity
    this.evictLRU();

    const now = Date.now();
    const expiresAt = now + ttlSeconds * 1000;

    this.cache.set(key, {
      value,
      expiresAt,
      lastAccessed: now,
    });
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Delete all keys matching a pattern (prefix)
   */
  async deletePattern(pattern: string): Promise<number> {
    let deleted = 0;
    const keys = Array.from(this.cache.keys());

    for (const key of keys) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      logger.debug({ key }, "Cache hit");
      return cached;
    }

    logger.debug({ key }, "Cache miss, fetching");
    const value = await fetcher();
    await this.set(key, value, ttlSeconds);

    return value;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug({ cleaned, remaining: this.cache.size }, "Cache cleanup completed");
    }
  }

  /**
   * Shutdown cache service
   */
  shutdown(): void {
    this.isShuttingDown = true;
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
    logger.info("Cache service shut down");
  }

  /**
   * Check if cache is at capacity
   */
  isAtCapacity(): boolean {
    return this.cache.size >= MAX_CACHE_SIZE;
  }

  /**
   * Get memory usage estimate (rough)
   */
  getMemoryUsage(): {
    entries: number;
    maxEntries: number;
    utilization: number;
  } {
    return {
      entries: this.cache.size,
      maxEntries: MAX_CACHE_SIZE,
      utilization: Math.round((this.cache.size / MAX_CACHE_SIZE) * 100),
    };
  }
}

// Singleton instance
export const cache = new CacheService();

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  GLOBAL_STATS: 5 * 60, // 5 minutes
  TOP_POOLS: 10 * 60, // 10 minutes
  TOP_USERS: 15 * 60, // 15 minutes
  TRANSACTION_STATS: 5 * 60, // 5 minutes
  ACTIVITY_TIMELINE: 10 * 60, // 10 minutes
  POOL_INFO: 2 * 60, // 2 minutes
  USER_PORTFOLIO: 1 * 60, // 1 minute
  TOKEN_BLACKLIST: 2 * 60 * 60, // 2 hours (match JWT expiration)
} as const;

// Cache key generators
export const CACHE_KEYS = {
  globalStats: () => "analytics:global-stats",
  topPools: (limit: number) => `analytics:top-pools:${limit}`,
  topUsers: (limit: number) => `analytics:top-users:${limit}`,
  transactionStats: () => "transactions:stats",
  activityTimeline: (days: number) => `analytics:timeline:${days}`,
  poolInfo: (address: string) => `pool:${address.toLowerCase()}`,
  userPortfolio: (address: string) => `user:portfolio:${address.toLowerCase()}`,
  tokenBlacklist: (jti: string) => `auth:blacklist:${jti}`,
} as const;

/**
 * Token Blacklist Service
 * Used to invalidate JWTs on logout before their natural expiration
 */
export const tokenBlacklist = {
  /**
   * Add a token to the blacklist
   * @param jti JWT ID or token hash
   * @param expiresInSeconds Time until token naturally expires
   */
  async add(jti: string, expiresInSeconds: number = CACHE_TTL.TOKEN_BLACKLIST): Promise<void> {
    const key = CACHE_KEYS.tokenBlacklist(jti);
    await cache.set(key, true, expiresInSeconds);
    logger.debug({ jti }, "Token added to blacklist");
  },

  /**
   * Check if a token is blacklisted
   * @param jti JWT ID or token hash
   * @returns true if token is blacklisted (should be rejected)
   */
  async isBlacklisted(jti: string): Promise<boolean> {
    const key = CACHE_KEYS.tokenBlacklist(jti);
    const result = await cache.get<boolean>(key);
    return result === true;
  },

  /**
   * Remove a token from blacklist (for testing or admin purposes)
   * @param jti JWT ID or token hash
   */
  async remove(jti: string): Promise<void> {
    const key = CACHE_KEYS.tokenBlacklist(jti);
    await cache.delete(key);
  },
};
