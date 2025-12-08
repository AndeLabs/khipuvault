/**
 * @fileoverview Error Tracking Service
 * @module lib/error-tracking
 *
 * Centralized error tracking service that can be configured to use Sentry
 * or any other error tracking service.
 *
 * Configuration:
 * - Set NEXT_PUBLIC_SENTRY_DSN in environment variables to enable Sentry
 * - In development, errors are logged to console
 * - In production without Sentry, errors are logged but not sent
 *
 * Usage:
 * ```typescript
 * import { captureError, setUser, addBreadcrumb } from '@/lib/error-tracking'
 *
 * // Capture an error
 * captureError(new Error('Something went wrong'), { tags: { page: 'dashboard' } })
 *
 * // Set user context when they connect wallet
 * setUser({ id: '0x...', address: '0x...' })
 *
 * // Add breadcrumb for navigation
 * addBreadcrumb({ category: 'navigation', message: 'User clicked deposit' })
 * ```
 */

interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  fingerprint?: string[];
}

interface UserContext {
  id?: string;
  address?: string;
  email?: string;
  username?: string;
}

interface Breadcrumb {
  category?: string;
  message: string;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  data?: Record<string, unknown>;
}

// Flag to check if Sentry is available
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const IS_SENTRY_ENABLED = false; // Disabled - Sentry not installed

// Simple in-memory breadcrumbs for non-Sentry mode (limited to 50)
const breadcrumbs: Breadcrumb[] = [];
const MAX_BREADCRUMBS = 50;

/**
 * Initialize error tracking
 * Call this once at app startup (in _app.tsx or layout.tsx)
 */
export async function initErrorTracking(): Promise<void> {
  if (!IS_SENTRY_ENABLED) {
    console.info(
      "[ErrorTracking] Sentry not installed. Errors will be logged to console.",
    );
    return;
  }
  // Sentry initialization would go here if installed
}

/**
 * Capture an error and send to error tracking service
 */
export async function captureError(
  error: Error | unknown,
  context?: ErrorContext,
): Promise<void> {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  // Always log to console in development
  if (!IS_PRODUCTION) {
    console.error("[ErrorTracking] Captured error:", errorObj, context);
  }

  // Store error info for potential debugging
  addBreadcrumb({
    category: "error",
    message: errorObj.message,
    level: "error",
    data: { stack: errorObj.stack, ...context?.extra },
  });
}

/**
 * Capture a message (non-error event)
 */
export async function captureMessage(
  message: string,
  context?: ErrorContext,
): Promise<void> {
  if (!IS_PRODUCTION) {
    console.info("[ErrorTracking] Captured message:", message, context);
  }

  addBreadcrumb({
    category: "message",
    message,
    level: context?.level || "info",
    data: context?.extra,
  });
}

/**
 * Set user context for error tracking
 * Call this when user connects their wallet
 */
export async function setUser(user: UserContext | null): Promise<void> {
  console.debug("[ErrorTracking] Set user:", user?.address || "null");
}

/**
 * Add a breadcrumb for debugging
 * Useful for tracking user actions leading up to an error
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  // Always store locally
  breadcrumbs.push({
    ...breadcrumb,
    data: { ...breadcrumb.data, timestamp: Date.now() },
  });

  // Keep only last MAX_BREADCRUMBS
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }
}

/**
 * Set a tag that will be sent with all future errors
 */
export async function setTag(key: string, value: string): Promise<void> {
  console.debug("[ErrorTracking] Set tag:", key, "=", value);
}

/**
 * Get recent breadcrumbs (useful for debugging without Sentry)
 */
export function getRecentBreadcrumbs(): Breadcrumb[] {
  return [...breadcrumbs];
}

/**
 * Create a wrapper for async functions that captures errors
 */
export function withErrorTracking<
  T extends (...args: unknown[]) => Promise<unknown>,
>(fn: T, context?: ErrorContext): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      await captureError(error, context);
      throw error;
    }
  }) as T;
}
