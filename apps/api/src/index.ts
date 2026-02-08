import "dotenv/config";

import compression from "compression";
import cors from "cors";
import express, { type Application } from "express";
import helmet from "helmet";

import { logger } from "./lib/logger";
import { httpRequestDuration, httpRequestsTotal, activeConnections } from "./lib/metrics";
import { initRedis, closeRedis } from "./lib/redis";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import {
  globalRateLimiter,
  speedLimiter,
  writeRateLimiter,
  initRateLimitStore,
} from "./middleware/rate-limit";
import { requestLogger } from "./middleware/request-logger";
import {
  sanitizeMongoQueries,
  requestSizeLimiter,
  validateContentType,
  xssProtection,
  requestId,
  securityHeaders,
} from "./middleware/security";

// Routes
import analyticsRouter from "./routes/analytics";
import authRouter from "./routes/auth";
import healthRouter from "./routes/health";
import lotteryRouter from "./routes/lottery";
import metricsRouter from "./routes/metrics";
import poolsRouter from "./routes/pools";
import transactionsRouter from "./routes/transactions";
import usersRouter from "./routes/users";

const app: Application = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

// ===== STARTUP VALIDATION =====

// Validate CORS_ORIGIN in production
const corsOrigins =
  process.env.CORS_ORIGIN?.split(",")
    .map((o) => o.trim())
    .filter(Boolean) || [];
const isProduction = NODE_ENV === "production";

if (isProduction && corsOrigins.length === 0) {
  logger.warn("CORS_ORIGIN not set in production. All cross-origin requests will be blocked.");
}

if (isProduction) {
  // Validate each origin is a valid URL
  for (const origin of corsOrigins) {
    try {
      new URL(origin);
    } catch {
      logger.error({ origin }, "Invalid CORS origin URL. Must be a valid URL.");
      throw new Error(`Invalid CORS_ORIGIN: ${origin}`);
    }
  }
  logger.info({ corsOrigins }, "CORS origins validated");
}

// Trust proxy (required for rate limiting behind reverse proxy)
app.set("trust proxy", 1);

// ===== SECURITY MIDDLEWARE (Order matters!) =====

// 1. Request tracking
app.use(requestId);

// 2. Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
app.use(securityHeaders);

// 3. CORS configuration - Secure setup following best practices
app.use(
  cors({
    origin: (origin, callback) => {
      // In production: require origin and validate against whitelist
      if (isProduction) {
        if (!origin) {
          // Block requests without origin in production (except health checks)
          return callback(new Error("Origin header required"), false);
        }
        if (corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"), false);
      }

      // In development: allow localhost origins and requests without origin
      if (!origin) {
        return callback(null, true);
      }

      // HTTP URLs are acceptable for localhost development environments
      // These URLs are only used in local development, never in production
      /* eslint-disable @microsoft/sdl/no-insecure-url */
      const devOrigins = [
        "http://localhost:3000",
        "http://localhost:9002",
        "http://127.0.0.1:3000",
      ];
      /* eslint-enable @microsoft/sdl/no-insecure-url */
      if (corsOrigins.includes(origin) || devOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID", "X-API-Key"],
    exposedHeaders: ["X-Request-ID", "RateLimit-Limit", "RateLimit-Remaining"],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200, // Legacy browser support
  })
);

// 4. Request logging with Pino
app.use(requestLogger);

// 5. Body parsing with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 5.5. Response compression (gzip/deflate)
app.use(
  compression({
    level: 6, // Balanced compression level
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      // Don't compress if client doesn't accept it
      if (req.headers["x-no-compression"]) {
        return false;
      }
      // Fall back to standard filter function
      return compression.filter(req, res);
    },
  })
);

// 5.6. Metrics middleware - track request duration
app.use((req, res, next) => {
  activeConnections.inc();
  const start = Date.now();

  res.on("finish", () => {
    activeConnections.dec();
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
  });

  next();
});

// 6. Request size validation
app.use(requestSizeLimiter("10mb"));

// 7. Content-Type validation (for write operations)
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    return validateContentType(["application/json"])(req, res, next);
  }
  next();
});

