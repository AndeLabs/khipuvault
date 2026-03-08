# Security Library

Comprehensive security utilities for KhipuVault frontend, including input sanitization, validation, and Content Security Policy (CSP) configuration.

## Features

- **Input Sanitization**: Prevent XSS and injection attacks
- **Validation Functions**: Validate blockchain data and user inputs
- **CSP Configuration**: Content Security Policy headers for Next.js
- **Security Constants**: Rate limits, input limits, blockchain security

## Usage

### Input Sanitization

```typescript
import {
  sanitizeHtml,
  sanitizeUrl,
  sanitizeAddress,
  sanitizeNumber,
  sanitizeString,
} from "@/lib/security";

// Sanitize HTML to prevent XSS
const userHtml = '<script>alert("xss")</script><p>Safe content</p>';
const safe = sanitizeHtml(userHtml);
// Returns: '<p>Safe content</p>'

// Sanitize URL
const url = sanitizeUrl(userInput);
if (url) {
  window.location.href = url; // Safe to use
}

// Sanitize Ethereum address
const address = sanitizeAddress(userInput);
if (address) {
  // Use checksummed address
  await contract.transfer(address, amount);
}

// Sanitize numeric input
const amount = sanitizeNumber(userInput, {
  min: 0,
  max: 1000,
  decimals: 18,
});
```

### Validation

```typescript
import {
  isValidEthAddress,
  isValidAmount,
  isValidUrl,
  isValidTransactionHash,
} from "@/lib/security";

// Validate Ethereum address
if (isValidEthAddress(address)) {
  // Process address
}

// Validate amount with decimals
if (isValidAmount(amount, 18, { min: 0.1, max: 1000 })) {
  // Process amount
}

// Validate URL with domain allowlist
const allowedDomains = ["example.com", "trusted.io"];
if (isValidUrl(url, allowedDomains)) {
  // Fetch from URL
}

// Validate transaction hash
if (isValidTransactionHash(hash)) {
  // Query transaction
}
```

### Form Validation with React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { isValidEthAddress, isValidAmount } from '@/lib/security';

function DepositForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    // All inputs are validated
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('address', {
          validate: (value) => isValidEthAddress(value) || 'Invalid address',
        })}
      />
      {errors.address && <span>{errors.address.message}</span>}

      <input
        {...register('amount', {
          validate: (value) =>
            isValidAmount(value, 18, { min: 0.01 }) || 'Invalid amount',
        })}
      />
      {errors.amount && <span>{errors.amount.message}</span>}

      <button type="submit">Deposit</button>
    </form>
  );
}
```

### CSP Configuration (Next.js Middleware)

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSecurityHeaders, generateNonce } from "@/lib/security";

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const response = NextResponse.next();

  // Apply all security headers
  const headers = getSecurityHeaders(nonce);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Store nonce for use in pages
  response.headers.set("x-nonce", nonce);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

### Using Nonce in Layout

```typescript
// app/layout.tsx
import { headers } from 'next/headers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const nonce = headersList.get('x-nonce');

  return (
    <html lang="en">
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{
          __html: `
            // Inline script with nonce
            console.log('Secure inline script');
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Security Constants

```typescript
import { RATE_LIMITS, INPUT_LIMITS, BLOCKCHAIN_SECURITY } from "@/lib/security";

// Check rate limit
function checkRateLimit(userId: string, action: "api" | "transactions" | "auth") {
  const limit = RATE_LIMITS[action];
  // Implement rate limiting logic
}

// Validate input length
function validateInput(text: string) {
  if (text.length > INPUT_LIMITS.text.long) {
    throw new Error("Input too long");
  }
}

// Check chain support
function isSupportedChain(chainId: number): boolean {
  return BLOCKCHAIN_SECURITY.supportedChains.includes(chainId);
}
```

## API Reference

### Sanitization Functions

- `sanitizeHtml(input: string): string` - Remove XSS from HTML
- `sanitizeUrl(url: string): string` - Validate and sanitize URLs
- `sanitizeAddress(address: string): 0x${string} | null` - Validate ETH address
- `sanitizeNumber(input: string | number, options?): number | null` - Validate numbers
- `sanitizeString(input: string, maxLength?): string` - Sanitize text input
- `sanitizeId(id: string): string | null` - Validate alphanumeric IDs
- `sanitizeTransactionHash(hash: string): 0x${string} | null` - Validate tx hash

### Validation Functions

- `isValidEthAddress(address: string): boolean` - Validate ETH address with checksum
- `isValidAmount(amount, decimals, options?): boolean` - Validate token amounts
- `isValidPoolId(id: string): boolean` - Validate pool IDs
- `isValidUrl(url: string, allowedDomains?): boolean` - Validate URLs
- `isValidTransactionHash(hash: string): boolean` - Validate tx hashes
- `isValidBlockNumber(blockNumber): boolean` - Validate block numbers
- `isValidEmail(email: string): boolean` - Validate email format
- `isValidChainId(chainId: number, allowedChains?): boolean` - Validate chain IDs
- `isValidBigInt(value): boolean` - Validate BigInt values
- `isValidPercentage(value, options?): boolean` - Validate percentages

### CSP Functions

- `generateCSPHeader(nonce?: string): string` - Generate CSP header
- `generateNonce(): string` - Generate cryptographic nonce
- `isAllowedByCSP(url: string, directive): boolean` - Check URL against CSP
- `getSecurityHeaders(nonce?: string): Record<string, string>` - Get all security headers

## Security Best Practices

1. **Always sanitize user inputs** before rendering or storing
2. **Validate addresses** before blockchain operations
3. **Use CSP headers** to prevent XSS attacks
4. **Implement rate limiting** to prevent abuse
5. **Validate amounts** with proper decimal precision
6. **Check transaction hashes** before querying
7. **Use nonces** for inline scripts
8. **Allowlist domains** for external resources

## Testing

```typescript
import { describe, it, expect } from "vitest";
import { sanitizeAddress, isValidAmount } from "@/lib/security";

describe("Security utils", () => {
  it("should sanitize valid address", () => {
    const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
    expect(sanitizeAddress(address)).toBe(address);
  });

  it("should reject invalid address", () => {
    expect(sanitizeAddress("invalid")).toBeNull();
  });

  it("should validate amounts correctly", () => {
    expect(isValidAmount("1.5", 18)).toBe(true);
    expect(isValidAmount("-1", 18)).toBe(false);
    expect(isValidAmount("1.123456789012345678", 18)).toBe(true);
    expect(isValidAmount("1.1234567890123456789", 18)).toBe(false);
  });
});
```

## Dependencies

- `viem` - Ethereum address validation
- `dompurify` - HTML sanitization
- `crypto` (Node.js built-in) - Nonce generation
