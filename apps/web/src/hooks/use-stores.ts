import { useShallow } from "zustand/react/shallow";
import {
  useUIStore,
  useWalletStore,
  useTransactionStore,
  selectPendingTransactions,
  selectConfirmingTransactions,
  selectHasPendingTransactions,
  selectPendingTransactionsCount,
  selectIsSidebarOpen,
  selectIsSidebarCollapsed,
  selectActiveModals,
  selectNotifications,
  selectGlobalLoading,
  selectTheme,
  selectWalletStatus,
  selectWalletAddress,
  selectChainInfo,
  selectWalletPreferences,
  type TransactionType,
} from "@/lib/stores";
import type { Address } from "viem";

/**
 * Hook for UI store state and actions
 * Use with shallow comparison for better performance
 */
export function useUI() {
  return useUIStore(
    useShallow((state) => ({
      // State
      isSidebarOpen: state.isSidebarOpen,
      isSidebarCollapsed: state.isSidebarCollapsed,
      activeModals: state.activeModals,
      notifications: state.notifications,
      globalLoading: state.globalLoading,
      loadingMessage: state.loadingMessage,
      theme: state.theme,

      // Actions
      toggleSidebar: state.toggleSidebar,
      setSidebarOpen: state.setSidebarOpen,
      toggleSidebarCollapsed: state.toggleSidebarCollapsed,
      setSidebarCollapsed: state.setSidebarCollapsed,
      openModal: state.openModal,
      closeModal: state.closeModal,
      closeAllModals: state.closeAllModals,
      addNotification: state.addNotification,
      removeNotification: state.removeNotification,
      clearNotifications: state.clearNotifications,
      setGlobalLoading: state.setGlobalLoading,
      setTheme: state.setTheme,
    }))
  );
}

/**
 * Hook for wallet store state and actions
 */
export function useWallet() {
  return useWalletStore(
    useShallow((state) => ({
      // State
      status: state.status,
      address: state.address,
      isConnected: state.isConnected,
      chainId: state.chainId,
      chainName: state.chainName,
      connectorName: state.connectorName,
      balances: state.balances,
      lastActivity: state.lastActivity,
      autoConnect: state.autoConnect,
      preferredConnector: state.preferredConnector,

      // Actions
      setStatus: state.setStatus,
      setConnected: state.setConnected,
      setDisconnected: state.setDisconnected,
      setChain: state.setChain,
      setBalance: state.setBalance,
      clearBalances: state.clearBalances,
      updateActivity: state.updateActivity,
      setAutoConnect: state.setAutoConnect,
      setPreferredConnector: state.setPreferredConnector,
    }))
  );
}

/**
 * Hook for transaction store state and actions
 */
export function useTransactions() {
  return useTransactionStore(
    useShallow((state) => ({
      // State
      transactions: state.transactions,
      history: state.history,
      maxPendingTransactions: state.maxPendingTransactions,
      maxHistorySize: state.maxHistorySize,
      autoRemoveConfirmed: state.autoRemoveConfirmed,
      autoRemoveDelay: state.autoRemoveDelay,

      // Actions
      addTransaction: state.addTransaction,
      updateTransaction: state.updateTransaction,
      updateTransactionByHash: state.updateTransactionByHash,
      setTransactionStatus: state.setTransactionStatus,
      setTransactionStatusByHash: state.setTransactionStatusByHash,
      setConfirmations: state.setConfirmations,
      setConfirmationsByHash: state.setConfirmationsByHash,
      removeTransaction: state.removeTransaction,
      removeTransactionByHash: state.removeTransactionByHash,
      moveToHistory: state.moveToHistory,
      clearCompleted: state.clearCompleted,
      clearFailed: state.clearFailed,
      clearAll: state.clearAll,
      clearHistory: state.clearHistory,
    }))
  );
}

/**
 * Hook for pending transactions only
 * Optimized selector that only re-renders when pending txs change
 */
export function usePendingTransactions() {
  const pending = useTransactionStore(selectPendingTransactions);
  const confirming = useTransactionStore(selectConfirmingTransactions);

  return {
    pending,
    confirming,
    all: [...pending, ...confirming],
    hasPending: pending.length > 0 || confirming.length > 0,
    count: pending.length + confirming.length,
  };
}

/**
 * Hook to check if there are pending transactions
 * Very lightweight, only returns boolean
 */
export function useHasPendingTransactions() {
  return useTransactionStore(selectHasPendingTransactions);
}

/**
 * Hook to get count of pending transactions
 */
