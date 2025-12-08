import { PrismaClient } from "@prisma/client";

// Singleton pattern for Prisma Client
// Prevents multiple instances in development (hot reload)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Create Prisma client with production-ready configuration
 *
 * Connection pooling is managed through DATABASE_URL query params:
 * - connection_limit: Max connections per instance (default: 10)
 * - pool_timeout: Time to wait for connection (default: 10s)
 *
 * Example: DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=10"
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    // Enable query engine logging in production for debugging
    errorFormat: process.env.NODE_ENV === "production" ? "minimal" : "pretty",
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler for Prisma
 * Call this during application shutdown to properly close connections
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Health check for database connection
 * Returns true if database is reachable
 */
export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// Handle process signals for graceful shutdown
const handleShutdown = async (signal: string) => {
  console.log(`[Prisma] ${signal} received, disconnecting...`);
  await disconnectPrisma();
  console.log("[Prisma] Disconnected successfully");
};

// Only register handlers if not already registered (prevent duplicate in hot reload)
if (!globalForPrisma.prisma) {
  process.on("beforeExit", () => handleShutdown("beforeExit"));
}

// Export types
export * from "@prisma/client";
