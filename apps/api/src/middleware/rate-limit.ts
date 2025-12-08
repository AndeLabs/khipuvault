import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

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
});

/**
 * Custom rate limiter factory
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: "Rate Limit Exceeded",
      message: options.message || "Too many requests, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}
