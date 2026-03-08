/**
 * @fileoverview API Error Classes
 * @module lib/api/errors
 *
 * Custom error classes for different API failure scenarios.
 * Provides structured error information for better debugging and user feedback.
 */

/**
 * Base API error class
 * All API errors extend from this class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Check if error is retryable (5xx or network errors)
   */
  get isRetryable(): boolean {
    return this.status >= 500 || this.status === 0;
  }

  /**
   * Check if error is client error (4xx)
   */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

/**
 * Network-related errors (timeout, connection refused, etc.)
 */
export class NetworkError extends ApiError {
  constructor(message: string = "Network request failed") {
    super(message, 0, "NETWORK_ERROR");
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Request timeout errors
 */
export class TimeoutError extends ApiError {
  constructor(
    message: string = "Request timeout",
    public timeoutMs: number = 0
  ) {
    super(message, 408, "TIMEOUT");
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Authentication/authorization errors (401, 403)
 */
export class AuthError extends ApiError {
  constructor(message: string = "Authentication failed", status: number = 401) {
    super(message, status, "AUTH_ERROR");
    this.name = "AuthError";
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Resource not found errors (404)
 */
export class NotFoundError extends ApiError {
  constructor(
    message: string = "Resource not found",
    public resource?: string
  ) {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends ApiError {
  constructor(
    message: string = "Validation failed",
    public validationErrors?: Array<{ field: string; message: string }>
  ) {
    super(message, 400, "VALIDATION_ERROR", validationErrors);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Rate limit errors (429)
 */
export class RateLimitError extends ApiError {
  constructor(
    message: string = "Rate limit exceeded",
    public retryAfter?: number // seconds
  ) {
    super(message, 429, "RATE_LIMIT");
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Server errors (500+)
 */
export class ServerError extends ApiError {
  constructor(message: string = "Internal server error", status: number = 500) {
    super(message, status, "SERVER_ERROR");
    this.name = "ServerError";
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Factory function to create appropriate error from HTTP response
 */
export function createApiError(
  status: number,
  message: string,
  code?: string,
  details?: unknown
): ApiError {
  switch (status) {
    case 0:
      return new NetworkError(message);
    case 400:
      return new ValidationError(
        message,
        details as Array<{ field: string; message: string }> | undefined
      );
    case 401:
    case 403:
      return new AuthError(message, status);
    case 404:
      return new NotFoundError(message);
    case 408:
      return new TimeoutError(message);
    case 429:
      return new RateLimitError(message);
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message, status);
    default:
      return new ApiError(message, status, code, details);
  }
}

/**
 * Type guard to check if error is ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Get user-friendly error message from any error
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error instanceof ValidationError) {
      return error.validationErrors
        ? error.validationErrors.map((e) => e.message).join(", ")
        : error.message;
    }
    if (error instanceof AuthError) {
      return "Please sign in to continue";
    }
    if (error instanceof NotFoundError) {
      return "Resource not found";
    }
    if (error instanceof RateLimitError) {
      return "Too many requests. Please try again later";
    }
    if (error instanceof NetworkError || error instanceof TimeoutError) {
      return "Network error. Please check your connection";
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}
