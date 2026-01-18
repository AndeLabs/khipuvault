import type { Options as RateLimitOptions } from "express-rate-limit";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

import { createChildLogger } from "../lib/logger";
import { getRedisClient, isRedisEnabled } from "../lib/redis";

const logger = createChildLogger({ module: "rate-limit" });

/**
 * Get the rate limit store (Redis or memory)
 * Uses Redis in production for distributed rate limiting
 */
async function getRateLimitStore(): Promise<RateLimitOptions["store"] | undefined> {
  if (!isRedisEnabled) {
    if (process.env.NODE_ENV === "production") {
      logger.warn(
        "Using in-memory rate limiting in production. Configure REDIS_URL for distributed deployments."
      );
    }
    return undefined; // Use default memory store
  }

  try {
    // Dynamically import rate-limit-redis
    const { RedisStore } = await import("rate-limit-redis");
    const client = getRedisClient();

    if (!client) {
      return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sendCommand = (command: string, ...args: string[]): any => client.call(command, ...args);

    return new RedisStore({
      // Use ioredis client with proper typing
      sendCommand,
      prefix: "rl:", // Rate limit prefix
    });
  } catch (error) {
    logger.warn({ error }, "rate-limit-redis not installed. Using memory store.");
    return undefined;
  }
}

// Store instance (set during initialization)
let redisStore: RateLimitOptions["store"] | undefined;

/**
 * Initialize rate limit store
 * Call this after Redis is initialized
 */
export async function initRateLimitStore(): Promise<void> {
  redisStore = await getRateLimitStore();
  if (redisStore) {
    logger.info("Rate limiting using Redis store");
  }
}

/**
 * Global rate limiter for all API endpoints
 * Prevents abuse by limiting requests per IP
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too Many Requests",
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use Redis store when available
  store: redisStore,
  // Skip rate limiting for specific IPs (e.g., internal services)
  skip: (req) => {
    // Add whitelisted IPs here
    const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(",") || [];
    return whitelist.includes(req.ip || "");
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per window
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    error: "Too Many Auth Attempts",
    message: "Too many authentication attempts, please try again later.",
  },
  store: redisStore,
});

/**
 * Rate limiter for write operations (POST, PUT, PATCH, DELETE)
 */
export const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 write operations per minute
  message: {
    error: "Too Many Write Operations",
    message: "Too many write operations, please slow down.",
  },
  store: redisStore,
  skip: (req) => {
    // Only apply to write operations
    return !["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  },
});

/**
 * Speed limiter - slows down responses after threshold
 * More gentle than hard rate limiting
 */
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per window at full speed
  delayMs: (hits) => hits * 100, // Add 100ms delay per request after threshold
  maxDelayMs: 5000, // Max delay of 5 seconds
});

/**
 * Very strict rate limiter for expensive operations
 * (e.g., analytics, complex queries)
 */
export const expensiveOperationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Only 5 expensive operations per minute
  message: {
    error: "Too Many Expensive Operations",
    message: "This operation is rate limited. Please wait before trying again.",
  },
  store: redisStore,
});

/**
 * Custom rate limiter factory
 */
export function createRateLimiter(options: { windowMs: number; max: number; message?: string }) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: "Rate Limit Exceeded",
      message: options.message || "Too many requests, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
  });
}
