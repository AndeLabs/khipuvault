/**
 * Security validators
 * Provides validation functions for user inputs and blockchain data
 */

import { isAddress, getAddress } from "viem";

/**
 * Validate Ethereum address with proper checksum
 * Uses viem's built-in validation
 *
 * @param address - Address to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```ts
 * isValidEthAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'); // true
 * isValidEthAddress('0xinvalid'); // false
 * isValidEthAddress('not-an-address'); // false
 * ```
 */
export function isValidEthAddress(address: string): address is `0x${string}` {
  if (!address || typeof address !== "string") {
    return false;
  }

  const trimmed = address.trim();

  // Use viem's address validation
  if (!isAddress(trimmed)) {
    return false;
  }

  try {
    // Verify checksum
    getAddress(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate amount with decimal precision
 * Ensures positive number within valid range
 *
 * @param amount - Amount to validate (as string or number)
 * @param decimals - Token decimals (default 18 for ETH)
 * @param options - Additional validation options
 * @returns true if valid amount
 *
 * @example
 * ```ts
 * isValidAmount('1.5', 18); // true
 * isValidAmount('-1', 18); // false
 * isValidAmount('0', 18); // false (must be > 0)
 * isValidAmount('1000', 6, { max: 500 }); // false
 * ```
 */
export function isValidAmount(
  amount: string | number,
  decimals: number = 18,
  options: {
    min?: number;
    max?: number;
    allowZero?: boolean;
  } = {}
): boolean {
  const { min, max, allowZero = false } = options;

  if (amount === null || amount === undefined || amount === "") {
    return false;
  }

  // Convert to string and validate format
  const str = String(amount).trim();

  // Must be numeric
  if (!/^\d+\.?\d*$/.test(str)) {
    return false;
  }

  const num = Number(str);

  // Must be finite number
  if (!Number.isFinite(num)) {
    return false;
  }

  // Must be non-negative
  if (num < 0) {
    return false;
  }

  // Check zero
  if (!allowZero && num === 0) {
    return false;
  }

  // Check minimum
  if (min !== undefined && num < min) {
    return false;
  }

  // Check maximum
  if (max !== undefined && num > max) {
    return false;
  }

  // Validate decimal places
  const parts = str.split(".");
  if (parts.length === 2) {
    const decimalPart = parts[1];
    if (decimalPart.length > decimals) {
      return false;
    }
  }

  return true;
}

/**
 * Validate pool ID format
 * Ensures ID is alphanumeric with allowed characters
 *
 * @param id - Pool ID to validate
 * @returns true if valid pool ID
 *
 * @example
 * ```ts
 * isValidPoolId('pool-123'); // true
 * isValidPoolId('pool_abc_456'); // true
 * isValidPoolId(''); // false
 * isValidPoolId('<script>'); // false
 * ```
 */
export function isValidPoolId(id: string): boolean {
  if (!id || typeof id !== "string") {
    return false;
  }

  const trimmed = id.trim();

  // Must be alphanumeric with hyphens/underscores
  if (!/^[a-zA-Z0-9\-_]+$/.test(trimmed)) {
    return false;
  }

  // Reasonable length constraints
  if (trimmed.length < 1 || trimmed.length > 100) {
    return false;
  }

  return true;
}

/**
 * Validate URL against allowlist
 * Only permits specific protocols and domains
 *
 * @param url - URL to validate
 * @param allowedDomains - Optional array of allowed domains
 * @returns true if URL is safe
 *
 * @example
 * ```ts
 * isValidUrl('https://example.com'); // true
 * isValidUrl('javascript:alert(1)'); // false
 * isValidUrl('https://malicious.com', ['example.com']); // false
 * ```
 */
export function isValidUrl(url: string, allowedDomains?: string[]): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  const trimmed = url.trim();

  // Check for dangerous protocols
  // eslint-disable-next-line no-script-url -- Checking for dangerous protocols
  const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:", "about:"];

  const lower = trimmed.toLowerCase();
  if (dangerousProtocols.some((protocol) => lower.startsWith(protocol))) {
    return false;
  }

  try {
    const urlObj = new URL(trimmed);

    // Only allow http/https
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return false;
    }

    // Check domain allowlist if provided
    if (allowedDomains && allowedDomains.length > 0) {
      const hostname = urlObj.hostname.toLowerCase();
      const isAllowed = allowedDomains.some((domain) => {
        const domainLower = domain.toLowerCase();
        return hostname === domainLower || hostname.endsWith(`.${domainLower}`);
      });

      if (!isAllowed) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validate transaction hash format
 * Must be 0x-prefixed 64-character hex string
 *
 * @param hash - Transaction hash to validate
 * @returns true if valid transaction hash
 *
 * @example
 * ```ts
 * isValidTransactionHash('0x' + 'a'.repeat(64)); // true
 * isValidTransactionHash('0x1234'); // false
 * isValidTransactionHash('invalid'); // false
 * ```
 */
export function isValidTransactionHash(hash: string): hash is `0x${string}` {
  if (!hash || typeof hash !== "string") {
    return false;
  }

  const trimmed = hash.trim();

  // Must match 0x followed by 64 hex characters
  return /^0x[a-fA-F0-9]{64}$/.test(trimmed);
}

/**
 * Validate block number
 * Must be positive integer
 *
 * @param blockNumber - Block number to validate
 * @returns true if valid block number
 *
 * @example
 * ```ts
 * isValidBlockNumber(123456); // true
 * isValidBlockNumber('123456'); // true
 * isValidBlockNumber(-1); // false
 * isValidBlockNumber(1.5); // false
 * ```
 */
export function isValidBlockNumber(blockNumber: string | number): boolean {
  if (blockNumber === null || blockNumber === undefined || blockNumber === "") {
    return false;
  }

  const num = Number(blockNumber);

  // Must be finite positive integer
  if (!Number.isFinite(num) || num < 0 || !Number.isInteger(num)) {
    return false;
  }

  return true;
}

/**
 * Validate email format
 * Basic email validation
 *
 * @param email - Email address to validate
 * @returns true if valid email format
 *
 * @example
 * ```ts
 * isValidEmail('user@example.com'); // true
 * isValidEmail('invalid-email'); // false
 * isValidEmail('user@'); // false
 * ```
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  const trimmed = email.trim();

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return false;
  }

  // Additional length checks
  if (trimmed.length > 254) {
    return false;
  }

  const [local, domain] = trimmed.split("@");
  if (local.length > 64 || domain.length > 255) {
    return false;
  }

  return true;
}

/**
 * Validate chain ID
 * Must be positive integer matching known chains
 *
 * @param chainId - Chain ID to validate
 * @param allowedChains - Optional array of allowed chain IDs
 * @returns true if valid chain ID
 *
 * @example
 * ```ts
 * isValidChainId(1); // true (Ethereum mainnet)
 * isValidChainId(11155111); // true (Sepolia)
 * isValidChainId(-1); // false
 * isValidChainId(999, [1, 11155111]); // false
 * ```
 */
export function isValidChainId(chainId: number, allowedChains?: number[]): boolean {
  if (!Number.isFinite(chainId) || chainId <= 0 || !Number.isInteger(chainId)) {
    return false;
  }

  // Check against allowlist if provided
  if (allowedChains && allowedChains.length > 0) {
    return allowedChains.includes(chainId);
  }

  return true;
}

/**
 * Validate bigint string
 * Ensures value can be parsed as bigint
 *
 * @param value - Value to validate
 * @returns true if valid bigint string
 *
 * @example
 * ```ts
 * isValidBigInt('1000000000000000000'); // true
 * isValidBigInt('-100'); // false (must be non-negative)
 * isValidBigInt('1.5'); // false (must be integer)
 * ```
 */
export function isValidBigInt(value: string | number | bigint): boolean {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  try {
    const bigIntValue = BigInt(value);

    // Must be non-negative
    if (bigIntValue < 0n) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validate percentage value
 * Must be between 0 and 100
 *
 * @param value - Percentage value
 * @param options - Validation options
 * @returns true if valid percentage
 *
 * @example
 * ```ts
 * isValidPercentage(50); // true
 * isValidPercentage(150); // false
 * isValidPercentage(-10); // false
 * isValidPercentage(0, { allowZero: true }); // true
 * ```
 */
export function isValidPercentage(
  value: string | number,
  options: {
    min?: number;
    max?: number;
    allowZero?: boolean;
  } = {}
): boolean {
  const { min = 0, max = 100, allowZero = true } = options;

  const num = Number(value);

  if (!Number.isFinite(num)) {
    return false;
  }

  if (!allowZero && num === 0) {
    return false;
  }

  if (num < min || num > max) {
    return false;
  }

  return true;
}
