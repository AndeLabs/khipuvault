/**
 * @fileoverview Redis Client for Production Deployments
 * @module lib/redis
 *
 * Provides Redis connection for:
 * - Rate limiting across multiple instances
 * - SIWE nonce storage with TTL
 * - Session management
 *
 * Configuration:
 * - Set REDIS_URL in environment variables
 * - Falls back to in-memory storage in development
 *
 * Usage:
 * ```typescript
 * import { redis, isRedisEnabled } from './lib/redis';
 *
 * if (isRedisEnabled) {
 *   await redis.set('key', 'value', 'EX', 300);
 *   const value = await redis.get('key');
 * }
 * ```
 */

import { createChildLogger } from "./logger";

const logger = createChildLogger({ module: "redis" });

// Redis configuration
const REDIS_URL = process.env.REDIS_URL;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Track if Redis is available
export let isRedisEnabled = false;

// Lazy-loaded Redis client
let redisClient: import("ioredis").default | null = null;

/**
 * In-memory fallback store for development
 * NOT suitable for production with multiple instances
 */
class InMemoryStore {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;

    // Check expiration
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string, mode?: string, ttl?: number): Promise<"OK"> {
    const expiresAt = mode === "EX" && ttl ? Date.now() + ttl * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return 0;
    }
    return 1;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// In-memory store instance
const memoryStore = new InMemoryStore();

// Cleanup interval (every 5 minutes)
setInterval(() => memoryStore.cleanup(), 5 * 60 * 1000);

/**
 * Unified store interface that works with both Redis and in-memory
 */
export interface Store {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, ttl?: number): Promise<"OK">;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

/**
 * Initialize Redis connection
 * Call this once at app startup
 */
export async function initRedis(): Promise<void> {
  if (!REDIS_URL) {
    if (IS_PRODUCTION) {
      logger.warn(
        "REDIS_URL not set in production. Rate limiting and nonce storage will use in-memory fallback. This is NOT recommended for multi-instance deployments."
      );
    } else {
      logger.info("REDIS_URL not set. Using in-memory storage for development.");
    }
    return;
  }

  try {
    // Dynamically import ioredis to avoid bundling when not used
    const Redis = (await import("ioredis")).default;

    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error("Redis connection failed after 3 retries");
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    // Test connection
    await redisClient.ping();
    isRedisEnabled = true;
    logger.info("Redis connected successfully");

    // Handle connection events
    redisClient.on("error", (error) => {
      logger.error({ error }, "Redis connection error");
    });

    redisClient.on("reconnecting", () => {
      logger.warn("Redis reconnecting...");
    });
  } catch (error) {
    logger.error({ error }, "Failed to connect to Redis. Using in-memory fallback.");
    redisClient = null;
    isRedisEnabled = false;
  }
}

/**
 * Get the store instance (Redis or in-memory)
 */
export function getStore(): Store {
  if (redisClient && isRedisEnabled) {
    return {
      get: (key) => redisClient!.get(key),
      set: (key, value, mode, ttl) => {
        if (mode === "EX" && ttl) {
          return redisClient!.set(key, value, "EX", ttl);
        }
        return redisClient!.set(key, value);
      },
      del: (key) => redisClient!.del(key),
      exists: (key) => redisClient!.exists(key),
      expire: (key, seconds) => redisClient!.expire(key, seconds),
    };
  }

  return memoryStore;
}

/**
 * Get the raw Redis client (for rate-limit-redis store)
 * Returns null if Redis is not available
 */
export function getRedisClient(): import("ioredis").default | null {
  return redisClient;
}

/**
 * Close Redis connection
 * Call this on app shutdown
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isRedisEnabled = false;
    logger.info("Redis connection closed");
  }
}

// Export the store for direct access
export const redis = {
  get store() {
    return getStore();
  },
  get client() {
    return getRedisClient();
  },
  get isEnabled() {
    return isRedisEnabled;
  },
};
