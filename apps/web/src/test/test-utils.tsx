/**
 * @fileoverview Testing Utilities
 * @module test/test-utils
 *
 * Provides comprehensive testing utilities including:
 * - Custom render function with all providers
 * - Factory functions for creating mock data
 * - Helper functions for common testing scenarios
 *
 * @example
 * ```tsx
 * import { renderWithProviders, createMockPool, waitForLoadingToFinish } from "@/test";
 *
 * it("renders pool card", async () => {
 *   const pool = createMockPool({ name: "Test Pool" });
 *   renderWithProviders(<PoolCard pool={pool} />);
 *   await waitForLoadingToFinish();
 *   expect(screen.getByText("Test Pool")).toBeInTheDocument();
 * });
 * ```
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { waitFor } from "@testing-library/react";

import type {
  Pool,
  PoolType,
  PoolStatus,
  Transaction,
  TransactionType,
  TransactionStatus,
  UserPortfolio,
  UserPortfolioPosition,
} from "@khipu/web3";

import type { ReactElement, ReactNode } from "react";
import type { Address } from "viem";

/**
 * Create a fresh QueryClient for each test
 * Disables retries and caching for predictable testing
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllTheProvidersProps {
  children: ReactNode;
}

/**
 * Wrapper component that includes all necessary providers
 */
export function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/**
 * Custom render function that includes all providers
 * Use this instead of @testing-library/react's render
 *
 * @example
 * ```tsx
 * const { getByText } = renderWithProviders(<MyComponent />);
 * ```
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// ============================================================================
// Factory Functions - Pool
// ============================================================================

interface CreateMockPoolOptions {
  id?: string;
  contractAddress?: string;
  poolType?: PoolType;
  name?: string;
  tvl?: string;
  apr?: number;
  totalUsers?: number;
  totalDeposits?: number;
  status?: PoolStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Factory function to create mock Pool objects
 * Provides sensible defaults, all values can be overridden
 *
 * @example
 * ```tsx
 * const pool = createMockPool({
 *   name: "Test Pool",
 *   tvl: "1000000",
 *   apr: 5.5
 * });
 * ```
 */
export function createMockPool(options: CreateMockPoolOptions = {}): Pool {
  return {
    id: options.id ?? "pool-1",
    contractAddress: (options.contractAddress ??
      "0x1234567890123456789012345678901234567890") as Address,
    poolType: options.poolType ?? "individual",
    name: options.name ?? "Test Pool",
    tvl: options.tvl ?? "1000000000000000000", // 1 BTC
    apr: options.apr ?? 4.5,
    totalUsers: options.totalUsers ?? 42,
    totalDeposits: options.totalDeposits ?? 100,
    status: options.status ?? "active",
    createdAt: options.createdAt ?? new Date("2024-01-01T00:00:00Z"),
    updatedAt: options.updatedAt ?? new Date("2024-01-15T00:00:00Z"),
  };
}

// ============================================================================
// Factory Functions - User
// ============================================================================

interface CreateMockUserOptions {
  address?: Address;
  totalDeposited?: string;
  totalYields?: string;
  totalValue?: string;
  positions?: UserPortfolioPosition[];
}

/**
 * Factory function to create mock User Portfolio objects
 *
 * @example
 * ```tsx
 * const portfolio = createMockUser({
 *   address: "0x123...",
 *   totalDeposited: "5000000000000000000"
 * });
 * ```
 */
export function createMockUser(options: CreateMockUserOptions = {}): UserPortfolio {
  const address = options.address ?? ("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" as Address);

  return {
    userId: address,
    totalDeposited: options.totalDeposited ?? "5000000000000000000", // 5 BTC
    totalYields: options.totalYields ?? "250000000000000000", // 0.25 BTC
    totalValue: options.totalValue ?? "5250000000000000000", // 5.25 BTC
    positions: options.positions ?? [
      createMockPosition({ poolType: "individual" }),
      createMockPosition({ poolType: "cooperative" }),
    ],
  };
}

interface CreateMockPositionOptions {
  poolType?: string;
  poolId?: string;
  poolName?: string;
  principal?: string;
  yields?: string;
  apr?: number;
  depositedAt?: Date;
}

/**
 * Factory function to create mock Portfolio Position objects
 */
export function createMockPosition(options: CreateMockPositionOptions = {}): UserPortfolioPosition {
  return {
    poolType: options.poolType ?? "individual",
    poolId: options.poolId ?? "pool-1",
    poolName: options.poolName ?? "Test Pool",
    principal: options.principal ?? "1000000000000000000", // 1 BTC
    yields: options.yields ?? "50000000000000000", // 0.05 BTC
    apr: options.apr ?? 5.0,
    depositedAt: options.depositedAt ?? new Date("2024-01-01T00:00:00Z"),
  };
}

// ============================================================================
// Factory Functions - Transaction
// ============================================================================

interface CreateMockTransactionOptions {
  id?: string;
  userId?: string;
  poolId?: string;
  type?: TransactionType;
  amount?: string;
  txHash?: string;
  blockNumber?: number;
  timestamp?: Date;
  status?: TransactionStatus;
  gasUsed?: string;
  error?: string;
}

