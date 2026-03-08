import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Address, Hash } from "viem";

export type TransactionStatus = "pending" | "confirming" | "confirmed" | "failed" | "cancelled";

export type TransactionType =
  | "deposit"
  | "withdraw"
  | "approve"
  | "claim"
  | "join_pool"
  | "contribute"
  | "buy_tickets"
  | "create_pool"
  | "other";

export interface PendingTransaction {
  id: string;
  hash: Hash;
  type: TransactionType;
  status: TransactionStatus;
  from: Address;
  to?: Address;
  value?: bigint;
  timestamp: number;
  confirmations: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

interface TransactionState {
  // Pending transactions
  transactions: PendingTransaction[];

  // Transaction history (completed/failed)
  history: PendingTransaction[];

  // Settings
  maxPendingTransactions: number;
  maxHistorySize: number;
  autoRemoveConfirmed: boolean;
  autoRemoveDelay: number; // ms
}

interface TransactionActions {
  // Add transaction
  addTransaction: (
    hash: Hash,
    type: TransactionType,
    from: Address,
    metadata?: Record<string, unknown>
  ) => string;

  // Update transaction
  updateTransaction: (
    id: string,
    updates: Partial<Omit<PendingTransaction, "id" | "hash" | "timestamp">>
  ) => void;

  // Update by hash
  updateTransactionByHash: (
    hash: Hash,
    updates: Partial<Omit<PendingTransaction, "id" | "hash" | "timestamp">>
  ) => void;

  // Set transaction status
  setTransactionStatus: (id: string, status: TransactionStatus, error?: string) => void;
  setTransactionStatusByHash: (hash: Hash, status: TransactionStatus, error?: string) => void;

  // Set confirmations
  setConfirmations: (id: string, confirmations: number) => void;
  setConfirmationsByHash: (hash: Hash, confirmations: number) => void;

  // Remove transaction
  removeTransaction: (id: string) => void;
  removeTransactionByHash: (hash: Hash) => void;

  // Move to history
  moveToHistory: (id: string) => void;

  // Clear
  clearCompleted: () => void;
  clearFailed: () => void;
  clearAll: () => void;
  clearHistory: () => void;

  // Settings
  setMaxPendingTransactions: (max: number) => void;
  setMaxHistorySize: (max: number) => void;
  setAutoRemoveConfirmed: (autoRemove: boolean) => void;
  setAutoRemoveDelay: (delay: number) => void;

  // Reset
  reset: () => void;
}

export type TransactionStore = TransactionState & TransactionActions;

const initialState: TransactionState = {
  transactions: [],
  history: [],
  maxPendingTransactions: 10,
  maxHistorySize: 50,
  autoRemoveConfirmed: true,
  autoRemoveDelay: 5000,
};

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Add transaction
      addTransaction: (hash, type, from, metadata) => {
        const id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? `tx-${crypto.randomUUID()}`
            : `tx-${Date.now()}-${performance.now().toString(36).replace(".", "")}`;
        const transaction: PendingTransaction = {
          id,
          hash,
          type,
          status: "pending",
          from,
          timestamp: Date.now(),
          confirmations: 0,
          metadata,
        };

        set((state) => {
          const transactions = [transaction, ...state.transactions];
          // Limit pending transactions
          if (transactions.length > state.maxPendingTransactions) {
            transactions.splice(state.maxPendingTransactions);
          }
          return { transactions };
        });

        return id;
      },

      // Update transaction
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx)),
        })),

      // Update by hash
      updateTransactionByHash: (hash, updates) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.hash === hash ? { ...tx, ...updates } : tx
          ),
        })),

      // Set transaction status
      setTransactionStatus: (id, status, error) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, status, error } : tx
          ),
        }));

        // Auto-remove if confirmed and enabled
        if (status === "confirmed" && get().autoRemoveConfirmed) {
          setTimeout(() => {
            get().moveToHistory(id);
          }, get().autoRemoveDelay);
        }
      },

      setTransactionStatusByHash: (hash, status, error) => {
        const tx = get().transactions.find((t) => t.hash === hash);
        if (tx) {
          get().setTransactionStatus(tx.id, status, error);
        }
      },

      // Set confirmations
      setConfirmations: (id, confirmations) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, confirmations } : tx
          ),
        })),

      setConfirmationsByHash: (hash, confirmations) => {
        const tx = get().transactions.find((t) => t.hash === hash);
        if (tx) {
          get().setConfirmations(tx.id, confirmations);
        }
      },

      // Remove transaction
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        })),

      removeTransactionByHash: (hash) =>
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.hash !== hash),
        })),

      // Move to history
      moveToHistory: (id) =>
        set((state) => {
          const tx = state.transactions.find((t) => t.id === id);
          if (!tx) {
            return state;
          }

          const transactions = state.transactions.filter((t) => t.id !== id);
          const history = [tx, ...state.history];

          // Limit history size
          if (history.length > state.maxHistorySize) {
            history.splice(state.maxHistorySize);
          }

          return { transactions, history };
        }),

      // Clear
      clearCompleted: () =>
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.status !== "confirmed"),
        })),

      clearFailed: () =>
        set((state) => ({
          transactions: state.transactions.filter(
            (tx) => tx.status !== "failed" && tx.status !== "cancelled"
          ),
        })),

      clearAll: () => set({ transactions: [] }),

      clearHistory: () => set({ history: [] }),

      // Settings
      setMaxPendingTransactions: (max) => set({ maxPendingTransactions: max }),

      setMaxHistorySize: (max) => set({ maxHistorySize: max }),

      setAutoRemoveConfirmed: (autoRemove) => set({ autoRemoveConfirmed: autoRemove }),

      setAutoRemoveDelay: (delay) => set({ autoRemoveDelay: delay }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: "khipu-transaction-store",
      partialize: (state) => ({
        transactions: state.transactions,
        history: state.history,
        autoRemoveConfirmed: state.autoRemoveConfirmed,
        autoRemoveDelay: state.autoRemoveDelay,
      }),
    }
  )
);

// Selectors
export const selectAllTransactions = (state: TransactionStore) => state.transactions;

export const selectPendingTransactions = (state: TransactionStore) =>
  state.transactions.filter((tx) => tx.status === "pending");

export const selectConfirmingTransactions = (state: TransactionStore) =>
  state.transactions.filter((tx) => tx.status === "confirming");

export const selectFailedTransactions = (state: TransactionStore) =>
  state.transactions.filter((tx) => tx.status === "failed" || tx.status === "cancelled");

export const selectTransactionById = (id: string) => (state: TransactionStore) =>
  state.transactions.find((tx) => tx.id === id);

export const selectTransactionByHash = (hash: Hash) => (state: TransactionStore) =>
  state.transactions.find((tx) => tx.hash === hash);

export const selectTransactionsByType = (type: TransactionType) => (state: TransactionStore) =>
  state.transactions.filter((tx) => tx.type === type);

export const selectTransactionHistory = (state: TransactionStore) => state.history;

export const selectHasPendingTransactions = (state: TransactionStore) =>
  state.transactions.some((tx) => tx.status === "pending" || tx.status === "confirming");

export const selectPendingTransactionsCount = (state: TransactionStore) =>
  state.transactions.filter((tx) => tx.status === "pending" || tx.status === "confirming").length;
