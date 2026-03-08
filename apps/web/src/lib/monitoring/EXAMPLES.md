# Performance Monitoring - Ejemplos de Implementación

## 1. Integrar Monitoring Provider en la App

**`app/layout.tsx` (Recommended - Full Featured):**

```typescript
'use client';

import { MonitoringProvider, PerformanceDebugPanel } from '@/lib/monitoring';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <MonitoringProvider
          enableWebVitals={true}
          enablePerformanceObserver={true}
          refreshInterval={30000}
        >
          {children}
          {/* Only shown in development */}
          <PerformanceDebugPanel />
        </MonitoringProvider>
      </body>
    </html>
  );
}
```

**`app/layout.tsx` (Alternative - Manual Setup):**

```typescript
'use client';

import { useEffect } from 'react';
import { initWebVitals, performanceObserver } from '@/lib/monitoring';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Inicializar Web Vitals y Performance Observer
  useEffect(() => {
    void initWebVitals();
    performanceObserver.init();
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## 2. Hook de Transacción con Tracking

**`hooks/web3/individual/use-deposit-with-tracking.ts`:**

```typescript
"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  trackTransactionStart,
  trackTransactionEnd,
  trackTransactionCancel,
  logger,
} from "@/lib/monitoring";
import { INDIVIDUAL_POOL_ABI, INDIVIDUAL_POOL_ADDRESS } from "@khipu/web3";
import type { TransactionType } from "@/lib/monitoring";

export function useDepositWithTracking() {
  const [txId, setTxId] = useState<string | null>(null);
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const deposit = (amount: bigint) => {
    try {
      // Iniciar tracking
      const id = trackTransactionStart("deposit", {
        amount: amount.toString(),
        pool: INDIVIDUAL_POOL_ADDRESS,
      });
      setTxId(id);

      writeContract({
        address: INDIVIDUAL_POOL_ADDRESS,
        abi: INDIVIDUAL_POOL_ABI,
        functionName: "deposit",
        args: [amount],
      });

      logger.info("Deposit transaction initiated", {
        category: "transaction",
        metadata: { amount: amount.toString(), txId: id },
      });
    } catch (err) {
      logger.error("Failed to initiate deposit", err, {
        category: "transaction",
        source: "useDepositWithTracking",
      });
      throw err;
    }
  };

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    onSuccess: (receipt) => {
      if (txId) {
        trackTransactionEnd(txId, "success", {
          gasUsed: receipt.gasUsed,
          txHash: receipt.transactionHash,
        });

        logger.info("Deposit transaction confirmed", {
          category: "transaction",
          txHash: receipt.transactionHash,
          metadata: {
            gasUsed: receipt.gasUsed.toString(),
            blockNumber: receipt.blockNumber.toString(),
          },
        });
      }
    },
    onError: (err) => {
      if (txId) {
        trackTransactionEnd(txId, "failed", {
          error: err,
          txHash: hash,
        });

        logger.txError("Deposit transaction failed", err, hash);
      }
    },
  });

  // Handle user rejection
  if (error && txId) {
    trackTransactionCancel(txId);
    logger.warn("Deposit transaction rejected by user", {
      category: "transaction",
      metadata: { error: error.message },
    });
  }

  return {
    deposit,
    isPending,
    isConfirming,
    isSuccess,
    error: error || receiptError,
    hash,
  };
}
```

## 3. Medir Performance de Operaciones RPC

**`hooks/web3/individual/use-pool-stats.ts`:**

```typescript
"use client";

import { useReadContract } from "wagmi";
import { performanceMonitor, PerfMarks } from "@/lib/monitoring";
import { INDIVIDUAL_POOL_ABI, INDIVIDUAL_POOL_ADDRESS } from "@khipu/web3";

export function usePoolStats() {
  const { data, isLoading, error } = useReadContract({
    address: INDIVIDUAL_POOL_ADDRESS,
    abi: INDIVIDUAL_POOL_ABI,
    functionName: "getPoolStats",
    query: {
      // Medir el tiempo de la llamada RPC
      queryFn: async (context) => {
        return await performanceMonitor.timeRPC("getPoolStats", async () => {
          return context.queryFn(context);
        });
      },
    },
  });

  return { data, isLoading, error };
}
```

## 4. Tracking de Navegación

**`components/layout/dashboard-nav.tsx`:**

```typescript
'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { analytics, AnalyticsEvents } from '@/lib/monitoring';

export function DashboardNav() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page views
    analytics.track(AnalyticsEvents.PAGE_VIEW, {
      page: pathname,
      timestamp: Date.now(),
    });
  }, [pathname]);

  return (
    <nav>
      {/* Navigation content */}
    </nav>
  );
}
```

## 5. Component con Performance Marks

**`features/individual-savings/components/pool-statistics.tsx`:**

```typescript
'use client';

