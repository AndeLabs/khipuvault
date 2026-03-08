# API Layer - Usage Examples

Real-world examples showing how to use the new API layer in KhipuVault.

## Example 1: User Portfolio Query (React Query)

```typescript
// features/portfolio/api/queries.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient, ENDPOINTS, type UserPortfolio } from "@/lib/api";

export function useUserPortfolio(address: string | undefined) {
  return useQuery({
    queryKey: ["portfolio", address],
    queryFn: () =>
      apiClient.get<UserPortfolio>(ENDPOINTS.users.portfolio(address!)),
    enabled: !!address,
    staleTime: 30_000, // 30 seconds
  });
}

// features/portfolio/components/portfolio-card.tsx
import { useUserPortfolio } from "../api/queries";
import { getUserFriendlyMessage } from "@/lib/api";

export function PortfolioCard({ address }: { address: string }) {
  const { data, isLoading, error } = useUserPortfolio(address);

  if (isLoading) {
    return <PortfolioSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {getUserFriendlyMessage(error)}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Value</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">
          {formatCurrency(data.totalValue)} mUSD
        </p>
      </CardContent>
    </Card>
  );
}
```

## Example 2: Transaction History with Pagination

```typescript
// features/transactions/api/queries.ts
import { useQuery } from "@tanstack/react-query";
import {
  apiClient,
  ENDPOINTS,
  type Transaction,
  type PaginatedResponse,
  type TransactionFilter,
} from "@/lib/api";

export function useTransactionHistory(
  address: string,
  filters: TransactionFilter = {}
) {
  const { page = 1, limit = 20, ...otherFilters } = filters;

  return useQuery({
    queryKey: ["transactions", address, filters],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Transaction>>(
        ENDPOINTS.users.transactions(address),
        {
          page,
          limit,
          ...otherFilters,
        }
      ),
    keepPreviousData: true, // Smooth pagination
  });
}

// features/transactions/components/transaction-table.tsx
import { useState } from "react";
import { useTransactionHistory } from "../api/queries";

export function TransactionTable({ address }: { address: string }) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<TransactionFilter>({});

  const { data, isLoading } = useTransactionHistory(address, {
    ...filter,
    page,
    limit: 20,
  });

  return (
    <div>
      <TransactionFilters onFilterChange={setFilter} />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.type}</TableCell>
                  <TableCell>{formatAmount(tx.amount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={tx.status} />
                  </TableCell>
                  <TableCell>{formatDate(tx.timestamp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            currentPage={page}
            totalPages={data?.totalPages ?? 0}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
```

## Example 3: Pool Analytics with Error Boundaries

```typescript
// features/pools/api/queries.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient, ENDPOINTS, type PoolAnalytics } from "@/lib/api";

export function usePoolAnalytics(poolId: string | undefined) {
  return useQuery({
    queryKey: ["pool-analytics", poolId],
    queryFn: () =>
      apiClient.get<PoolAnalytics>(ENDPOINTS.pools.analytics(poolId!)),
    enabled: !!poolId,
    staleTime: 5 * 60_000, // 5 minutes
    retry: 3, // React Query retry
  });
}

// features/pools/components/pool-analytics-chart.tsx
import { usePoolAnalytics } from "../api/queries";
import { ErrorBoundary } from "react-error-boundary";
import { NotFoundError, AuthError } from "@/lib/api";

function PoolAnalyticsContent({ poolId }: { poolId: string }) {
  const { data, error, isLoading } = usePoolAnalytics(poolId);

  // Handle specific errors
  if (error instanceof NotFoundError) {
    return <NotFound message="Pool analytics not found" />;
  }

  if (error instanceof AuthError) {
    return <SignInPrompt />;
  }

  if (error) {
    throw error; // Let ErrorBoundary handle it
  }

  if (isLoading) return <ChartSkeleton />;

  return (
    <div className="space-y-4">
      <TVLChart data={data.tvlHistory} />
      <APRChart data={data.aprHistory} />
      <UserGrowthChart data={data.userGrowth} />
    </div>
  );
}

export function PoolAnalyticsChart({ poolId }: { poolId: string }) {
  return (
    <ErrorBoundary
      fallback={
        <Alert variant="destructive">
          <AlertTitle>Failed to load analytics</AlertTitle>
          <AlertDescription>
            Please try again later or contact support.
          </AlertDescription>
        </Alert>
      }
    >
      <PoolAnalyticsContent poolId={poolId} />
    </ErrorBoundary>
  );
}
```

## Example 4: Optimistic Updates (Mutations)

```typescript
// features/pools/api/mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ENDPOINTS, type Pool } from "@/lib/api";
import { toast } from "sonner";

interface CreatePoolInput {
  name: string;
  type: "individual" | "cooperative";
  minDeposit: string;
}

export function useCreatePool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePoolInput) =>
      apiClient.post<Pool>(ENDPOINTS.pools.list, input),

    // Optimistic update
    onMutate: async (newPool) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["pools"] });

      // Snapshot previous value
      const previousPools = queryClient.getQueryData<Pool[]>(["pools"]);

      // Optimistically update
      if (previousPools) {
        queryClient.setQueryData<Pool[]>(["pools"], [
          ...previousPools,
          {
            id: "temp-id",
            ...newPool,
            tvl: "0",
            apr: 0,
            totalUsers: 0,
            status: "active",
          } as Pool,
        ]);
      }

      return { previousPools };
    },

    // Rollback on error
    onError: (err, newPool, context) => {
      if (context?.previousPools) {
        queryClient.setQueryData(["pools"], context.previousPools);
      }
      toast.error("Failed to create pool");
    },

    // Refetch on success
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pools"] });
      toast.success(`Pool "${data.name}" created successfully!`);
    },
  });
}

// features/pools/components/create-pool-form.tsx
import { useCreatePool } from "../api/mutations";
import { useRouter } from "next/navigation";

export function CreatePoolForm() {
  const router = useRouter();
  const createPool = useCreatePool();
  const [name, setName] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const pool = await createPool.mutateAsync({
        name,
        type: "individual",
        minDeposit: parseEther("100").toString(),
      });

      router.push(`/pools/${pool.id}`);
    } catch (error) {
      // Error already handled in mutation
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Pool name"
      />
      <Button type="submit" disabled={createPool.isLoading}>
        {createPool.isLoading ? "Creating..." : "Create Pool"}
      </Button>
    </form>
  );
}
```

