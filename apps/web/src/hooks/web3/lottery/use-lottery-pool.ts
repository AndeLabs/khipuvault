/**
 * @fileoverview Lottery Pool Hooks - Barrel Export
 * @module hooks/web3/lottery/use-lottery-pool
 *
 * Re-exports all lottery pool hooks for backwards compatibility.
 * The actual implementations are split into:
 * - use-lottery-queries.ts - Read operations
 * - use-lottery-mutations.ts - Write operations
 * - lottery-helpers.ts - Utility functions
 */

"use client";

// Query hooks
export {
  useCurrentRound,
  useAllRounds,
  useUserTickets,
  useUserInvestment,
  useUserProbability,
  useUserLotteryStats,
  useLotteryPoolOwner,
  useLotteryPoolDeployed,
  type LotteryRound,
  type UserLotteryStats,
} from "./use-lottery-queries";

// Mutation hooks
export {
  useBuyTickets,
  useClaimPrize,
  useWithdrawCapital,
  useDrawWinner,
  useCreateRound,
} from "./use-lottery-mutations";

// Helper functions
export {
  formatBTC,
  getLotteryTypeText,
  getStatusText,
  getStatusColor,
  getTimeRemaining,
  formatProbability,
  isLotteryPoolDeployed,
  formatUSD,
  formatAddress,
  getRoundStatus,
} from "./lottery-helpers";
