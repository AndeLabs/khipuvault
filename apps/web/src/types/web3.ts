/**
 * @fileoverview Centralized Web3 Type Re-exports
 * @module types/web3
 *
 * Single entry point for commonly used Web3 types across the application.
 * Types are defined in their respective modules and re-exported here for convenience.
 *
 * @example
 * ```ts
 * import type {
 *   MutationState,
 *   CooperativePoolInfo,
 *   LotteryRoundV3,
 * } from "@/types/web3";
 * ```
 */

// ============================================================================
// COOPERATIVE POOL TYPES
// ============================================================================

export type {
  PoolInfo as CooperativePoolInfo,
  MemberInfo as CooperativeMemberInfo,
  MemberWithAddress,
  ActionState,
  MemberInfoContractResponse,
  PoolInfoContractResponse,
} from "@/hooks/web3/cooperative/constants";

export { PoolStatus as CooperativePoolStatus } from "@/hooks/web3/cooperative/constants";

// ============================================================================
// INDIVIDUAL POOL TYPES
// ============================================================================

export type { TransactionState } from "@/hooks/web3/individual/constants";

export type { UserInfoV3, ReferralStats } from "@/lib/web3/contracts-v3";

// ============================================================================
// LOTTERY POOL TYPES
// ============================================================================

export type {
  LotteryRoundStatusType,
  LotteryRoundV3,
  LotteryParticipantV3,
  RoundInfo as LotteryRoundInfo,
  UserLotteryInfo,
} from "@/lib/web3/lottery-types";

export {
  LotteryRoundStatus,
  RoundStatus as SimpleLotteryRoundStatus,
} from "@/lib/web3/lottery-types";

// ============================================================================
// CONTRACT MUTATION TYPES
// ============================================================================

export type {
  MutationState,
  ContractMutationConfig,
  MutationParams,
  ContractMutationResult,
} from "@/hooks/web3/common/use-contract-mutation";

// ============================================================================
// TRANSACTION CALLBACK TYPES
// ============================================================================

/**
 * Result type for transaction callback functions.
 * Use this instead of Promise<any> for type safety.
 *
 * @example
 * ```ts
 * interface DepositCardProps {
 *   onDeposit: (amount: string) => Promise<TransactionResult>;
 * }
 * ```
 */
export type TransactionResult = void | {
  hash?: `0x${string}`;
  success?: boolean;
};

/**
 * Transaction callback function type with amount parameter
 */
export type TransactionCallback = (amount: string) => Promise<TransactionResult>;

/**
 * Transaction callback function type without parameters
 */
export type TransactionAction = () => Promise<TransactionResult>;

// ============================================================================
// COMMON TOKEN/ADDRESS TYPES
// ============================================================================

export type { Address } from "viem";
