# Quick Wins - Mejoras Rápidas de Performance para KhipuVault

## 🚀 Implementaciones Inmediatas (< 1 hora cada una)

### 1. Instalar Vercel Speed Insights (5 minutos)

```bash
cd frontend
npm install @vercel/speed-insights
```

**Editar `frontend/src/app/layout.tsx`:**
```typescript
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="dark">
      <body className="font-body antialiased">
        <Web3ErrorBoundary>
          <Web3Provider theme="dark">
            <NetworkSwitcher />
            {children}
            <Toaster />
            <SpeedInsights /> {/* ← Añadir esta línea */}
          </Web3Provider>
        </Web3ErrorBoundary>
      </body>
    </html>
  );
}
```

**Resultado**: Monitoreo en tiempo real de Core Web Vitals ✅

---

### 2. Optimizar Carga de Fuentes (10 minutos)

**Editar `frontend/src/app/layout.tsx`:**

**ANTES (actual - LENTO):**
```typescript
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@700&display=swap" rel="stylesheet" />
</head>
```

**DESPUÉS (optimizado - RÁPIDO):**
```typescript
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  weight: '700',
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`dark ${inter.variable} ${robotoMono.variable}`}
    >
      {/* Eliminar <head> con links de Google Fonts */}
      <body className={`${inter.className} antialiased`}>
        {/* ... resto del código */}
      </body>
    </html>
  );
}
```

**Actualizar `tailwind.config.ts`:**
```typescript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-roboto-mono)', 'monospace'],
      },
    },
  },
};
```

**Resultado**:
- Mejora CLS (Cumulative Layout Shift)
- Fonts cargadas automáticamente por Next.js
- Elimina FOUT (Flash of Unstyled Text) ✅

---

### 3. Fix Critical: Deshabilitar `revalidate = 0` (2 minutos)

**Editar `frontend/src/app/layout.tsx`:**

**ANTES (línea 7):**
```typescript
export const revalidate = 0  // ❌ MALO
```

**DESPUÉS:**
```typescript
export const revalidate = 3600  // ✅ BUENO: Cache por 1 hora
```

**Resultado**: Habilita caching de Next.js, reduce carga del servidor ✅

---

### 4. Lazy Load de Componentes Pesados (15 minutos)

**Crear `frontend/src/app/dashboard/cooperative-savings/page.tsx` optimizado:**

```typescript
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load de componentes pesados
const PoolsList = dynamic(
  () => import('@/components/dashboard/cooperative-savings/pools-list'),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />,
    ssr: false,
  }
);

const RealtimeAnalytics = dynamic(
  () => import('@/components/dashboard/cooperative-savings/realtime-analytics-dashboard'),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />,
    ssr: false,
  }
);

export default function CooperativeSavingsPage() {
  return (
    <div>
      <h1>Ahorros Cooperativos</h1>

      <Suspense fallback={<div>Cargando pools...</div>}>
        <PoolsList />
      </Suspense>

      <Suspense fallback={<div>Cargando analytics...</div>}>
        <RealtimeAnalytics />
      </Suspense>
    </div>
  );
}
```

**Resultado**: Reducción del bundle inicial en ~30-40% ✅

---

### 5. Configurar React Query Provider (20 minutos)

**Crear `frontend/src/providers/react-query-provider.tsx`:**

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutos
            gcTime: 1000 * 60 * 30, // 30 minutos
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

**Actualizar `frontend/src/app/layout.tsx`:**

```typescript
import { ReactQueryProvider } from '@/providers/react-query-provider';

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="dark">
      <body className="font-body antialiased">
        <ReactQueryProvider>  {/* ← Añadir wrapper */}
          <Web3ErrorBoundary>
            <Web3Provider theme="dark">
              <NetworkSwitcher />
              {children}
              <Toaster />
            </Web3Provider>
          </Web3ErrorBoundary>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
```

**Resultado**: Caching automático de queries, menos requests al backend ✅

---

### 6. Optimizar next.config.ts (15 minutos)

**Editar `frontend/next.config.ts`:**

```typescript
import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ CAMBIO: Solo ignorar en dev
    ignoreDuringBuilds: process.env.NODE_ENV !== 'production',
  },

  // ✅ NUEVO: Remover console.log en producción
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // ✅ NUEVO: Optimizar imports
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      'lucide-react',
    ],
  },

  transpilePackages: [
    '@mezo-org/passport',
    '@mezo-org/orangekit',
    '@mezo-org/orangekit-smart-account',
    '@mezo-org/orangekit-contracts',
  ],

  webpack: (config, { isServer }) => {
    // ... configuración existente ...

    return config;
  },

  images: {
    formats: ['image/avif', 'image/webp'], // ✅ NUEVO: Formatos modernos
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
```

**Resultado**:
- Console.logs eliminados en producción
- Mejor tree-shaking
- Imágenes en formatos modernos (AVIF/WebP) ✅

---

### 7. Instalar Bundle Analyzer (10 minutos)

```bash
cd frontend
npm install @next/bundle-analyzer
```

**Crear `frontend/next.config.js` (temporal para analyzer):**

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = require('./next.config.ts');

