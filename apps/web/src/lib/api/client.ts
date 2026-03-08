/**
 * @fileoverview Enhanced API Client
 * @module lib/api/client
 *
 * Production-ready API client with:
 * - Authentication header injection
 * - Centralized error handling
 * - Automatic retry with exponential backoff
 * - Request/response logging
 * - Timeout handling
 * - Type-safe methods
 */

import { API_CONFIG, buildUrl } from "./endpoints";
import { createApiError, NetworkError, TimeoutError, type ApiError } from "./errors";
import type { RequestConfig } from "./types";

/**
 * Request interceptor function type
 */
type RequestInterceptor = (url: string, config: RequestInit) => RequestInit | Promise<RequestInit>;

/**
 * Response interceptor function type
 */
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

/**
 * Logger interface for request/response logging
 */
interface Logger {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}

/**
 * Simple console logger for development
 */
const consoleLogger: Logger = {
  debug: (message, meta) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[API] ${message}`, meta);
    }
  },
  error: (message, meta) => {
    console.error(`[API] ${message}`, meta);
  },
};

/**
 * Enhanced API Client with interceptors and advanced error handling
 */
export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;
  private retryDelay: number;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private logger: Logger;

  constructor(
    baseUrl: string = API_CONFIG.BASE_URL,
    options?: {
      timeout?: number;
      retries?: number;
      retryDelay?: number;
      logger?: Logger;
    }
  ) {
    this.baseUrl = baseUrl;
    this.timeout = options?.timeout ?? API_CONFIG.TIMEOUT;
    this.retries = options?.retries ?? API_CONFIG.RETRIES;
    this.retryDelay = options?.retryDelay ?? API_CONFIG.RETRY_DELAY;
    this.logger = options?.logger ?? consoleLogger;
  }

  /**
   * Add request interceptor
   * Interceptors are called in the order they are added
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   * Interceptors are called in the order they are added
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Set authentication token for all requests
   */
  setAuthToken(token: string): void {
    this.addRequestInterceptor((url, config) => ({
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    }));
  }

  /**
   * Remove all request interceptors
   */
  clearRequestInterceptors(): void {
    this.requestInterceptors = [];
  }

  /**
   * Core fetch method with retry logic and interceptors
   */
  private async fetchWithRetry<T>(
    endpoint: string,
    options?: RequestInit,
    config?: RequestConfig
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error | null = null;
    const maxRetries = config?.retries ?? this.retries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config?.timeout ?? this.timeout);

        // Build request config
        let requestConfig: RequestInit = {
          headers: {
            "Content-Type": "application/json",
            ...config?.headers,
            ...options?.headers,
          },
          signal: config?.signal ?? controller.signal,
          ...options,
        };

        // Apply request interceptors
        for (const interceptor of this.requestInterceptors) {
          requestConfig = await interceptor(url, requestConfig);
        }

        // Log request in development
        this.logger.debug("Request", {
          method: requestConfig.method ?? "GET",
          url,
          attempt: attempt + 1,
        });

        // Make request
        let response = await fetch(url, requestConfig);
        clearTimeout(timeoutId);

        // Apply response interceptors
        for (const interceptor of this.responseInterceptors) {
          response = await interceptor(response);
        }

        // Handle HTTP errors
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          const error = createApiError(
            response.status,
            errorBody.message || errorBody.error || response.statusText,
            errorBody.code,
            errorBody.details
          );

          this.logger.error("HTTP Error", {
            status: response.status,
            message: error.message,
            url,
          });

          throw error;
        }

        // Parse response
        const data = await response.json();

        this.logger.debug("Response", {
          status: response.status,
          url,
        });

        return data;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof Error && "status" in error) {
          const apiError = error as ApiError;
          if (!apiError.isRetryable) {
            throw error;
          }
        }

        // Handle abort (timeout or user cancellation)
        if (error instanceof Error && error.name === "AbortError") {
          if (config?.signal?.aborted) {
            // User cancelled - don't retry
            throw new NetworkError("Request cancelled");
          }
          // Timeout - may retry
          lastError = new TimeoutError("Request timeout", this.timeout);
        }

        // Handle network errors
        if (error instanceof TypeError && error.message.includes("fetch")) {
          lastError = new NetworkError("Network request failed");
        }

        // Retry with exponential backoff
        if (attempt < maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          this.logger.debug("Retrying request", {
            attempt: attempt + 1,
            maxRetries,
            delayMs: delay,
            error: lastError?.message,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries exhausted
    this.logger.error("Request failed after retries", {
      url,
      attempts: maxRetries + 1,
      error: lastError?.message,
    });

    throw lastError ?? new NetworkError("Unknown error");
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
    config?: RequestConfig
  ): Promise<T> {
    const url = buildUrl(endpoint, params);
    return this.fetchWithRetry<T>(url, { method: "GET" }, config);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.fetchWithRetry<T>(
      endpoint,
      {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      },
      config
    );
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.fetchWithRetry<T>(
      endpoint,
      {
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
      },
      config
    );
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.fetchWithRetry<T>(
      endpoint,
      {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      },
      config
    );
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.fetchWithRetry<T>(
      endpoint,
      {
        method: "DELETE",
      },
      config
    );
  }

  /**
   * Upload file
   */
  async upload<T>(
    endpoint: string,
    file: File,
    fieldName: string = "file",
    additionalFields?: Record<string, string>,
    config?: RequestConfig
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    // Note: Don't set Content-Type for FormData, browser will set it with boundary
    return this.fetchWithRetry<T>(
      endpoint,
      {
        method: "POST",
        body: formData,
        headers: {
          // Remove Content-Type for FormData
          ...config?.headers,
        },
      },
      {
        ...config,
        headers: {
          ...config?.headers,
          // Don't include Content-Type
        },
      }
    );
  }
}

/**
 * Singleton API client instance
 */
export const apiClient = new ApiClient();

/**
 * Create a new API client instance with custom config
 */
export function createApiClient(options?: {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  logger?: Logger;
}): ApiClient {
  return new ApiClient(options?.baseUrl, options);
}
