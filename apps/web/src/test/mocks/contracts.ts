/**
 * @fileoverview Contract Mocks for Testing
 * @module test/mocks/contracts
 *
 * Provides mock contract responses and utilities for testing Web3 interactions.
 * These mocks simulate blockchain contract calls without needing a real network.
 *
 * @example
 * ```tsx
 * import { mockContractRead, mockContractWrite } from "@/test/mocks/contracts";
 *
 * // Mock a contract read
 * vi.mocked(useReadContract).mockReturnValue(
 *   mockContractRead({ data: BigInt(1000000000000000000) })
 * );
 *
 * // Mock a contract write
 * vi.mocked(useWriteContract).mockReturnValue(
 *   mockContractWrite({ isPending: false })
 * );
 * ```
 */

import type { Address, Hash } from "viem";

// ============================================================================
// Mock Contract Addresses
// ============================================================================

export const MOCK_ADDRESSES = {
  INDIVIDUAL_POOL: "0x1111111111111111111111111111111111111111" as Address,
  COOPERATIVE_POOL: "0x2222222222222222222222222222222222222222" as Address,
  LOTTERY_POOL: "0x3333333333333333333333333333333333333333" as Address,
  ROTATING_POOL: "0x4444444444444444444444444444444444444444" as Address,
  MUSD_TOKEN: "0x5555555555555555555555555555555555555555" as Address,
  STABILITY_POOL: "0x6666666666666666666666666666666666666666" as Address,
  TROVE_MANAGER: "0x7777777777777777777777777777777777777777" as Address,
  USER_WALLET: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" as Address,
} as const;

// ============================================================================
// Mock Hook Returns
// ============================================================================

/**
 * Mock return value for useReadContract hook
 */
export interface MockReadContractReturn<T = unknown> {
  data?: T;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  isPending?: boolean;
  isSuccess?: boolean;
  refetch?: () => void;
}

/**
 * Create a mock return value for useReadContract
 */
export function mockContractRead<T = unknown>(
  overrides: MockReadContractReturn<T> = {}
): MockReadContractReturn<T> {
  return {
    data: overrides.data,
    isLoading: overrides.isLoading ?? false,
    isPending: overrides.isPending ?? false,
    isError: overrides.isError ?? false,
    isSuccess: overrides.isSuccess ?? true,
    error: overrides.error ?? null,
    refetch: overrides.refetch ?? (() => {}),
  };
}

/**
 * Mock return value for useWriteContract hook
 */
export interface MockWriteContractReturn {
  writeContract?: (args: unknown) => void;
  writeContractAsync?: (args: unknown) => Promise<Hash>;
  isPending?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  error?: Error | null;
  data?: Hash;
  reset?: () => void;
}

/**
 * Create a mock return value for useWriteContract
 */
export function mockContractWrite(
  overrides: MockWriteContractReturn = {}
): MockWriteContractReturn {
  return {
    writeContract: overrides.writeContract ?? (() => {}),
    writeContractAsync:
      overrides.writeContractAsync ??
      (async () => "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" as Hash),
    isPending: overrides.isPending ?? false,
    isError: overrides.isError ?? false,
    isSuccess: overrides.isSuccess ?? false,
    error: overrides.error ?? null,
    data: overrides.data,
    reset: overrides.reset ?? (() => {}),
  };
}

/**
 * Mock return value for useWaitForTransactionReceipt hook
 */
export interface MockWaitForReceiptReturn {
  data?: {
    status: "success" | "reverted";
    transactionHash: Hash;
    blockNumber: bigint;
    gasUsed: bigint;
  };
  isLoading?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  error?: Error | null;
}

/**
 * Create a mock return value for useWaitForTransactionReceipt
 */
export function mockWaitForReceipt(
  overrides: MockWaitForReceiptReturn = {}
): MockWaitForReceiptReturn {
  return {
    data: overrides.data ?? {
      status: "success" as const,
      transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" as Hash,
      blockNumber: BigInt(1000000),
      gasUsed: BigInt(21000),
    },
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    isSuccess: overrides.isSuccess ?? true,
    error: overrides.error ?? null,
  };
}

