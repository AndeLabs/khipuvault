"use client";

import { AlertTriangle, RefreshCw, Home, Mail } from "lucide-react";
import * as React from "react";

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
// Temporarily disabled Sentry integration until properly configured
// import { captureError, addBreadcrumb } from "@/lib/error-tracking";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js 13+ Page-level Error Boundary
 *
 * This file is automatically used by Next.js to handle errors in the app directory.
 * It provides a consistent error UI across all pages.
 *
 * Features:
 * - Automatic error catching for page-level errors
 * - Retry functionality to recover from transient errors
 * - Navigation to home page
 * - Error digest for tracking (in production)
 * - Development mode debug information
 * - Automatic error reporting to Sentry (when configured)
 *
 * Note: This component must be a Client Component ('use client')
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function Error({ error, reset }: ErrorProps) {
  const isDevelopment = process.env.NODE_ENV === "development";

  React.useEffect(() => {
    // Log error to console for debugging
    // eslint-disable-next-line no-console
    console.error("Page Error:", error);

    // TODO: Re-enable Sentry integration after proper configuration
    // Report error to error tracking service (Sentry if configured)
    // void captureError(error, {
    //   tags: {
    //     errorBoundary: "page",
    //     digest: error.digest ?? "unknown",
    //   },
    //   extra: {
    //     pathname: typeof window !== "undefined" ? window.location.pathname : "unknown",
    //     userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    //   },
    //   level: "error",
    // });

    // Add breadcrumb for debugging
    // addBreadcrumb({
    //   category: "error.boundary",
    //   message: `Page error caught: ${error.message}`,
    //   level: "error",
    //   data: { digest: error.digest },
    // });
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-destructive/50 shadow-xl">
        <CardHeader>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="font-heading text-2xl">Algo salio mal</CardTitle>
              <CardDescription>Ocurrio un error inesperado en esta pagina</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Message */}
          <Alert variant="destructive">
            <AlertDescription className="font-mono text-sm">
              {error.message ?? "Error desconocido"}
            </AlertDescription>
          </Alert>

          {/* Error Digest (Production) */}
          {error.digest && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                ID de Error: <span className="font-mono">{error.digest}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Por favor incluye este ID si contactas a soporte
              </p>
            </div>
          )}

          {/* Development Mode - Show Stack Trace */}
          {isDevelopment && error.stack && (
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

          {/* User Instructions */}
          <div className="space-y-3 pt-4">
            <p className="text-sm font-medium">Que puedes hacer:</p>
            <div className="grid gap-2">
              <div className="flex items-start gap-3 rounded-lg bg-surface-elevated p-3">
                <RefreshCw className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Reintentar</p>
                  <p className="text-xs text-muted-foreground">
                    Intentar cargar la pagina nuevamente
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-surface-elevated p-3">
                <Home className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Volver al inicio</p>
                  <p className="text-xs text-muted-foreground">
                    Regresar a la pagina principal de KhipuVault
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-surface-elevated p-3">
                <Mail className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Contactar soporte</p>
                  <p className="text-xs text-muted-foreground">
                    Si el problema persiste, contactanos para ayudarte
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Help */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Este error ha sido registrado automaticamente. Estamos trabajando para mejorar la
              estabilidad de la aplicacion.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button onClick={reset} className="flex-1 gap-2" size="lg">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="flex-1 gap-2"
            size="lg"
          >
            <Home className="h-4 w-4" />
            Ir al Inicio
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
