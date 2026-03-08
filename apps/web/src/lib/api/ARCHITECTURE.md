# API Layer Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              React Components                        │    │
│  │  (Pages, Features, UI Components)                    │    │
│  └────────────┬────────────────────────────┬────────────┘    │
│               │                             │                 │
│               │ useQuery/useMutation        │                 │
│               ▼                             ▼                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │   React Query Hooks      │  │   Service Layer          │ │
│  │  (features/*/api/)       │  │  (features/*/api/)       │ │
│  └────────────┬─────────────┘  └────────────┬─────────────┘ │
│               │                               │                │
│               │ apiClient.get/post            │                │
│               └───────────┬───────────────────┘                │
│                           ▼                                    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │            API Client Layer (@/lib/api)              │    │
│  │                                                       │    │
│  │  ┌─────────────────┐  ┌────────────────────────┐   │    │
│  │  │  ApiClient      │  │  ENDPOINTS             │   │    │
│  │  │  - get()        │  │  - users.*             │   │    │
│  │  │  - post()       │  │  - pools.*             │   │    │
│  │  │  - put()        │  │  - transactions.*      │   │    │
│  │  │  - patch()      │  │  - analytics.*         │   │    │
│  │  │  - delete()     │  │  - lottery.*           │   │    │
│  │  │  - upload()     │  │  - rosca.*             │   │    │
│  │  └─────────────────┘  └────────────────────────┘   │    │
│  │                                                       │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │  Request Interceptors                        │   │    │
│  │  │  - Add auth headers                          │   │    │
│  │  │  - Add custom headers                        │   │    │
│  │  │  - Transform requests                        │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  │                        ▼                             │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │  Fetch with Retry Logic                      │   │    │
│  │  │  - Exponential backoff                       │   │    │
│  │  │  - Timeout handling                          │   │    │
│  │  │  - Request cancellation                      │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  │                        ▼                             │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │  Response Interceptors                       │   │    │
│  │  │  - Transform responses                       │   │    │
│  │  │  - Log response times                        │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  │                        ▼                             │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │  Error Handling                              │   │    │
│  │  │  - Create typed errors                       │   │    │
│  │  │  - Map HTTP status to error classes          │   │    │
│  │  │  - User-friendly messages                    │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ HTTP (JSON)
                            ▼
                  ┌──────────────────┐
                  │  Backend API     │
                  │  (Express.js)    │
                  └──────────────────┘
```

## Data Flow

### Request Flow

```
Component
   │
   │ useQuery({ queryFn: () => apiClient.get(...) })
   ▼
React Query
   │
   │ execute queryFn
   ▼
Service Layer (optional)
   │
   │ apiClient.get<UserPortfolio>(ENDPOINTS.users.portfolio(address))
   ▼
ApiClient
   │
   ├─► Request Interceptors (add auth, headers)
   │
   ├─► Build URL with params
   │
   ├─► Retry Loop (up to N times)
   │   │
   │   ├─► Create AbortController
   │   │
   │   ├─► Set timeout
   │   │
   │   ├─► fetch(url, config)
   │   │
   │   ├─► Response Interceptors
   │   │
   │   └─► Error? → Retry with exponential backoff
   │
   ├─► Parse response
   │
   └─► Return typed data
       │
       ▼
React Query (cache)
   │
   ▼
Component (render)
```

### Error Flow

```
HTTP Error
   │
   ▼
createApiError(status, message, code, details)
   │
   ├─► 0 → NetworkError
   ├─► 400 → ValidationError
   ├─► 401/403 → AuthError
   ├─► 404 → NotFoundError
   ├─► 408 → TimeoutError
   ├─► 429 → RateLimitError
   ├─► 5xx → ServerError
   └─► other → ApiError
       │
       ▼
Retry Logic
   │
   ├─► isRetryable? (5xx, 0) → Retry
   └─► isClientError? (4xx) → Throw immediately
       │
       ▼
React Query (onError)
   │
   ▼
useApiError hook
   │
   ├─► AuthError → Redirect to login
   ├─► NetworkError → Toast "Check connection"
   ├─► RateLimitError → Toast "Too many requests"
   └─► Other → Toast getUserFriendlyMessage(error)
```

## Module Organization

```
lib/api/
│
├── client.ts              # Core ApiClient class
│   ├── ApiClient          # Main class
│   ├── apiClient          # Singleton instance
│   └── createApiClient()  # Factory for custom instances
│
├── endpoints.ts           # Endpoint constants
│   ├── API_CONFIG         # Base URL, timeout, retries
│   ├── ENDPOINTS          # All endpoints organized by domain
│   │   ├── users
│   │   ├── pools
│   │   ├── transactions
│   │   ├── analytics
│   │   ├── lottery
│   │   ├── rosca
│   │   └── mezo
│   └── buildUrl()         # Helper for query params
│
├── errors.ts              # Error classes
│   ├── ApiError           # Base class
│   ├── NetworkError       # Network failures
│   ├── TimeoutError       # Timeouts
│   ├── AuthError          # Auth failures
│   ├── NotFoundError      # 404s
│   ├── ValidationError    # 400s
│   ├── RateLimitError     # 429s
│   ├── ServerError        # 5xx
│   ├── createApiError()   # Factory function
│   ├── isApiError()       # Type guard
│   └── getUserFriendlyMessage()
│
├── types.ts               # TypeScript types
│   ├── Common types
│   ├── User types
│   ├── Pool types
│   ├── Transaction types
│   ├── Analytics types
│   ├── Lottery types
│   ├── ROSCA types
│   └── Mezo types
│
└── index.ts               # Public API (re-exports)
```

## Usage Patterns

### Pattern 1: Direct Usage

```typescript
import { apiClient, ENDPOINTS } from "@/lib/api";

