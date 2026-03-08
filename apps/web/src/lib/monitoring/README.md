# Performance Monitoring

Sistema integral de monitoreo de performance para KhipuVault.

## Características

- **Web Vitals**: Métricas Core Web Vitals (LCP, INP, CLS, FCP, TTFB)
- **Performance Observer**: Monitoreo de long tasks, recursos, y navegación
- **React Performance Hooks**: Hooks especializados para debugging de renders
- **Transaction Metrics**: Tracking de transacciones blockchain
- **Bundle Analysis**: Análisis y presupuestos de tamaño de bundles
- **Monitoring Provider**: Context API para acceso a métricas en toda la app
- **Logger**: Sistema de logging estructurado

## Quick Start

### Opción 1: Con MonitoringProvider (Recomendado)

```typescript
// app/layout.tsx
'use client';

import { MonitoringProvider, PerformanceDebugPanel } from '@/lib/monitoring';

export default function RootLayout({ children }) {
  return (
    <MonitoringProvider>
      {children}
      <PerformanceDebugPanel /> {/* Dev only */}
    </MonitoringProvider>
  );
}
```

### Opción 2: Inicialización Manual

```typescript
// app/layout.tsx
'use client';

import { useEffect } from 'react';
import { initWebVitals, performanceObserver } from '@/lib/monitoring';

export default function RootLayout({ children }) {
  useEffect(() => {
    initWebVitals();
    performanceObserver.init();
  }, []);

  return <>{children}</>;
}
```

## Módulos

### 1. Web Vitals (`web-vitals.ts`)

Captura Core Web Vitals automáticamente.

**Uso:**

```typescript
import { initWebVitals, getWebVitalsReport } from "@/lib/monitoring";

// En el punto de entrada de tu app (app/layout.tsx)
export default function RootLayout() {
  useEffect(() => {
    initWebVitals();
  }, []);
}

// Para obtener el reporte
const report = getWebVitalsReport();
console.log(report);
// { CLS: 0.05, FCP: 1200, INP: 150, LCP: 2100, TTFB: 500, ... }
```

**Métricas capturadas:**

- LCP (Largest Contentful Paint) - Loading performance
- INP (Interaction to Next Paint) - Responsiveness
- CLS (Cumulative Layout Shift) - Visual stability
- FCP (First Contentful Paint) - Initial render
- TTFB (Time to First Byte) - Server response

### 2. Transaction Metrics (`transaction-metrics.ts`)

Rastrea métricas de transacciones blockchain.

**Uso en hooks:**

```typescript
import { trackTransactionStart, trackTransactionEnd, transactionMetrics } from "@/lib/monitoring";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

export function useDeposit() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const [txId, setTxId] = useState<string>();

  const deposit = (amount: bigint) => {
    // Iniciar tracking
    const id = trackTransactionStart("deposit", { amount: amount.toString() });
    setTxId(id);

    writeContract({
      address: POOL_ADDRESS,
      abi: POOL_ABI,
      functionName: "deposit",
      args: [amount],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    onSuccess: (receipt) => {
      if (txId) {
        trackTransactionEnd(txId, "success", {
          gasUsed: receipt.gasUsed,
          txHash: receipt.transactionHash,
        });
      }
    },
    onError: (error) => {
      if (txId) {
        trackTransactionEnd(txId, "failed", { error });
      }
    },
  });

  return { deposit, isPending, isConfirming, isSuccess };
}
```

**Ver métricas:**

```typescript
import { transactionMetrics } from "@/lib/monitoring";

// Ver reporte completo
const report = transactionMetrics.getMetrics();
console.log(`Success Rate: ${report.successRate}%`);
console.log(`Avg Time: ${report.avgTime}ms`);
console.log(`Avg Gas: ${report.avgGasUsed}`);

// Ver por tipo
const depositStats = transactionMetrics.getByType("deposit");
console.log(depositStats);

// Ver transacciones pendientes
const pending = transactionMetrics.getPending();

// Ver transacciones recientes
const recent = transactionMetrics.getRecent(5);

// Log en consola (dev only)
transactionMetrics.logSummary();
```

### 3. Performance Marks (`performance.ts`)

Medir operaciones personalizadas.

**Uso:**

