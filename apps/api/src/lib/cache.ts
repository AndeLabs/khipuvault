/**
 * @fileoverview Hybrid Cache Service with Redis + In-Memory Fallback
 *
 * Production-ready caching layer with:
 * - Redis for distributed caching (multi-instance support)
 * - In-memory LRU fallback for development/single-instance
 * - TTL-based expiration
 * - Memory-safe with bounded size (in-memory mode)
 *
 * Architecture:
 * - Production: Uses Redis for horizontal scaling
 * - Development: Falls back to in-memory LRU cache
 */

import { logger } from "./logger";
import { getStore, isRedisEnabled, type Store } from "./redis";

// ============================================================================
// IN-MEMORY LRU CACHE (Fallback)
// ============================================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

// Maximum cache entries to prevent memory exhaustion
const MAX_CACHE_SIZE = 5000;
// When at max, evict this percentage of least recently used entries
const EVICTION_PERCENTAGE = 0.1;

class InMemoryLRUCache {
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

  private evictLRU(): void {
    if (this.cache.size < MAX_CACHE_SIZE) return;

    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].lastAccessed - b[1].lastAccessed
    );

    const toEvict = Math.ceil(entries.length * EVICTION_PERCENTAGE);
    for (let i = 0; i < toEvict; i++) {
      this.cache.delete(entries[i][0]);
    }

    logger.debug({ evicted: toEvict, remaining: this.cache.size }, "LRU cache eviction completed");
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    entry.lastAccessed = now;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.evictLRU();

    const now = Date.now();
    this.cache.set(key, {
      value,
      expiresAt: now + ttlSeconds * 1000,
      lastAccessed: now,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async deletePattern(pattern: string): Promise<number> {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

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

  shutdown(): void {
    this.isShuttingDown = true;
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }

  getStats(): { size: number; maxSize: number; utilization: number } {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      utilization: Math.round((this.cache.size / MAX_CACHE_SIZE) * 100),
    };
  }
}

// ============================================================================
// HYBRID CACHE SERVICE
// ============================================================================

class CacheService {
  private memoryCache = new InMemoryLRUCache();
  private redisStore: Store | null = null;

  constructor() {
    // Redis store will be lazy-initialized on first use
  }

  private getRedisStore(): Store | null {
    if (!isRedisEnabled) return null;
    if (!this.redisStore) {
      this.redisStore = getStore();
    }
    return this.redisStore;
  }

  /**
   * Get a value from cache (Redis first, then memory)
   */
  async get<T>(key: string): Promise<T | null> {
    const redis = this.getRedisStore();

    if (redis) {
      try {
        const value = await redis.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
        return null;
      } catch (error) {
        logger.warn({ key, error }, "Redis get failed, falling back to memory");
      }
    }

    return this.memoryCache.get<T>(key);
  }

  /**
   * Set a value in cache with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const redis = this.getRedisStore();

    if (redis) {
      try {
        await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
        return;
      } catch (error) {
        logger.warn({ key, error }, "Redis set failed, falling back to memory");
      }
    }

    await this.memoryCache.set(key, value, ttlSeconds);
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<void> {
    const redis = this.getRedisStore();

    if (redis) {
      try {
        await redis.del(key);
      } catch (error) {
        logger.warn({ key, error }, "Redis delete failed");
      }
    }

    await this.memoryCache.delete(key);
  }

  /**
   * Delete all keys matching a pattern (prefix)
   * Note: Redis pattern deletion requires SCAN which is not implemented here
   * For now, this only works fully in memory mode
   */
  async deletePattern(pattern: string): Promise<number> {
    // Redis pattern deletion would require SCAN command
    // For now, we only support memory cache pattern deletion
    return this.memoryCache.deletePattern(pattern);
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      logger.debug({ key, backend: isRedisEnabled ? "redis" : "memory" }, "Cache hit");
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
    await this.memoryCache.clear();
    // Note: Redis clear would require FLUSHDB which is dangerous
    // Only clear memory cache
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    backend: "redis" | "memory";
    memory: { size: number; maxSize: number; utilization: number };
  } {
    return {
      backend: isRedisEnabled ? "redis" : "memory",
      memory: this.memoryCache.getStats(),
    };
  }

  /**
   * Shutdown cache service
   */
  shutdown(): void {
    this.memoryCache.shutdown();
    logger.info("Cache service shut down");
  }
}

// Singleton instance
export const cache = new CacheService();

// ============================================================================
// CACHE TTL CONSTANTS
// ============================================================================

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

// ============================================================================
// CACHE KEY GENERATORS
// ============================================================================

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

// ============================================================================
// TOKEN BLACKLIST SERVICE
// ============================================================================

/**
 * Token Blacklist Service
 * Used to invalidate JWTs on logout before their natural expiration
 */
export const tokenBlacklist = {
  async add(jti: string, expiresInSeconds: number = CACHE_TTL.TOKEN_BLACKLIST): Promise<void> {
    const key = CACHE_KEYS.tokenBlacklist(jti);
    await cache.set(key, true, expiresInSeconds);
    logger.debug({ jti }, "Token added to blacklist");
  },

  async isBlacklisted(jti: string): Promise<boolean> {
    const key = CACHE_KEYS.tokenBlacklist(jti);
    const result = await cache.get<boolean>(key);
    return result === true;
  },

  async remove(jti: string): Promise<void> {
    const key = CACHE_KEYS.tokenBlacklist(jti);
    await cache.delete(key);
  },
};
