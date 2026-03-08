/**
 * @fileoverview Reusable Modal Flow Hook
 * @module hooks/use-modal-flow
 *
 * Standardizes modal state management for transaction-based modals.
 * Reduces boilerplate across deposit, withdraw, contribute, and other modals.
 *
 * @example
 * ```tsx
 * function DepositModal({ open, onOpenChange }) {
 *   const { mutate, isPending, isSuccess, error } = useDeposit();
 *
 *   const {
 *     step,
 *     setStep,
 *     handleSubmit,
 *     handleSuccess,
 *     handleError,
 *     reset,
 *   } = useModalFlow({
 *     onSuccess: () => {
 *       toast.success("Deposit successful!");
 *       onOpenChange(false);
 *     },
 *     onError: (error) => {
 *       toast.error(error.message);
 *     },
 *   });
 *
 *   const onSubmit = async () => {
 *     await handleSubmit(async () => {
 *       await mutate({ amount });
 *     });
 *   };
 *
 *   // Monitor transaction state
 *   useEffect(() => {
 *     if (isSuccess) handleSuccess();
 *     if (error) handleError(error);
 *   }, [isSuccess, error]);
 * }
 * ```
 */

"use client";

import { useCallback, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BLOCKCHAIN_TIMING, UI_TIMING } from "@/lib/config/timing";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Standard modal flow steps
 */
export type ModalStep = "idle" | "input" | "confirming" | "processing" | "success" | "error";

/**
 * Configuration for the modal flow hook
 */
export interface UseModalFlowOptions {
  /** Callback when transaction succeeds */
  onSuccess?: (txHash?: string) => void;
  /** Callback when transaction fails */
  onError?: (error: Error) => void;
  /** Query keys to invalidate on success */
  invalidateKeys?: readonly (readonly unknown[])[];
  /** Delay before invalidating queries (ms) - allows blockchain to confirm */
  invalidateDelay?: number;
  /** Auto-close modal on success after delay (ms). Set to 0 to disable. */
  autoCloseDelay?: number;
  /** Function to close the modal */
  onClose?: () => void;
  /** Show toast notifications */
  showToasts?: boolean;
  /** Success toast message */
  successMessage?: string;
  /** Error toast title */
  errorTitle?: string;
}

/**
 * Return type of useModalFlow hook
 */
