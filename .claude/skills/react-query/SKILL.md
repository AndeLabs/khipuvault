---
name: react-query
description: React Query 5 patterns for server state management with Wagmi integration in Web3 applications
---

# React Query 5 Patterns

This skill provides expertise in React Query for server state management in Web3 apps.

## Basic Query Patterns

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Query keys factory
export const queryKeys = {
  all: ["khipuvault"] as const,
  pools: () => [...queryKeys.all, "pools"] as const,
  pool: (address: string) => [...queryKeys.pools(), address] as const,
  userDeposits: (address: string) => [...queryKeys.all, "deposits", address] as const,
  transactions: (filters: TransactionFilters) =>
    [...queryKeys.all, "transactions", filters] as const,
};

// Basic query hook
export function usePool(poolAddress: string) {
  return useQuery({
    queryKey: queryKeys.pool(poolAddress),
    queryFn: () => fetchPool(poolAddress),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!poolAddress,
  });
}

// Query with pagination
export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: () => fetchTransactions(filters),
    placeholderData: keepPreviousData, // Smooth pagination
  });
}
```

## Wagmi Integration

```typescript
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { INDIVIDUAL_POOL_ABI, INDIVIDUAL_POOL_ADDRESS } from "@khipu/web3";

// Combined hook: contract read + API data
export function usePoolWithStats(poolAddress: `0x${string}`) {
  const queryClient = useQueryClient();

  // On-chain data
  const { data: onChainData, isLoading: isLoadingOnChain } = useReadContract({
    address: poolAddress,
    abi: INDIVIDUAL_POOL_ABI,
    functionName: "getPoolStats",
  });

  // Off-chain data (API)
  const { data: apiData, isLoading: isLoadingApi } = useQuery({
    queryKey: ["pool", "stats", poolAddress],
    queryFn: () => api.getPoolStats(poolAddress),
    staleTime: 60 * 1000,
  });

  return {
    onChain: onChainData,
    offChain: apiData,
    isLoading: isLoadingOnChain || isLoadingApi,
  };
}

// Mutation with query invalidation
export function useDeposit() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      // Invalidate related queries after successful tx
      queryClient.invalidateQueries({ queryKey: queryKeys.pools() });
      queryClient.invalidateQueries({ queryKey: ["user", "deposits"] });
    },
  });

  const deposit = async (amount: bigint) => {
    writeContract({
      address: INDIVIDUAL_POOL_ADDRESS,
      abi: INDIVIDUAL_POOL_ABI,
      functionName: "deposit",
      value: amount,
    });
  };

  return {
    deposit,
    isPending,
    isConfirming,
    isSuccess,
    txHash: hash,
  };
}
```

## Optimistic Updates

```typescript
export function useRecordTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.recordTransaction,

    // Optimistic update
    onMutate: async (newTx) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactions({}),
      });

      // Snapshot previous value
      const previousTxs = queryClient.getQueryData(queryKeys.transactions({}));

      // Optimistically add new transaction
      queryClient.setQueryData(queryKeys.transactions({}), (old: Transaction[] | undefined) => [
        { ...newTx, status: "PENDING" },
        ...(old || []),
      ]);

      return { previousTxs };
    },

    // Rollback on error
    onError: (err, newTx, context) => {
      queryClient.setQueryData(queryKeys.transactions({}), context?.previousTxs);
    },

    // Refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions({}),
      });
    },
  });
}
```

## Infinite Queries (Pagination)

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

export function useInfiniteTransactions(userAddress: string) {
  return useInfiniteQuery({
    queryKey: ['transactions', 'infinite', userAddress],
    queryFn: ({ pageParam = 1 }) =>
      api.getTransactions({ userAddress, page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

// Usage in component
function TransactionList() {
  const { address } = useAccount();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTransactions(address!);

  const transactions = data?.pages.flatMap(page => page.items) ?? [];

  return (
    <>
      {transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
      {hasNextPage && (
        <Button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </>
  );
}
```

## Error Boundaries Integration

```typescript
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div>
              <p>Something went wrong: {error.message}</p>
              <Button onClick={resetErrorBoundary}>Try again</Button>
            </div>
          )}
        >
          <MainContent />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

## Provider Setup

```typescript
// apps/web/src/providers/query.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## Best Practices

- Use query key factories for consistency
- Keep query keys serializable (no functions)
- Use `staleTime` to reduce unnecessary refetches
- Implement optimistic updates for better UX
- Combine Wagmi hooks with React Query for full data picture
- Use `placeholderData: keepPreviousData` for smooth pagination
- Invalidate queries after mutations instead of manual updates
- Use error boundaries for graceful error handling
