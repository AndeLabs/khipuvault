/**
 * @fileoverview MSW (Mock Service Worker) Handlers
 * @module test/mocks/handlers
 *
 * Provides mock API handlers for testing components that make HTTP requests.
 * Uses MSW to intercept network requests and return mock data.
 *
 * @example
 * ```tsx
 * import { setupServer } from "msw/node";
 * import { handlers } from "@/test/mocks/handlers";
 *
 * const server = setupServer(...handlers);
 *
 * beforeAll(() => server.listen());
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 * ```
 */

import { http, HttpResponse } from "msw";

import { createMockPool, createMockUser, createMockTransaction } from "../test-utils";

import type { Pool, UserPortfolio, Transaction } from "@khipu/web3";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

// ============================================================================
// Mock Data Store
// ============================================================================

/**
 * In-memory mock data store
 * Can be modified during tests to simulate different scenarios
 */
export const mockData = {
  pools: [
    createMockPool({ id: "pool-1", name: "Individual Pool", poolType: "individual" }),
    createMockPool({ id: "pool-2", name: "Cooperative Pool", poolType: "cooperative" }),
    createMockPool({ id: "pool-3", name: "Lottery Pool", poolType: "lottery" }),
    createMockPool({ id: "pool-4", name: "Rotating Pool", poolType: "rotating" }),
  ] as Pool[],

  users: new Map<string, UserPortfolio>([
    [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      createMockUser({
        address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" as `0x${string}`,
      }),
    ],
  ]),

  transactions: new Map<string, Transaction[]>([
    [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      [
        createMockTransaction({ type: "deposit", status: "confirmed" }),
        createMockTransaction({ type: "withdraw", status: "confirmed" }),
        createMockTransaction({ type: "claim_yield", status: "pending" }),
      ],
    ],
  ]),

  analytics: {
    global: {
      totalValueLocked: "50000000000000000000", // 50 BTC
      totalUsers: 1234,
      totalDeposits: 5678,
      totalYieldGenerated: "2500000000000000000", // 2.5 BTC
      activePoolsCount: 42,
      averageApr: 5.2,
    },
    pool: (poolId: string) => ({
      poolId,
      tvl: "10000000000000000000", // 10 BTC
      deposits: 250,
      withdrawals: 50,
      yieldClaimed: "500000000000000000", // 0.5 BTC
      uniqueUsers: 120,
      averageDepositSize: "83333333333333333", // ~0.083 BTC
      dailyVolume: [
        { date: "2024-01-01", volume: "1000000000000000000" },
        { date: "2024-01-02", volume: "1500000000000000000" },
        { date: "2024-01-03", volume: "1200000000000000000" },
      ],
    }),
  },
};

/**
 * Reset mock data to initial state
 * Useful for resetting between tests
 */
export function resetMockData() {
  mockData.pools = [
    createMockPool({ id: "pool-1", name: "Individual Pool", poolType: "individual" }),
    createMockPool({ id: "pool-2", name: "Cooperative Pool", poolType: "cooperative" }),
    createMockPool({ id: "pool-3", name: "Lottery Pool", poolType: "lottery" }),
    createMockPool({ id: "pool-4", name: "Rotating Pool", poolType: "rotating" }),
  ];

  mockData.users.clear();
  mockData.users.set(
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    createMockUser({
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" as `0x${string}`,
    })
  );

  mockData.transactions.clear();
  mockData.transactions.set("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", [
    createMockTransaction({ type: "deposit", status: "confirmed" }),
    createMockTransaction({ type: "withdraw", status: "confirmed" }),
    createMockTransaction({ type: "claim_yield", status: "pending" }),
  ]);
}

// ============================================================================
// MSW Handlers
// ============================================================================

export const handlers = [
  // -------------------------------------------------------------------------
  // User Endpoints
  // -------------------------------------------------------------------------

  // GET /api/users/:address/portfolio
  http.get(`${API_URL}/users/:address/portfolio`, ({ params }) => {
    const { address } = params;
    const portfolio = mockData.users.get(address as string);

    if (!portfolio) {
      return HttpResponse.json(
        { message: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    return HttpResponse.json(portfolio);
  }),

  // GET /api/users/:address/transactions
  http.get(`${API_URL}/users/:address/transactions`, ({ params }) => {
    const { address } = params;
    const transactions = mockData.transactions.get(address as string);

    if (!transactions) {
      return HttpResponse.json([], { status: 200 });
    }

    return HttpResponse.json(transactions);
  }),

  // -------------------------------------------------------------------------
  // Pool Endpoints
  // -------------------------------------------------------------------------

  // GET /api/pools
  http.get(`${API_URL}/pools`, () => {
    return HttpResponse.json(mockData.pools);
  }),

  // GET /api/pools/:poolId
  http.get(`${API_URL}/pools/:poolId`, ({ params }) => {
    const { poolId } = params;
    const pool = mockData.pools.find((p) => p.id === poolId);

    if (!pool) {
      return HttpResponse.json(
        { message: "Pool not found", code: "POOL_NOT_FOUND" },
        { status: 404 }
      );
    }

    return HttpResponse.json(pool);
  }),

  // GET /api/pools/:poolId/analytics
  http.get(`${API_URL}/pools/:poolId/analytics`, ({ params }) => {
    const { poolId } = params;
    const analytics = mockData.analytics.pool(poolId as string);

    return HttpResponse.json(analytics);
  }),

  // GET /api/pools/address/:poolAddress/stats
  http.get(`${API_URL}/pools/address/:poolAddress/stats`, () => {
    return HttpResponse.json({
      activeDepositors: 120,
      change24h: 5.5,
    });
  }),

  // -------------------------------------------------------------------------
  // Analytics Endpoints
  // -------------------------------------------------------------------------

  // GET /api/analytics/global
  http.get(`${API_URL}/analytics/global`, () => {
    return HttpResponse.json(mockData.analytics.global);
  }),
];

// ============================================================================
// Error Handlers (for testing error states)
// ============================================================================

/**
 * Handlers that simulate various error conditions
 * Useful for testing error handling and retry logic
 */
export const errorHandlers = {
  // Network error (timeout)
  networkError: http.get(`${API_URL}/*`, () => {
    return HttpResponse.error();
  }),

  // Server error (500)
  serverError: http.get(`${API_URL}/*`, () => {
    return HttpResponse.json(
      { message: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }),

  // Not found (404)
  notFound: http.get(`${API_URL}/*`, () => {
    return HttpResponse.json({ message: "Not found", code: "NOT_FOUND" }, { status: 404 });
  }),

  // Unauthorized (401)
  unauthorized: http.get(`${API_URL}/*`, () => {
    return HttpResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }),

  // Rate limited (429)
  rateLimited: http.get(`${API_URL}/*`, () => {
    return HttpResponse.json(
      { message: "Too many requests", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }),
};

/**
 * Delayed response handler for testing loading states
 * @param delayMs - Delay in milliseconds
 */
export function createDelayedHandler(delayMs: number = 1000) {
  return http.get(`${API_URL}/*`, async () => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return HttpResponse.json(mockData.pools);
  });
}
