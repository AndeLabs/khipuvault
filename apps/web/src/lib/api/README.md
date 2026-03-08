# API Layer Documentation

This directory contains the modular API client for KhipuVault frontend.

## Structure

```
lib/api/
├── client.ts      # Enhanced API client with interceptors, retry, logging
├── endpoints.ts   # API endpoint constants (single source of truth)
├── types.ts       # TypeScript types for requests/responses
├── errors.ts      # Custom error classes (ApiError, NetworkError, etc.)
└── index.ts       # Re-exports everything
```

## Quick Start

```typescript
import { apiClient, ENDPOINTS, type UserPortfolio } from "@/lib/api";

// Simple GET request
const portfolio = await apiClient.get<UserPortfolio>(ENDPOINTS.users.portfolio("0x1234..."));

// With query parameters
const transactions = await apiClient.get(ENDPOINTS.transactions.list, {
  page: 1,
  limit: 20,
  status: "confirmed",
});

// POST request
const response = await apiClient.post(ENDPOINTS.pools.list, {
  name: "My Pool",
  type: "individual",
});
```

## Features

### 1. Authentication

Add auth token once and all requests include it:

```typescript
import { apiClient } from "@/lib/api";

// Set token (after SIWE login)
apiClient.setAuthToken(jwtToken);

// All subsequent requests include Authorization header
const data = await apiClient.get("/users/me");
```

### 2. Error Handling

Use specific error classes for better UX:

```typescript
import { apiClient, isApiError, AuthError, NotFoundError } from "@/lib/api";

try {
  const pool = await apiClient.get(ENDPOINTS.pools.detail(poolId));
} catch (error) {
  if (error instanceof AuthError) {
    // Redirect to login
    router.push("/login");
  } else if (error instanceof NotFoundError) {
    // Show 404 page
    notFound();
  } else if (isApiError(error)) {
    // Generic API error
    toast.error(error.message);
  } else {
    // Unknown error
    console.error(error);
  }
}
```

Get user-friendly messages:

```typescript
import { getUserFriendlyMessage } from "@/lib/api";

catch (error) {
  const message = getUserFriendlyMessage(error);
  toast.error(message); // "Please sign in to continue"
}
```

### 3. Request Interceptors

Modify requests before they're sent:

```typescript
import { apiClient } from "@/lib/api";

// Add custom header to all requests
apiClient.addRequestInterceptor((url, config) => ({
  ...config,
  headers: {
    ...config.headers,
    "X-Client-Version": "1.0.0",
  },
}));

// Add conditional logic
apiClient.addRequestInterceptor((url, config) => {
  if (url.includes("/admin/")) {
    return {
      ...config,
      headers: {
        ...config.headers,
        "X-Admin-Token": getAdminToken(),
      },
    };
  }
  return config;
});
```

### 4. Response Interceptors

Process responses before they're returned:

```typescript
apiClient.addResponseInterceptor(async (response) => {
  // Log slow requests
  const duration = performance.now() - startTime;
  if (duration > 3000) {
    console.warn(`Slow request: ${response.url} (${duration}ms)`);
  }
  return response;
});
```

### 5. Retry Logic

Automatic retry with exponential backoff:

```typescript
// Default: 2 retries for 5xx and network errors
const data = await apiClient.get("/pools");

// Custom retry config
const data = await apiClient.get("/pools", {}, { retries: 5, timeout: 30000 });
```

### 6. Request Cancellation

```typescript
const controller = new AbortController();

// Pass signal
const promise = apiClient.get("/pools", {}, { signal: controller.signal });

// Cancel request
controller.abort();
```

## Usage with React Query

Recommended pattern for data fetching:

```typescript
// features/pools/api/queries.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient, ENDPOINTS, type Pool } from "@/lib/api";

export function usePool(poolId: string) {
  return useQuery({
    queryKey: ["pool", poolId],
    queryFn: () => apiClient.get<Pool>(ENDPOINTS.pools.detail(poolId)),
    staleTime: 60_000, // 1 minute
  });
}

export function usePools() {
  return useQuery({
    queryKey: ["pools"],
    queryFn: () => apiClient.get<Pool[]>(ENDPOINTS.pools.list),
  });
}

// Mutations
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreatePool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePoolInput) => apiClient.post<Pool>(ENDPOINTS.pools.list, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pools"] });
    },
  });
}
```

Usage in components:

```typescript
function PoolDetails({ poolId }: { poolId: string }) {
  const { data: pool, isLoading, error } = usePool(poolId);

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorAlert error={error} />;

  return <PoolCard pool={pool} />;
}
```

## Error Types

| Class             | Status  | Use Case                      |
| ----------------- | ------- | ----------------------------- |
| `ApiError`        | Any     | Base class for all API errors |
| `NetworkError`    | 0       | Connection failed, offline    |
| `TimeoutError`    | 408     | Request took too long         |
| `ValidationError` | 400     | Invalid input                 |
| `AuthError`       | 401/403 | Not authenticated/authorized  |
| `NotFoundError`   | 404     | Resource doesn't exist        |
| `RateLimitError`  | 429     | Too many requests             |
| `ServerError`     | 5xx     | Backend error                 |

## Advanced Usage

### Custom API Client Instance

Create isolated client with different config:

```typescript
import { createApiClient } from "@/lib/api";

const adminClient = createApiClient({
  baseUrl: "https://admin-api.khipuvault.com",
  timeout: 30000,
  retries: 5,
});

adminClient.setAuthToken(adminToken);
```

### File Upload

```typescript
const file = new File([blob], "avatar.png");

const response = await apiClient.upload(
  "/users/avatar",
  file,
  "avatar", // form field name
  { userId: "123" } // additional fields
);
```

### Custom Logger

```typescript
import { createApiClient } from "@/lib/api";
import { logger } from "@/lib/monitoring";

const client = createApiClient({
  logger: {
    debug: (msg, meta) => logger.debug(msg, meta),
    error: (msg, meta) => logger.error(msg, meta),
  },
});
```

## Migration from Old Client

Before (using KhipuApiClient from @khipu/web3):

```typescript
import { apiClient } from "@/lib/api-client";

const portfolio = await apiClient.getUserPortfolio(address);
```

After (using new modular API):

```typescript
import { apiClient, ENDPOINTS, type UserPortfolio } from "@/lib/api";

const portfolio = await apiClient.get<UserPortfolio>(ENDPOINTS.users.portfolio(address));
```

Benefits:

- Centralized endpoint management
- Better error handling
- Request/response interceptors
- Customizable retry logic
- Type-safe throughout
- Easier to test and mock
