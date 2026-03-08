# Monitoring System - Usage Guide

Guía práctica para usar el sistema de monitoreo en KhipuVault.

## Setup Inicial

### 1. Instalar Dependencias

El sistema ya usa las dependencias incluidas en Next.js. Solo necesitas instalar `web-vitals`:

```bash
pnpm add web-vitals
```

Para análisis de bundles (opcional):

```bash
pnpm add -D @next/bundle-analyzer
```

### 2. Configurar en App Router

Opción recomendada con `MonitoringProvider`:

```typescript
// apps/web/src/app/layout.tsx
'use client';

import { MonitoringProvider, PerformanceDebugPanel } from '@/lib/monitoring';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <MonitoringProvider>
          {children}
          {/* Panel de debug - solo en development */}
          <PerformanceDebugPanel />
        </MonitoringProvider>
      </body>
    </html>
  );
}
```

## Casos de Uso Comunes

### Monitorear Transacciones Web3

```typescript
// hooks/web3/use-deposit.ts
"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { trackTransactionStart, trackTransactionEnd, logger } from "@/lib/monitoring";

export function useDeposit() {
  const [txId, setTxId] = useState<string>();
  const { writeContract, data: hash } = useWriteContract();

  const deposit = (amount: bigint) => {
    // Iniciar tracking
    const id = trackTransactionStart("deposit", {
      amount: amount.toString(),
    });
    setTxId(id);

    writeContract({
      address: POOL_ADDRESS,
      abi: POOL_ABI,
      functionName: "deposit",
      args: [amount],
    });

    logger.info("Deposit initiated", { category: "transaction" });
  };

  useWaitForTransactionReceipt({
    hash,
    onSuccess: (receipt) => {
      if (txId) {
        trackTransactionEnd(txId, "success", {
          gasUsed: receipt.gasUsed,
          txHash: receipt.transactionHash,
        });
        logger.info("Deposit confirmed", { txHash: receipt.transactionHash });
      }
    },
    onError: (error) => {
      if (txId) {
        trackTransactionEnd(txId, "failed");
        logger.txError("Deposit failed", error, hash);
      }
    },
  });

  return { deposit };
}
```

### Debuggear Re-renders Innecesarios

```typescript
// components/expensive-component.tsx
'use client';

import { useRenderCount, useWhyDidYouRender } from '@/lib/monitoring';

function ExpensiveComponent({ userId, data, onUpdate }) {
  // Warn si renderiza más de 5 veces
  const renderCount = useRenderCount('ExpensiveComponent', 5);

  // En dev, loggea qué props cambiaron
  useWhyDidYouRender('ExpensiveComponent', { userId, data, onUpdate });

  return (
    <div>
      {/* Solo en dev, muestra el contador */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500">Renders: {renderCount}</div>
      )}
      {/* Component content */}
    </div>
  );
}
```

### Medir Performance de API Calls

```typescript
// hooks/api/use-pool-stats.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { performanceMonitor } from "@/lib/monitoring";
import { api } from "@/lib/api-client";

export function usePoolStats(poolAddress: string) {
  return useQuery({
    queryKey: ["poolStats", poolAddress],
    queryFn: async () => {
      // Medir automáticamente el tiempo
      return performanceMonitor.measureAsync("api:poolStats", async () => {
        return api.getPoolStats(poolAddress);
      });
    },
    staleTime: 60_000,
  });
}
```

### Tracking de Lifecycle de Componentes

```typescript
// components/dashboard/pool-card.tsx
'use client';

import { useComponentLifecycle, usePerformanceMark } from '@/lib/monitoring';

function PoolCard({ poolAddress }) {
  // Loggea mount, updates, y unmount con timing
  useComponentLifecycle('PoolCard');

  // Marca cuando cambia el pool
  usePerformanceMark('PoolCard:poolChanged', [poolAddress]);

  return <div>Pool: {poolAddress}</div>;
}
```

### Detectar Long-Running Effects

```typescript
// components/data-processor.tsx
'use client';

import { useLongRunningEffect } from '@/lib/monitoring';

function DataProcessor({ rawData }) {
  // Warn si el effect tarda más de 50ms
  useLongRunningEffect(
    'processData',
    () => {
      const processed = rawData.map(processItem);
      setState(processed);
    },
    [rawData],
    50 // threshold en ms
  );

  return <div>Processed data</div>;
}
```

### Monitorear Health Score de la App

```typescript
// components/dashboard/health-indicator.tsx
'use client';

import { useHealthScore } from '@/lib/monitoring';

export function HealthIndicator() {
  const score = useHealthScore();

  const getColor = () => {
    if (score > 80) return 'text-green-500';
    if (score > 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`font-bold ${getColor()}`}>
      Health: {score}/100
    </div>
  );
}
```

### Ver Métricas en Tiempo Real