```typescript
import { performanceMonitor, PerfMarks } from "@/lib/monitoring";

// Usar marks predefinidos
performanceMonitor.startMark(PerfMarks.FETCH_POOL_INFO);
const poolInfo = await fetchPoolInfo();
performanceMonitor.endMark(PerfMarks.FETCH_POOL_INFO);

// Medir operaciones async
const result = await performanceMonitor.measureAsync("fetch:userBalances", async () => {
  return await Promise.all([fetchBalance1(), fetchBalance2()]);
});

// RPC calls específicamente
const data = await performanceMonitor.timeRPC("getUserDeposit", async () => {
  return await publicClient.readContract({
    address: POOL_ADDRESS,
    abi: POOL_ABI,
    functionName: "getUserDeposit",
    args: [userAddress],
  });
});

// Ver estadísticas agregadas
const avgDuration = performanceMonitor.getAverageDuration("fetch:poolInfo");
const p95 = performanceMonitor.getP95Duration("fetch:poolInfo");

// Ver todas las stats (dev only)
performanceMonitor.logStats();
```

**Marks predefinidos:**

- `PerfMarks.RPC_READ_CONTRACT` - Lecturas de contratos
- `PerfMarks.RPC_WRITE_CONTRACT` - Escrituras de contratos
- `PerfMarks.RPC_WAIT_TX` - Espera de transacciones
- `PerfMarks.PAGE_LOAD` - Carga de páginas
- `PerfMarks.FETCH_POOL_INFO` - Fetch de pool info
- `PerfMarks.FETCH_USER_DATA` - Fetch de user data
- `PerfMarks.WALLET_CONNECT` - Conexión de wallet

### 4. Performance Observer (`performance-observer.ts`)

Monitoreo avanzado del navegador.

**Uso:**

```typescript
import { performanceObserver } from "@/lib/monitoring";

// Inicializar (se hace automático con MonitoringProvider)
performanceObserver.init();

// Obtener long tasks (>50ms que causan jank)
const longTasks = performanceObserver.getLongTasks();
const avgLongTask = performanceObserver.getAverageLongTaskDuration();

// Obtener timings de recursos
const slowResources = performanceObserver.getSlowResources();
const totalSize = performanceObserver.getTotalResourceSize();
const cacheRate = performanceObserver.getCacheHitRate();

// Obtener métricas de navegación
const navMetrics = performanceObserver.getNavigationMetrics();
// { dns: 45, tcp: 23, request: 120, response: 89, ... }

// Reporte completo
const summary = performanceObserver.getSummaryReport();
performanceObserver.logSummary(); // Log to console (dev only)
```

### 5. React Performance Hooks (`hooks.ts`)

Hooks para debugging de performance en React.

**Hooks disponibles:**

```typescript
import {
  useRenderCount,
  usePerformanceMark,
  useMeasure,
  useWhyDidYouRender,
  useComponentLifecycle,
  useAsyncPerformance,
  useLongRunningEffect,
} from '@/lib/monitoring';

// Track renders
const renderCount = useRenderCount('MyComponent', 10); // Warn at 10+

// Auto performance marks
usePerformanceMark('MyComponent:mount');
usePerformanceMark('MyComponent:dataLoad', [userId]);

// Measure operations
const { start, end, duration } = useMeasure('fetchData');

// Debug re-renders (dev only)
useWhyDidYouRender('MyComponent', { userId, data, onUpdate });

// Track full lifecycle
useComponentLifecycle('MyComponent');

// Measure async functions
const fetchUser = useAsyncPerformance('fetchUser', async (id) => { ... });

// Detect slow effects (>50ms)
useLongRunningEffect('processData', () => { ... }, [data], 50);
```