export function usePendingTransactionsCount() {
  return useTransactionStore(selectPendingTransactionsCount);
}

/**
 * Hook for sidebar state
 */
export function useSidebar() {
  return useUIStore(
    useShallow((state) => ({
      isOpen: state.isSidebarOpen,
      isCollapsed: state.isSidebarCollapsed,
      toggle: state.toggleSidebar,
      setOpen: state.setSidebarOpen,
      toggleCollapsed: state.toggleSidebarCollapsed,
      setCollapsed: state.setSidebarCollapsed,
    }))
  );
}

/**
 * Hook for notifications
 */
export function useNotifications() {
  return useUIStore(
    useShallow((state) => ({
      notifications: state.notifications,
      add: state.addNotification,
      remove: state.removeNotification,
      clear: state.clearNotifications,
    }))
  );
}

/**
 * Hook for modals
 */
export function useModals() {
  return useUIStore(
    useShallow((state) => ({
      activeModals: state.activeModals,
      open: state.openModal,
      close: state.closeModal,
      closeAll: state.closeAllModals,
    }))
  );
}

/**
 * Hook for theme
 */
export function useTheme() {
  return useUIStore(
    useShallow((state) => ({
      theme: state.theme,
      setTheme: state.setTheme,
    }))
  );
}

/**
 * Hook for global loading state
 */
export function useGlobalLoading() {
  return useUIStore(
    useShallow((state) => ({
      loading: state.globalLoading,
      message: state.loadingMessage,
      setLoading: state.setGlobalLoading,
    }))
  );
}

/**
 * Hook for wallet connection status
 */
export function useWalletStatus() {
  return useWalletStore(selectWalletStatus);
}

/**
 * Hook for wallet address
 */
export function useWalletAddress() {
  return useWalletStore(selectWalletAddress);
}

/**
 * Hook for chain info
 */
export function useChainInfo() {
  return useWalletStore(selectChainInfo);
}

/**
 * Hook for wallet preferences
 */
export function useWalletPreferences() {
  return useWalletStore(selectWalletPreferences);
}

/**
 * Hook to get balance for a specific token
 */
export function useTokenBalance(token: string) {
  return useWalletStore((state) => state.balances[token]);
}

/**
 * Hook for all balances
 */
export function useAllBalances() {
  return useWalletStore((state) => state.balances);
}

/**
 * Hook to add a transaction and track it
 * Returns helper functions to update the transaction status
 */
export function useTransactionTracker() {
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const setTransactionStatus = useTransactionStore((state) => state.setTransactionStatus);
  const setConfirmations = useTransactionStore((state) => state.setConfirmations);

  return {
    trackTransaction: (
      hash: `0x${string}`,
      type: TransactionType,
      from: Address,
      metadata?: Record<string, unknown>
    ) => {
      const id = addTransaction(hash, type, from, metadata);
      return {
        id,
        hash,
        setStatus: (
          status: "pending" | "confirming" | "confirmed" | "failed" | "cancelled",
          error?: string
        ) => setTransactionStatus(id, status, error),
        setConfirmations: (confirmations: number) => setConfirmations(id, confirmations),
      };
    },
  };
}

/**
 * Convenience hook to add a notification with common patterns
 */
export function useNotify() {
  const addNotification = useUIStore((state) => state.addNotification);

  return {
    success: (title: string, message?: string, duration = 5000) =>
      addNotification({ type: "success", title, message, duration }),

    error: (title: string, message?: string, duration = 8000) =>
      addNotification({ type: "error", title, message, duration }),

    warning: (title: string, message?: string, duration = 6000) =>
      addNotification({ type: "warning", title, message, duration }),

    info: (title: string, message?: string, duration = 5000) =>
      addNotification({ type: "info", title, message, duration }),
  };
}

/**
 * Hook to sync Wagmi wallet state with Zustand store
 * Use this in a top-level component
 */
export function useSyncWalletState(
  address?: Address,
  isConnected?: boolean,
  chainId?: number,
  connectorName?: string
) {
  const setConnected = useWalletStore((state) => state.setConnected);
  const setDisconnected = useWalletStore((state) => state.setDisconnected);
  const setChain = useWalletStore((state) => state.setChain);

  // Sync connection state
  if (isConnected && address && chainId) {
    setConnected(address, chainId, connectorName);
  } else if (!isConnected) {
    setDisconnected();
  }

  // Sync chain changes
  if (isConnected && chainId) {
    setChain(chainId);
  }
}