// ============================================================================
// Mock Contract Data - Individual Pool
// ============================================================================

export const mockIndividualPoolData = {
  /**
   * Mock balance of a user in the individual pool
   */
  balance: BigInt("1000000000000000000"), // 1 BTC

  /**
   * Mock total deposited in individual pool
   */
  totalDeposited: BigInt("50000000000000000000"), // 50 BTC

  /**
   * Mock yield generated for a user
   */
  yieldGenerated: BigInt("50000000000000000"), // 0.05 BTC

  /**
   * Mock total yield generated in pool
   */
  totalYield: BigInt("2500000000000000000"), // 2.5 BTC

  /**
   * Mock last compound timestamp
   */
  lastCompound: BigInt(Math.floor(Date.now() / 1000) - 86400), // 1 day ago

  /**
   * Mock pool status (active)
   */
  isActive: true,

  /**
   * Mock minimum deposit amount
   */
  minDeposit: BigInt("10000000000000000"), // 0.01 BTC

  /**
   * Mock maximum deposit amount
   */
  maxDeposit: BigInt("100000000000000000000"), // 100 BTC
};

// ============================================================================
// Mock Contract Data - Cooperative Pool
// ============================================================================

export const mockCooperativePoolData = {
  /**
   * Mock pool info tuple [id, name, creator, memberCount, contributionAmount, etc.]
   */
  poolInfo: [
    BigInt(1), // id
    "Test Cooperative Pool", // name
    MOCK_ADDRESSES.USER_WALLET, // creator
    BigInt(10), // memberCount
    BigInt("1000000000000000000"), // contributionAmount (1 BTC)
    BigInt(2592000), // periodDuration (30 days)
    BigInt(0), // currentPeriod
    BigInt(12), // totalPeriods
    BigInt(Math.floor(Date.now() / 1000)), // startTime
    BigInt("10000000000000000000"), // totalBtcCollected (10 BTC)
    BigInt("10000000000"), // totalMusdMinted
    BigInt("500000000000000000"), // totalYieldGenerated (0.5 BTC)
    BigInt("0"), // yieldDistributed
    0, // status (0 = FORMING)
    true, // autoAdvance
    true, // useNativeBtc
  ],

  /**
   * Mock member info
   */
  memberInfo: {
    isActive: true,
    contribution: BigInt("1000000000000000000"),
    lastContributionTime: BigInt(Math.floor(Date.now() / 1000)),
    yieldEarned: BigInt("50000000000000000"),
  },
};

// ============================================================================
// Mock Contract Data - Lottery Pool
// ============================================================================

export const mockLotteryPoolData = {
  /**
   * Mock current lottery round
   */
  currentRound: BigInt(42),

  /**
   * Mock ticket price
   */
  ticketPrice: BigInt("10000000000000000"), // 0.01 BTC

  /**
   * Mock total prize pool
   */
  prizePool: BigInt("10000000000000000000"), // 10 BTC

  /**
   * Mock user ticket count
   */
  userTickets: BigInt(5),

  /**
   * Mock total tickets sold
   */
  totalTickets: BigInt(1000),

  /**
   * Mock draw time
   */
  drawTime: BigInt(Math.floor(Date.now() / 1000) + 86400), // 1 day from now

  /**
   * Mock winning numbers
   */
  winningNumbers: [BigInt(7), BigInt(14), BigInt(21), BigInt(28), BigInt(35), BigInt(42)],

  /**
   * Mock is winner
   */
  isWinner: false,
};

// ============================================================================
// Mock Contract Data - Rotating Pool (ROSCA)
// ============================================================================

