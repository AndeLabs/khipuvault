/**
 * @fileoverview Centralized Logger
 * @module lib/monitoring/logger
 *
 * Structured logging for consistent error handling and debugging.
 * Replaces scattered console.error calls with categorized, actionable logs.
 */

// ============================================================================
// TYPES
// ============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogCategory =
  | "transaction"
  | "wallet"
  | "contract"
  | "api"
  | "ui"
  | "auth"
  | "validation"
  | "general";

export interface LogContext {
  /** Error category for filtering/aggregation */
  category?: LogCategory;
  /** Component or hook name */
  source?: string;
  /** User-friendly error message */
  userMessage?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Transaction hash if applicable */
  txHash?: string;
  /** Wallet address if applicable */
  address?: string;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  timestamp: number;
  error?: Error;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Minimum log level based on environment */
const MIN_LOG_LEVEL: LogLevel = process.env.NODE_ENV === "production" ? "warn" : "debug";

// ============================================================================
// LOGGER IMPLEMENTATION
// ============================================================================

class Logger {
  private minLevel: number;

  constructor() {
    this.minLevel = LOG_LEVELS[MIN_LOG_LEVEL];
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.minLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const { level, message, context } = entry;
    const prefix = context.source ? `[${context.source}]` : "";
    const category = context.category ? `(${context.category})` : "";
    return `${prefix}${category} ${message}`.trim();
  }

  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: Date.now(),
      error,
    };

    const formattedMessage = this.formatMessage(entry);

    // In development, use console methods with nice formatting
    if (process.env.NODE_ENV !== "production") {
      const logMethod = console[level] || console.log;

      if (error) {
        logMethod(formattedMessage, error);
      } else if (Object.keys(context.metadata || {}).length > 0) {
        logMethod(formattedMessage, context.metadata);
      } else {
        logMethod(formattedMessage);
      }
      return;
    }

    // In production, we could send to external service
    // For now, still use console but with structured data
    if (level === "error" || level === "warn") {
      console[level](formattedMessage, {
        ...context,
        error: error?.message,
        stack: error?.stack,
      });
    }
  }

  /**
   * Debug level - Development only
   */
  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  /**
   * Info level - General information
   */
  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  /**
   * Warning level - Non-critical issues
   */
  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  /**
   * Error level - Critical issues
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : undefined;
    const ctx = context || {};

    // If error is not an Error instance, include it in metadata
    if (error && !(error instanceof Error)) {
      ctx.metadata = { ...ctx.metadata, errorData: error };
    }

    this.log("error", message, ctx, err);
  }

  /**
   * Transaction-specific error logging
   */
  txError(message: string, error?: Error | unknown, txHash?: string): void {
    this.error(message, error, {
      category: "transaction",
      txHash,
    });
  }

  /**
   * Contract interaction error logging
   */
  contractError(
    message: string,
    error?: Error | unknown,
    metadata?: Record<string, unknown>
  ): void {
    this.error(message, error, {
      category: "contract",
      metadata,
    });
  }

  /**
   * Wallet-related error logging
   */
  walletError(message: string, error?: Error | unknown, address?: string): void {
    this.error(message, error, {
      category: "wallet",
      address,
    });
  }

  /**
   * API error logging
   */
  apiError(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    this.error(message, error, {
      category: "api",
      metadata,
    });
  }

  /**
   * UI/Component error logging
   */
  uiError(message: string, error?: Error | unknown, source?: string): void {
    this.error(message, error, {
      category: "ui",
      source,
    });
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const logger = new Logger();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract user-friendly message from error
 */
export function getUserErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred"
): string {
  if (!error) {
    return fallback;
  }

  if (error instanceof Error) {
    // Check for common Web3 error patterns
    const message = error.message.toLowerCase();

    if (message.includes("user rejected") || message.includes("user denied")) {
      return "Transaction was rejected";
    }
    if (message.includes("insufficient funds")) {
      return "Insufficient funds for transaction";
    }
    if (message.includes("network") || message.includes("connection")) {
      return "Network connection error. Please try again.";
    }
    if (message.includes("timeout")) {
      return "Request timed out. Please try again.";
    }

    // Return the error message if it's user-friendly (not too technical)
    if (error.message.length < 100 && !error.message.includes("0x")) {
      return error.message;
    }
  }

  return fallback;
}

/**
 * Check if error is user rejection (wallet)
 */
export function isUserRejection(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const errorObj = error as { code?: number | string; message?: string };

  return (
    errorObj.code === 4001 ||
    errorObj.code === "ACTION_REJECTED" ||
    errorObj.message?.toLowerCase().includes("rejected") ||
    errorObj.message?.toLowerCase().includes("denied") ||
    false
  );
}
