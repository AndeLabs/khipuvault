# Authentication with SIWE (Sign-In with Ethereum)

This API uses SIWE (Sign-In with Ethereum) for authentication, combined with JWT tokens for maintaining sessions.

## Overview

The authentication flow consists of three main steps:

1. **Get a nonce** - Request a unique nonce from the server
2. **Sign the message** - Sign a SIWE message with the user's wallet
3. **Verify and get JWT** - Submit the signed message to receive a JWT token

## API Endpoints

### 1. Get Nonce

Request a unique nonce for signing.

```http
GET /api/auth/nonce
```

**Response:**

```json
{
  "nonce": "abc123...xyz"
}
```

### 2. Verify SIWE Message

Submit a signed SIWE message to authenticate and receive a JWT token.

```http
POST /api/auth/verify
Content-Type: application/json

{
  "message": "example.com wants you to sign in with your Ethereum account:\n0x1234...",
  "signature": "0xabcd..."
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "address": "0x1234567890123456789012345678901234567890",
  "expiresIn": "7d"
}
```

**Error Response:**

```json
{
  "error": "Authentication failed",
  "details": {
    "reason": "Invalid nonce: nonce already used"
  }
}
```

### 3. Get Current User

Get information about the currently authenticated user.

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**

```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "authenticated": true,
  "iat": 1699999999,
  "exp": 1700604799
}
```

### 4. Logout

Logout the current user (client should delete the token).

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully. Please delete your token."
}
```

## Client Implementation Example

### Using ethers.js

```typescript
import { ethers } from "ethers";
import { SiweMessage } from "siwe";

async function authenticateWithSIWE() {
  // 1. Get provider and signer
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  // 2. Request nonce from server
  const nonceResponse = await fetch("http://localhost:3001/api/auth/nonce");
  const { nonce } = await nonceResponse.json();

  // 3. Create SIWE message
  const message = new SiweMessage({
    domain: window.location.host,
    address: address,
    statement: "Sign in with Ethereum to KhipuVault",
    uri: window.location.origin,
    version: "1",
    chainId: 1, // Ethereum mainnet
    nonce: nonce,
  });

  // 4. Sign the message
  const messageString = message.prepareMessage();
  const signature = await signer.signMessage(messageString);

  // 5. Verify with server
  const verifyResponse = await fetch("http://localhost:3001/api/auth/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: messageString,
      signature: signature,
    }),
  });

  const { token, address: verifiedAddress } = await verifyResponse.json();

  // 6. Store token for future requests
  localStorage.setItem("auth_token", token);

  return { token, address: verifiedAddress };
}

// Use the token in subsequent requests
async function makeAuthenticatedRequest(endpoint: string) {
  const token = localStorage.getItem("auth_token");

  const response = await fetch(`http://localhost:3001${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}
```

### Using wagmi + viem

```typescript
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";

function useAuth() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const signIn = async () => {
    if (!address) throw new Error("No wallet connected");

    // 1. Get nonce
    const nonceRes = await fetch("/api/auth/nonce");
    const { nonce } = await nonceRes.json();

    // 2. Create and sign message
    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in with Ethereum to KhipuVault",
      uri: window.location.origin,
      version: "1",
      chainId: 1,
      nonce,
    });

    const signature = await signMessageAsync({
      message: message.prepareMessage(),
    });

    // 3. Verify
    const verifyRes = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message.prepareMessage(),
        signature,
      }),
    });

    const { token } = await verifyRes.json();
    localStorage.setItem("auth_token", token);

    return token;
  };

  return { signIn };
}
```

## Protected Routes

To protect routes, use the `requireAuth` middleware:

```typescript
import { Router } from "express";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Public route
router.get("/public", (req, res) => {
  res.json({ message: "This is public" });
});

// Protected route
router.get("/protected", requireAuth, (req, res) => {
  // req.user is available and contains:
  // - address: string
  // - iat: number (issued at)
  // - exp: number (expires at)
  res.json({
    message: "This is protected",
    user: req.user,
  });
});

export default router;
```

## Security Features

### Nonce Management

- Each nonce is valid for **10 minutes**
- Nonces are **single-use** (cannot be replayed)
- Expired nonces are automatically cleaned up
- Nonces are cryptographically secure (32 bytes of randomness)

### JWT Tokens

- Tokens expire after **7 days** by default (configurable via `JWT_EXPIRATION`)
- Tokens include issuer and audience claims for additional security
- Addresses are normalized to lowercase for consistency
- Secret key should be strong and kept secure (configure via `JWT_SECRET`)

### Message Verification

- Signatures are verified using `viem`
- SIWE message structure is validated
- Message expiration and not-before times are checked
- Domain, URI, and version are validated

## Environment Variables

```env
# Required for production
JWT_SECRET=your-secret-key-here

# Optional (defaults shown)
JWT_EXPIRATION=7d
```

**Important:** Generate a strong JWT secret for production:

```bash
openssl rand -base64 32
```

## Error Handling

Common error responses:

| Status | Error                 | Description                        |
| ------ | --------------------- | ---------------------------------- |
| 401    | Unauthorized          | No token provided or invalid token |
| 401    | Authentication failed | Invalid signature or nonce         |
| 400    | Validation Error      | Invalid request body format        |
| 500    | Internal Server Error | Server error during authentication |

## Best Practices

1. **Always use HTTPS in production** to protect tokens in transit
2. **Store tokens securely** (httpOnly cookies preferred over localStorage)
3. **Implement token refresh** for better UX
4. **Add rate limiting** to prevent brute force attacks
5. **Monitor failed authentication attempts**
6. **Rotate JWT secrets** periodically
7. **Consider implementing token blacklist** for logout in production

## Production Considerations

For production deployments, consider:

1. **Redis for nonce storage** - Instead of in-memory Map, use Redis for:
   - Distributed nonce storage across multiple servers
   - Automatic TTL (time-to-live) management
   - Better performance and scalability

2. **Token blacklist** - Implement JWT token blacklist using Redis:
   - Store invalidated tokens until they expire
   - Check blacklist on each authenticated request
   - Enable true server-side logout

3. **Rate limiting** - Add specific rate limits for auth endpoints:
   - Limit nonce requests per IP
   - Limit verification attempts per address
   - Prevent enumeration attacks

Example Redis nonce storage:

```typescript
import Redis from "ioredis";

const redis = new Redis();

async function storeNonce(nonce: string) {
  await redis.setex(`nonce:${nonce}`, 600, "unused"); // 10 minutes TTL
}

async function verifyAndConsumeNonce(nonce: string): Promise<boolean> {
  const value = await redis.get(`nonce:${nonce}`);
  if (value === "unused") {
    await redis.set(`nonce:${nonce}`, "used");
    return true;
  }
  return false;
}
```