const portfolio = await apiClient.get(ENDPOINTS.users.portfolio(address));
```

### Pattern 2: Service Layer

```typescript
// features/pools/api/service.ts
import { apiClient, ENDPOINTS } from "@/lib/api";

export class PoolService {
  static getPool(id: string) {
    return apiClient.get(ENDPOINTS.pools.detail(id));
  }
}

// features/pools/api/queries.ts
import { useQuery } from "@tanstack/react-query";
import { PoolService } from "./service";

export function usePool(id: string) {
  return useQuery({
    queryKey: ["pool", id],
    queryFn: () => PoolService.getPool(id),
  });
}
```

### Pattern 3: Error Boundary

```typescript
// components/error-boundary.tsx
<ErrorBoundary
  fallback={(error) => {
    if (error instanceof AuthError) {
      return <SignInPrompt />;
    }
    return <ErrorAlert error={error} />;
  }}
>
  <PoolDetails poolId={id} />
</ErrorBoundary>
```

## Type Flow

```typescript
// Define endpoint
ENDPOINTS.users.portfolio: (address: string) => `/users/${address}/portfolio`

// Define type
interface UserPortfolio {
  userId: string;
  totalDeposited: string;
  // ...
}

// Use with type parameter
const portfolio = await apiClient.get<UserPortfolio>(
  ENDPOINTS.users.portfolio(address)
);
// Type of portfolio: UserPortfolio ✅

// TypeScript ensures type safety
portfolio.totalDeposited // ✅ OK
portfolio.nonExistent     // ❌ Type error
```

## Interceptor Chain

```
Request
   │
   ▼
Interceptor 1 (Add auth)
   │
   ▼
Interceptor 2 (Add version)
   │
   ▼
Interceptor N (Custom logic)
   │
   ▼
fetch()
   │
   ▼
Response
   │
   ▼
Response Interceptor 1 (Log time)
   │
   ▼
Response Interceptor 2 (Transform)
   │
   ▼
Response Interceptor N (Custom)
   │
   ▼
Parsed Data
```

## Retry Strategy

```
Attempt 1: Immediate
   │ (fails)
   ▼
Wait 1s (2^0 * 1000ms)
   │
   ▼
Attempt 2
   │ (fails)
   ▼
Wait 2s (2^1 * 1000ms)
   │
   ▼
Attempt 3
   │ (fails)
   ▼
Wait 4s (2^2 * 1000ms)
   │
   ▼
Attempt 4
   │ (fails)
   ▼
Throw error
```

## Integration Points

### With React Query

```
ApiClient → React Query → Component
         ↑
    Error handling, caching, refetch
```

### With Auth System

```
SIWE Login
   │
   ▼
Get JWT token
   │
   ▼
apiClient.setAuthToken(token)
   │
   ▼
All requests include Authorization header
```

### With Error Tracking

```
API Error
   │
   ▼
useApiError hook
   │
   ├─► captureError() (Sentry/etc)
   └─► toast.error()
```

## Benefits Diagram

```
┌─────────────────────────────────────────┐
│         Before (Old API Client)         │
├─────────────────────────────────────────┤
│ ❌ Hardcoded endpoint strings           │
│ ❌ Basic error handling                 │
│ ❌ No interceptors                      │
│ ❌ Limited retry logic                  │
│ ❌ Mixed error types                    │
│ ❌ Basic TypeScript types               │
└─────────────────────────────────────────┘
                  │
                  │ Migration
                  ▼
┌─────────────────────────────────────────┐
│         After (New API Layer)           │
├─────────────────────────────────────────┤
│ ✅ Centralized ENDPOINTS constants      │
│ ✅ Typed error classes                  │
│ ✅ Request/Response interceptors        │
│ ✅ Configurable retry with backoff      │
│ ✅ Specific error handling              │
│ ✅ Complete TypeScript coverage         │
│ ✅ Easy to test and mock                │
│ ✅ Production-ready                     │
└─────────────────────────────────────────┘
```

## Testing Strategy

```
Unit Tests
   │
   ├─► ApiClient methods
   ├─► Error creation
   ├─► buildUrl()
   └─► Type guards

Integration Tests
   │
   ├─► Request interceptors
   ├─► Response interceptors
   ├─► Retry logic
   └─► Error handling

E2E Tests
   │
   └─► Full request flow with real backend
```

## Performance Considerations

1. **Retry Logic**: Exponential backoff prevents overwhelming server
2. **Timeout**: Prevents hanging requests (default: 15s)
3. **Request Cancellation**: Cleanup on component unmount
4. **React Query Caching**: Reduces unnecessary API calls
5. **Keep-Alive**: Reuse connections (browser default)
6. **Compression**: gzip/brotli (handled by server)

## Security Considerations

1. **Auth Token**: Stored securely, sent in Authorization header
2. **HTTPS Only**: Production uses HTTPS (env config)
3. **CORS**: Handled by backend
4. **Rate Limiting**: Backend enforces limits
5. **Input Validation**: Backend validates (Zod schemas)
6. **XSS Prevention**: React handles escaping
