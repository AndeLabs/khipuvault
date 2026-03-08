/**
 * Error Handling Components
 *
 * Provides reusable error boundaries and fallback components
 * for graceful error handling throughout the application.
 *
 * @module components/error
 */

export { ErrorBoundary } from "./error-boundary";
export type { ErrorFallbackProps } from "./error-boundary";

export { ErrorFallback } from "./error-fallback";
export { PoolErrorFallback } from "./pool-error-fallback";
export { TransactionErrorFallback } from "./transaction-error-fallback";