/**
 * Factory function to create mock Transaction objects
 *
 * @example
 * ```tsx
 * const transaction = createMockTransaction({
 *   type: "deposit",
 *   amount: "1000000000000000000",
 *   status: "confirmed"
 * });
 * ```
 */
export function createMockTransaction(options: CreateMockTransactionOptions = {}): Transaction {
  return {
    id: options.id ?? "tx-1",
    userId: options.userId ?? "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    poolId: options.poolId ?? "pool-1",
    type: options.type ?? "deposit",
    amount: options.amount ?? "1000000000000000000", // 1 BTC
    txHash: options.txHash ?? "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    blockNumber: options.blockNumber ?? 1000000,
    timestamp: options.timestamp ?? new Date("2024-01-01T12:00:00Z"),
    status: options.status ?? "confirmed",
    gasUsed: options.gasUsed ?? "21000",
    error: options.error,
  };
}

// ============================================================================
// Factory Functions - Blockchain Data (for contract hooks)
// ============================================================================

/**
 * Create mock pool data array as returned by blockchain contracts
 * Used for testing components that consume blockchain hook data
 */
type PoolDataElement = bigint | string | Address | number | boolean;

export function createMockPoolData(overrides: Record<number, PoolDataElement> = {}) {
  const base: PoolDataElement[] = [
    BigInt(1), // 0: id
    "Test ROSCA Pool", // 1: name
    "0x1234567890123456789012345678901234567890" as Address, // 2: creator
    BigInt(12), // 3: memberCount
    BigInt("10000000000000000"), // 4: contributionAmount (0.01 BTC)
    BigInt(2592000), // 5: periodDuration (30 days)
    BigInt(5), // 6: currentPeriod
    BigInt(12), // 7: totalPeriods
    BigInt(1704067200), // 8: startTime
    BigInt("120000000000000000"), // 9: totalBtcCollected
    BigInt("120000000000"), // 10: totalMusdMinted
    BigInt("5000000000000000"), // 11: totalYieldGenerated
    BigInt("2000000000000000"), // 12: yieldDistributed
    0, // 13: status (0 = FORMING, 1 = ACTIVE, 2 = COMPLETED, 3 = CANCELLED)
    true, // 14: autoAdvance
    true, // 15: useNativeBtc
  ];

  // Apply overrides by index
  Object.keys(overrides).forEach((key) => {
    const index = parseInt(key);
    if (!isNaN(index) && index >= 0 && index < base.length) {
      base[index] = overrides[index];
    }
  });

  return base;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Wait for all loading states to finish
 * Useful for components with async data fetching
 *
 * @example
 * ```tsx
 * renderWithProviders(<MyComponent />);
 * await waitForLoadingToFinish();
 * expect(screen.getByText("Content")).toBeInTheDocument();
 * ```
 */
export async function waitForLoadingToFinish() {
  await waitFor(
    () => {
      // Check for common loading indicators
      const loadingSpinners = document.querySelectorAll('[role="status"]');
      const loadingTexts = document.querySelectorAll('[data-loading="true"]');
      const skeletons = document.querySelectorAll(".animate-pulse");

      if (loadingSpinners.length > 0 || loadingTexts.length > 0 || skeletons.length > 0) {
        throw new Error("Still loading");
      }
    },
    {
      timeout: 3000,
      interval: 100,
    }
  );
}

/**
 * Wait for element to be removed from DOM
 * Useful for testing transitions and animations
 */
export async function waitForElementToBeRemoved(selector: string) {
  await waitFor(
    () => {
      const element = document.querySelector(selector);
      if (element) {
        throw new Error(`Element ${selector} still in DOM`);
      }
    },
    { timeout: 3000 }
  );
}

/**
 * Get a valid Ethereum address for testing
 * Can provide a custom seed for deterministic addresses
 */
export function getMockAddress(seed: number = 0): Address {
  const addresses: Address[] = [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    "0x1234567890123456789012345678901234567890",
    "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    "0x9876543210987654321098765432109876543210",
    "0x5555555555555555555555555555555555555555",
  ];

  return addresses[seed % addresses.length]!;
}

/**
 * Format BigInt to BTC string for test assertions
 */
export function formatBtcForTest(amount: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(decimals, "0");

  return `${whole}.${fractionStr.slice(0, 4)}`;
}

/**
 * Parse BTC string to BigInt for test setup
 */
export function parseBtcForTest(amount: string, decimals: number = 18): bigint {
  const [whole, fraction = "0"] = amount.split(".");
  const wholeBigInt = BigInt(whole || "0") * BigInt(10 ** decimals);
  const fractionBigInt = BigInt(fraction.padEnd(decimals, "0"));

  return wholeBigInt + fractionBigInt;
}

// Re-export commonly used testing library functions
export { screen, waitFor, within, fireEvent } from "@testing-library/react";
export { userEvent } from "@testing-library/user-event";
export { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";

// Re-export everything for convenience
export * from "./test-providers";