export interface UseModalFlowResult {
  /** Current step in the modal flow */
  step: ModalStep;
  /** Set the current step */
  setStep: (step: ModalStep) => void;
  /** Error message if any */
  error: string | null;
  /** Transaction hash if available */
  txHash: string | null;
  /** Whether the flow is processing (confirming or processing) */
  isProcessing: boolean;
  /** Whether the flow is in a loading state */
  isLoading: boolean;
  /** Whether the flow completed successfully */
  isComplete: boolean;
  /** Reset the flow to initial state */
  reset: () => void;
  /** Wrap an async action with proper state management */
  executeAction: <T>(action: () => Promise<T>) => Promise<T | undefined>;
  /** Call when transaction succeeds */
  handleSuccess: (txHash?: string) => void;
  /** Call when transaction fails */
  handleError: (error: Error | string) => void;
  /** Transition to confirming step (user interacting with wallet) */
  startConfirming: () => void;
  /** Transition to processing step (tx submitted, waiting for confirmation) */
  startProcessing: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default delay before invalidating queries after success */
const DEFAULT_INVALIDATE_DELAY = BLOCKCHAIN_TIMING.CONFIRMATION_DELAY;

/** Default delay before auto-closing modal after success */
const DEFAULT_AUTO_CLOSE_DELAY = UI_TIMING.MODAL_AUTO_CLOSE;

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for managing modal transaction flow state
 */
export function useModalFlow(options: UseModalFlowOptions = {}): UseModalFlowResult {
  const {
    onSuccess,
    onError,
    invalidateKeys,
    invalidateDelay = DEFAULT_INVALIDATE_DELAY,
    autoCloseDelay = DEFAULT_AUTO_CLOSE_DELAY,
    onClose,
    showToasts = true,
    successMessage = "Transaction successful!",
    errorTitle = "Transaction Failed",
  } = options;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State
  const [step, setStep] = useState<ModalStep>("input");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Derived state
  const isProcessing = step === "confirming" || step === "processing";
  const isLoading = step === "confirming" || step === "processing";
  const isComplete = step === "success";

  // Reset function
  const reset = useCallback(() => {
    setStep("input");
    setError(null);
    setTxHash(null);
  }, []);

  // Start confirming (waiting for wallet signature)
  const startConfirming = useCallback(() => {
    setStep("confirming");
    setError(null);
  }, []);

  // Start processing (tx submitted)
  const startProcessing = useCallback(() => {
    setStep("processing");
  }, []);

  // Handle success
  const handleSuccess = useCallback(
    (hash?: string) => {
      setStep("success");
      if (hash) setTxHash(hash);

      // Show success toast
      if (showToasts) {
        toast({
          title: "Success",
          description: successMessage,
        });
      }

      // Invalidate queries after delay
      if (invalidateKeys && invalidateKeys.length > 0) {
        setTimeout(() => {
          invalidateKeys.forEach((key) => {
            void queryClient.invalidateQueries({ queryKey: key as readonly unknown[] });
          });
        }, invalidateDelay);
      }

      // Call success callback
      onSuccess?.(hash);

      // Auto-close modal
      if (autoCloseDelay > 0 && onClose) {
        setTimeout(() => {
          onClose();
        }, autoCloseDelay);
      }
    },
    [
      showToasts,
      toast,
      successMessage,
      invalidateKeys,
      invalidateDelay,
      queryClient,
      onSuccess,
      autoCloseDelay,
      onClose,
    ]
  );

  // Handle error
  const handleError = useCallback(
    (err: Error | string) => {
      const errorMessage = typeof err === "string" ? err : err.message;
      setStep("error");
      setError(errorMessage);

      // Show error toast
      if (showToasts) {
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      }

      // Call error callback
      if (typeof err !== "string") {
        onError?.(err);
      } else {
        onError?.(new Error(err));
      }
    },
    [showToasts, toast, errorTitle, onError]
  );

  // Execute action with state management
  const executeAction = useCallback(
    async <T>(action: () => Promise<T>): Promise<T | undefined> => {
      try {
        startConfirming();
        const result = await action();
        // Note: Success should be called by the consumer when tx is confirmed
        return result;
      } catch (err) {
        handleError(err instanceof Error ? err : new Error(String(err)));
        return undefined;
      }
    },
    [startConfirming, handleError]
  );

  return {
    step,
    setStep,
    error,
    txHash,
    isProcessing,
    isLoading,
    isComplete,
    reset,
    executeAction,
    handleSuccess,
    handleError,
    startConfirming,
    startProcessing,
  };
}

// ============================================================================
// UTILITY HOOK FOR TRANSACTION MONITORING
// ============================================================================

/**
 * Hook to connect transaction state to modal flow
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isSuccess, error, hash } = useDeposit();
 * const flow = useModalFlow({ onSuccess: () => onClose() });
 *
 * useTransactionMonitor({
 *   isPending,
 *   isSuccess,
 *   error,
 *   hash,
 *   flow,
 * });
 * ```
 */
export interface UseTransactionMonitorOptions {
  /** Whether transaction is pending (waiting for wallet) */
  isPending?: boolean;
  /** Whether transaction succeeded */
  isSuccess?: boolean;
  /** Transaction error */
  error?: Error | null;
  /** Transaction hash */
  hash?: string | null;
  /** Modal flow instance */
  flow: UseModalFlowResult;
}

export function useTransactionMonitor({
  isPending,
  isSuccess,
  error,
  hash,
  flow,
}: UseTransactionMonitorOptions): void {
  // Update step when pending changes
  useEffect(() => {
    if (isPending && flow.step === "confirming") {
      flow.startProcessing();
    }
  }, [isPending, flow]);

  // Handle success
  useEffect(() => {
    if (isSuccess && flow.step !== "success") {
      flow.handleSuccess(hash ?? undefined);
    }
  }, [isSuccess, hash, flow]);

  // Handle error
  useEffect(() => {
    if (error && flow.step !== "error") {
      flow.handleError(error);
    }
  }, [error, flow]);
}

export default useModalFlow;
