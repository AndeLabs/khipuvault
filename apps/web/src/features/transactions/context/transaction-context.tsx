"use client";

import * as React from "react";

import { useToast } from "@/hooks/use-toast";

import type { TransactionState } from "@/components/common/transaction-status";

/**
 * Transaction Manager Context
 *
 * Unified system for managing blockchain transactions with:
 * - 7-step transaction feedback
 * - Error recovery
 * - Transaction history
 * - Toast notifications
 * - Optimistic updates
 */

interface Transaction {
  id: string;
  type: string;
  status: TransactionState;
  message?: string;
  txHash?: string;
  timestamp: number;
  data?: any;
}

interface TransactionContextValue {
  transactions: Transaction[];
  activeTransaction: Transaction | null;
  startTransaction: (type: string, data?: any) => string;
  updateTransaction: (
    id: string,
    update: Partial<Omit<Transaction, "id" | "timestamp">>,
  ) => void;
  completeTransaction: (id: string, txHash?: string) => void;
  failTransaction: (id: string, error: string) => void;
  rejectTransaction: (id: string) => void;
  clearTransaction: (id: string) => void;
  clearAllTransactions: () => void;
}

const TransactionContext = React.createContext<
  TransactionContextValue | undefined
>(undefined);

interface TransactionProviderProps {
  children: React.ReactNode;
  maxHistory?: number;
}

export function TransactionProvider({
  children,
  maxHistory = 50,
}: TransactionProviderProps) {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const { toast } = useToast();

  const activeTransaction = React.useMemo(
    () =>
      transactions.find(
        (tx) =>
          tx.status === "pending" ||
          tx.status === "signing" ||
          tx.status === "confirming",
      ) || null,
    [transactions],
  );

  const startTransaction = React.useCallback(
    (type: string, data?: any) => {
      const id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newTransaction: Transaction = {
        id,
        type,
        status: "pending",
        timestamp: Date.now(),
        data,
      };

      setTransactions((prev) => {
        const updated = [newTransaction, ...prev];
        return updated.slice(0, maxHistory);
      });

      return id;
    },
    [maxHistory],
  );

  const updateTransaction = React.useCallback(
    (id: string, update: Partial<Omit<Transaction, "id" | "timestamp">>) => {
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, ...update } : tx)),
      );
    },
    [],
  );

  const completeTransaction = React.useCallback(
    (id: string, txHash?: string) => {
      // Use functional update to get current transaction data and avoid stale closure
      setTransactions((prev) => {
        const transaction = prev.find((tx) => tx.id === id);
        if (transaction) {
          // Show toast with current transaction data (not stale closure)
          toast({
            title: "Transaction Successful",
            description: `${transaction.type} completed successfully`,
            variant: "default",
          });
        }
        return prev.map((tx) =>
          tx.id === id
            ? { ...tx, status: "success" as TransactionState, txHash }
            : tx,
        );
      });
    },
    [toast],
  );

  const failTransaction = React.useCallback(
    (id: string, error: string) => {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === id
            ? { ...tx, status: "error" as TransactionState, message: error }
            : tx,
        ),
      );

      toast({
        title: "Transaction Failed",
        description: error,
        variant: "destructive",
      });
    },
    [toast],
  );

  const rejectTransaction = React.useCallback((id: string) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              status: "rejected" as TransactionState,
              message: "Transaction rejected by user",
            }
          : tx,
      ),
    );
  }, []);

  const clearTransaction = React.useCallback((id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }, []);

  const clearAllTransactions = React.useCallback(() => {
    setTransactions([]);
  }, []);

  const value: TransactionContextValue = {
    transactions,
    activeTransaction,
    startTransaction,
    updateTransaction,
    completeTransaction,
    failTransaction,
    rejectTransaction,
    clearTransaction,
    clearAllTransactions,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransaction() {
  const context = React.useContext(TransactionContext);
  if (!context) {
    throw new Error("useTransaction must be used within TransactionProvider");
  }
  return context;
}

/**
 * Hook for executing a transaction with automatic state management
 */
interface UseTransactionExecuteOptions<T = any> {
  type: string;
  onSign?: () => void | Promise<void>;
  onConfirm?: () => void | Promise<void>;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
}

export function useTransactionExecute<T = any>(
  options: UseTransactionExecuteOptions<T>,
) {
  const {
    startTransaction,
    updateTransaction,
    completeTransaction,
    failTransaction,
    rejectTransaction,
  } = useTransaction();

  const execute = React.useCallback(
    async (fn: () => Promise<T>) => {
      const txId = startTransaction(options.type);

      try {
        // Step 1: Signing
        updateTransaction(txId, {
          status: "signing",
          message: "Please sign the transaction in your wallet",
        });

        if (options.onSign) {
          await options.onSign();
        }

        // Step 2: Execute transaction
        const result = await fn();

        // Step 3: Confirming
        updateTransaction(txId, {
          status: "confirming",
          message: "Waiting for blockchain confirmation",
        });

        if (options.onConfirm) {
          await options.onConfirm();
        }

        // Step 4: Success
        completeTransaction(txId, (result as any)?.hash);

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error: any) {
        // Check if user rejected
        if (
          error?.code === 4001 ||
          error?.code === "ACTION_REJECTED" ||
          error?.message?.includes("rejected") ||
          error?.message?.includes("denied")
        ) {
          rejectTransaction(txId);
        } else {
          // Transaction failed
          failTransaction(
            txId,
            error?.message || "Transaction failed. Please try again.",
          );

          if (options.onError) {
            options.onError(error);
          }
        }

        throw error;
      }
    },
    [
      startTransaction,
      updateTransaction,
      completeTransaction,
      failTransaction,
      rejectTransaction,
      options,
    ],
  );

  return { execute };
}
