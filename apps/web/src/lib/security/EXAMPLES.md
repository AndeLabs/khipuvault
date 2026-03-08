# Security Library - Usage Examples

Real-world examples of how to use the security library in KhipuVault components.

## Example 1: Validating User Addresses

```typescript
// features/individual-savings/components/address-input.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { isValidEthAddress, sanitizeAddress } from '@/lib/security';

export function AddressInput({ onChange }: { onChange: (address: string) => void }) {
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Sanitize address
    const sanitized = sanitizeAddress(value);

    if (!sanitized) {
      setError('Invalid Ethereum address');
      return;
    }

    if (!isValidEthAddress(sanitized)) {
      setError('Address checksum validation failed');
      return;
    }

    setError('');
    onChange(sanitized);
  };

  return (
    <div>
      <Input
        placeholder="0x..."
        onChange={handleChange}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
```

## Example 2: Sanitizing Amount Inputs

```typescript
// features/individual-savings/hooks/use-amount-input.ts
import { useState, useCallback } from "react";
import { sanitizeNumber, isValidAmount } from "@/lib/security";

export function useAmountInput(decimals: number = 18) {
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleAmountChange = useCallback(
    (value: string) => {
      // Sanitize the input
      const sanitized = sanitizeNumber(value, {
        decimals,
        min: 0,
        allowNegative: false,
      });

      if (sanitized === null) {
        setError("Invalid amount");
        setAmount(value);
        return;
      }

      // Additional validation
      if (!isValidAmount(sanitized.toString(), decimals, { min: 0.01 })) {
        setError("Amount must be at least 0.01");
        setAmount(value);
        return;
      }

      setError("");
      setAmount(sanitized.toString());
    },
    [decimals]
  );

  return {
    amount,
    error,
    handleAmountChange,
    isValid: !error && amount !== "",
  };
}
```

## Example 3: Secure API URL Validation

```typescript
// lib/api-client.ts
import { isValidUrl, ALLOWED_DOMAINS } from "@/lib/security";

const ALLOWED_API_DOMAINS = ["api.khipuvault.com", "khipuvault.com", ...ALLOWED_DOMAINS.web3];

export async function fetchFromApi(endpoint: string) {
  const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;

  // Validate URL before fetching
  if (!isValidUrl(fullUrl, ALLOWED_API_DOMAINS)) {
    throw new Error("Invalid API URL");
  }

  const response = await fetch(fullUrl);
  return response.json();
}
```

## Example 4: Validating Transaction Hashes

```typescript
// features/transactions/components/transaction-link.tsx
import { isValidTransactionHash, sanitizeTransactionHash } from '@/lib/security';

export function TransactionLink({ hash }: { hash: string }) {
  // Sanitize and validate
  const sanitized = sanitizeTransactionHash(hash);

  if (!sanitized || !isValidTransactionHash(sanitized)) {
    return <span className="text-gray-400">Invalid transaction</span>;
  }

  const explorerUrl = `https://etherscan.io/tx/${sanitized}`;

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 hover:underline"
    >
      {sanitized.slice(0, 10)}...{sanitized.slice(-8)}
    </a>
  );
}
```

## Example 5: Content Security Policy in Middleware

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSecurityHeaders, generateNonce } from "@/lib/security";

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const response = NextResponse.next();

  // Apply security headers
  const headers = getSecurityHeaders(nonce);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Pass nonce to pages
  response.headers.set("x-nonce", nonce);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

## Example 6: Sanitizing User Comments

```typescript
// features/portfolio/components/comment-form.tsx
import { useState } from 'react';
import { sanitizeHtml, sanitizeString } from '@/lib/security';
import { Textarea } from '@/components/ui/textarea';

