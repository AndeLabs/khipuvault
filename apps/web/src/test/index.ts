/**
 * @fileoverview Testing Utilities - Main Export
 * @module test
 *
 * Central export point for all testing utilities.
 * Import everything you need for testing from this single module.
 *
 * @example
 * ```tsx
 * // Import everything you need from one place
 * import {
 *   renderWithProviders,
 *   createMockPool,
 *   createMockUser,
 *   mockContractRead,
 *   handlers,
 *   screen,
 *   waitFor,
 *   vi,
 *   expect,
 * } from "@/test";
 *
 * describe("MyComponent", () => {
 *   it("renders correctly", () => {
 *     const pool = createMockPool({ name: "Test Pool" });
 *     renderWithProviders(<MyComponent pool={pool} />);
 *     expect(screen.getByText("Test Pool")).toBeInTheDocument();
 *   });
 * });
 * ```
 */

// ============================================================================
// Test Utilities
// ============================================================================

export {
  // Render functions
  renderWithProviders,
  AllTheProviders,
  createTestQueryClient,
  // Factory functions - Pool
  createMockPool,
  // Factory functions - User
  createMockUser,
  createMockPosition,
  // Factory functions - Transaction
  createMockTransaction,
  // Factory functions - Blockchain
  createMockPoolData,
  // Helper functions
  waitForLoadingToFinish,
  waitForElementToBeRemoved,
  getMockAddress,
  formatBtcForTest,
  parseBtcForTest,
  // Re-exported from testing-library
  screen,
  waitFor,
  within,
  fireEvent,
  userEvent,
  // Re-exported from vitest
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "./test-utils";

export { TestProviders, createWrapper } from "./test-providers";

// ============================================================================
// Mock Handlers (MSW)
// ============================================================================

export {
  handlers,
  errorHandlers,
  createDelayedHandler,
  mockData,
  resetMockData,
} from "./mocks/handlers";

// ============================================================================
// Contract Mocks
// ============================================================================

export {
  // Mock addresses
  MOCK_ADDRESSES,
  // Mock hook returns
  mockContractRead,
  mockContractWrite,
  mockWaitForReceipt,
  // Mock contract data
  mockIndividualPoolData,
  mockCooperativePoolData,
  mockLotteryPoolData,
  mockRotatingPoolData,
  mockMusdTokenData,
  mockMezoData,
  // Helper functions
  createMockTxHash,
  createMockContractError,
  createSuccessReceipt,
  createRevertedReceipt,
} from "./mocks/contracts";

// ============================================================================
// Type Exports
// ============================================================================

export type {
  MockReadContractReturn,
  MockWriteContractReturn,
  MockWaitForReceiptReturn,
} from "./mocks/contracts";