## Example 5: Polling for Real-time Updates

```typescript
// features/lottery/api/queries.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient, ENDPOINTS, type LotteryRound } from "@/lib/api";

export function useActiveLottery() {
  return useQuery({
    queryKey: ["lottery", "active"],
    queryFn: () =>
      apiClient.get<LotteryRound>(ENDPOINTS.lottery.active),
    refetchInterval: 10_000, // Poll every 10 seconds
    refetchIntervalInBackground: false, // Stop when tab inactive
  });
}

// features/lottery/components/lottery-countdown.tsx
import { useActiveLottery } from "../api/queries";
import { useEffect, useState } from "react";

export function LotteryCountdown() {
  const { data: lottery, isLoading } = useActiveLottery();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!lottery?.drawTime) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(lottery.drawTime).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("Draw in progress...");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(interval);
  }, [lottery?.drawTime]);

  if (isLoading) return <Skeleton className="h-8 w-32" />;

  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground">Next Draw</p>
      <p className="text-2xl font-bold">{timeLeft}</p>
    </div>
  );
}
```

## Example 6: Authentication Integration

```typescript
// lib/auth/siwe-client.ts
import { apiClient } from "@/lib/api";
import { SiweMessage } from "siwe";
import { useAccount, useSignMessage } from "wagmi";

export function useAuth() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const signIn = async () => {
    if (!address) throw new Error("No wallet connected");

    // Create SIWE message
    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in to KhipuVault",
      uri: window.location.origin,
      version: "1",
      chainId: 1,
      nonce: crypto.randomUUID(),
    });

    // Sign message
    const signature = await signMessageAsync({
      message: message.prepareMessage(),
    });

    // Verify with backend
    const response = await apiClient.post<{ token: string }>("/auth/siwe", {
      message: message.prepareMessage(),
      signature,
    });

    // Set auth token for all future requests
    apiClient.setAuthToken(response.token);

    // Store in localStorage
    localStorage.setItem("auth_token", response.token);

    return response.token;
  };

  const signOut = () => {
    apiClient.clearRequestInterceptors();
    localStorage.removeItem("auth_token");
  };

  return { signIn, signOut };
}

// app/providers.tsx
import { useEffect } from "react";
import { apiClient } from "@/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  // Restore auth token on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      apiClient.setAuthToken(token);
    }
  }, []);

  return <>{children}</>;
}
```

## Example 7: Request Cancellation on Unmount

```typescript
// features/search/components/pool-search.tsx
import { useState, useEffect, useRef } from "react";
import { apiClient, ENDPOINTS, type Pool } from "@/lib/api";

export function PoolSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    // Cancel previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const search = async () => {
      setIsLoading(true);
      try {
        const pools = await apiClient.get<Pool[]>(
          ENDPOINTS.pools.list,
          { search: query },
          { signal: abortControllerRef.current!.signal }
        );
        setResults(pools);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Search failed:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);

    return () => {
      clearTimeout(debounce);
      abortControllerRef.current?.abort();
    };
  }, [query]);

  return (
    <div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search pools..."
      />
      {isLoading && <Spinner />}
      <SearchResults results={results} />
    </div>
  );
}
```

## Example 8: Custom Error Handling Hook

```typescript
// hooks/use-api-error.ts
import { useEffect } from "react";
import { toast } from "sonner";
import {
  isApiError,
  AuthError,
  NetworkError,
  RateLimitError,
  getUserFriendlyMessage,
} from "@/lib/api";
import { useRouter } from "next/navigation";

export function useApiError(error: unknown) {
  const router = useRouter();

  useEffect(() => {
    if (!error) return;

    if (error instanceof AuthError) {
      toast.error("Please sign in to continue");
      router.push("/login");
      return;
    }

    if (error instanceof NetworkError) {
      toast.error("Network error. Please check your connection.");
      return;
    }

    if (error instanceof RateLimitError) {
      const retryAfter = error.retryAfter ?? 60;
      toast.error(`Rate limited. Please wait ${retryAfter} seconds.`);
      return;
    }

    if (isApiError(error)) {
      toast.error(getUserFriendlyMessage(error));
      return;
    }

    // Unknown error
    console.error("Unexpected error:", error);
    toast.error("An unexpected error occurred");
  }, [error, router]);
}

// Usage in components
function MyComponent() {
  const { data, error } = useUserPortfolio(address);
  useApiError(error);

  // Rest of component...
}
```

## Best Practices

1. **Always use TypeScript types** from `@/lib/api/types`
2. **Use ENDPOINTS constants** instead of hardcoded strings
3. **Handle errors gracefully** with specific error classes
4. **Implement loading states** for better UX
5. **Use React Query** for caching and background refetching
6. **Cancel requests** when components unmount
7. **Add error boundaries** for unexpected failures
8. **Use optimistic updates** for instant feedback
9. **Poll sparingly** - use websockets for real-time data when possible
10. **Store auth tokens securely** - consider httpOnly cookies for production
