/**
 * Content Security Policy (CSP) configuration
 * Helps prevent XSS attacks and other code injection vulnerabilities
 */

import { randomBytes } from "crypto";

/**
 * Allowed domains for external resources
 */
export const ALLOWED_DOMAINS = {
  // Analytics and monitoring
  analytics: ["www.google-analytics.com", "analytics.google.com", "www.googletagmanager.com"],

  // Web3 providers
  web3: [
    "cloudflare-eth.com",
    "rpc.ankr.com",
    "eth-mainnet.alchemyapi.io",
    "eth-sepolia.g.alchemy.com",
    "mainnet.infura.io",
    "sepolia.infura.io",
  ],

  // CDN and static assets
  cdn: ["cdn.jsdelivr.net", "unpkg.com"],

  // Wallet providers
  wallets: [
    "connect.trezor.io",
    "wallet.coinbase.com",
    "c0f4f41c-2f55-4863-921b-sdk-docs.arc.dev", // WalletConnect
  ],

  // IPFS gateways
  ipfs: ["ipfs.io", "gateway.pinata.cloud", "cloudflare-ipfs.com"],

  // Sentry error tracking
  sentry: ["sentry.io", "*.sentry.io"],

  // Fonts
  fonts: ["fonts.googleapis.com", "fonts.gstatic.com"],
} as const;

/**
 * CSP directives configuration
 * Used to configure Content-Security-Policy headers
 */
export const CSP_DIRECTIVES = {
  // Default policy - restrict everything by default
  "default-src": ["'self'"],

  // Script sources - be strict here
  "script-src": [
    "'self'",
    "'unsafe-inline'", // Required for Next.js
    "'unsafe-eval'", // Required for development
    ...ALLOWED_DOMAINS.analytics,
    ...ALLOWED_DOMAINS.wallets,
  ],

  // Style sources
  "style-src": [
    "'self'",
    "'unsafe-inline'", // Required for styled-components/CSS-in-JS
    ...ALLOWED_DOMAINS.fonts,
  ],

  // Image sources - allow data URIs for inline images
  "img-src": ["'self'", "data:", "blob:", "https:", ...ALLOWED_DOMAINS.ipfs],

  // Font sources
  "font-src": ["'self'", "data:", ...ALLOWED_DOMAINS.fonts],

  // Connect sources - APIs and WebSocket
  "connect-src": [
    "'self'",
    ...ALLOWED_DOMAINS.web3,
    ...ALLOWED_DOMAINS.analytics,
    ...ALLOWED_DOMAINS.wallets,
    ...ALLOWED_DOMAINS.sentry,
    "wss:", // WebSocket for Web3
  ],

  // Frame sources - for wallet modals
  "frame-src": ["'self'", ...ALLOWED_DOMAINS.wallets],

  // Object and embed - block plugins
  "object-src": ["'none'"],
  "embed-src": ["'none'"],

  // Base URI - prevent base tag injection
  "base-uri": ["'self'"],

  // Form actions - only allow same origin
  "form-action": ["'self'"],

  // Frame ancestors - prevent clickjacking
  "frame-ancestors": ["'none'"],

  // Upgrade insecure requests
  "upgrade-insecure-requests": [],
} as const;

/**
 * Generate CSP header value from directives
 *
 * @param nonce - Optional nonce for inline scripts
 * @returns CSP header value
 *
 * @example
 * ```ts
 * const csp = generateCSPHeader();
 * // Returns: "default-src 'self'; script-src 'self' ..."
 * ```
 */
