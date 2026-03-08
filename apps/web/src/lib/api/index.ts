/**
 * @fileoverview API Module Entry Point
 * @module lib/api
 *
 * Centralized API module exporting:
 * - API client with interceptors
 * - Endpoint constants
 * - Type definitions
 * - Error classes
 */

// Client
export { apiClient, createApiClient, ApiClient } from "./client";

// Endpoints
export { ENDPOINTS, API_CONFIG, buildUrl } from "./endpoints";
export {
  USER_ENDPOINTS,
  POOL_ENDPOINTS,
  TRANSACTION_ENDPOINTS,
  ANALYTICS_ENDPOINTS,
  LOTTERY_ENDPOINTS,
  ROSCA_ENDPOINTS,
  MEZO_ENDPOINTS,
} from "./endpoints";

// Errors
export {
  ApiError,
  NetworkError,
  TimeoutError,
  AuthError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  createApiError,
  isApiError,
  getUserFriendlyMessage,
} from "./errors";

// Types
export type {
  // Common
  PaginationParams,
  PaginatedResponse,
  RequestConfig,
  ApiResponse,
  ApiErrorResponse,
  // User
  UserPortfolio,
  UserPortfolioPosition,
  UserStats,
  // Pool
  Pool,
  PoolType,
  PoolStatus,
  PoolStats,
  PoolAnalytics,
  PoolParticipant,
  // Transaction
  Transaction,
  TransactionType,
  TransactionStatus,
  TransactionFilter,
  // Analytics
  GlobalAnalytics,
  PlatformStats,
  YieldAnalytics,
  // Lottery
  LotteryRound,
  LotteryTicket,
  // ROSCA
  RoscaPool,
  RoscaParticipant,
  RoscaRound,
  // Mezo
  MezoTroveStats,
  MezoStabilityPoolStats,
  MezoSystemStats,
} from "./types";
