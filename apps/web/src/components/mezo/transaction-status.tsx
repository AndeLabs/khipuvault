/**
 * @fileoverview Transaction Status Components
 * @module components/mezo/transaction-status
 *
 * Components for displaying transaction status with user-friendly
 * error messages parsed from the validation utilities.
 */

"use client";

import { TxErrorType } from "@/hooks/web3/mezo/utils/validation";
import { cn } from "@/lib/utils";

interface TransactionStatusProps {
  isPending?: boolean;
  isConfirming?: boolean;
  isSuccess?: boolean;
  error?: { type: TxErrorType; message: string } | null;
  validationError?: string | null;
  hash?: `0x${string}`;
  className?: string;
}

const errorConfig: Record<TxErrorType, { icon: string; title: string; recoverable: boolean }> = {
  [TxErrorType.USER_REJECTED]: {
    icon: "🚫",
    title: "Transaction Cancelled",
    recoverable: true,
  },
  [TxErrorType.INSUFFICIENT_FUNDS]: {
    icon: "💸",
    title: "Insufficient Balance",
    recoverable: true,
  },
  [TxErrorType.CONTRACT_REVERT]: {
    icon: "⚠️",
    title: "Transaction Failed",
    recoverable: true,
  },
  [TxErrorType.GAS_ESTIMATION]: {
    icon: "⛽",
    title: "Transaction Would Fail",
    recoverable: true,
  },
  [TxErrorType.NETWORK_ERROR]: {
    icon: "🌐",
    title: "Network Error",
    recoverable: true,
  },
  [TxErrorType.UNKNOWN]: {
    icon: "❓",
    title: "Error",
    recoverable: false,
  },
};

export function TransactionStatus({
  isPending,
  isConfirming,
  isSuccess,
  error,
  validationError,
  hash,
  className,
}: TransactionStatusProps) {
  // Show validation error first
  if (validationError) {
    return (
      <div className={cn("rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3", className)}>
        <div className="flex items-start gap-2">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-medium text-yellow-500">Invalid Input</p>
            <p className="text-sm text-yellow-400/80">{validationError}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show parsed error
  if (error) {
    const config = errorConfig[error.type];
    return (
      <div className={cn("rounded-lg border border-red-500/30 bg-red-500/10 p-3", className)}>
        <div className="flex items-start gap-2">
          <span className="text-lg">{config.icon}</span>
          <div>
            <p className="font-medium text-red-500">{config.title}</p>
            <p className="text-sm text-red-400/80">{error.message}</p>
            {config.recoverable && <p className="mt-1 text-xs text-gray-400">You can try again</p>}
          </div>
        </div>
      </div>
    );
  }

  // Show pending state
  if (isPending) {
    return (
      <div className={cn("rounded-lg border border-blue-500/30 bg-blue-500/10 p-3", className)}>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-blue-500">Waiting for wallet confirmation...</p>
        </div>
      </div>
    );
  }

  // Show confirming state
  if (isConfirming && hash) {
    return (
      <div className={cn("rounded-lg border border-blue-500/30 bg-blue-500/10 p-3", className)}>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <div>
            <p className="text-blue-500">Confirming transaction...</p>
            <p className="mt-1 font-mono text-xs text-gray-400">
              {hash.slice(0, 10)}...{hash.slice(-8)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show success state
  if (isSuccess && hash) {
    return (
      <div className={cn("rounded-lg border border-green-500/30 bg-green-500/10 p-3", className)}>
        <div className="flex items-center gap-2">
          <span className="text-lg">✅</span>
          <div>
            <p className="font-medium text-green-500">Transaction Confirmed</p>
            <p className="mt-1 font-mono text-xs text-gray-400">
              {hash.slice(0, 10)}...{hash.slice(-8)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Inline error text for form fields
 */
export function ValidationError({
  error,
  className,
}: {
  error?: string | null;
  className?: string;
}) {
  if (!error) return null;

  return <p className={cn("text-sm text-red-500", className)}>{error}</p>;
}

/**
 * Transaction hash link
 */
export function TxHashLink({
  hash,
  explorerUrl = "https://explorer.mezo.org/tx",
  className,
}: {
  hash: `0x${string}`;
  explorerUrl?: string;
  className?: string;
}) {
  return (
    <a
      href={`${explorerUrl}/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 font-mono text-xs text-blue-400 hover:text-blue-300 hover:underline",
        className
      )}
    >
      {hash.slice(0, 10)}...{hash.slice(-8)}
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  );
}
