/**
 * @fileoverview Mezo Protocol Hooks - Main Export
 * @module hooks/web3/mezo
 *
 * Comprehensive hooks for interacting with Mezo Protocol:
 * - Price Feed: Real-time BTC/USD prices from Pyth oracle
 * - Stability Pool: Deposit MUSD, earn liquidation rewards
 * - Trove Manager: Query Trove (CDP) data and system stats
 * - Borrower Operations: Open, close, adjust Troves
 *
 * @example
 * ```tsx
 * import { useMezoPriceFeed, useStabilityPoolStats, useUserTrove } from "@/hooks/web3/mezo";
 *
 * function MyComponent() {
 *   const { price } = useMezoPriceFeed();
 *   const { totalDeposits } = useStabilityPoolStats();
 *   const { hasActiveTrove, collateralRatio } = useUserTrove();
 *
 *   return <div>BTC Price: ${price}</div>;
 * }
 * ```
 */

"use client";

// ============================================================================
// PRICE FEED HOOKS
// ============================================================================

export { useMezoPriceFeed, usePriceFeedStatus, useBtcToUsd } from "./use-mezo-price-feed";

// ============================================================================
// STABILITY POOL HOOKS
// ============================================================================

export {
  useStabilityPoolStats,
  useUserStabilityPoolPosition,
  useDepositToStabilityPool,
  useWithdrawFromStabilityPool,
  useApproveMusdForStabilityPool,
  useStabilityPoolDeposit,
} from "./use-mezo-stability-pool";

// ============================================================================
// TROVE MANAGER HOOKS
// ============================================================================

export {
  TroveStatus,
  type TroveStatusType,
  useTroveManagerStats,
  useUserTrove,
  useSystemTCR,
  useRecoveryMode,
  useBorrowingFee,
} from "./use-mezo-trove-manager";

// ============================================================================
// BORROWER OPERATIONS HOOKS
// ============================================================================

export {
  useMinNetDebt,
  useCalculateBorrowingFee,
  useUserBtcBalance,
  useOpenTrove,
  useCloseTrove,
  useAddCollateral,
  useWithdrawCollateral,
  useBorrowMusd,
  useRepayMusd,
  useGetHints,
  useComputeCR,
} from "./use-mezo-borrower";

// ============================================================================
// LIQUIDATION MONITORING HOOKS
// ============================================================================

export {
  LiquidationRisk,
  type LiquidationRiskLevel,
  useLiquidationMonitor,
  useLiquidatableTroves,
  calculateHealthFactor,
  formatHealthFactor,
} from "./use-liquidation-monitor";
