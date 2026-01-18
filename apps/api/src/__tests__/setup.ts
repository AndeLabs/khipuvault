/**
 * @fileoverview Test setup and configuration
 * @module __tests__/setup
 */

import { vi, beforeAll, afterAll, afterEach } from "vitest";

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-for-testing-only-32chars!";
process.env.JWT_EXPIRATION = "1h";

// Mock Prisma client
vi.mock("@khipu/database", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    deposit: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    pool: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    poolAnalytics: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    lotteryRound: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    lotteryTicket: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    eventLog: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(<T>(fn: () => T) => fn()),
  },
}));

// Mock logger to avoid console noise during tests
const mockChildLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  fatal: vi.fn(),
  trace: vi.fn(),
  child: vi.fn(() => mockChildLogger),
};

vi.mock("../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(() => mockChildLogger),
  },
  createChildLogger: vi.fn(() => mockChildLogger),
}));

// Mock Redis module
vi.mock("../lib/redis", () => ({
  initRedis: vi.fn().mockResolvedValue(undefined),
  closeRedis: vi.fn().mockResolvedValue(undefined),
  getRedisClient: vi.fn().mockReturnValue(null),
  getStore: vi.fn().mockReturnValue(new Map()),
  isRedisEnabled: false,
}));

// Mock cache
vi.mock("../lib/cache", () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getOrSet: vi.fn(<T>(_key: string, fn: () => T) => fn()),
  },
  tokenBlacklist: {
    add: vi.fn(),
    isBlacklisted: vi.fn().mockResolvedValue(false),
    remove: vi.fn(),
  },
  CACHE_TTL: {
    USER_PORTFOLIO: 300,
    POOL_STATS: 60,
    ANALYTICS: 600,
    GLOBAL_STATS: 300,
    TOP_POOLS: 600,
  },
  CACHE_KEYS: {
    userPortfolio: (addr: string) => `user:portfolio:${addr}`,
    poolStats: (addr: string) => `pool:stats:${addr}`,
    globalStats: () => "global:stats",
    topPools: (limit: number) => `top:pools:${limit}`,
  },
}));

// Helper to create mock Express request
export function createMockRequest(overrides: Partial<any> = {}): any {
  return {
    headers: {},
    params: {},
    query: {},
    body: {},
    path: "/test",
    method: "GET",
    ip: "127.0.0.1",
    ...overrides,
  };
}

// Helper to create mock Express response
export function createMockResponse(): any {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res;
}

// Helper to create mock next function
export function createMockNext(): any {
  return vi.fn();
}

// Test fixtures
export const fixtures = {
  validAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f3A123",
  validAddressLower: "0x742d35cc6634c0532925a3b844bc9e7595f3a123",
  invalidAddress: "0xinvalid",
  shortAddress: "0x123",

  mockUser: {
    id: "user-1",
    address: "0x742d35cc6634c0532925a3b844bc9e7595f3a123",
    ensName: "test.eth",
    avatar: null,
    createdAt: new Date("2024-01-01"),
    lastActiveAt: new Date("2024-01-15"),
  },

  mockDeposit: {
    id: "deposit-1",
    userAddress: "0x742d35cc6634c0532925a3b844bc9e7595f3a123",
    poolAddress: "0xpool123",
    amount: "1000000000000000000",
    type: "DEPOSIT" as const,
    txHash: "0xtx123",
    blockNumber: 12345,
    timestamp: new Date("2024-01-10"),
  },

  mockPool: {
    id: "pool-1",
    contractAddress: "0xpool123",
    name: "Test Pool",
    poolType: "INDIVIDUAL" as const,
    createdAt: new Date("2024-01-01"),
  },
};

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
  vi.restoreAllMocks();
});
