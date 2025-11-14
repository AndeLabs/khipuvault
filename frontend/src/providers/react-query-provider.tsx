'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * React Query Provider with optimized configuration for KhipuVault
 *
 * This provider configures caching, refetching, and retry behavior
 * to minimize unnecessary network requests while keeping data fresh.
 *
 * Key optimizations:
 * - staleTime: 5 minutes - data is considered fresh for 5 minutes
 * - gcTime: 30 minutes - unused data is garbage collected after 30 minutes
 * - refetchOnWindowFocus: false - prevents refetch when user switches tabs
 * - refetchOnMount: false - prevents refetch on component remount if data is fresh
 * - retry: 1 - only retry failed queries once
 */
export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data remains fresh for 5 minutes
            staleTime: 1000 * 60 * 5,

            // Unused data is garbage collected after 30 minutes
            gcTime: 1000 * 60 * 30,

            // Don't refetch on window focus (performance optimization)
            refetchOnWindowFocus: false,

            // Don't refetch on component mount if data is fresh
            refetchOnMount: false,

            // Only retry failed queries once
            retry: 1,

            // Retry delay increases exponentially: 1s, 2s, 4s...
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
