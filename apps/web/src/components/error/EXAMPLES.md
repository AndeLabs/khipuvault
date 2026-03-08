# Error Components - Ejemplos de Uso

## Ejemplo 1: Error Boundary Genérico en una Página

```tsx
// app/dashboard/page.tsx
import { ErrorBoundary, ErrorFallback } from "@/components/error";
import { DashboardContent } from "@/components/dashboard";

export default function DashboardPage() {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <DashboardContent />
    </ErrorBoundary>
  );
}
```

## Ejemplo 2: Pool Error en Individual Savings

```tsx
// app/dashboard/individual-savings/page.tsx
import { ErrorBoundary, PoolErrorFallback } from "@/components/error";
import { IndividualPoolStats } from "@/features/individual-savings";

export default function IndividualSavingsPage() {
  return (
    <ErrorBoundary
      fallback={(props) => (
        <PoolErrorFallback {...props} poolName="Pool de Ahorro Individual" poolType="individual" />
      )}
    >
      <IndividualPoolStats />
    </ErrorBoundary>
  );
}
```

## Ejemplo 3: Transaction Error con Retry Custom

```tsx
// features/individual-savings/components/deposit-card.tsx
"use client";

import { useState } from "react";
import { ErrorBoundary, TransactionErrorFallback } from "@/components/error";
import { useDeposit } from "@/hooks/web3/individual";
import { Button } from "@/components/ui/button";

function DepositForm() {
  const [amount, setAmount] = useState("");
  const { deposit, isPending } = useDeposit();

  const handleDeposit = () => {
    deposit(parseEther(amount));
  };

  return (
    <div>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Monto a depositar"
      />
      <Button onClick={handleDeposit} loading={isPending}>
        Depositar
      </Button>
    </div>
  );
}

export function DepositCard() {
  const handleRetry = () => {
    // Limpiar estado si es necesario
    console.log("Retrying deposit...");
  };

  return (
    <ErrorBoundary
      fallback={(props) => (
        <TransactionErrorFallback {...props} transactionType="Deposito" onRetry={handleRetry} />
      )}
    >
      <DepositForm />
    </ErrorBoundary>
  );
}
```

## Ejemplo 4: Múltiples Error Boundaries Anidados

```tsx
// app/dashboard/cooperative-savings/page.tsx
import {
  ErrorBoundary,
  ErrorFallback,
  PoolErrorFallback,
  TransactionErrorFallback,
} from "@/components/error";
import { PoolList } from "@/features/cooperative-savings/components/pool-list";
import { CreatePoolForm } from "@/features/cooperative-savings/components/create-pool-form";

export default function CooperativeSavingsPage() {
  return (
    // Error boundary de página
    <ErrorBoundary fallback={ErrorFallback}>
      <div className="space-y-6">
        <h1>Ahorro Cooperativo</h1>

        {/* Error boundary para listado de pools */}
        <ErrorBoundary
          fallback={(props) => <PoolErrorFallback {...props} poolType="cooperative" />}
        >
          <PoolList />
        </ErrorBoundary>

        {/* Error boundary para crear pool */}
        <ErrorBoundary
          fallback={(props) => (
            <TransactionErrorFallback {...props} transactionType="Creacion de Pool" />
          )}
        >
          <CreatePoolForm />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
```

## Ejemplo 5: Error Boundary con Logging Custom

```tsx
// app/dashboard/prize-pool/page.tsx
import { ErrorBoundary, PoolErrorFallback } from "@/components/error";
import { LotteryPool } from "@/features/prize-pool";
import { captureError } from "@/lib/error-tracking";

export default function PrizePoolPage() {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Logging custom
    captureError(error, {
      tags: {
        feature: "lottery",
        page: "prize-pool",
      },
      extra: {
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
      },
    });
  };

  const handleReset = () => {
    // Limpiar estado de la lotería
    console.log("Resetting lottery state...");
  };

  return (
    <ErrorBoundary
      fallback={(props) => (
        <PoolErrorFallback {...props} poolName="Loteria de Premios" poolType="lottery" />
      )}
      onError={handleError}
      onReset={handleReset}
    >
      <LotteryPool />
    </ErrorBoundary>
  );
}
```

## Ejemplo 6: Error Fallback Customizado

```tsx
// components/custom-error-fallback.tsx
import { RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ErrorFallbackProps } from "@/components/error";

export function CustomErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Card className="p-6">
      <h2>Oops! Algo salio mal</h2>
      <p>{error?.message}</p>
      <div className="flex gap-2">
        <Button onClick={resetError}>
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          <Home className="h-4 w-4" />
          Inicio
        </Button>
      </div>
    </Card>
  );
}

// Uso
import { ErrorBoundary } from "@/components/error";
import { CustomErrorFallback } from "@/components/custom-error-fallback";

<ErrorBoundary fallback={CustomErrorFallback}>
  <YourComponent />
</ErrorBoundary>;
```

## Ejemplo 7: Error Boundary en Layout

```tsx
// app/dashboard/layout.tsx
import { ErrorBoundary, ErrorFallback } from "@/components/error";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={ErrorFallback}
      onError={(error) => {
        console.error("Dashboard error:", error);
      }}
    >
      <div className="dashboard-layout">
        <aside>Sidebar</aside>
        <main>{children}</main>
      </div>
    </ErrorBoundary>
  );
}
```

## Mejores Prácticas

### 1. Error Boundaries en Límites de Features

Coloca error boundaries en los límites de features/módulos para aislar errores:

```tsx
// features/individual-savings/index.tsx
export function IndividualSavingsFeature() {
  return (
    <ErrorBoundary fallback={(props) => <PoolErrorFallback {...props} poolType="individual" />}>
      {/* Feature components */}
    </ErrorBoundary>
  );
}
```

### 2. Granularidad Apropiada

No envuelvas cada componente pequeño. Usa error boundaries en:

- Páginas completas
- Features/módulos
- Componentes que hacen llamadas a la blockchain
- Componentes que hacen llamadas a APIs

### 3. Logging y Monitoreo

Siempre usa `onError` para logging:

```tsx
<ErrorBoundary
  fallback={YourFallback}
  onError={(error, errorInfo) => {
    captureError(error, {
      tags: { component: "MyComponent" },
      extra: errorInfo,
    });
  }}
>
  {/* components */}
</ErrorBoundary>
```

### 4. Estado de Limpieza en Reset

Usa `onReset` para limpiar estado:

```tsx
<ErrorBoundary
  fallback={YourFallback}
  onReset={() => {
    // Reset global state
    queryClient.invalidateQueries();
  }}
>
  {/* components */}
</ErrorBoundary>
```
