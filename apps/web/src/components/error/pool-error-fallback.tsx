"use client";

import { AlertTriangle, RefreshCw, Wallet, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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

interface PoolErrorFallbackProps extends ErrorFallbackProps {
  poolName?: string;
  poolType?: "individual" | "cooperative" | "rotating" | "lottery";
}

/**
 * Pool-Specific Error Fallback Component
 *
 * Specialized error UI for pool-related errors.
 * Provides context-aware error messages and recovery options.
 *
 * Features:
 * - Pool-specific error messaging
 * - Navigation back to pool list
 * - Wallet connection check
 * - Pool type-aware instructions
 * - Retry functionality
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={(props) => (
 *     <PoolErrorFallback
 *       {...props}
 *       poolName="Pool Individual"
 *       poolType="individual"
 *     />
 *   )}
 * >
 *   <PoolComponent />
 * </ErrorBoundary>
 * ```
 */
export function PoolErrorFallback({
  error,
  errorInfo,
  resetError,
  poolName,
  poolType = "individual",
}: PoolErrorFallbackProps) {
  const router = useRouter();
  const isDevelopment = process.env.NODE_ENV === "development";

  // Determine error type based on error message
  const errorMessage = error?.message?.toLowerCase() ?? "";
  const isContractError = errorMessage.includes("contract") || errorMessage.includes("revert");
  const isNetworkError = errorMessage.includes("network") || errorMessage.includes("rpc");
  const isWalletError =
    errorMessage.includes("wallet") ||
    errorMessage.includes("not connected") ||
    errorMessage.includes("provider");

  // Get pool type label
  const getPoolTypeLabel = () => {
    switch (poolType) {
      case "individual":
        return "Ahorro Individual";
      case "cooperative":
        return "Ahorro Cooperativo";
      case "rotating":
        return "Pool Rotativo";
      case "lottery":
        return "Loteria de Premios";
      default:
        return "Pool";
    }
  };

  // Get pool-specific instructions
  const getInstructions = () => {
    if (isWalletError) {
      return [
        "Conecta tu wallet usando el boton en la esquina superior",
        "Asegurate de que tu wallet este desbloqueada",
        "Verifica que estas en la red correcta (Bitlayer Testnet)",
      ];
    }

    if (isNetworkError) {
      return [
        "Verifica tu conexion a internet",
        "Intenta recargar la pagina",
        "Espera unos momentos - la red puede estar congestionada",
      ];
    }

    if (isContractError) {
      return [
        "Verifica que el pool este activo y disponible",
        "Asegurate de cumplir con los requisitos del pool",
        "Contacta a soporte si el problema persiste",
      ];
    }

    return [
      "Intenta recargar la pagina",
      "Vuelve a la lista de pools e intenta de nuevo",
      "Verifica tu conexion de wallet y red",
      "Contacta a soporte si el problema continua",
    ];
  };

  // Navigate to pool list based on type
  const handleBackToPools = () => {
    let route: string;

    switch (poolType) {
      case "individual":
        route = "/dashboard/individual-savings";
        break;
      case "cooperative":
        route = "/dashboard/cooperative-savings";
        break;
      case "rotating":
        route = "/dashboard/rotating-pool";
        break;
      case "lottery":
        route = "/dashboard/prize-pool";
        break;
      default:
        route = "/dashboard";
    }

    router.push(route);
  };

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-destructive/50">
        <CardHeader>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              {isWalletError ? (
                <Wallet className="h-6 w-6 text-destructive" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-destructive" />
              )}
            </div>
            <div>
              <CardTitle className="text-2xl">
                {isWalletError ? "Error de Wallet" : "Error en Pool"}
              </CardTitle>
              <CardDescription>
                {poolName
                  ? `Ocurrio un problema con ${poolName}`
                  : `Error en ${getPoolTypeLabel()}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Message */}
          <Alert variant="destructive">
            <AlertTitle className="mb-2">Descripcion del Error</AlertTitle>
            <AlertDescription className="font-mono text-sm">
              {error?.message ?? "Error desconocido al cargar el pool"}
            </AlertDescription>
          </Alert>

          {/* Pool-specific warning */}
          {isContractError && (
            <Alert>
              <AlertDescription className="text-sm">
                Este error puede ocurrir si el pool ha sido pausado o si no cumples con los
                requisitos minimos de participacion.
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
          <Button onClick={resetError} className="gap-2" size="lg">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
          <Button variant="outline" onClick={handleBackToPools} className="gap-2" size="lg">
            <ArrowLeft className="h-4 w-4" />
            Volver a Pools
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
