/**
 * @fileoverview Application Hooks - Main Export Module
 * @module hooks
 *
 * Central export point for general-purpose application hooks.
 *
 * Organization:
 * - Root level: General utility hooks (toast, errors, modal, etc.)
 * - web3/: Web3 and blockchain related hooks (see @/hooks/web3/*)
 *
 * Web3 Hooks are organized by feature:
 * - @/hooks/web3/individual - Individual savings pool
 * - @/hooks/web3/cooperative - Cooperative savings pool
 * - @/hooks/web3/lottery - Prize pool / lottery
 * - @/hooks/web3/rotating - Rotating savings (ROSCA)
 * - @/hooks/web3/mezo - Mezo protocol integration
 * - @/hooks/web3/common - Shared utilities
 */

"use client";

// ============================================================================
// UI & STATE HOOKS
// ============================================================================

/**
 * Toast notifications with success, error, warning helpers
 */
export {
  useToast,
  toast,
  toastSuccess,
  toastError,
  toastWarning,
  toastInfo,
  toastTransaction,
} from "./use-toast";

/**
 * Centralized error handling with logging
 */
export { useErrorHandler } from "./use-error-handler";

/**
 * Modal flow state management
 */
export { useModalFlow } from "./use-modal-flow";

// ============================================================================
// DATA HOOKS
// ============================================================================

/**
 * BTC price from API
 */
export { useBTCPrice } from "./use-btc-price";

/**
 * Protocol-wide statistics
 */
export { useProtocolStats } from "./use-protocol-stats";

/**
 * Pool statistics aggregation
 */
export { usePoolStats } from "./use-pool-stats";

/**
 * Portfolio analytics for connected user
 */
export { usePortfolioAnalytics } from "./use-portfolio-analytics";

// ============================================================================
// NAVIGATION HOOKS
// ============================================================================

/**
 * Route prefetching for better UX
 */
export { useRoutePrefetch, usePrefetchLinkProps } from "./use-route-prefetch";