Ver [EXAMPLES.md](./EXAMPLES.md#11-react-performance-hooks) para ejemplos detallados.

### 6. Bundle Analysis (`bundle-config.ts`)

Configuración de presupuestos y análisis de bundles.

**Presupuestos:**

```typescript
import { BUNDLE_BUDGETS, PERFORMANCE_THRESHOLDS } from "@/lib/monitoring";

// Budgets en KB
BUNDLE_BUDGETS.mainBundle; // 250 KB
BUNDLE_BUDGETS.vendorBundle; // 350 KB
BUNDLE_BUDGETS.pageChunk; // 150 KB
BUNDLE_BUDGETS.initialLoad; // 600 KB total

// Performance thresholds
PERFORMANCE_THRESHOLDS.initialLoad; // 3000ms
PERFORMANCE_THRESHOLDS.maxLongTasks; // 5
```

**Análisis:**

```typescript
import { checkBundleSize, formatBytes, logBundleAnalysis } from "@/lib/monitoring";

const analysis = checkBundleSize("mainBundle", 280000, BUNDLE_BUDGETS.mainBundle);
// { name, size, budget, percentage, level, message }

const size = formatBytes(1500000); // "1.43 MB"

logBundleAnalysis([analysis1, analysis2]); // Colored console output
```

### 7. Monitoring Provider (`provider.tsx`)

React Context para acceso a métricas.

**Setup:**

```typescript
import { MonitoringProvider, PerformanceDebugPanel } from '@/lib/monitoring';

<MonitoringProvider
  enableWebVitals={true}
  enablePerformanceObserver={true}
  refreshInterval={30000}
>
  <App />
  <PerformanceDebugPanel /> {/* Dev only */}
</MonitoringProvider>
```

**Hooks:**

```typescript
import {
  useMonitoring,
  useWebVitals,
  useTransactionMetrics,
  useHealthScore,
  usePerformanceStats,
} from "@/lib/monitoring";

// Acceso completo
const { webVitals, transactionMetrics, healthScore } = useMonitoring();

// Hooks individuales
const vitals = useWebVitals();
const txMetrics = useTransactionMetrics();
const score = useHealthScore(); // 0-100
const stats = usePerformanceStats();
```

### 8. Logger (`logger.ts`)

Sistema de logging estructurado.

**Uso:**

```typescript
import { logger } from '@/lib/monitoring';

// Logs básicos
logger.debug('Debug message', { metadata: { foo: 'bar' } });
logger.info('Info message', { category: 'ui' });
logger.warn('Warning message', { source: 'MyComponent' });

// Error logging
logger.error('Error occurred', error, {
  category: 'contract',
  source: 'useDeposit',
});

// Helpers específicos
logger.txError('Transaction failed', error, txHash);
logger.contractError('Contract call failed', error, { address, function });
logger.walletError('Wallet connection failed', error, address);
logger.apiError('API request failed', error, { endpoint, status });
logger.uiError('Component render failed', error, 'MyComponent');
```

## Integración Completa

### Setup Básico

**`app/layout.tsx` (Opción 1 - Con Provider):**

```typescript
'use client';

import { MonitoringProvider, PerformanceDebugPanel } from '@/lib/monitoring';

export default function RootLayout({ children }) {
  return (
    <MonitoringProvider
      enableWebVitals={true}
      enablePerformanceObserver={true}
      refreshInterval={30000}
    >
      {children}
      {/* Debug panel - solo se muestra en development */}
      <PerformanceDebugPanel />
    </MonitoringProvider>
  );
}
```

**`app/layout.tsx` (Opción 2 - Manual):**

```typescript
'use client';

import { useEffect } from 'react';
import { initWebVitals, performanceObserver } from '@/lib/monitoring';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Inicializar tracking
    initWebVitals();
    performanceObserver.init();
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### Uso en Componentes

```typescript
'use client';

import {
  useMonitoring,
  useRenderCount,
  usePerformanceMark,
  performanceMonitor,
} from '@/lib/monitoring';

function MyComponent({ userId }: { userId: string }) {
  const { healthScore } = useMonitoring();
  const renderCount = useRenderCount('MyComponent', 10);

  usePerformanceMark('MyComponent:mount');
  usePerformanceMark('MyComponent:userChanged', [userId]);

  return (
    <div>
      <p>Health: {healthScore}/100</p>
      <p>Renders: {renderCount}</p>
    </div>
  );
}
```

## Tipos

```typescript
// Transaction types
type TransactionType =
  | "deposit"
  | "withdraw"
  | "approve"
  | "claim"
  | "create_pool"
  | "join_pool"
  | "leave_pool"
  | "buy_tickets"
  | "stake"
  | "unstake"
  | "borrow"
  | "repay"
  | "other";

// Log categories
type LogCategory =
  | "transaction"
  | "wallet"
  | "contract"
  | "api"
  | "ui"
  | "auth"
  | "validation"
  | "general";
```

## Production

En producción:

- Web Vitals se envían al endpoint de analytics configurado
- Logs de error/warn se mantienen
- Logs de debug/info se ocultan
- Métricas se pueden enviar a servicios externos

Configure `NEXT_PUBLIC_ANALYTICS_ENDPOINT` en `.env`:

```bash
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://analytics.example.com/api/events
```

## Desarrollo

En desarrollo:

- Todos los logs se muestran en consola con colores
- Web Vitals se loggean automáticamente
- Use `performanceMonitor.logStats()` para ver estadísticas
- Use `transactionMetrics.logSummary()` para ver resumen de transacciones
