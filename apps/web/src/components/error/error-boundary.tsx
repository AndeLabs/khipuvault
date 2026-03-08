"use client";

import * as React from "react";

import { captureError } from "@/lib/error-tracking";

export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  resetError: () => void;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  logError?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Generic Reusable Error Boundary Component
 *
 * A customizable React Error Boundary that catches JavaScript errors
 * in the component tree and displays a fallback UI.
 *
 * Features:
 * - Customizable fallback component
 * - Error logging with monitoring integration
 * - Reset/retry functionality
 * - Custom error and reset handlers
 *
 * @example
 * ```tsx
 * import { ErrorBoundary, ErrorFallback } from '@/components/error';
 *
 * <ErrorBoundary fallback={ErrorFallback}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Update state with detailed error info
    this.setState({
      errorInfo,
    });

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Capture error for monitoring (only if enabled)
    if (this.props.logError !== false) {
      void captureError(error, {
        tags: { boundary: "generic", component: "ErrorBoundary" },
        extra: { componentStack: errorInfo.componentStack },
      });
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler if provided
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;

      // Render custom fallback if provided
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
          />
        );
      }

      // No fallback provided - throw error to parent boundary
      throw this.state.error;
    }

    return this.props.children;
  }
}
