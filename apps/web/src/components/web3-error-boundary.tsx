"use client";

import { Wallet, WifiOff, XCircle, AlertTriangle, RefreshCw, Home } from "lucide-react";
import * as React from "react";
import { useConnect, useAccount } from "wagmi";

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

import { ErrorBoundary, ErrorFallbackProps } from "./error-boundary";

interface Web3ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

/**
 * Web3-specific Error Types
 */
enum Web3ErrorType {
  WALLET_DISCONNECTED = "WALLET_DISCONNECTED",
  NETWORK_ERROR = "NETWORK_ERROR",
  TRANSACTION_REJECTED = "TRANSACTION_REJECTED",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  CONTRACT_ERROR = "CONTRACT_ERROR",
  UNKNOWN = "UNKNOWN",
}

interface ParsedWeb3Error {
  type: Web3ErrorType;
  message: string;
  originalError: Error;
}

/**
 * Web3 Error Boundary Component
 *
 * Specialized error boundary for Web3/blockchain errors.
 * Detects common Web3 error patterns and provides specific UI and recovery options.
 *
 * Features:
 * - Detects wallet disconnection errors
 * - Identifies network/RPC errors
 * - Handles transaction rejection
 * - Recognizes insufficient funds errors
 * - Contract execution errors
 * - Provides context-specific recovery options
 * - Reconnect wallet functionality
 *
 * @example
 * ```tsx
 * <Web3ErrorBoundary>
 *   <YourWeb3Component />
 * </Web3ErrorBoundary>
 * ```
 */