export const mockRotatingPoolData = {
  /**
   * Mock ROSCA pool info
   */
  poolInfo: [
    BigInt(1), // id
    "Test ROSCA Pool", // name
    MOCK_ADDRESSES.USER_WALLET, // creator
    BigInt(12), // memberCount
    BigInt("10000000000000000"), // contributionAmount (0.01 BTC)
    BigInt(2592000), // periodDuration (30 days)
    BigInt(5), // currentPeriod
    BigInt(12), // totalPeriods
    BigInt(1704067200), // startTime
    BigInt("120000000000000000"), // totalBtcCollected
    BigInt("120000000000"), // totalMusdMinted
    BigInt("5000000000000000"), // totalYieldGenerated
    BigInt("2000000000000000"), // yieldDistributed
    1, // status (1 = ACTIVE)
    true, // autoAdvance
    true, // useNativeBtc
  ],

  /**
   * Mock member participation
   */
  memberInfo: {
    hasPaid: true,
    hasReceived: false,
    receivePeriod: BigInt(7),
    contributions: BigInt("50000000000000000"), // 0.05 BTC
  },

  /**
   * Mock user pools (array of pool IDs user is part of)
   */
  userPools: [BigInt(1), BigInt(3), BigInt(5)],
};

// ============================================================================
// Mock Contract Data - MUSD Token
// ============================================================================

export const mockMusdTokenData = {
  /**
   * Mock MUSD balance
   */
  balance: BigInt("1000000000"), // 1000 MUSD (9 decimals)

  /**
   * Mock allowance
   */
  allowance: BigInt("0"),

  /**
   * Mock total supply
   */
  totalSupply: BigInt("1000000000000000"), // 1M MUSD

  /**
   * Mock decimals
   */
  decimals: 9,

  /**
   * Mock name
   */
  name: "MUSD Stablecoin",

  /**
   * Mock symbol
   */
  symbol: "MUSD",
};

// ============================================================================
// Mock Contract Data - Mezo Integration
// ============================================================================

export const mockMezoData = {
  /**
   * Mock stability pool deposit
   */
  stabilityPoolDeposit: BigInt("5000000000"), // 5000 MUSD

  /**
   * Mock trove debt
   */
  troveDebt: BigInt("4000000000"), // 4000 MUSD

  /**
   * Mock trove collateral
   */
  troveCollateral: BigInt("1000000000000000000"), // 1 BTC

  /**
   * Mock collateral ratio (150%)
   */
  collateralRatio: 150,

  /**
   * Mock liquidation reserve
   */
  liquidationReserve: BigInt("200000000"), // 200 MUSD

  /**
   * Mock borrowing fee
   */
  borrowingFee: BigInt("40000000"), // 40 MUSD (1%)
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a mock transaction hash
 */
export function createMockTxHash(seed: number = 0): Hash {
  const hashes: Hash[] = [
    "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "0x1111111111111111111111111111111111111111111111111111111111111111",
    "0x2222222222222222222222222222222222222222222222222222222222222222",
    "0x3333333333333333333333333333333333333333333333333333333333333333",
  ];

  return hashes[seed % hashes.length]!;
}

/**
 * Create a mock error for contract calls
 */
export function createMockContractError(message: string = "Contract execution reverted") {
  const error = new Error(message);
  error.name = "ContractFunctionExecutionError";
  return error;
}

/**
 * Simulate a successful transaction receipt
 */
export function createSuccessReceipt(txHash: Hash = createMockTxHash()) {
  return {
    status: "success" as const,
    transactionHash: txHash,
    blockNumber: BigInt(1000000 + Math.floor(Math.random() * 10000)),
    gasUsed: BigInt(21000 + Math.floor(Math.random() * 50000)),
    logs: [],
  };
}

/**
 * Simulate a reverted transaction receipt
 */
export function createRevertedReceipt(txHash: Hash = createMockTxHash()) {
  return {
    status: "reverted" as const,
    transactionHash: txHash,
    blockNumber: BigInt(1000000 + Math.floor(Math.random() * 10000)),
    gasUsed: BigInt(21000),
    logs: [],
  };
}
