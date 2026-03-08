/**
 * Security utilities for KhipuVault
 *
 * This module provides comprehensive security functions including:
 * - Input sanitization (HTML, URLs, addresses, numbers)
 * - Validation functions (addresses, amounts, URLs)
 * - Content Security Policy (CSP) configuration
 *
 * @example
 * ```ts
 * import {
 *   sanitizeAddress,
 *   isValidEthAddress,
 *   getSecurityHeaders
 * } from '@/lib/security';
 *
 * // Sanitize user input
 * const address = sanitizeAddress(userInput);
 *
 * // Validate before processing
 * if (isValidEthAddress(address)) {
 *   // Process address
 * }
 *
 * // Apply security headers in middleware
 * const headers = getSecurityHeaders();
 * ```
 */

// Re-export sanitization functions
export {
  sanitizeHtml,
  sanitizeUrl,
  sanitizeAddress,
  sanitizeNumber,
  sanitizeString,
  sanitizeId,
  sanitizeTransactionHash,
} from "./sanitize";

// Re-export validation functions
export {
  isValidEthAddress,
  isValidAmount,
  isValidPoolId,
  isValidUrl,
  isValidTransactionHash,
  isValidBlockNumber,
  isValidEmail,
  isValidChainId,
  isValidBigInt,
  isValidPercentage,
} from "./validators";

// Re-export CSP configuration and helpers
export {
  ALLOWED_DOMAINS,
  CSP_DIRECTIVES,
  CSP_REPORT_CONFIG,
  SECURITY_HEADERS,
  TRUSTED_TYPES_POLICY,
  generateCSPHeader,
  generateCSPReportOnlyHeader,
  generateNonce,
  isAllowedByCSP,
  getSecurityHeaders,
} from "./csp";

/**
 * Common security patterns and best practices
 */

/**
 * Rate limiting configuration
 * Use to prevent abuse and DoS attacks
 */
export const RATE_LIMITS = {
  // API requests per minute
  api: {
    requests: 100,
    window: 60 * 1000, // 1 minute
  },

  // Transaction submissions per hour
  transactions: {
    requests: 20,
    window: 60 * 60 * 1000, // 1 hour
  },

  // Authentication attempts per 15 minutes
  auth: {
    requests: 5,
    window: 15 * 60 * 1000, // 15 minutes
  },
} as const;

/**
 * Input length limits
 * Prevent resource exhaustion attacks
 */
export const INPUT_LIMITS = {
  // Maximum string lengths
  text: {
    short: 100,
    medium: 500,
    long: 2000,
  },

  // Maximum file sizes (in bytes)
  file: {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
  },

  // Maximum array lengths
  array: {
    small: 10,
    medium: 100,
    large: 1000,
  },
} as const;

/**
 * Blockchain-specific security constants
 */
export const BLOCKCHAIN_SECURITY = {
  // Minimum confirmations before considering transaction final
  minConfirmations: 3,

  // Maximum gas price (in gwei) to prevent overpaying
  maxGasPrice: 500,

  // Minimum time between transactions (in seconds)
  minTransactionDelay: 5,

  // Maximum slippage tolerance (percentage)
  maxSlippage: 5,

  // Supported chain IDs
  supportedChains: [1, 11155111], // Mainnet, Sepolia
} as const;
