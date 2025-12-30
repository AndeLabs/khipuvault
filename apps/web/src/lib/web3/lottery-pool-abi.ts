/**
 * @fileoverview ABI for LotteryPoolV3 contract
 * @module lib/web3/lottery-pool-abi
 *
 * LotteryPoolV3 deployed on Mezo Testnet at:
 * 0x8c9cc22f5184bB4E485dbb51531959A8Cf0624b4
 *
 * V3 Features:
 * - Commit/Reveal randomness scheme
 * - mUSD-based lottery (not native BTC)
 * - UUPS Upgradeable
 * - Yield aggregation integration
 */

// Import the V3 ABI from the contracts package
import LotteryPoolV3ABI from "@/contracts/abis/LotteryPoolV3.json";

// Ensure ABI is an array (handle bundler wrapping)
export const LOTTERY_POOL_ABI = Array.isArray(LotteryPoolV3ABI)
  ? LotteryPoolV3ABI
  : (LotteryPoolV3ABI as any).default ||
    (LotteryPoolV3ABI as any).abi ||
    LotteryPoolV3ABI;

// V3 Round Status enum values
export const LotteryRoundStatus = {
  OPEN: 0,
  COMMIT: 1,
  REVEAL: 2,
  COMPLETED: 3,
  CANCELLED: 4,
} as const;

export type LotteryRoundStatusType =
  (typeof LotteryRoundStatus)[keyof typeof LotteryRoundStatus];

// V3 Round structure type
export interface LotteryRoundV3 {
  ticketPrice: bigint;
  totalMusd: bigint;
  maxTickets: bigint;
  totalTicketsSold: bigint;
  startTime: bigint;
  endTime: bigint;
  commitDeadline: bigint;
  revealDeadline: bigint;
  winner: string;
  winnerPrize: bigint;
  totalYield: bigint;
  status: LotteryRoundStatusType;
  operatorCommit: string;
  revealedSeed: bigint;
}

// V3 Participant structure type
export interface LotteryParticipantV3 {
  ticketCount: bigint;
  musdContributed: bigint;
  firstTicketIndex: bigint;
  lastTicketIndex: bigint;
  claimed: boolean;
}

// Export default for backwards compatibility
export default LOTTERY_POOL_ABI;
