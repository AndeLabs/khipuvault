/**
 * Security sanitization utilities
 * Provides functions to sanitize user inputs and prevent XSS attacks
 */

import DOMPurify from "dompurify";
import { isAddress, getAddress } from "viem";

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes dangerous tags and attributes while preserving safe content
 *
 * @param input - Raw HTML string from user input
 * @returns Sanitized HTML safe for rendering
 *
 * @example
 * ```ts
 * const userInput = '<script>alert("xss")</script><p>Safe content</p>';
 * const safe = sanitizeHtml(userInput);
 * // Returns: '<p>Safe content</p>'
 * ```
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Configure DOMPurify with strict settings
  const config = {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "span", "a"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?):\/\/)/i, // Only allow https URLs
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
  };

  return DOMPurify.sanitize(input, config) as string;
}

/**
 * Sanitize and validate URLs to prevent javascript: and data: URIs
 * Only allows http, https, and mailto protocols
 *
 * @param url - URL string to validate
 * @returns Sanitized URL or empty string if invalid
 *
 * @example
 * ```ts
 * sanitizeUrl('https://example.com'); // 'https://example.com'
 * sanitizeUrl('javascript:alert(1)'); // ''
 * sanitizeUrl('data:text/html,<script>'); // ''
 * ```
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== "string") {
    return "";
  }

  const trimmed = url.trim();

  // Reject dangerous protocols
  // eslint-disable-next-line no-script-url -- Checking for dangerous protocols
  const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:", "about:"];

  const lower = trimmed.toLowerCase();
  if (dangerousProtocols.some((protocol) => lower.startsWith(protocol))) {
    return "";
  }

  // Only allow safe protocols
  const safeProtocols = ["https://", "https://", "mailto:"];
  const hasValidProtocol = safeProtocols.some((protocol) => lower.startsWith(protocol));

  if (!hasValidProtocol) {
    return "";
  }

  try {
    // Additional validation using URL constructor
    const urlObj = new URL(trimmed);

    // Reject non-standard ports for security
    const allowedPorts = ["", "80", "443"];
    if (!allowedPorts.includes(urlObj.port)) {
      return "";
    }

    return urlObj.href;
  } catch {
    return "";
  }
}

/**
 * Sanitize and validate Ethereum addresses
 * Validates checksum and returns normalized address
 *
 * @param address - Ethereum address to validate
 * @returns Checksummed address or null if invalid
 *
 * @example
 * ```ts
 * sanitizeAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');
 * // Returns: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'
 *
 * sanitizeAddress('invalid-address');
 * // Returns: null
 * ```
 */
export function sanitizeAddress(address: string): `0x${string}` | null {
  if (!address || typeof address !== "string") {
    return null;
  }

  const trimmed = address.trim();

  // Validate using viem's isAddress
  if (!isAddress(trimmed)) {
    return null;
  }

  try {
    // Return checksummed address
    return getAddress(trimmed);
  } catch {
    return null;
  }
}

/**
 * Sanitize numeric input and validate range
 * Prevents NaN, Infinity, and negative numbers
 *
 * @param input - Numeric value as string or number
 * @param options - Validation options
 * @returns Sanitized number or null if invalid
 *
 * @example
 * ```ts
 * sanitizeNumber('123.45'); // 123.45
 * sanitizeNumber('123.45', { decimals: 1 }); // 123.4
 * sanitizeNumber('-50'); // null (negative not allowed by default)
 * sanitizeNumber('50', { max: 100 }); // 50
 * sanitizeNumber('150', { max: 100 }); // null
 * ```
 */
export function sanitizeNumber(
  input: string | number,
  options: {
    min?: number;
    max?: number;
    decimals?: number;
    allowNegative?: boolean;
  } = {}
): number | null {
  const { min, max, decimals, allowNegative = false } = options;

  if (input === null || input === undefined || input === "") {
    return null;
  }

  // Convert to string for validation
  const str = String(input).trim();

  // Reject invalid patterns
  if (!/^-?\d+\.?\d*$/.test(str)) {
    return null;
  }

  const num = Number(str);

  // Validate number properties
  if (!Number.isFinite(num)) {
    return null;
  }

  if (!allowNegative && num < 0) {
    return null;
  }

  // Check minimum value
  const minValue = min !== undefined ? min : allowNegative ? -Infinity : 0;
  if (num < minValue) {
    return null;
  }

  if (max !== undefined && num > max) {
    return null;
  }

  // Apply decimal precision if specified
  if (decimals !== undefined) {
    return Number(num.toFixed(decimals));
  }

  return num;
}

/**
 * Sanitize string input by removing control characters and trimming
 * Useful for text inputs, usernames, etc.
 *
 * @param input - String to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 *
 * @example
 * ```ts
 * sanitizeString('  Hello\x00World  '); // 'HelloWorld'
 * sanitizeString('Long text...', 10); // 'Long text.'
 * ```
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Remove control characters and normalize whitespace
  let sanitized = input
    // eslint-disable-next-line no-control-regex -- Intentionally removing control characters
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Remove control characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize pool ID or transaction hash
 * Validates hexadecimal format
 *
 * @param id - Pool ID or transaction hash
 * @returns Sanitized ID or null if invalid
 *
 * @example
 * ```ts
 * sanitizeId('123'); // '123'
 * sanitizeId('abc123'); // 'abc123'
 * sanitizeId('<script>'); // null
 * ```
 */
export function sanitizeId(id: string): string | null {
  if (!id || typeof id !== "string") {
    return null;
  }

  const trimmed = id.trim();

  // Allow alphanumeric, hyphens, and underscores
  if (!/^[a-zA-Z0-9\-_]+$/.test(trimmed)) {
    return null;
  }

  // Reasonable length limits
  if (trimmed.length < 1 || trimmed.length > 100) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize transaction hash
 * Validates 0x-prefixed 64-character hex string
 *
 * @param hash - Transaction hash
 * @returns Sanitized hash or null if invalid
 *
 * @example
 * ```ts
 * sanitizeTransactionHash('0x1234...'); // '0x1234...'
 * sanitizeTransactionHash('invalid'); // null
 * ```
 */
export function sanitizeTransactionHash(hash: string): `0x${string}` | null {
  if (!hash || typeof hash !== "string") {
    return null;
  }

  const trimmed = hash.trim();

  // Must be 0x followed by 64 hex characters
  if (!/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
    return null;
  }

  return trimmed as `0x${string}`;
}
