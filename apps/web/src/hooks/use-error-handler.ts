/**
 * @fileoverview Centralized Error Handler Hook
 * @module hooks/use-error-handler
 *
 * Combines logging, toasting, and error categorization for
 * consistent error handling across the application.
 */

"use client";

import { useCallback } from "react";

import { logger, getUserErrorMessage, isUserRejection } from "@/lib/monitoring";

import { toastError, toastWarning } from "./use-toast";

// ============================================================================
// TYPES
// ============================================================================

export type ErrorCategory = "transaction" | "contract" | "wallet" | "api" | "ui" | "validation";

export interface ErrorHandlerOptions {
  /** Error category for logging */
  category?: ErrorCategory;
  /** Component or hook source name */
  source?: string;
  /** Suppress toast notification */
  silent?: boolean;
  /** Custom fallback message */
  fallbackMessage?: string;
  /** Additional context for logging */
  metadata?: Record<string, unknown>;
  /** Callback after handling */
  onHandled?: (error: unknown) => void;
}

export interface UseErrorHandlerReturn {
  /**
   * Handle any error with logging and optional toast
   */
  handleError: (error: unknown, options?: ErrorHandlerOptions) => void;

  /**
   * Handle transaction-specific errors
   */
  handleTxError: (error: unknown, txHash?: string) => void;

  /**
   * Handle wallet errors (connection, signing, etc.)
   */
  handleWalletError: (error: unknown) => void;

  /**
   * Handle API errors
   */
  handleApiError: (error: unknown, endpoint?: string) => void;

  /**
   * Check if error is user rejection
   */
  isUserRejection: (error: unknown) => boolean;

  /**
   * Get user-friendly error message
   */
  getUserMessage: (error: unknown, fallback?: string) => string;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for centralized error handling
 *
 * @example
 * ```tsx
 * const { handleError, handleTxError } = useErrorHandler();
 *
 * try {
 *   await someOperation();
 * } catch (err) {
 *   handleError(err, { category: 'contract', source: 'DepositCard' });
 * }
 * ```
 */
export function useErrorHandler(defaultSource?: string): UseErrorHandlerReturn {
  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const {
        category = "ui",
        source = defaultSource,
        silent = false,
        fallbackMessage = "An error occurred. Please try again.",
        metadata,
        onHandled,
      } = options;

      // Check if user rejected
      if (isUserRejection(error)) {
        // User rejections are expected - log as warning, don't show error toast
        logger.warn("User rejected action", { category: "wallet", source });
        if (!silent) {
          toastWarning("Action Cancelled", "You cancelled the operation.");
        }
        onHandled?.(error);
        return;
      }

      // Log the error
      logger.error(getUserErrorMessage(error, fallbackMessage), error, {
        category,
        source,
        metadata,
      });

      // Show toast unless silent
      if (!silent) {
        toastError(error, fallbackMessage);
      }

      onHandled?.(error);
    },
    [defaultSource]
  );

  const handleTxError = useCallback(
    (error: unknown, txHash?: string) => {
      handleError(error, {
        category: "transaction",
        fallbackMessage: "Transaction failed. Please try again.",
        metadata: txHash ? { txHash } : undefined,
      });
    },
    [handleError]
  );

  const handleWalletError = useCallback(
    (error: unknown) => {
      handleError(error, {
        category: "wallet",
        fallbackMessage: "Wallet error. Please check your connection.",
      });
    },
    [handleError]
  );

  const handleApiError = useCallback(
    (error: unknown, endpoint?: string) => {
      handleError(error, {
        category: "api",
        fallbackMessage: "Server error. Please try again later.",
        metadata: endpoint ? { endpoint } : undefined,
      });
    },
    [handleError]
  );

  const getUserMessage = useCallback((error: unknown, fallback?: string) => {
    return getUserErrorMessage(error, fallback);
  }, []);

  return {
    handleError,
    handleTxError,
    handleWalletError,
    handleApiError,
    isUserRejection,
    getUserMessage,
  };
}