export function CommentForm({ onSubmit }: { onSubmit: (comment: string) => void }) {
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Sanitize HTML to prevent XSS
    const sanitized = sanitizeHtml(comment);

    // Also sanitize string (remove control characters)
    const cleaned = sanitizeString(sanitized, 500);

    if (!cleaned) {
      return;
    }

    onSubmit(cleaned);
    setComment('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment..."
        maxLength={500}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Example 7: Chain ID Validation

```typescript
// hooks/web3/use-network-validation.ts
import { useAccount } from "wagmi";
import { isValidChainId, BLOCKCHAIN_SECURITY } from "@/lib/security";

export function useNetworkValidation() {
  const { chainId } = useAccount();

  const isSupported = chainId
    ? isValidChainId(chainId, BLOCKCHAIN_SECURITY.supportedChains)
    : false;

  const isSepolia = chainId === 11155111;
  const isMainnet = chainId === 1;

  return {
    isSupported,
    isSepolia,
    isMainnet,
    chainId,
  };
}
```

## Example 8: Rate Limiting Hook

```typescript
// hooks/use-rate-limit.ts
import { useState, useCallback } from 'react';
import { RATE_LIMITS } from '@/lib/security';

type RateLimitType = keyof typeof RATE_LIMITS;

export function useRateLimit(type: RateLimitType) {
  const [attempts, setAttempts] = useState<number[]>([]);

  const checkLimit = useCallback(() => {
    const now = Date.now();
    const limit = RATE_LIMITS[type];

    // Remove old attempts outside the time window
    const recentAttempts = attempts.filter(
      (time) => now - time < limit.window
    );

    // Check if limit exceeded
    if (recentAttempts.length >= limit.requests) {
      return false;
    }

    // Add new attempt
    setAttempts([...recentAttempts, now]);
    return true;
  }, [attempts, type]);

  return { checkLimit };
}

// Usage in component:
function TransactionButton() {
  const { checkLimit } = useRateLimit('transactions');

  const handleClick = () => {
    if (!checkLimit()) {
      toast.error('Too many transactions. Please wait.');
      return;
    }

    // Proceed with transaction
    executeTransaction();
  };

  return <button onClick={handleClick}>Send Transaction</button>;
}
```

## Example 9: Validating Pool Parameters

```typescript
// features/cooperative-savings/hooks/use-pool-validation.ts
import { isValidAmount, isValidPercentage, sanitizeString } from "@/lib/security";

export interface PoolParams {
  name: string;
  contributionAmount: string;
  interestRate: number;
  maxParticipants: number;
}

export function usePoolValidation() {
  const validatePoolParams = (params: PoolParams): string[] => {
    const errors: string[] = [];

    // Validate name
    const sanitizedName = sanitizeString(params.name, 100);
    if (!sanitizedName || sanitizedName.length < 3) {
      errors.push("Pool name must be between 3 and 100 characters");
    }

    // Validate contribution amount
    if (!isValidAmount(params.contributionAmount, 6, { min: 10, max: 100000 })) {
      errors.push("Contribution amount must be between 10 and 100,000 mUSD");
    }

    // Validate interest rate
    if (!isValidPercentage(params.interestRate, { min: 0, max: 50 })) {
      errors.push("Interest rate must be between 0% and 50%");
    }

    // Validate max participants
    if (params.maxParticipants < 2 || params.maxParticipants > 100) {
      errors.push("Max participants must be between 2 and 100");
    }

    return errors;
  };

  return { validatePoolParams };
}
```

## Example 10: Secure External Link Component

```typescript
// components/ui/external-link.tsx
import { isValidUrl, sanitizeUrl } from '@/lib/security';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  allowedDomains?: string[];
}

export function ExternalLink({ href, children, allowedDomains }: ExternalLinkProps) {
  // Sanitize and validate URL
  const sanitized = sanitizeUrl(href);

  if (!sanitized || !isValidUrl(sanitized, allowedDomains)) {
    // Don't render link if URL is invalid
    return <span className="text-gray-400">{children}</span>;
  }

  return (
    <a
      href={sanitized}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-blue-500 hover:underline"
    >
      {children}
      <ExternalLinkIcon className="h-3 w-3" />
    </a>
  );
}
```

## Security Best Practices

1. **Always validate user input** before processing or storing
2. **Sanitize before rendering** to prevent XSS attacks
3. **Use type guards** (like `isValidEthAddress`) for TypeScript safety
4. **Implement rate limiting** for sensitive operations
5. **Validate chain IDs** before executing transactions
6. **Check URL domains** before fetching external resources
7. **Apply CSP headers** in middleware for defense in depth
8. **Sanitize addresses** to ensure proper checksumming
9. **Validate amounts** with proper decimal precision
10. **Use allowlists** instead of blocklists when possible

## Testing Security Functions

```typescript
// __tests__/security-integration.test.ts
import { describe, it, expect } from "vitest";
import { sanitizeAddress, isValidAmount } from "@/lib/security";

describe("Security Integration", () => {
  it("should handle user deposit flow securely", () => {
    // User input (potentially malicious)
    const userAddress = "0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED";
    const userAmount = "1000.123456";

    // Sanitize and validate
    const address = sanitizeAddress(userAddress);
    expect(address).toBe("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed");

    const isValid = isValidAmount(userAmount, 6, { min: 10 });
    expect(isValid).toBe(true);
  });
});
```