module.exports = withBundleAnalyzer(nextConfig);
```

**Añadir script en `package.json`:**

```json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build"
  }
}
```

**Uso:**
```bash
npm run analyze
```

**Resultado**: Visualización de qué ocupa más espacio en tu bundle ✅

---

## 🎯 Mejoras de Componentes Específicos

### 8. Memorizar Componente de Lista de Pools (10 minutos)

**Editar `frontend/src/components/dashboard/cooperative-savings/pools-list.tsx`:**

```typescript
import { memo, useMemo, useCallback } from 'react';

// ✅ Memorizar el componente de cada pool individual
const PoolCard = memo(({ pool, onJoin }) => {
  const handleJoin = useCallback(() => {
    onJoin(pool.id);
  }, [onJoin, pool.id]);

  return (
    <div onClick={handleJoin}>
      {/* ... contenido del card ... */}
    </div>
  );
});

PoolCard.displayName = 'PoolCard';

// ✅ Memorizar el componente principal
export const PoolsList = memo(({ pools }) => {
  // Memorizar callback
  const handleJoinPool = useCallback((poolId: string) => {
    // Lógica para unirse al pool
    console.log('Joining pool:', poolId);
  }, []);

  // Memorizar pools filtrados/ordenados
  const sortedPools = useMemo(() => {
    return pools.sort((a, b) => b.createdAt - a.createdAt);
  }, [pools]);

  return (
    <div className="grid gap-4">
      {sortedPools.map((pool) => (
        <PoolCard
          key={pool.id}
          pool={pool}
          onJoin={handleJoinPool}
        />
      ))}
    </div>
  );
});

PoolsList.displayName = 'PoolsList';
```

**Resultado**: Evita re-renders innecesarios cuando el padre cambia ✅

---

### 9. Virtualizar Tabla de Transacciones (25 minutos)

```bash
npm install @tanstack/react-virtual
```

**Crear `frontend/src/components/dashboard/individual-savings/transactions-table-virtual.tsx`:**

```typescript
'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: string;
}

export function VirtualTransactionsTable({
  transactions
}: {
  transactions: Transaction[]
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // altura de cada fila
    overscan: 5, // renderizar 5 items extra arriba/abajo
  });

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto border rounded-lg"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const transaction = transactions[virtualRow.index];

          return (
            <div
              key={transaction.id}
              className="absolute top-0 left-0 w-full flex items-center gap-4 p-4 border-b hover:bg-gray-50"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="flex-1">{transaction.type}</div>
              <div className="flex-1">{transaction.amount}</div>
              <div className="flex-1">{transaction.date}</div>
              <div className="flex-1">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    transaction.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {transaction.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Resultado**: Tablas con miles de filas se renderizan instantáneamente ✅

---

## 📊 Comandos para Medir Performance

### Lighthouse desde CLI

```bash
npm install -g lighthouse

# Ejecutar auditoría
lighthouse https://khipuvault.vercel.app --view

# Con opciones específicas
lighthouse https://khipuvault.vercel.app \
  --only-categories=performance \
  --output=json \
  --output-path=./lighthouse-report.json
```

### Analizar Bundle Size

```bash
cd frontend
npm run build

# Analizar con visualización
npm run analyze
```

### Ver Performance en Chrome DevTools

1. Abrir Chrome DevTools (F12)
2. Ir a pestaña "Lighthouse"
3. Seleccionar "Performance"
4. Click "Analyze page load"

### Medir Core Web Vitals en Producción

1. Instalar extensión "Web Vitals" en Chrome
2. Navegar a tu sitio
3. Ver métricas en tiempo real

---

## ✅ Checklist Post-Implementación

Después de implementar estos quick wins, verificar:

- [ ] `npm run build` completa sin errores
- [ ] Bundle size reducido (comparar antes/después)
- [ ] Lighthouse score > 70
- [ ] Speed Insights instalado y funcionando
- [ ] Fuentes cargan sin flash
- [ ] Console limpio en producción
- [ ] React Query DevTools visible en desarrollo
- [ ] Lazy loading funciona (verificar con Network tab)
- [ ] Componentes memorizados no re-renderizan innecesariamente

---

## 🚀 Siguiente Nivel

Una vez completados estos quick wins, continuar con:

1. **Implementar Sentry** para error tracking
2. **Configurar Lighthouse CI** en pipeline
3. **Optimizar imágenes** con next/image
4. **Implementar Service Worker** para offline support
5. **Añadir E2E tests** con Playwright

---

## 💡 Tips Adicionales

### Performance Budgets

Añadir en `package.json`:

```json
{
  "size-limit": [
    {
      "path": "frontend/.next/static/chunks/*.js",
      "limit": "200 KB"
    }
  ]
}
```

### Pre-commit Hook para Lighthouse

```bash
npm install -D husky
npx husky install

# Crear hook
npx husky add .husky/pre-commit "npm run lint && npm run typecheck"
```

### Monitoreo Continuo

Configurar GitHub Actions para ejecutar Lighthouse en cada PR:

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://khipuvault-pr-${{ github.event.number }}.vercel.app
          uploadArtifacts: true
```

---

## 🆘 Troubleshooting

### "Dynamic import not working"

Asegurar que el componente está marcado como `'use client'`:

```typescript
'use client';

export function MyComponent() {
  // ...
}
```

### "Fonts not loading"

Verificar que `next/font` está importado correctamente y que `className` usa la variable.

### "React Query hooks not working"

Asegurar que `ReactQueryProvider` envuelve toda la app en `layout.tsx`.

---

¡Implementa estos quick wins y verás mejoras inmediatas! 🎉
