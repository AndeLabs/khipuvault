"use client";

import { AlertTriangle, RefreshCw, XCircle, WifiOff, Wallet, AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { ErrorFallbackProps } from "./error-boundary";

/**
 * Transaction Error Types
 */
type TransactionErrorType =
  | "rejected"
  | "failed"
  | "insufficient_funds"
  | "network"
  | "wallet"
  | "gas"
  | "unknown";

interface TransactionErrorFallbackProps extends ErrorFallbackProps {
  transactionType?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

/**
 * Parse transaction error to identify specific type
 */
function parseTransactionError(error: Error | null): {
  type: TransactionErrorType;
  message: string;
} {
  if (!error) {
    return { type: "unknown", message: "Error desconocido" };
  }

  const errorMessage = error.message.toLowerCase();

  // User rejected transaction
  if (
    errorMessage.includes("user rejected") ||
    errorMessage.includes("user denied") ||
    errorMessage.includes("rejected") ||
    errorMessage.includes("cancelled")
  ) {
    return {
      type: "rejected",
      message: "Transaccion rechazada. Cancelaste la transaccion en tu wallet.",
    };
  }

  // Insufficient funds
  if (
    errorMessage.includes("insufficient") ||
    errorMessage.includes("balance") ||
    errorMessage.includes("not enough")
  ) {
    return {
      type: "insufficient_funds",
      message: "Fondos insuficientes para completar la transaccion y pagar el gas.",
    };
  }

  // Gas estimation failed
  if (errorMessage.includes("gas") || errorMessage.includes("out of gas")) {
    return {
      type: "gas",
      message: "Error al estimar el gas. La transaccion podria fallar si se ejecuta.",
    };
  }

  // Network errors
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("rpc") ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("timeout")
  ) {
    return {
      type: "network",
      message: "Error de conexion a la red blockchain. Verifica tu internet.",
    };
  }

  // Wallet errors
  if (
    errorMessage.includes("wallet") ||
    errorMessage.includes("not connected") ||
    errorMessage.includes("provider")
  ) {
    return {
      type: "wallet",
      message: "Error de wallet. Asegurate de que tu wallet este conectada.",
    };
  }

  // Transaction failed (reverted)
  if (
    errorMessage.includes("revert") ||
    errorMessage.includes("execution reverted") ||
    errorMessage.includes("failed")
  ) {
    return {
      type: "failed",
      message: "La transaccion fue rechazada por el contrato inteligente.",
    };
  }

  return {
    type: "unknown",
    message: error.message || "Error desconocido en la transaccion",
  };
}

/**
 * Transaction Error Fallback Component
 *
 * Specialized error UI for transaction-related errors.
 * Identifies common transaction failure patterns and provides
 * specific guidance for each error type.
 *
 * Features:
 * - Identifies transaction error types (rejected, failed, gas, etc.)
 * - Context-aware error messages
 * - Visual indicators based on error severity
 * - Retry functionality
 * - Type-specific recovery instructions
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={(props) => (
 *     <TransactionErrorFallback
 *       {...props}
 *       transactionType="Deposito"
 *       onRetry={handleRetry}
 *     />
 *   )}
 * >
 *   <TransactionComponent />
 * </ErrorBoundary>
 * ```
 */
export function TransactionErrorFallback({
  error,
  errorInfo,
  resetError,
  transactionType = "Transaccion",
  onRetry,
  showRetry = true,
}: TransactionErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const parsedError = parseTransactionError(error);

  // Get icon based on error type
  const getErrorIcon = () => {
    switch (parsedError.type) {
      case "rejected":
        return <XCircle className="h-6 w-6 text-warning" />;
      case "wallet":
        return <Wallet className="h-6 w-6 text-destructive" />;
      case "network":
        return <WifiOff className="h-6 w-6 text-destructive" />;
      case "insufficient_funds":
      case "gas":
        return <AlertCircle className="h-6 w-6 text-destructive" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
    }
  };

  // Get icon background color
  const getIconBgColor = () => {
    switch (parsedError.type) {
      case "rejected":
        return "bg-warning/10";
      default:
        return "bg-destructive/10";
    }
  };

  // Get title based on error type
  const getTitle = () => {
    switch (parsedError.type) {
      case "rejected":
        return "Transaccion Cancelada";
      case "failed":
        return "Transaccion Fallida";
      case "insufficient_funds":
        return "Fondos Insuficientes";
      case "gas":
        return "Error de Gas";
      case "network":
        return "Error de Red";
      case "wallet":
        return "Error de Wallet";
      default:
        return "Error en Transaccion";
    }
  };

  // Get instructions based on error type
  const getInstructions = () => {
    switch (parsedError.type) {
      case "rejected":
        return [
          "Vuelve a intentar la transaccion",
          "Revisa los detalles en tu wallet antes de confirmar",
          "Asegurate de entender que hace la transaccion",
        ];
      case "insufficient_funds":
        return [
          "Verifica que tienes suficiente saldo para la transaccion",
          "Recuerda que necesitas fondos adicionales para el gas",
          "Considera depositar mas fondos o reducir el monto",
        ];
      case "gas":
        return [
          "Intenta aumentar el limite de gas manualmente",
          "Verifica que el pool este activo y aceptando transacciones",
          "Espera unos minutos e intenta de nuevo",
        ];
      case "network":
        return [
          "Verifica tu conexion a internet",
          "Intenta cambiar de proveedor RPC en tu wallet",
          "Espera unos momentos y vuelve a intentar",
        ];
      case "wallet":
        return [
          "Asegurate de que tu wallet este conectada",
          "Verifica que estas en la red correcta",
          "Intenta desconectar y reconectar tu wallet",
        ];
      case "failed":
        return [
          "Verifica que cumples con los requisitos del contrato",
          "Revisa que los parametros de la transaccion sean correctos",
          "Contacta a soporte si el problema persiste",
        ];
      default:
        return [
          "Vuelve a intentar la transaccion",
          "Verifica tu wallet y conexion de red",
          "Contacta a soporte si el error continua",
        ];
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    resetError();
  };

  // Determine if this is a warning (rejected) or error
  const isWarning = parsedError.type === "rejected";

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card
        className={`w-full max-w-2xl ${isWarning ? "border-warning/50" : "border-destructive/50"}`}
      >
        <CardHeader>
          <div className="mb-2 flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${getIconBgColor()}`}
            >
              {getErrorIcon()}
            </div>
            <div>
              <CardTitle className="text-2xl">{getTitle()}</CardTitle>
              <CardDescription>{transactionType} no pudo completarse correctamente</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Message */}
          <Alert variant={isWarning ? "default" : "destructive"}>
            <AlertTitle className="mb-2">Descripcion del Error</AlertTitle>
            <AlertDescription className="text-sm">{parsedError.message}</AlertDescription>
          </Alert>

          {/* Special notice for rejected transactions */}
          {parsedError.type === "rejected" && (
            <Alert>
              <AlertDescription className="text-sm">
                Esta no es un error. Simplemente cancelaste la transaccion en tu wallet. Puedes
                intentar de nuevo cuando estes listo.
              </AlertDescription>
            </Alert>
          )}

          {/* Special notice for insufficient funds */}
          {parsedError.type === "insufficient_funds" && (
            <Alert>
              <AlertDescription className="text-sm">
                Recuerda que necesitas tener suficiente saldo no solo para la transaccion, sino
                tambien para pagar el costo del gas en la red.
              </AlertDescription>
            </Alert>
          )}

          {/* Development Mode - Show Stack Trace */}
          {isDevelopment && error?.stack && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Stack Trace (modo desarrollo)
              </summary>
              <div className="mt-2 overflow-x-auto rounded-lg bg-muted/50 p-4">
                <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                  {error.stack}
                </pre>
              </div>
            </details>
          )}

          {/* Development Mode - Component Stack */}
          {isDevelopment && errorInfo?.componentStack && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Component Stack
              </summary>
              <div className="mt-2 overflow-x-auto rounded-lg bg-muted/50 p-4">
                <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                  {errorInfo.componentStack}
                </pre>
              </div>
            </details>
          )}

          {/* User Instructions */}
          <div className="space-y-2 pt-4">
            <p className="text-sm font-medium">Que puedes hacer:</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {getInstructions().map((instruction) => (
                <li key={instruction} className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">•</span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-3">
          {showRetry && (
            <Button onClick={handleRetry} className="gap-2" size="lg" variant="default">
              <RefreshCw className="h-4 w-4" />
              {parsedError.type === "rejected" ? "Intentar de Nuevo" : "Reintentar Transaccion"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