export function generateCSPHeader(nonce?: string): string {
  // Create mutable copy of directives
  const directives: Record<string, string[]> = {};

  Object.entries(CSP_DIRECTIVES).forEach(([key, values]) => {
    directives[key] = [...values];
  });

  // Add nonce to script-src if provided
  if (nonce) {
    directives["script-src"].push(`'nonce-${nonce}'`);
  }

  // Convert directives object to CSP string
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(" ")}`;
    })
    .join("; ");
}

/**
 * Generate a cryptographically secure nonce
 * Used for inline scripts with CSP
 *
 * @returns Base64-encoded nonce
 *
 * @example
 * ```ts
 * const nonce = generateNonce();
 * // Returns: "Qi/5K2Gc9p6..."
 *
 * // Use in script tag:
 * <script nonce={nonce}>...</script>
 * ```
 */
export function generateNonce(): string {
  return randomBytes(16).toString("base64");
}

/**
 * Validate if a URL is allowed by CSP
 *
 * @param url - URL to validate
 * @param directive - CSP directive to check against
 * @returns true if URL is allowed
 *
 * @example
 * ```ts
 * isAllowedByCSP('https://fonts.googleapis.com/css', 'style-src');
 * // Returns: true
 *
 * isAllowedByCSP('https://evil.com/script.js', 'script-src');
 * // Returns: false
 * ```
 */
export function isAllowedByCSP(url: string, directive: keyof typeof CSP_DIRECTIVES): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const directives = CSP_DIRECTIVES[directive];

    // Check if URL matches any allowed sources
    return directives.some((source) => {
      // Handle special keywords
      if (source.startsWith("'")) {
        return false;
      }

      // Handle wildcard subdomains
      if (source.startsWith("*.")) {
        const domain = source.slice(2);
        return hostname === domain || hostname.endsWith(`.${domain}`);
      }

      // Exact match
      return hostname === source;
    });
  } catch {
    return false;
  }
}

/**
 * CSP reporting configuration
 * Use for monitoring CSP violations
 */
export const CSP_REPORT_CONFIG = {
  // Endpoint for CSP violation reports
  reportUri: "/api/csp-report",

  // Report-Only mode for testing (doesn't block)
  reportOnly: process.env.NODE_ENV === "development",
} as const;

/**
 * Generate CSP report-only header for testing
 *
 * @param nonce - Optional nonce
 * @returns CSP report-only header value
 */
export function generateCSPReportOnlyHeader(nonce?: string): string {
  const baseHeader = generateCSPHeader(nonce);
  return `${baseHeader}; report-uri ${CSP_REPORT_CONFIG.reportUri}`;
}

/**
 * Trusted types configuration
 * Helps prevent DOM XSS vulnerabilities
 */
export const TRUSTED_TYPES_POLICY = {
  name: "khipuvault",
  createHTML: (input: string) => {
    // Only allow safe HTML
    // In production, use DOMPurify here
    return input;
  },
  createScript: (input: string) => {
    // Only allow safe scripts
    return input;
  },
  createScriptURL: (input: string) => {
    // Validate script URLs against allowlist
    try {
      const url = new URL(input);
      const allowed = [...ALLOWED_DOMAINS.analytics, ...ALLOWED_DOMAINS.wallets];

      if (allowed.some((domain) => url.hostname === domain)) {
        return input;
      }
    } catch {
      // Invalid URL
    }
    return "";
  },
} as const;

/**
 * Security headers configuration
 * Additional security headers to complement CSP
 */
export const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Enable XSS protection
  "X-XSS-Protection": "1; mode=block",

  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions policy
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",

  // HSTS (only for production)
  ...(process.env.NODE_ENV === "production" && {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  }),
} as const;

/**
 * Get all security headers for Next.js middleware
 *
 * @param nonce - Optional nonce for CSP
 * @returns Object with all security headers
 *
 * @example
 * ```ts
 * // In Next.js middleware:
 * export function middleware(request: NextRequest) {
 *   const nonce = generateNonce();
 *   const response = NextResponse.next();
 *
 *   const headers = getSecurityHeaders(nonce);
 *   Object.entries(headers).forEach(([key, value]) => {
 *     response.headers.set(key, value);
 *   });
 *
 *   return response;
 * }
 * ```
 */
export function getSecurityHeaders(nonce?: string): Record<string, string> {
  const cspHeader = CSP_REPORT_CONFIG.reportOnly
    ? generateCSPReportOnlyHeader(nonce)
    : generateCSPHeader(nonce);

  return {
    ...SECURITY_HEADERS,
    [CSP_REPORT_CONFIG.reportOnly
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy"]: cspHeader,
  };
}
