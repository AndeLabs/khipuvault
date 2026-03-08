/**
 * @fileoverview Transaction Step Messages
 * @module lib/config/transaction-messages
 *
 * Centralized messages for transaction step UI feedback.
 * Eliminates duplicated switch statements across modals.
 */

import type { ApproveExecuteStep } from "@/hooks/web3/common/use-approve-and-execute";

// ============================================================================
// TYPES
// ============================================================================

export interface StepMessage {
  /** Primary message shown to user */
  title: string;
  /** Secondary description */
  description: string;
}

// ============================================================================
// MESSAGES
// ============================================================================

/**
 * Standard messages for approve + execute transaction flows.
 * Used by deposit, buy tickets, contribute, and similar modals.
 */
export const TX_STEP_MESSAGES: Record<ApproveExecuteStep, StepMessage> = {
  idle: {
    title: "Ready",
    description: "Enter an amount to continue",
  },
  "switching-network": {
    title: "Switching Network...",
    description: "Please approve the network switch in your wallet",
  },
  checking: {
    title: "Checking Allowance...",
    description: "Verifying token approval status",
  },
  approving: {
    title: "Approving mUSD...",
    description: "Please confirm the approval in your wallet",
  },
  "awaiting-approval": {
    title: "Waiting for Approval...",
    description: "Transaction is being confirmed on-chain",
  },
  "verifying-allowance": {
    title: "Verifying...",
    description: "Confirming approval was successful",
  },
  executing: {
    title: "Processing...",
    description: "Please confirm the transaction in your wallet",
  },
} as const;

/**
 * Get step message with optional action-specific customization.
 *
 * @example
 * ```tsx
 * const { title, description } = getStepMessage(step, {
 *   executing: { title: "Buying Tickets...", description: "Please wait" },
 * });
 * ```
 */
export function getStepMessage(
  step: ApproveExecuteStep,
  overrides?: Partial<Record<ApproveExecuteStep, Partial<StepMessage>>>
): StepMessage {
  const base = TX_STEP_MESSAGES[step];
  const override = overrides?.[step];

  return {
    title: override?.title ?? base.title,
    description: override?.description ?? base.description,
  };
}

/**
 * Check if user needs to interact with wallet at this step
 */
export function isWalletInteractionStep(step: ApproveExecuteStep): boolean {
  return step === "switching-network" || step === "approving" || step === "executing";
}

/**
 * Check if step is a waiting/pending state
 */
export function isWaitingStep(step: ApproveExecuteStep): boolean {
  return step === "awaiting-approval" || step === "checking" || step === "verifying-allowance";
}
