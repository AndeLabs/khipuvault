/**
 * @fileoverview API Request/Response Types
 * @module lib/api/types
 *
 * TypeScript types for API requests and responses.
 * Provides type safety for all API interactions.
 */

import type { Address } from "viem";

/**
 * Common pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Common paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * API request configuration
 */
export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

/**
 * API response envelope
 */
export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: unknown;
  timestamp: string;
}

// ============================================================================
// User Types
// ============================================================================

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

export interface UserStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalYieldsClaimed: string;
  activePools: number;
  joinedAt: Date;
  lastActivityAt: Date;
}

// ============================================================================
// Pool Types
// ============================================================================

export type PoolType = "individual" | "cooperative" | "lottery" | "rotating";
export type PoolStatus = "active" | "paused" | "emergency" | "closed";

export interface Pool {
  id: string;
  contractAddress: Address;
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

export interface PoolStats {
  activeDepositors: number;
  change24h: number;
  volume24h: string;
  totalVolume: string;
  avgDepositSize: string;
}

export interface PoolAnalytics {
  poolId: string;
  tvlHistory: Array<{ timestamp: Date; tvl: string }>;
  aprHistory: Array<{ timestamp: Date; apr: number }>;
  userGrowth: Array<{ timestamp: Date; users: number }>;
  yieldDistribution: Array<{ date: Date; amount: string }>;
}

export interface PoolParticipant {
  address: Address;
  depositAmount: string;
  yieldsClaimed: string;
  joinedAt: Date;
  isActive: boolean;
}

// ============================================================================
// Transaction Types
// ============================================================================

export type TransactionType =
  | "deposit"
  | "withdraw"
  | "claim_yield"
  | "compound"
  | "pool_created"
  | "pool_joined"
  | "pool_left"
  | "lottery_purchase"
  | "lottery_won"
  | "rosca_payment"
  | "rosca_payout";

export type TransactionStatus = "pending" | "confirmed" | "failed";

export interface Transaction {
  id: string;
  userId: string;
  poolId: string;
  type: TransactionType;
  amount: string;
  txHash: Address;
  blockNumber: number;
  timestamp: Date;
  status: TransactionStatus;
  gasUsed?: string;
  error?: string;
}

export interface TransactionFilter {
  address?: Address;
  poolId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  fromDate?: Date;
  toDate?: Date;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface GlobalAnalytics {
  totalValueLocked: string;
  totalUsers: number;
  totalPools: number;
  totalYieldsDistributed: string;
  averageApr: number;
  volume24h: string;
}

export interface PlatformStats {
  activeUsers24h: number;
  transactions24h: number;
  newPools7d: number;
  popularPool: {
    id: string;
    name: string;
    participants: number;
  };
}

export interface YieldAnalytics {
  totalYields: string;
  averageYield: string;
  topPerformers: Array<{
    poolId: string;
    poolName: string;
    yield: string;
    apr: number;
  }>;
}

// ============================================================================
// Lottery Types
// ============================================================================

export interface LotteryRound {
  id: string;
  roundNumber: number;
  prizePool: string;
  totalTickets: number;
  ticketPrice: string;
  drawTime: Date;
  winner?: Address;
  winningTicket?: number;
  status: "active" | "drawing" | "completed" | "cancelled";
}

export interface LotteryTicket {
  id: string;
  roundId: string;
  owner: Address;
  ticketNumber: number;
  purchasedAt: Date;
  isWinner: boolean;
}

// ============================================================================
// ROSCA (Rotating Pool) Types
// ============================================================================

export interface RoscaPool {
  id: string;
  contractAddress: Address;
  contributionAmount: string;
  totalParticipants: number;
  currentRound: number;
  totalRounds: number;
  nextPayoutDate: Date;
  status: "forming" | "active" | "completed";
  createdAt: Date;
}

export interface RoscaParticipant {
  address: Address;
  contributionsPaid: number;
  hasReceivedPayout: boolean;
  payoutRound?: number;
  joinedAt: Date;
}

export interface RoscaRound {
  roundNumber: number;
  recipient: Address;
  payoutAmount: string;
  contributorsCount: number;
  completedAt?: Date;
  status: "pending" | "active" | "completed";
}

// ============================================================================
// Mezo Protocol Types
// ============================================================================

export interface MezoTroveStats {
  userAddress: Address;
  collateral: string;
  debt: string;
  collateralRatio: string;
  isActive: boolean;
  lastUpdated: Date;
}

export interface MezoStabilityPoolStats {
  userAddress: Address;
  depositedAmount: string;
  pendingRewards: string;
  totalRewardsClaimed: string;
  lastUpdated: Date;
}

export interface MezoSystemStats {
  totalCollateral: string;
  totalDebt: string;
  stabilityPoolBalance: string;
  musdPrice: string;
  systemCollateralRatio: string;
}
