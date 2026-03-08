/**
 * @fileoverview Timing and Delay Constants
 * @module lib/config/timing
 *
 * Centralized timing configuration for consistent behavior across the app.
 */

/**
 * Blockchain confirmation delays
 * Time to wait after a transaction for blockchain state to update
 */
export const BLOCKCHAIN_TIMING = {
  /** Standard confirmation delay for query invalidation (ms) */
  CONFIRMATION_DELAY: 3000,
  /** Fast confirmation for optimistic updates (ms) */
  FAST_CONFIRMATION: 1500,
  /** Extended delay for complex operations (ms) */
  EXTENDED_CONFIRMATION: 5000,
} as const;

/**
 * UI timing constants
 */
export const UI_TIMING = {
  /** Auto-close modal after success (ms) */
  MODAL_AUTO_CLOSE: 2000,
  /** Toast display duration (ms) */
  TOAST_DURATION: 5000,
  /** Debounce delay for search inputs (ms) */
  SEARCH_DEBOUNCE: 300,
  /** Polling interval for live data (ms) */
  LIVE_DATA_POLL: 30000,
} as const;

/**
 * Animation durations
 */
export const ANIMATION_TIMING = {
  /** Fast transitions */
  FAST: 150,
  /** Standard transitions */
  NORMAL: 300,
  /** Slow transitions */
  SLOW: 500,
} as const;
