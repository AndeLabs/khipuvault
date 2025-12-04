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
  tags?: Record<string, string>
  extra?: Record<string, unknown>
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  fingerprint?: string[]
}

interface UserContext {
  id?: string
  address?: string
  email?: string
  username?: string
}

interface Breadcrumb {
  category?: string
  message: string
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  data?: Record<string, unknown>
}

// Flag to check if Sentry is available
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const IS_SENTRY_ENABLED = !!SENTRY_DSN

// Simple in-memory breadcrumbs for non-Sentry mode (limited to 50)
const breadcrumbs: Breadcrumb[] = []
const MAX_BREADCRUMBS = 50

/**
 * Initialize error tracking
 * Call this once at app startup (in _app.tsx or layout.tsx)
 */
export async function initErrorTracking(): Promise<void> {
  if (!IS_SENTRY_ENABLED) {
    console.info('[ErrorTracking] Sentry DSN not configured. Errors will be logged to console.')
    return
  }

  try {
    // Dynamic import to avoid bundling Sentry if not used
    const Sentry = await import('@sentry/nextjs')

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: IS_PRODUCTION ? 'production' : 'development',

      // Performance monitoring
      tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,

      // Session replay for debugging UI issues
      replaysSessionSampleRate: IS_PRODUCTION ? 0.1 : 0,
      replaysOnErrorSampleRate: 1.0,

      // Filter out noisy errors
      ignoreErrors: [
        // Ignore benign browser/extension errors
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Non-Error promise rejection captured',
        // Ignore wallet connection errors (expected during normal usage)
        'User rejected the request',
        'User denied transaction signature',
        'The user rejected the request',
        // Ignore network errors that are expected
        'Network request failed',
        'Failed to fetch',
      ],

      // Sanitize sensitive data
      beforeSend(event) {
        // Remove wallet addresses from error messages if needed
        if (event.exception?.values) {
          for (const exception of event.exception.values) {
            if (exception.value) {
              // Partially redact Ethereum addresses
              exception.value = exception.value.replace(
                /0x[a-fA-F0-9]{40}/g,
                (match) => `${match.slice(0, 6)}...${match.slice(-4)}`
              )
            }
          }
        }
        return event
      },

      // Integration options
      integrations: (integrations) => {
        return integrations.filter((integration) => {
          // Disable integrations that might cause issues
          return integration.name !== 'GlobalHandlers' || IS_PRODUCTION
        })
      },
    })

    console.info('[ErrorTracking] Sentry initialized successfully')
  } catch (error) {
    console.error('[ErrorTracking] Failed to initialize Sentry:', error)
  }
}

/**
 * Capture an error and send to error tracking service
 */
export async function captureError(error: Error | unknown, context?: ErrorContext): Promise<void> {
  const errorObj = error instanceof Error ? error : new Error(String(error))

  // Always log to console in development
  if (!IS_PRODUCTION) {
    console.error('[ErrorTracking] Captured error:', errorObj, context)
  }

  if (!IS_SENTRY_ENABLED) {
    // Store error info for potential debugging
    addBreadcrumb({
      category: 'error',
      message: errorObj.message,
      level: 'error',
      data: { stack: errorObj.stack, ...context?.extra },
    })
    return
  }

  try {
    const Sentry = await import('@sentry/nextjs')
    Sentry.captureException(errorObj, {
      tags: context?.tags,
      extra: context?.extra,
      level: context?.level,
      fingerprint: context?.fingerprint,
    })
  } catch (sentryError) {
    console.error('[ErrorTracking] Failed to send error to Sentry:', sentryError)
  }
}

/**
 * Capture a message (non-error event)
 */
export async function captureMessage(message: string, context?: ErrorContext): Promise<void> {
  if (!IS_PRODUCTION) {
    console.info('[ErrorTracking] Captured message:', message, context)
  }

  if (!IS_SENTRY_ENABLED) {
    addBreadcrumb({
      category: 'message',
      message,
      level: context?.level || 'info',
      data: context?.extra,
    })
    return
  }

  try {
    const Sentry = await import('@sentry/nextjs')
    Sentry.captureMessage(message, {
      tags: context?.tags,
      extra: context?.extra,
      level: context?.level || 'info',
    })
  } catch (sentryError) {
    console.error('[ErrorTracking] Failed to send message to Sentry:', sentryError)
  }
}

/**
 * Set user context for error tracking
 * Call this when user connects their wallet
 */
export async function setUser(user: UserContext | null): Promise<void> {
  if (!IS_SENTRY_ENABLED) {
    console.debug('[ErrorTracking] Set user:', user?.address || 'null')
    return
  }

  try {
    const Sentry = await import('@sentry/nextjs')
    if (user) {
      Sentry.setUser({
        id: user.id || user.address,
        email: user.email,
        username: user.username || user.address,
      })
    } else {
      Sentry.setUser(null)
    }
  } catch (sentryError) {
    console.error('[ErrorTracking] Failed to set user:', sentryError)
  }
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
  })

  // Keep only last MAX_BREADCRUMBS
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift()
  }

  if (!IS_SENTRY_ENABLED) {
    return
  }

  // Async add to Sentry
  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.addBreadcrumb({
        category: breadcrumb.category,
        message: breadcrumb.message,
        level: breadcrumb.level,
        data: breadcrumb.data,
      })
    })
    .catch(() => {
      // Silently fail - breadcrumbs are not critical
    })
}

/**
 * Set a tag that will be sent with all future errors
 */
export async function setTag(key: string, value: string): Promise<void> {
  if (!IS_SENTRY_ENABLED) {
    console.debug('[ErrorTracking] Set tag:', key, '=', value)
    return
  }

  try {
    const Sentry = await import('@sentry/nextjs')
    Sentry.setTag(key, value)
  } catch (sentryError) {
    console.error('[ErrorTracking] Failed to set tag:', sentryError)
  }
}

/**
 * Get recent breadcrumbs (useful for debugging without Sentry)
 */
export function getRecentBreadcrumbs(): Breadcrumb[] {
  return [...breadcrumbs]
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
      return await fn(...args)
    } catch (error) {
      await captureError(error, context)
      throw error
    }
  }) as T
}
