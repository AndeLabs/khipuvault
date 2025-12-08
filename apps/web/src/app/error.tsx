"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { captureError, addBreadcrumb } from "@/lib/error-tracking";

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
    console.error("Page Error:", error);

    // Report error to error tracking service (Sentry if configured)
    captureError(error, {
      tags: {
        errorBoundary: "page",
        digest: error.digest || "unknown",
      },
      extra: {
        pathname:
          typeof window !== "undefined" ? window.location.pathname : "unknown",
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      },
      level: "error",
    });

    // Add breadcrumb for debugging
    addBreadcrumb({
      category: "error.boundary",
      message: `Page error caught: ${error.message}`,
      level: "error",
      data: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-destructive/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl font-heading">
                Algo salio mal
              </CardTitle>
              <CardDescription>
                Ocurrio un error inesperado en esta pagina
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Message */}
          <Alert variant="destructive">
            <AlertDescription className="font-mono text-sm">
              {error.message || "Error desconocido"}
            </AlertDescription>
          </Alert>

          {/* Error Digest (Production) */}
          {error.digest && (
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">
                ID de Error: <span className="font-mono">{error.digest}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Por favor incluye este ID si contactas a soporte
              </p>
            </div>
          )}

          {/* Development Mode - Show Stack Trace */}
          {isDevelopment && error.stack && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Stack Trace (modo desarrollo)
              </summary>
              <div className="mt-2 p-4 bg-muted/50 rounded-lg overflow-x-auto">
                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </div>
            </details>
          )}

          {/* User Instructions */}
          <div className="pt-4 space-y-3">
            <p className="text-sm font-medium">Que puedes hacer:</p>
            <div className="grid gap-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-elevated">
                <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Reintentar</p>
                  <p className="text-xs text-muted-foreground">
                    Intentar cargar la pagina nuevamente
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-elevated">
                <Home className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Volver al inicio</p>
                  <p className="text-xs text-muted-foreground">
                    Regresar a la pagina principal de KhipuVault
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-elevated">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
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
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Este error ha sido registrado automaticamente. Estamos trabajando
              para mejorar la estabilidad de la aplicacion.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button onClick={reset} className="gap-2 flex-1" size="lg">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="gap-2 flex-1"
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
