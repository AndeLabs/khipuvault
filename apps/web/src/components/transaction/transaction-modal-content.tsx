/**
 * @fileoverview Transaction Modal Content Components
 * @module components/transaction/transaction-modal-content
 *
 * Reusable UI components for transaction modals.
 * Provides consistent loading, success, and error states.
 */

"use client";

import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ApproveExecuteStep } from "@/hooks/web3/common/use-approve-and-execute";
import {
  getStepMessage,
  isWalletInteractionStep,
  type StepMessage,
} from "@/lib/config/transaction-messages";
import { getTxExplorerUrl } from "@/lib/config/urls";

// ============================================================================
// PROCESSING STATE
// ============================================================================

interface ProcessingContentProps {
  /** Current transaction step */
  step: ApproveExecuteStep;
  /** Optional step message overrides */
  stepOverrides?: Partial<Record<ApproveExecuteStep, Partial<StepMessage>>>;
  /** Icon color class */
  iconColor?: string;
}

/**
 * Processing state content for transaction modals
 */
export function TransactionProcessing({
  step,
  stepOverrides,
  iconColor = "text-lavanda",
}: ProcessingContentProps) {
  const message = getStepMessage(step, stepOverrides);
  const isWalletStep = isWalletInteractionStep(step);

  return (
    <div className="space-y-4 py-8 text-center">
      <Loader2 className={`mx-auto h-12 w-12 animate-spin ${iconColor}`} />
      <div>
        <p className="mb-1 font-medium">{message.title}</p>
        <p className="text-sm text-muted-foreground">
          {isWalletStep ? "Please confirm in your wallet" : "Please wait..."}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// SUCCESS STATE
// ============================================================================

interface SuccessContentProps {
  /** Success title */
  title?: string;
  /** Success description */
  description?: string;
  /** Transaction hash */
  txHash?: string;
  /** Additional content below description */
  children?: React.ReactNode;
}

/**
 * Success state content for transaction modals
 */
export function TransactionSuccess({
  title = "Transaction Successful!",
  description,
  txHash,
  children,
}: SuccessContentProps) {
  return (
    <div className="space-y-4 py-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
        <CheckCircle2 className="h-8 w-8 text-success" />
      </div>
      <div>
        <p className="mb-1 text-lg font-medium">{title}</p>
        {description && <p className="mb-4 text-sm text-muted-foreground">{description}</p>}
        {txHash && (
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => window.open(getTxExplorerUrl(txHash), "_blank")}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

interface ErrorContentProps {
  /** Error title */
  title?: string;
  /** Error message */
  error: string | Error | null;
  /** Retry callback */
  onRetry?: () => void;
}

/**
 * Error state content for transaction modals
 */
export function TransactionError({
  title = "Transaction Failed",
  error,
  onRetry,
}: ErrorContentProps) {
  const errorMessage = error instanceof Error ? error.message : (error ?? "Unknown error");

  return (
    <div className="space-y-4 py-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="h-8 w-8 text-destructive" />
      </div>
      <div>
        <p className="mb-1 text-lg font-medium">{title}</p>
        <p className="mb-4 text-sm text-muted-foreground">{errorMessage}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COST SUMMARY
// ============================================================================

interface CostRowProps {
  label: string;
  value: string;
  className?: string;
}

/**
 * Single row in a cost summary
 */
export function CostRow({ label, value, className }: CostRowProps) {
  return (
    <div className={`flex justify-between text-sm ${className ?? ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

interface CostSummaryProps {
  /** Summary title */
  title?: string;
  /** Cost rows */
  items: Array<{ label: string; value: string; highlight?: boolean }>;
  /** Additional content */
  children?: React.ReactNode;
  /** Container className */
  className?: string;
}

/**
 * Cost summary box for transaction modals
 */
export function CostSummary({ title, items, children, className }: CostSummaryProps) {
  return (
    <div
      className={`space-y-2 rounded-lg border border-border bg-surface-elevated p-4 ${className ?? ""}`}
    >
      {title && <p className="mb-3 text-sm font-medium">{title}</p>}
      {items.map((item, index) => (
        <CostRow
          key={index}
          label={item.label}
          value={item.value}
          className={item.highlight ? "font-bold" : ""}
        />
      ))}
      {children}
    </div>
  );
}
