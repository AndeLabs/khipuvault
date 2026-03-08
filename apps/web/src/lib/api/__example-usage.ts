/**
 * @fileoverview Example Usage of New API Layer
 * @module lib/api/__example-usage
 *
 * This file demonstrates how to use the new API layer.
 * DELETE this file after reviewing the examples.
 */

import {
  apiClient,
  ENDPOINTS,
  type UserPortfolio,
  type Pool,
  type Transaction,
  type PaginatedResponse,
  isApiError,
  AuthError,
  NotFoundError,
  getUserFriendlyMessage,
} from "./index";

// ============================================================================
// Example 1: Simple GET Request
// ============================================================================

async function fetchUserPortfolio(address: string) {
  try {
    const portfolio = await apiClient.get<UserPortfolio>(ENDPOINTS.users.portfolio(address));

    console.log("Portfolio:", portfolio);
    console.log("Total Value:", portfolio.totalValue);
    console.log("Positions:", portfolio.positions.length);
  } catch (error) {
    console.error("Failed to fetch portfolio:", getUserFriendlyMessage(error));
  }
}

// ============================================================================
// Example 2: GET with Query Parameters
// ============================================================================

async function fetchTransactions(address: string) {
  try {
    const transactions = await apiClient.get<PaginatedResponse<Transaction>>(
      ENDPOINTS.users.transactions(address),
      {
        page: 1,
        limit: 20,
        status: "confirmed",
        sortBy: "timestamp",
        sortOrder: "desc",
      }
    );

    console.log("Total Transactions:", transactions.total);
    console.log("Page:", transactions.page, "/", transactions.totalPages);
    console.log("Items:", transactions.items);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
  }
}

// ============================================================================
// Example 3: POST Request
// ============================================================================

async function createPool() {
  try {
    const newPool = await apiClient.post<Pool>(ENDPOINTS.pools.list, {
      name: "My Savings Pool",
      type: "individual",
      minDeposit: "1000000000000000000", // 1 mUSD in wei
    });

    console.log("Pool created:", newPool);
  } catch (error) {
    if (error instanceof AuthError) {
      console.log("User needs to sign in");
      // Redirect to login
    } else if (isApiError(error)) {
      console.error("API Error:", error.message, error.status);
    }
  }
}

// ============================================================================
// Example 4: Error Handling
// ============================================================================

async function fetchPoolWithErrorHandling(poolId: string) {
  try {
    const pool = await apiClient.get<Pool>(ENDPOINTS.pools.detail(poolId));
    console.log("Pool found:", pool);
  } catch (error) {
    // Handle specific error types
    if (error instanceof NotFoundError) {
      console.log("Pool not found");
      // Show 404 page
    } else if (error instanceof AuthError) {
      console.log("Authentication required");
      // Redirect to login
    } else if (isApiError(error)) {
      console.error(`Error ${error.status}:`, error.message);

      // Check if retryable
      if (error.isRetryable) {
        console.log("This error can be retried");
      }

      // Get user-friendly message
      const friendlyMsg = getUserFriendlyMessage(error);
      console.log("User message:", friendlyMsg);
    } else {
      console.error("Unknown error:", error);
    }
  }
}

// ============================================================================
// Example 5: Authentication
// ============================================================================

async function authenticateAndFetchData(jwtToken: string, address: string) {
  // Set auth token (only needs to be done once)
  apiClient.setAuthToken(jwtToken);

  // Now all requests include Authorization header
  try {
    const portfolio = await apiClient.get<UserPortfolio>(ENDPOINTS.users.portfolio(address));
    console.log("Authenticated request successful:", portfolio);
  } catch (error) {
    console.error("Failed:", error);
  }
}

// ============================================================================
// Example 6: Request Cancellation
// ============================================================================

async function fetchWithCancellation() {
  const controller = new AbortController();

  // Simulate cancellation after 2 seconds
  setTimeout(() => controller.abort(), 2000);

  try {
    const pools = await apiClient.get<Pool[]>(
      ENDPOINTS.pools.list,
      {},
      { signal: controller.signal }
    );
    console.log("Pools:", pools);
  } catch (error) {
    console.log("Request cancelled or failed:", error);
  }
}

// ============================================================================
// Example 7: Custom Retry Configuration
// ============================================================================

async function fetchWithCustomRetry(poolId: string) {
  try {
    const analytics = await apiClient.get(
      ENDPOINTS.pools.analytics(poolId),
      {},
      {
        retries: 5, // Retry up to 5 times
        timeout: 30000, // 30 second timeout
      }
    );
    console.log("Analytics:", analytics);
  } catch (error) {
    console.error("Failed after 5 retries:", error);
  }
}

// ============================================================================
// Example 8: Request Interceptor
// ============================================================================

function setupRequestInterceptors() {
  // Add custom header to all requests
  apiClient.addRequestInterceptor((url, config) => ({
    ...config,
    headers: {
      ...config.headers,
      "X-Client-Version": "1.0.0",
      "X-Platform": "web",
    },
  }));

  // Add conditional headers
  apiClient.addRequestInterceptor((url, config) => {
    if (url.includes("/admin/")) {
      return {
        ...config,
        headers: {
          ...config.headers,
          "X-Admin-Secret": "secret-token",
        },
      };
    }
    return config;
  });
}

// ============================================================================
// Example 9: Response Interceptor
// ============================================================================

function setupResponseInterceptors() {
  apiClient.addResponseInterceptor((response) => {
    // Log response time
    const responseTime = response.headers.get("x-response-time");
    if (responseTime) {
      console.log(`Response time: ${responseTime}ms`);
    }
    return response;
  });
}

// ============================================================================
// Example 10: Real-World Usage Pattern
// ============================================================================

class PoolService {
  static async getPoolDetails(poolId: string) {
    try {
      const [pool, analytics, stats] = await Promise.all([
        apiClient.get<Pool>(ENDPOINTS.pools.detail(poolId)),
        apiClient.get(ENDPOINTS.pools.analytics(poolId)),
        apiClient.get(ENDPOINTS.pools.stats(poolId)),
      ]);

      return { pool, analytics, stats };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new Error("Pool not found");
      }
      throw error;
    }
  }

  static async createPool(data: { name: string; type: "individual" | "cooperative" }) {
    const pool = await apiClient.post<Pool>(ENDPOINTS.pools.list, data);
    return pool;
  }

  static async updatePool(poolId: string, data: Partial<Pool>) {
    const pool = await apiClient.patch<Pool>(ENDPOINTS.pools.detail(poolId), data);
    return pool;
  }

  static async deletePool(poolId: string) {
    await apiClient.delete(ENDPOINTS.pools.detail(poolId));
  }
}

// ============================================================================
// Export examples (for reference only)
// ============================================================================

export const examples = {
  fetchUserPortfolio,
  fetchTransactions,
  createPool,
  fetchPoolWithErrorHandling,
  authenticateAndFetchData,
  fetchWithCancellation,
  fetchWithCustomRetry,
  setupRequestInterceptors,
  setupResponseInterceptors,
  PoolService,
};

// Prevent accidental usage in production
if (process.env.NODE_ENV === "production") {
  console.warn("⚠️  Example usage file should be deleted in production builds");
}