```typescript
// app/dev/performance/page.tsx
'use client';

import { useMonitoring } from '@/lib/monitoring';

export default function PerformancePage() {
  const {
    webVitals,
    transactionMetrics,
    healthScore,
    refreshWebVitals,
  } = useMonitoring();

  return (
    <div className="p-6">
      <h1>Performance Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        {/* Web Vitals */}
        <div>
          <h2>Web Vitals</h2>
          <p>LCP: {webVitals?.LCP}ms ({webVitals?.ratings.LCP})</p>
          <p>INP: {webVitals?.INP}ms ({webVitals?.ratings.INP})</p>
          <p>CLS: {webVitals?.CLS} ({webVitals?.ratings.CLS})</p>
        </div>

        {/* Transactions */}
        <div>
          <h2>Transactions</h2>
          <p>Total: {transactionMetrics?.total}</p>
          <p>Success: {transactionMetrics?.successRate}%</p>
          <p>Pending: {transactionMetrics?.pending}</p>
        </div>
      </div>

      <button onClick={refreshWebVitals}>Refresh</button>
    </div>
  );
}
```

## Análisis de Performance

### 1. Identificar Long Tasks

```typescript
import { performanceObserver } from "@/lib/monitoring";

// En la consola del navegador o en un effect
const longTasks = performanceObserver.getLongTasks();
console.log("Long tasks (>50ms):", longTasks);

// Average duration
const avg = performanceObserver.getAverageLongTaskDuration();
console.log("Average long task:", avg, "ms");
```

### 2. Analizar Recursos Lentos

```typescript
import { performanceObserver } from "@/lib/monitoring";

const slowResources = performanceObserver.getSlowResources();
console.log("Slow resources (>1000ms):", slowResources);

// Cache hit rate
const cacheRate = performanceObserver.getCacheHitRate();
console.log("Cache hit rate:", cacheRate, "%");
```

### 3. Ver Timing de Navegación

```typescript
import { performanceObserver } from "@/lib/monitoring";

const navMetrics = performanceObserver.getNavigationMetrics();
if (navMetrics) {
  console.log("DNS lookup:", navMetrics.dns, "ms");
  console.log("TCP connection:", navMetrics.tcp, "ms");
  console.log("TTFB:", navMetrics.ttfb, "ms");
  console.log("DOM processing:", navMetrics.domProcessing, "ms");
}
```

### 4. Analizar Tamaño de Bundles

```typescript
import { checkBundleSize, BUNDLE_BUDGETS, logBundleAnalysis } from "@/lib/monitoring";

// Check individual bundles
const mainAnalysis = checkBundleSize("main", 280000, BUNDLE_BUDGETS.mainBundle);
const vendorAnalysis = checkBundleSize("vendor", 350000, BUNDLE_BUDGETS.vendorBundle);

// Log all analyses with colors
logBundleAnalysis([mainAnalysis, vendorAnalysis]);
```

## Testing

### Test de Hooks de Performance

```typescript
// __tests__/hooks/use-my-hook.test.ts
import { renderHook } from "@testing-library/react";
import { performanceMonitor } from "@/lib/monitoring";
import { useMyHook } from "../use-my-hook";

describe("useMyHook", () => {
  beforeEach(() => {
    performanceMonitor.clear();
  });

  it("should measure operation time", async () => {
    const { result } = renderHook(() => useMyHook());

    await result.current.expensiveOperation();

    const stats = performanceMonitor.getStats();
    expect(stats["myOperation"]).toBeDefined();
    expect(stats["myOperation"].count).toBe(1);
  });
});
```

### Test de Transaction Tracking

```typescript
// __tests__/hooks/use-deposit.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { clearTransactionMetrics, getTransactionMetrics } from "@/lib/monitoring";
import { useDeposit } from "../use-deposit";

describe("useDeposit", () => {
  beforeEach(() => {
    clearTransactionMetrics();
  });

  it("should track transaction", async () => {
    const { result } = renderHook(() => useDeposit());

    result.current.deposit(BigInt(100));

    await waitFor(() => {
      const metrics = getTransactionMetrics();
      expect(metrics.pending).toBeGreaterThan(0);
    });
  });
});
```

## Tips de Production

### 1. Configurar Analytics Endpoint

```bash
# .env.production
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://analytics.khipuvault.com/api/events
```

### 2. Limitar Logging en Production

El logger automáticamente oculta logs de debug/info en producción:

```typescript
import { logger } from "@/lib/monitoring";

// Solo se muestra en development
logger.debug("Debug info", { foo: "bar" });

// Se muestra en development y production
logger.error("Critical error", error);
```

### 3. Bundle Analysis

```bash
# Analizar bundles
ANALYZE=true pnpm build

# Se genera reporte en .next/analyze/
```

### 4. Monitoring Dashboard

Crear una ruta `/dev/performance` solo accesible en development:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/dev")) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
}
```

## Troubleshooting

### Web Vitals no se reportan

1. Verificar que `web-vitals` está instalado
2. Verificar que `initWebVitals()` se llama en client component
3. Revisar console para warnings

### Performance Observer no funciona

1. Verificar que el navegador soporta PerformanceObserver API
2. Revisar console para warnings de compatibilidad
3. Los datos solo se capturan después de `init()`

### Debug Panel no aparece

1. Solo aparece en `NODE_ENV=development`
2. Verificar que está dentro de `<MonitoringProvider>`

### Métricas no actualizan

1. Verificar `refreshInterval` en MonitoringProvider
2. Llamar manualmente a `refresh*()` functions
3. Revisar que los hooks están dentro del Provider

## Recursos

- [Web Vitals Documentation](https://web.dev/vitals/)
- [Performance Observer API](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance Profiler](https://react.dev/reference/react/Profiler)