import { useEffect } from 'react';
import { performanceMonitor } from '@/lib/monitoring';
import { usePoolStats } from '@/hooks/web3/individual/use-pool-stats';

export function PoolStatistics() {
  useEffect(() => {
    performanceMonitor.startMark('component:poolStats:mount');

    return () => {
      performanceMonitor.endMark('component:poolStats:mount');
    };
  }, []);

  const { data, isLoading } = usePoolStats();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Pool statistics cards */}
    </div>
  );
}
```

## 6. Error Boundary con Logger

**`components/error-boundary.tsx`:**

```typescript
'use client';

import { Component, type ReactNode } from 'react';
import { logger } from '@/lib/monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.uiError('Error boundary caught error', error, this.constructor.name);

    logger.error('Component stack trace', error, {
      category: 'ui',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-fallback">
            <h2>Something went wrong</h2>
            <button onClick={() => this.setState({ hasError: false })}>
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

## 7. Hook con Timing Async

**`hooks/api/use-analytics-data.ts`:**

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { performanceMonitor } from "@/lib/monitoring";
import { api } from "@/lib/api-client";

export function useAnalyticsData(poolAddress: string) {
  return useQuery({
    queryKey: ["analytics", poolAddress],
    queryFn: async () => {
      return await performanceMonitor.measureAsync("fetch:analytics", async () => {
        return await api.getPoolAnalytics(poolAddress);
      });
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
```

## 8. Dashboard de Métricas (Dev Tool)

**`app/dev/metrics/page.tsx`:**

```typescript
'use client';

import { useEffect, useState } from 'react';
import {
  getWebVitalsReport,
  transactionMetrics,
  performanceMonitor,
  type TransactionMetricsReport,
  type WebVitalsReport,
} from '@/lib/monitoring';
import { Card, CardContent, CardHeader, CardTitle } from '@khipu/ui/components/card';

export default function MetricsPage() {
  const [webVitals, setWebVitals] = useState<WebVitalsReport | null>(null);
  const [txMetrics, setTxMetrics] = useState<TransactionMetricsReport | null>(null);

  useEffect(() => {
    // Actualizar métricas cada 5 segundos
    const interval = setInterval(() => {
      setWebVitals(getWebVitalsReport());
      setTxMetrics(transactionMetrics.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Performance Metrics Dashboard</h1>

      {/* Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard
              name="LCP"
              value={webVitals?.LCP}
              rating={webVitals?.ratings.LCP}
              unit="ms"
            />
            <MetricCard
              name="INP"
              value={webVitals?.INP}
              rating={webVitals?.ratings.INP}
              unit="ms"
            />
            <MetricCard
              name="CLS"
              value={webVitals?.CLS}
              rating={webVitals?.ratings.CLS}
            />
            <MetricCard
              name="FCP"
              value={webVitals?.FCP}
              rating={webVitals?.ratings.FCP}
              unit="ms"
            />
            <MetricCard
              name="TTFB"
              value={webVitals?.TTFB}
              rating={webVitals?.ratings.TTFB}
              unit="ms"
            />
          </div>
        </CardContent>
      </Card>

      {/* Transaction Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{txMetrics?.total || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {txMetrics?.successRate.toFixed(1) || 0}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Time</p>
              <p className="text-2xl font-bold">
                {txMetrics?.avgTime.toFixed(0) || 0}ms
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {txMetrics?.pending || 0}
              </p>
            </div>
          </div>

          {/* By Type */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">By Transaction Type</h3>
            <div className="space-y-2">
              {txMetrics &&
                Object.entries(txMetrics.byType)
                  .filter(([, stats]) => stats.total > 0)
                  .map(([type, stats]) => (
                    <div
                      key={type}
                      className="flex justify-between items-center p-2 bg-muted rounded"
                    >
                      <span className="font-medium capitalize">
                        {type.replace('_', ' ')}
                      </span>
                      <div className="flex gap-4 text-sm">
                        <span>Total: {stats.total}</span>
                        <span className="text-green-600">
                          Success: {stats.successful}
                        </span>
                        <span className="text-red-600">Failed: {stats.failed}</span>
                        <span>{stats.avgTime.toFixed(0)}ms</span>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <button
            onClick={() => performanceMonitor.logStats()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Log Stats to Console
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  name,
  value,
  rating,
  unit,
}: {
  name: string;
  value?: number | null;
  rating?: string | null;
  unit?: string;
}) {
  const color =
    rating === 'good'
      ? 'text-green-600'
      : rating === 'needs-improvement'
        ? 'text-yellow-600'
        : 'text-red-600';

  return (
    <div className="p-4 border rounded-lg">
      <p className="text-sm text-muted-foreground">{name}</p>
      <p className={`text-2xl font-bold ${color}`}>
        {value !== null && value !== undefined
          ? `${value.toFixed(name === 'CLS' ? 3 : 0)}${unit || ''}`
          : 'N/A'}
      </p>
      <p className="text-xs capitalize">{rating || 'pending'}</p>
    </div>
  );
}
```

## 9. Testing con Metrics

**`hooks/web3/__tests__/use-deposit-with-tracking.test.ts`:**

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { clearTransactionMetrics, getTransactionMetrics } from "@/lib/monitoring";
import { useDepositWithTracking } from "../individual/use-deposit-with-tracking";

describe("useDepositWithTracking", () => {
  beforeEach(() => {
    clearTransactionMetrics();
  });

  it("tracks transaction lifecycle", async () => {
    const { result } = renderHook(() => useDepositWithTracking());

    // Inicio - debería estar vacío
    let metrics = getTransactionMetrics();
    expect(metrics.pending).toBe(0);

    // Ejecutar depósito
    result.current.deposit(BigInt(100));

    // Debería tener una transacción pendiente
    await waitFor(() => {
      metrics = getTransactionMetrics();
      expect(metrics.pending).toBe(1);
    });

    // Simular éxito
    await waitFor(() => {
      metrics = getTransactionMetrics();
      expect(metrics.successful).toBe(1);
      expect(metrics.pending).toBe(0);
      expect(metrics.successRate).toBe(100);
    });
  });
});
```

## 10. Custom Performance Hook

**`hooks/use-measure-render.ts`:**

```typescript
"use client";

import { useEffect, useRef } from "react";
import { performanceMonitor } from "@/lib/monitoring";

export function useMeasureRender(componentName: string) {
  const mountTime = useRef<number>(0);

  useEffect(() => {
    const markName = `component:${componentName}:mount`;
    performanceMonitor.startMark(markName);
    mountTime.current = Date.now();

    return () => {
      performanceMonitor.endMark(markName);
    };
  }, [componentName]);

  const measureRender = (operationName: string) => {
    const markName = `component:${componentName}:${operationName}`;
    performanceMonitor.startMark(markName);

    return () => {
      performanceMonitor.endMark(markName);
    };
  };

  return { measureRender };
}

// Uso:
// const { measureRender } = useMeasureRender('PoolStatistics');
//
// const handleClick = () => {
//   const done = measureRender('handleClick');
//   // ... do work
//   done();
// };
```

## 11. React Performance Hooks

### useRenderCount - Track Component Renders

```typescript
'use client';

import { useRenderCount } from '@/lib/monitoring';

function MyComponent({ userId }: { userId: string }) {
  // Warns if component renders more than 10 times
  const renderCount = useRenderCount('MyComponent', 10);

  return (
    <div>
      Rendered {renderCount} times
      {renderCount > 10 && <span className="text-red-500">Too many renders!</span>}
    </div>
  );
}
```

### usePerformanceMark - Automatic Performance Marks

```typescript
'use client';

import { usePerformanceMark } from '@/lib/monitoring';

function DataComponent({ userId }: { userId: string }) {
  // Creates mark on mount
  usePerformanceMark('DataComponent:mount');

  // Creates new mark when userId changes
  usePerformanceMark('DataComponent:userChanged', [userId]);

  return <div>User: {userId}</div>;
}
```

### useMeasure - Measure Operations

```typescript
'use client';

import { useMeasure } from '@/lib/monitoring';
import { useState } from 'react';

function DataFetcher() {
  const { start, end, duration } = useMeasure('fetchUserData');
  const [data, setData] = useState(null);

  const fetchData = async () => {
    start();
    const response = await fetch('/api/user');
    const json = await response.json();
    setData(json);
    end();
  };

  return (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
      {duration && <p>Last fetch took {duration.toFixed(0)}ms</p>}
    </div>
  );
}
```

### useWhyDidYouRender - Debug Re-renders

```typescript
'use client';

import { useWhyDidYouRender } from '@/lib/monitoring';

function ExpensiveComponent({
  userId,
  data,
  onUpdate
}: {
  userId: string;
  data: unknown;
  onUpdate: () => void;
}) {
  // In development, logs which props changed
  useWhyDidYouRender('ExpensiveComponent', { userId, data, onUpdate });

  return <div>Content</div>;
}
```

### useComponentLifecycle - Track Full Lifecycle

```typescript
'use client';

import { useComponentLifecycle } from '@/lib/monitoring';

function TrackedComponent() {
  // Logs mount, updates, and unmount with timing
  useComponentLifecycle('TrackedComponent');

  return <div>This component is fully tracked</div>;
}
```

### useAsyncPerformance - Measure Async Functions

```typescript
'use client';

import { useAsyncPerformance } from '@/lib/monitoring';

function DataComponent() {
  const fetchUser = useAsyncPerformance('fetchUser', async (id: string) => {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  });

  return (
    <button onClick={() => fetchUser('123')}>
      Load User (automatically measured)
    </button>
  );
}
```

### useLongRunningEffect - Detect Slow Effects

```typescript
'use client';

import { useLongRunningEffect } from '@/lib/monitoring';

function DataProcessor({ data }: { data: unknown[] }) {
  // Warns if effect takes longer than 50ms
  useLongRunningEffect('processData', () => {
    // Expensive computation
    const processed = data.map(processItem);
    updateState(processed);
  }, [data], 50);

  return <div>Processed data</div>;
}
```

## 12. Performance Observer - Advanced Monitoring

```typescript
'use client';

import { performanceObserver } from '@/lib/monitoring';
import { useEffect } from 'react';

function PerformanceAnalyzer() {
  useEffect(() => {
    // Get long tasks (>50ms)
    const longTasks = performanceObserver.getLongTasks();
    console.log('Long tasks:', longTasks);

    // Get slow resources (>1000ms)
    const slowResources = performanceObserver.getSlowResources();
    console.log('Slow resources:', slowResources);

    // Get navigation metrics
    const navMetrics = performanceObserver.getNavigationMetrics();
    console.log('Navigation:', navMetrics);

    // Get full summary
    const summary = performanceObserver.getSummaryReport();
    console.log('Summary:', summary);

    // Log to console (dev only)
    performanceObserver.logSummary();
  }, []);

  return <div>Check console for performance data</div>;
}
```

## 13. Bundle Analysis - Monitor Bundle Sizes

```typescript
import { checkBundleSize, BUNDLE_BUDGETS, formatBytes, logBundleAnalysis } from "@/lib/monitoring";

// Check if bundle is within budget
const analysis = checkBundleSize("mainBundle", 280000, BUNDLE_BUDGETS.mainBundle);
console.log(analysis);
// {
//   name: 'mainBundle',
//   size: 280000,
//   budget: 250000,
//   percentage: 112,
//   level: 'critical',
//   message: 'Bundle size exceeds budget by 12%'
// }

// Format bytes for display
const size = formatBytes(1500000); // "1.43 MB"

// Log multiple bundle analyses
const analyses = [
  checkBundleSize("main", 280000, BUNDLE_BUDGETS.mainBundle),
  checkBundleSize("vendor", 300000, BUNDLE_BUDGETS.vendorBundle),
  checkBundleSize("page", 120000, BUNDLE_BUDGETS.pageChunk),
];
logBundleAnalysis(analyses);
```

## 14. Using Monitoring Context

```typescript
'use client';

import {
  useMonitoring,
  useWebVitals,
  useTransactionMetrics,
  useHealthScore,
} from '@/lib/monitoring';

function PerformanceDashboard() {
  // Get all monitoring data
  const {
    webVitals,
    transactionMetrics,
    healthScore,
    refreshWebVitals,
    refreshTransactionMetrics,
  } = useMonitoring();

  return (
    <div>
      <h2>Health Score: {healthScore}/100</h2>

      <div>
        <h3>Web Vitals</h3>
        <p>LCP: {webVitals?.LCP}ms ({webVitals?.ratings.LCP})</p>
        <p>INP: {webVitals?.INP}ms ({webVitals?.ratings.INP})</p>
        <p>CLS: {webVitals?.CLS} ({webVitals?.ratings.CLS})</p>
      </div>

      <div>
        <h3>Transactions</h3>
        <p>Total: {transactionMetrics?.total}</p>
        <p>Success Rate: {transactionMetrics?.successRate}%</p>
        <p>Pending: {transactionMetrics?.pending}</p>
      </div>

      <button onClick={refreshWebVitals}>Refresh Vitals</button>
      <button onClick={refreshTransactionMetrics}>Refresh Transactions</button>
    </div>
  );
}

// Or use individual hooks
function HealthBadge() {
  const score = useHealthScore();
  return (
    <span className={score > 80 ? 'text-green-500' : 'text-red-500'}>
      {score}/100
    </span>
  );
}
```

## 15. Next.js Bundle Analyzer Integration

**`next.config.js`:**

```javascript
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Import bundle config
      const { NEXT_BUNDLE_OPTIMIZATIONS } = require("./src/lib/monitoring");

      // Apply modular imports
      config.resolve.alias = {
        ...config.resolve.alias,
        ...NEXT_BUNDLE_OPTIMIZATIONS.modularizeImports,
      };
    }
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
```

**Run analysis:**

```bash
ANALYZE=true pnpm build
```
