import "dotenv/config";
import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { logger } from "./lib/logger";
import { requestLogger } from "./middleware/request-logger";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import {
  globalRateLimiter,
  speedLimiter,
  writeRateLimiter,
} from "./middleware/rate-limit";
import {
  sanitizeMongoQueries,
  requestSizeLimiter,
  validateContentType,
  xssProtection,
  requestId,
  securityHeaders,
} from "./middleware/security";

// Routes
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import poolsRouter from "./routes/pools";
import transactionsRouter from "./routes/transactions";
import analyticsRouter from "./routes/analytics";
import healthRouter from "./routes/health";

const app: Application = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

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
  }),
);
app.use(securityHeaders);

// 3. CORS configuration - Secure setup following best practices
const corsOrigins =
  process.env.CORS_ORIGIN?.split(",")
    .map((o) => o.trim())
    .filter(Boolean) || [];
const isProduction = NODE_ENV === "production";

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
      if (!origin) return callback(null, true);

      const devOrigins = [
        "http://localhost:3000",
        "http://localhost:9002",
        "http://127.0.0.1:3000",
      ];
      if (corsOrigins.includes(origin) || devOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-ID",
      "X-API-Key",
    ],
    exposedHeaders: ["X-Request-ID", "RateLimit-Limit", "RateLimit-Remaining"],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200, // Legacy browser support
  }),
);

// 4. Request logging with Pino
app.use(requestLogger);

// 5. Body parsing with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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

// API routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/pools", poolsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/analytics", analyticsRouter);

// ===== ERROR HANDLING =====

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ===== SERVER STARTUP =====

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
      },
    },
    "KhipuVault API Server started",
  );

  logger.info(`Server listening on http://localhost:${PORT}`);
});

// ===== REQUEST TIMEOUT PROTECTION =====
// Protects against slowloris attacks and hung connections

// Request timeout: 30 seconds for normal requests
server.setTimeout(30000);

// Keep-alive timeout: Must be greater than load balancer's idle timeout
// AWS ALB default is 60s, so we use 65s
server.keepAliveTimeout = 65000;

// Headers timeout: Must be greater than keepAliveTimeout
// Prevents attacks that send headers very slowly
server.headersTimeout = 66000;

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(
    { signal },
    "Shutdown signal received, starting graceful shutdown",
  );

  // 1. Stop accepting new connections
  server.close(async () => {
    try {
      // 2. Shutdown cache service
      const { cache } = await import("./lib/cache");
      cache.shutdown();
      logger.info("Cache service shutdown complete");

      // 3. Disconnect Prisma
      const { prisma } = await import("@khipu/database");
      await prisma.$disconnect();
      logger.info("Database connection closed");

      logger.info("Graceful shutdown completed successfully");
      process.exit(0);
    } catch (error) {
      logger.error({ error }, "Error during graceful shutdown");
      process.exit(1);
    }
  });

  // Force close after 30 seconds (give more time for cleanup)
  setTimeout(() => {
    logger.error("Forcing shutdown after timeout");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught Exception detected");
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  logger.fatal(
    { reason, promise },
    "Unhandled Promise Rejection detected - initiating shutdown",
  );
  gracefulShutdown("UNHANDLED_REJECTION");
});

export default app;
