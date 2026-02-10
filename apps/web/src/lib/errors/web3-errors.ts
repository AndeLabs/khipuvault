/**
 * Centralized Web3 Error Parser
 *
 * Consolidates all error parsing logic for blockchain transactions.
 * Supports both English error messages from contracts and Spanish user-facing messages.
 *
 * @example
 * ```ts
 * import { parseWeb3Error, getErrorMessage } from "@/lib/errors/web3-errors";
 *
 * const parsed = parseWeb3Error(error);
 * toast.error(parsed.userMessage);
 * ```
 */

/**
 * Error categories for handling and reporting
 */
export type Web3ErrorCategory =
  | "user_rejected" // User cancelled in wallet
  | "insufficient_funds" // Not enough gas or tokens
  | "contract_error" // Smart contract revert
  | "network_error" // RPC or connection issues
  | "validation_error" // Invalid input/state
  | "unknown"; // Unclassified errors

/**
 * Parsed error with category and messages
 */
export interface ParsedWeb3Error {
  category: Web3ErrorCategory;
  /** Technical message for logging */
  technicalMessage: string;
  /** User-friendly message in Spanish */
  userMessage: string;
  /** Original error for debugging */
  originalError?: Error;
  /** Whether error is recoverable (user can retry) */
  isRecoverable: boolean;
  /** Suggested action for recovery */
  recoveryAction?: string;
}

/**
 * Contract error patterns mapped to user messages
 */
const CONTRACT_ERROR_MAP: Record<
  string,
  { message: string; recoverable: boolean; action?: string }
> = {
  // Individual Pool errors
  NoActiveDeposit: {
    message: "No tienes un depósito activo",
    recoverable: false,
  },
  InvalidAmount: {
    message: "Monto inválido",
    recoverable: true,
    action: "Verifica el monto e intenta de nuevo",
  },
  InsufficientBalance: {
    message: "Saldo insuficiente",
    recoverable: true,
    action: "Verifica tu balance de mUSD",
  },
  DepositTooSmall: {
    message: "El depósito es muy pequeño",
    recoverable: true,
    action: "El mínimo es 10 mUSD",
  },
  DepositTooLarge: {
    message: "El depósito excede el máximo",
    recoverable: true,
    action: "El máximo es 1,000,000 mUSD",
  },
  WithdrawTooSmall: {
    message: "El retiro es muy pequeño",
    recoverable: true,
    action: "El mínimo es 1 mUSD",
  },
  CooldownNotComplete: {
    message: "Período de espera no completado",
    recoverable: false,
    action: "Espera 24 horas después del depósito",
  },

  // Cooperative Pool errors
  PoolNotActive: {
    message: "El pool no está activo",
    recoverable: false,
  },
  PoolFull: {
    message: "El pool está lleno",
    recoverable: false,
  },
  AlreadyMember: {
    message: "Ya eres miembro de este pool",
    recoverable: false,
  },
  NotMember: {
    message: "No eres miembro de este pool",
    recoverable: false,
  },
  MinContributionNotMet: {
    message: "No alcanzas la contribución mínima",
    recoverable: true,
    action: "Aumenta el monto de tu contribución",
  },
  MaxContributionExceeded: {
    message: "Excedes la contribución máxima",
    recoverable: true,
    action: "Reduce el monto de tu contribución",
  },
  OnlyCreatorCanClose: {
    message: "Solo el creador puede cerrar el pool",
    recoverable: false,
  },
  CannotLeaveAsCreator: {
    message: "El creador no puede abandonar el pool",
    recoverable: false,
    action: "Cierra el pool en su lugar",
  },

  // Rotating Pool errors
  RoundNotComplete: {
    message: "La ronda aún no termina",
    recoverable: false,
  },
  AlreadyReceived: {
    message: "Ya recibiste en esta ronda",
    recoverable: false,
  },
  NotYourTurn: {
    message: "No es tu turno para recibir",
    recoverable: false,
  },

  // Token errors
  InsufficientAllowance: {
    message: "Aprobación insuficiente",
    recoverable: true,
    action: "Aprueba el gasto de tokens primero",
  },
  TransferFailed: {
    message: "La transferencia falló",
    recoverable: true,
    action: "Intenta de nuevo",
  },
};

