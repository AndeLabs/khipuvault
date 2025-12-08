// Local type definitions to avoid build-time dependency on @khipu/shared
// These mirror the types from @khipu/shared but are defined locally for DTS build compatibility

export interface UserPortfolioPosition {
  poolType: string;
  poolId: string;
  poolName: string;
  principal: string;
  yields: string;
  apr: number;
  depositedAt: Date;
}

export interface UserPortfolio {
  userId: string;
  totalDeposited: string;
  totalYields: string;
  totalValue: string;
  positions: UserPortfolioPosition[];
}

export type PoolType = "individual" | "cooperative" | "lottery" | "rotating";
export type PoolStatus = "active" | "paused" | "emergency" | "closed";

export interface Pool {
  id: string;
  contractAddress: string;
  poolType: PoolType;
  name: string;
  tvl: string;
  apr: number;
  totalUsers: number;
  totalDeposits: number;
  status: PoolStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType =
  | "deposit"
  | "withdraw"
  | "claim_yield"
  | "compound"
  | "pool_created"
  | "pool_joined"
  | "pool_left";
export type TransactionStatus = "pending" | "confirmed" | "failed";

export interface Transaction {
  id: string;
  userId: string;
  poolId: string;
  type: TransactionType;
  amount: string;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  status: TransactionStatus;
  gasUsed?: string;
  error?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * API Client for KhipuVault backend
 * Production-ready with proper error handling, timeout, and retry logic
 */
export class KhipuApiClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(
    baseUrl: string = API_BASE_URL,
    options?: { timeout?: number; retries?: number },
  ) {
    this.baseUrl = baseUrl;
    this.timeout = options?.timeout ?? 10000; // 10s default
    this.retries = options?.retries ?? 2; // 2 retries default
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: {
            "Content-Type": "application/json",
            ...options?.headers,
          },
          signal: controller.signal,
          ...options,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new ApiError(
            errorBody.message || response.statusText,
            response.status,
            errorBody.code,
            errorBody.details,
          );
        }

        return response.json();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ) {
          throw error;
        }

        // Don't retry on abort (user cancelled)
        if (error instanceof Error && error.name === "AbortError") {
          throw new ApiError("Request timeout", 408);
        }

        // Log retry attempt
        if (attempt < this.retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries exhausted
    throw lastError ?? new ApiError("Unknown error", 500);
  }

  // User endpoints
  async getUserPortfolio(address: string): Promise<UserPortfolio> {
    return this.fetch(`/users/${address}/portfolio`);
  }

  async getUserTransactions(address: string): Promise<Transaction[]> {
    return this.fetch(`/users/${address}/transactions`);
  }

  // Pool endpoints
  async getPools(): Promise<Pool[]> {
    return this.fetch("/pools");
  }

  async getPool(poolId: string): Promise<Pool> {
    return this.fetch(`/pools/${poolId}`);
  }

  async getPoolAnalytics(poolId: string) {
    return this.fetch(`/pools/${poolId}/analytics`);
  }

  // Analytics endpoints
  async getGlobalAnalytics() {
    return this.fetch("/analytics/global");
  }
}

// Export singleton instance
export const khipuApi = new KhipuApiClient();