// 8. Input sanitization
app.use(xssProtection);
app.use(sanitizeMongoQueries);

// 9. Rate limiting
app.use(globalRateLimiter); // Global rate limit
app.use(speedLimiter); // Speed limiter (gradual slowdown)
app.use(writeRateLimiter); // Extra limit for write operations

// ===== ROUTES =====

// Health check (no rate limiting)
app.use("/health", healthRouter);

// Metrics endpoint (Prometheus format)
app.use("/metrics", metricsRouter);

// API routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/pools", poolsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/lottery", lotteryRouter);

// ===== ERROR HANDLING =====

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ===== SERVER STARTUP =====

// Initialize services before starting the server
async function startServer() {
  try {
    // Initialize Redis for rate limiting and nonce storage
    await initRedis();
    await initRateLimitStore();
    logger.info("Redis and rate limiting initialized");
  } catch (error) {
    logger.warn({ error }, "Redis initialization failed, using in-memory fallback");
  }

  const server = app.listen(PORT, () => {
    logger.info(
      {
        port: PORT,
        environment: NODE_ENV,
        corsOrigins: corsOrigins.length > 0 ? corsOrigins : ["localhost (dev)"],
        features: {
          rateLimiting: true,
          security: true,
          logging: true,
          redis: process.env.REDIS_URL ? "enabled" : "disabled",
        },
      },
      "KhipuVault API Server started"
    );

    logger.info(`Server listening on http://localhost:${PORT}`);
  });

  return server;
}

// Start the server
const serverPromise = startServer();
let server: ReturnType<typeof app.listen>;

// ===== REQUEST TIMEOUT PROTECTION =====
// Configure server timeouts after startup

void serverPromise
  .then((s) => {
    server = s;

    // Protects against slowloris attacks and hung connections
    // Request timeout: 30 seconds for normal requests
    server.setTimeout(30000);

    // Keep-alive timeout: Must be greater than load balancer's idle timeout
    // AWS ALB default is 60s, so we use 65s
    server.keepAliveTimeout = 65000;

    // Headers timeout: Must be greater than keepAliveTimeout
    // Prevents attacks that send headers very slowly
    server.headersTimeout = 66000;
  })
  .catch((error) => {
    logger.error({ error }, "Failed to configure server timeouts");
    // Error is already handled in startServer, this is just for timeout configuration
  });

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, "Shutdown signal received, starting graceful shutdown");

  // Wait for server to be initialized
  const srv = await serverPromise;

  // 1. Stop accepting new connections
  srv.close(async () => {
    try {
      // 2. Close Redis connection
      await closeRedis();
      logger.info("Redis connection closed");

      // 3. Shutdown cache service
      const { cache } = await import("./lib/cache");
      cache.shutdown();
      logger.info("Cache service shutdown complete");

      // 4. Disconnect Prisma
      const { prisma } = await import("@khipu/database");
      await prisma.$disconnect();
      logger.info("Database connection closed");

      logger.info("Graceful shutdown completed successfully");
      // eslint-disable-next-line no-process-exit -- Intentional exit after graceful shutdown
      process.exit(0);
    } catch (error) {
      logger.error({ error }, "Error during graceful shutdown");
      // eslint-disable-next-line no-process-exit -- Intentional exit on shutdown error
      process.exit(1);
    }
  });

  // Force close after 30 seconds (give more time for cleanup)
  setTimeout(() => {
    logger.error("Forcing shutdown after timeout");
    // eslint-disable-next-line no-process-exit -- Intentional forced exit on timeout
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  // Use 'err' key so pino serializer properly extracts error properties
  logger.fatal(
    { err: error, errorMessage: error.message, errorStack: error.stack },
    "Uncaught Exception detected"
  );
  void gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  // Extract error properties if reason is an Error
  const errorInfo =
    reason instanceof Error
      ? { err: reason, errorMessage: reason.message, errorStack: reason.stack }
      : { reason };
  logger.fatal(
    { ...errorInfo, promise: String(promise) },
    "Unhandled Promise Rejection detected - initiating shutdown"
  );
  void gracefulShutdown("UNHANDLED_REJECTION");
});

export default app;
