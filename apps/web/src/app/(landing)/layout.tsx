"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

/**
 * Landing Layout - React Query Only
 *
 * Provides QueryClientProvider for blockchain data fetching
 * without WagmiProvider (no wallet connectivity).
 *
 * This allows landing pages to:
 * - Fetch protocol stats (TVL, APY)
 * - Show real blockchain data
 * - Avoid wallet extension conflicts
 */

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
        gcTime: 5 * 60 * 1000,
      },
    },
  });
}

export default function LandingLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
