# Error Handling Components

Componentes reutilizables para manejo de errores en KhipuVault.

## Componentes

### 1. ErrorBoundary

Error Boundary genérico y reutilizable.

```tsx
import { ErrorBoundary, ErrorFallback } from "@/components/error";

<ErrorBoundary fallback={ErrorFallback}>
  <YourComponent />
</ErrorBoundary>;
```

### 2. ErrorFallback

Fallback UI genérico con mensaje personalizable.

```tsx
import { ErrorBoundary, ErrorFallback } from "@/components/error";

<ErrorBoundary
  fallback={(props) => (
    <ErrorFallback
      {...props}
      title="Error Custom"
      description="Descripción custom"
      showHomeButton={true}
    />
  )}
>
  <YourComponent />
</ErrorBoundary>;
```

### 3. PoolErrorFallback

Fallback específico para errores en pools.

```tsx
import { ErrorBoundary, PoolErrorFallback } from "@/components/error";

<ErrorBoundary
  fallback={(props) => (
    <PoolErrorFallback {...props} poolName="Pool Individual de Ahorros" poolType="individual" />
  )}
>
  <PoolComponent />
</ErrorBoundary>;
```

Tipos de pool soportados:

- `individual` - Ahorro Individual
- `cooperative` - Ahorro Cooperativo
- `rotating` - Pool Rotativo
- `lottery` - Lotería de Premios

### 4. TransactionErrorFallback

Fallback específico para errores en transacciones.

```tsx
import { ErrorBoundary, TransactionErrorFallback } from "@/components/error";

<ErrorBoundary
  fallback={(props) => (
    <TransactionErrorFallback
      {...props}
      transactionType="Deposito"
      onRetry={handleRetryDeposit}
      showRetry={true}
    />
  )}
>
  <TransactionComponent />
</ErrorBoundary>;
```

Tipos de errores detectados automáticamente:

- `rejected` - Usuario canceló la transacción
- `failed` - Transacción falló (revert)
- `insufficient_funds` - Fondos insuficientes
- `gas` - Error de estimación de gas
- `network` - Error de red/RPC
- `wallet` - Error de wallet/conexión

## Características

- **Logging automático**: Integrado con sistema de monitoreo
- **Modo desarrollo**: Muestra stack traces en desarrollo
- **Retry**: Botón para reintentar la operación
- **Customizable**: Props para personalizar título, descripción y botones
- **Type-safe**: Tipado completo con TypeScript
- **Responsive**: Diseño adaptable a móviles

## Props Comunes

### ErrorBoundary

```tsx
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  logError?: boolean; // default: true
}
```

### ErrorFallbackProps

```tsx
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  resetError: () => void;
}
```

## Ejemplo Completo

```tsx
import { ErrorBoundary, PoolErrorFallback } from "@/components/error";
import { IndividualPoolCard } from "@/features/individual-savings";

export function PoolPage() {
  return (
    <ErrorBoundary
      fallback={(props) => (
        <PoolErrorFallback {...props} poolName="Pool Individual" poolType="individual" />
      )}
      onError={(error, errorInfo) => {
        console.error("Pool error:", error);
        // Custom error handling
      }}
      onReset={() => {
        // Clean up state on reset
      }}
    >
      <IndividualPoolCard />
    </ErrorBoundary>
  );
}
```
