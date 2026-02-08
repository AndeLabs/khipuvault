/**
 * @fileoverview Error Tracking Service
 * @module lib/error-tracking
 *
 * Centralized error tracking service with optional Sentry integration.
 *
 * Configuration:
 * 1. Install Sentry: pnpm add @sentry/nextjs
 * 2. Set NEXT_PUBLIC_SENTRY_DSN in environment variables
 * 3. Run: npx @sentry/wizard@latest -i nextjs
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

// Check if Sentry DSN is configured
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const IS_SENTRY_ENABLED = Boolean(SENTRY_DSN);

// Simple in-memory breadcrumbs for non-Sentry mode (limited to 50)
const breadcrumbs: Breadcrumb[] = [];
const MAX_BREADCRUMBS = 50;

// Sentry module interface (loosely typed to avoid import issues)
interface SentryModule {
  init: (options: Record<string, unknown>) => void;
  captureException: (error: Error) => void;
  captureMessage: (message: string) => void;
  withScope: (callback: (scope: SentryScope) => void) => void;
  setUser: (user: Record<string, unknown> | null) => void;
  setTag: (key: string, value: string) => void;
  addBreadcrumb: (breadcrumb: Record<string, unknown>) => void;
}

interface SentryScope {
  setTag: (key: string, value: string) => void;
  setExtra: (key: string, value: unknown) => void;
  setLevel: (level: string) => void;
  setFingerprint: (fingerprint: string[]) => void;
}

// Lazy-loaded Sentry module
let SentryModule: SentryModule | null = null;
let sentryInitialized = false;

/**
 * Try to load Sentry module dynamically
 * TEMPORARILY DISABLED: Sentry integration is causing issues with Next.js 15
 */
async function loadSentry(): Promise<SentryModule | null> {
  // Temporarily disable Sentry loading
  return null;

  // if (sentryInitialized) {
  //   return SentryModule;
  // }

  // try {
  //   // Dynamic import with error handling
  //   const sentryModule = await import("@sentry/nextjs");
  //   return sentryModule as SentryModule;
  // } catch {
  //   return null;
  // }
}

/**
 * Initialize error tracking
 * Call this once at app startup (in _app.tsx or layout.tsx)
 */
export async function initErrorTracking(): Promise<void> {
  if (sentryInitialized) {
    return;
  }
  sentryInitialized = true;

  if (!IS_SENTRY_ENABLED) {
    if (IS_PRODUCTION) {
      // eslint-disable-next-line no-console
      console.warn(
        "[ErrorTracking] NEXT_PUBLIC_SENTRY_DSN not set. Error tracking disabled in production."
      );
    } else {
      // eslint-disable-next-line no-console
      console.info("[ErrorTracking] Development mode. Errors logged to console.");
    }
    return;
  }

  try {
    const sentry = await loadSentry();

    if (!sentry) {
      // eslint-disable-next-line no-console
      console.warn("[ErrorTracking] @sentry/nextjs not installed. Run: pnpm add @sentry/nextjs");
      return;
    }

    SentryModule = sentry;

    sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0",

      // Performance monitoring
      tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,

      // Session replay for debugging (production only)
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Ignore certain errors
      ignoreErrors: [
        // Common browser errors
        "ResizeObserver loop limit exceeded",
        "ResizeObserver loop completed with undelivered notifications",
        // Network errors
        "Network request failed",
        "Failed to fetch",
        // User-triggered navigation
        "Navigation cancelled",
      ],
    });

    // eslint-disable-next-line no-console
    console.info("[ErrorTracking] Sentry initialized successfully");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      "[ErrorTracking] Failed to initialize Sentry:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * Capture an error and send to error tracking service
 */
export async function captureError(error: Error | unknown, context?: ErrorContext): Promise<void> {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  // Always log to console in development
  if (!IS_PRODUCTION) {
    // eslint-disable-next-line no-console
    console.error("[ErrorTracking] Captured error:", errorObj, context);
  }

  // Store breadcrumb for debugging
  addBreadcrumb({
    category: "error",
    message: errorObj.message,
    level: "error",
    data: { stack: errorObj.stack, ...context?.extra },
  });

  // Send to Sentry if available
  if (SentryModule) {
    SentryModule.withScope((scope: SentryScope) => {
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      if (context?.level) {
        scope.setLevel(context.level);
      }
      if (context?.fingerprint) {
        scope.setFingerprint(context.fingerprint);
      }
      SentryModule!.captureException(errorObj);
    });
  }
}

/**
 * Capture a message (non-error event)
 */
export async function captureMessage(message: string, context?: ErrorContext): Promise<void> {
  if (!IS_PRODUCTION) {
    // eslint-disable-next-line no-console
    console.info("[ErrorTracking] Captured message:", message, context);
  }

  addBreadcrumb({
    category: "message",
    message,
    level: context?.level ?? "info",
    data: context?.extra,
  });

  if (SentryModule) {
    SentryModule.withScope((scope: SentryScope) => {
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      if (context?.level) {
        scope.setLevel(context.level);
      }
      SentryModule!.captureMessage(message);
    });
  }
}

/**
 * Set user context for error tracking
 * Call this when user connects their wallet
 */
export async function setUser(user: UserContext | null): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug("[ErrorTracking] Set user:", user?.address ?? "null");
  }

  if (SentryModule) {
    SentryModule.setUser(
      user
        ? {
            id: user.id ?? user.address,
            username: user.username ?? user.address?.slice(0, 8),
            email: user.email,
          }
        : null
    );
  }
}

/**
 * Add a breadcrumb for debugging
 * Useful for tracking user actions leading up to an error
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  // Store locally
  breadcrumbs.push({
    ...breadcrumb,
    data: { ...breadcrumb.data, timestamp: Date.now() },
  });

  // Keep only last MAX_BREADCRUMBS
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }

  // Send to Sentry if available
  if (SentryModule) {
    SentryModule.addBreadcrumb({
      category: breadcrumb.category,
      message: breadcrumb.message,
      level: breadcrumb.level,
      data: breadcrumb.data,
    });
  }
}

/**
 * Set a tag that will be sent with all future errors
 */
export async function setTag(key: string, value: string): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug("[ErrorTracking] Set tag:", key, "=", value);
  }

  if (SentryModule) {
    SentryModule.setTag(key, value);
  }
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
export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      await captureError(error, context);
      throw error;
    }
  }) as T;
}

/**
 * Check if error tracking is enabled
 */
export function isErrorTrackingEnabled(): boolean {
  return IS_SENTRY_ENABLED && SentryModule !== null;
}