/**
 * Parse a Web3 error into a structured format
 */
export function parseWeb3Error(error: unknown): ParsedWeb3Error {
  const errorMessage = extractErrorMessage(error);
  const originalError = error instanceof Error ? error : undefined;

  // Check for user rejection
  if (isUserRejection(errorMessage)) {
    return {
      category: "user_rejected",
      technicalMessage: "Transaction rejected by user",
      userMessage: "Rechazaste la transacción en tu wallet",
      originalError,
      isRecoverable: true,
      recoveryAction: "Intenta de nuevo cuando estés listo",
    };
  }

  // Check for insufficient funds
  if (isInsufficientFunds(errorMessage)) {
    return {
      category: "insufficient_funds",
      technicalMessage: "Insufficient funds for gas",
      userMessage: "No tienes suficiente BTC para pagar el gas",
      originalError,
      isRecoverable: true,
      recoveryAction: "Obtén más BTC para gas",
    };
  }

  // Check for known contract errors
  const contractError = findContractError(errorMessage);
  if (contractError) {
    return {
      category: "contract_error",
      technicalMessage: contractError.key,
      userMessage: contractError.details.message,
      originalError,
      isRecoverable: contractError.details.recoverable,
      recoveryAction: contractError.details.action,
    };
  }

  // Check for network errors
  if (isNetworkError(errorMessage)) {
    return {
      category: "network_error",
      technicalMessage: errorMessage,
      userMessage: "Error de conexión con la blockchain",
      originalError,
      isRecoverable: true,
      recoveryAction: "Verifica tu conexión e intenta de nuevo",
    };
  }

  // Unknown error
  return {
    category: "unknown",
    technicalMessage: errorMessage,
    userMessage: "Error inesperado. Intenta de nuevo.",
    originalError,
    isRecoverable: true,
    recoveryAction: "Si el problema persiste, contacta soporte",
  };
}

/**
 * Get just the user message from an error
 */
export function getErrorMessage(error: unknown): string {
  return parseWeb3Error(error).userMessage;
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  return parseWeb3Error(error).isRecoverable;
}

// Helper functions

function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

function isUserRejection(message: string): boolean {
  const patterns = [
    "user rejected",
    "User rejected",
    "user denied",
    "User denied",
    "rejected the request",
    "cancelled",
    "canceled",
    "ACTION_REJECTED",
  ];
  return patterns.some((p) => message.includes(p));
}

function isInsufficientFunds(message: string): boolean {
  const patterns = [
    "insufficient funds",
    "Insufficient funds",
    "not enough funds",
    "gas required exceeds",
    "exceeds balance",
  ];
  return patterns.some((p) => message.includes(p));
}

function isNetworkError(message: string): boolean {
  const patterns = [
    "network",
    "timeout",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "ENOTFOUND",
    "fetch failed",
    "Failed to fetch",
    "disconnected",
  ];
  return patterns.some((p) => message.toLowerCase().includes(p.toLowerCase()));
}

function findContractError(
  message: string
): { key: string; details: (typeof CONTRACT_ERROR_MAP)[string] } | null {
  for (const [key, details] of Object.entries(CONTRACT_ERROR_MAP)) {
    if (message.includes(key)) {
      return { key, details };
    }
  }
  return null;
}

/**
 * Log error with context (for debugging)
 */
export function logWeb3Error(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === "development") {
    const parsed = parseWeb3Error(error);
    console.error(`[Web3Error]${context ? ` ${context}:` : ""}`, {
      category: parsed.category,
      technical: parsed.technicalMessage,
      recoverable: parsed.isRecoverable,
      originalError: parsed.originalError,
    });
  }
}
