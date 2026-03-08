"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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

interface GenericErrorFallbackProps extends ErrorFallbackProps {
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  showStackTrace?: boolean;
}

/**
 * Generic Error Fallback Component
 *
 * A reusable error fallback UI with customizable title and description.
 * Displays error message, retry button, and optional navigation.
 *
 * Features:
 * - Clean, user-friendly error display
 * - Retry functionality
 * - Optional home button
 * - Development mode stack trace
 * - Customizable title and description
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={(props) => <ErrorFallback {...props} />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export function ErrorFallback({
  error,
  errorInfo,
  resetError,
  title = "Algo salio mal",
  description = "Lo sentimos, ocurrio un error inesperado",
  showHomeButton = true,
  showStackTrace = true,
}: GenericErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-destructive/50">
        <CardHeader>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Message */}
          <Alert variant="destructive">
            <AlertDescription className="font-mono text-sm">
              {error?.message ?? "Error desconocido"}
            </AlertDescription>
          </Alert>

          {/* Development Mode - Show Stack Trace */}
          {isDevelopment && showStackTrace && error?.stack && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Detalles tecnicos (modo desarrollo)
              </summary>
              <div className="mt-2 overflow-x-auto rounded-lg bg-muted/50 p-4">
                <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                  {error.stack}
                </pre>
              </div>
            </details>
          )}

          {/* Development Mode - Component Stack */}
          {isDevelopment && showStackTrace && errorInfo?.componentStack && (
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
            <p className="text-sm text-muted-foreground">
              Puedes intentar las siguientes acciones:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Reintentar la operacion</li>
              <li>Recargar la pagina</li>
              {showHomeButton && <li>Volver a la pagina principal</li>}
              <li>Verificar tu conexion a internet</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button onClick={resetError} className="gap-2" size="lg">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
          {showHomeButton && (
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
              className="gap-2"
              size="lg"
            >
              <Home className="h-4 w-4" />
              Ir al Inicio
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