export function Web3ErrorBoundary({ children, onError, onReset }: Web3ErrorBoundaryProps) {
  return (
    <ErrorBoundary fallback={Web3ErrorFallback} onError={onError} onReset={onReset}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Parse Web3 errors to identify specific error types
 */
function parseWeb3Error(error: Error | null): ParsedWeb3Error {
  if (!error) {
    return {
      type: Web3ErrorType.UNKNOWN,
      message: "Error desconocido",
      originalError: new Error("Unknown error"),
    };
  }

  const errorMessage = error.message.toLowerCase();

  // Wallet Disconnected
  if (
    errorMessage.includes("wallet") ||
    errorMessage.includes("connector") ||
    errorMessage.includes("not connected") ||
    errorMessage.includes("no provider")
  ) {
    return {
      type: Web3ErrorType.WALLET_DISCONNECTED,
      message: "Wallet desconectada. Por favor reconecta tu wallet para continuar.",
      originalError: error,
    };
  }

  // Network/RPC Errors
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("rpc") ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("could not detect network")
  ) {
    return {
      type: Web3ErrorType.NETWORK_ERROR,
      message: "Error de conexion a la red blockchain. Verifica tu conexion a internet.",
      originalError: error,
    };
  }

  // Transaction Rejected
  if (
    errorMessage.includes("user rejected") ||
    errorMessage.includes("user denied") ||
    errorMessage.includes("rejected") ||
    errorMessage.includes("cancelled")
  ) {
    return {
      type: Web3ErrorType.TRANSACTION_REJECTED,
      message: "Transaccion rechazada. Aprobaste la transaccion en tu wallet?",
      originalError: error,
    };
  }

  // Insufficient Funds
  if (
    errorMessage.includes("insufficient") ||
    errorMessage.includes("balance") ||
    errorMessage.includes("not enough")
  ) {
    return {
      type: Web3ErrorType.INSUFFICIENT_FUNDS,
      message: "Fondos insuficientes para completar la transaccion.",
      originalError: error,
    };
  }

  // Contract Errors
  if (
    errorMessage.includes("revert") ||
    errorMessage.includes("execution reverted") ||
    errorMessage.includes("contract")
  ) {
    return {
      type: Web3ErrorType.CONTRACT_ERROR,
      message: "Error en el contrato inteligente. La transaccion fue rechazada por el contrato.",
      originalError: error,
    };
  }

  // Unknown Error
  return {
    type: Web3ErrorType.UNKNOWN,
    message: error.message || "Error desconocido en la operacion Web3",
    originalError: error,
  };
}

/**
 * Web3-specific Error Fallback UI
 */
function Web3ErrorFallback({ error, errorInfo: _errorInfo, resetError }: ErrorFallbackProps) {
  const parsedError = parseWeb3Error(error);
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();
  const isDevelopment = process.env.NODE_ENV === "development";

  // Get icon and color based on error type
  const errorIconMap = {
    [Web3ErrorType.WALLET_DISCONNECTED]: <Wallet className="h-6 w-6" />,
    [Web3ErrorType.NETWORK_ERROR]: <WifiOff className="h-6 w-6" />,
    [Web3ErrorType.TRANSACTION_REJECTED]: <XCircle className="h-6 w-6" />,
    [Web3ErrorType.INSUFFICIENT_FUNDS]: <AlertTriangle className="h-6 w-6" />,
    [Web3ErrorType.CONTRACT_ERROR]: <AlertTriangle className="h-6 w-6" />,
    [Web3ErrorType.UNKNOWN]: <AlertTriangle className="h-6 w-6" />,
  };

  const errorColorMap = {
    [Web3ErrorType.TRANSACTION_REJECTED]: "text-yellow-500 bg-yellow-500/10",
    [Web3ErrorType.WALLET_DISCONNECTED]: "text-blue-500 bg-blue-500/10",
    [Web3ErrorType.NETWORK_ERROR]: "text-orange-500 bg-orange-500/10",
    [Web3ErrorType.INSUFFICIENT_FUNDS]: "text-destructive bg-destructive/10",
    [Web3ErrorType.CONTRACT_ERROR]: "text-destructive bg-destructive/10",
    [Web3ErrorType.UNKNOWN]: "text-destructive bg-destructive/10",
  };

  const getErrorIcon = () => errorIconMap[parsedError.type];
  const getErrorColor = () => errorColorMap[parsedError.type];

  const handleReconnectWallet = async () => {
    try {
      const connector = connectors[0]; // Use first available connector (usually MetaMask)
      if (connector) {
        await connect({ connector });
        resetError(); // Reset error after successful connection
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error reconnecting wallet:", err);
    }
  };

  // Get specific instructions based on error type
  const getInstructions = () => {
    switch (parsedError.type) {
      case Web3ErrorType.WALLET_DISCONNECTED:
        return [
          "Conecta tu wallet usando el boton de abajo",
          "Asegurate de que tu wallet este desbloqueada",
          "Verifica que estas en la red correcta",
        ];
      case Web3ErrorType.NETWORK_ERROR:
        return [
          "Verifica tu conexion a internet",
          "Intenta cambiar de proveedor RPC si el problema persiste",
          "Espera unos momentos y vuelve a intentar",
        ];
      case Web3ErrorType.TRANSACTION_REJECTED:
        return [
          "Vuelve a intentar la operacion",
          "Revisa los detalles de la transaccion en tu wallet",
          "Asegurate de tener suficiente gas/ETH para la transaccion",
        ];
      case Web3ErrorType.INSUFFICIENT_FUNDS:
        return [
          "Verifica que tienes suficiente saldo",
          "Considera depositar mas fondos",
          "Intenta con una cantidad menor",
        ];
      case Web3ErrorType.CONTRACT_ERROR:
        return [
          "Verifica que cumples con los requisitos del contrato",
          "Revisa los parametros de la transaccion",
          "Contacta a soporte si el problema persiste",
        ];
      default:
        return [
          "Intenta recargar la pagina",
          "Verifica tu conexion de wallet",
          "Contacta a soporte si el problema continua",
        ];
    }
  };

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-border">
        <CardHeader>
          <div className="mb-2 flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${getErrorColor()}`}
            >
              {getErrorIcon()}
            </div>
            <div>
              <CardTitle className="text-2xl">
                {(() => {
                  if (parsedError.type === Web3ErrorType.TRANSACTION_REJECTED) {
                    return "Transaccion Rechazada";
                  }
                  if (parsedError.type === Web3ErrorType.WALLET_DISCONNECTED) {
                    return "Wallet Desconectada";
                  }
                  if (parsedError.type === Web3ErrorType.NETWORK_ERROR) {
                    return "Error de Red";
                  }
                  return "Error Web3";
                })()}
              </CardTitle>
              <CardDescription>
                {parsedError.type === Web3ErrorType.TRANSACTION_REJECTED
                  ? "La transaccion fue cancelada"
                  : "Ocurrio un error con la blockchain"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Message */}
          <Alert
            variant={
              parsedError.type === Web3ErrorType.TRANSACTION_REJECTED ? "default" : "destructive"
            }
          >
            <AlertDescription>{parsedError.message}</AlertDescription>
          </Alert>

          {/* Development Mode - Show Original Error */}
          {isDevelopment && parsedError.originalError && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Error original (modo desarrollo)
              </summary>
              <div className="mt-2 overflow-x-auto rounded-lg bg-muted/50 p-4">
                <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                  {parsedError.originalError.stack ?? parsedError.originalError.message}
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
          {/* Reconnect Wallet Button (for wallet disconnected errors) */}
          {parsedError.type === Web3ErrorType.WALLET_DISCONNECTED && !isConnected && (
            <Button onClick={handleReconnectWallet} className="gap-2" size="lg">
              <Wallet className="h-4 w-4" />
              Reconectar Wallet
            </Button>
          )}

          {/* Retry Button */}
          <Button
            onClick={resetError}
            variant={
              parsedError.type === Web3ErrorType.WALLET_DISCONNECTED && !isConnected
                ? "outline"
                : "default"
            }
            className="gap-2"
            size="lg"
          >
            <RefreshCw className="h-4 w-4" />
            {parsedError.type === Web3ErrorType.TRANSACTION_REJECTED
              ? "Reintentar Transaccion"
              : "Reintentar"}
          </Button>

          {/* Home Button */}
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="gap-2"
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
