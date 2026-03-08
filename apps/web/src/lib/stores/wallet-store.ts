import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Address } from "viem";

export type WalletConnectionStatus = "disconnected" | "connecting" | "connected";

export type SupportedChain = "rootstock" | "bob" | "mezo";

interface WalletState {
  // Connection status
  status: WalletConnectionStatus;
  address?: Address;
  isConnected: boolean;

  // Chain info
  chainId?: number;
  chainName?: SupportedChain;

  // Connector info
  connectorName?: string;

  // Balances (cached)
  balances: Record<string, bigint>;

  // Last activity
  lastActivity?: number;

  // Preferences
  autoConnect: boolean;
  preferredConnector?: string;
}

interface WalletActions {
  // Connection actions
  setStatus: (status: WalletConnectionStatus) => void;
  setConnected: (address: Address, chainId: number, connectorName?: string) => void;
  setDisconnected: () => void;

  // Chain actions
  setChain: (chainId: number, chainName?: SupportedChain) => void;

  // Balance actions
  setBalance: (token: string, balance: bigint) => void;
  clearBalances: () => void;

  // Activity tracking
  updateActivity: () => void;

  // Preferences
  setAutoConnect: (autoConnect: boolean) => void;
  setPreferredConnector: (connectorName: string) => void;

  // Reset
  reset: () => void;
}

export type WalletStore = WalletState & WalletActions;

const initialState: WalletState = {
  status: "disconnected",
  address: undefined,
  isConnected: false,
  chainId: undefined,
  chainName: undefined,
  connectorName: undefined,
  balances: {},
  lastActivity: undefined,
  autoConnect: true,
  preferredConnector: undefined,
};

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Connection actions
      setStatus: (status) => set({ status }),

      setConnected: (address, chainId, connectorName) =>
        set({
          status: "connected",
          address,
          chainId,
          connectorName,
          isConnected: true,
          lastActivity: Date.now(),
        }),

      setDisconnected: () =>
        set({
          status: "disconnected",
          address: undefined,
          chainId: undefined,
          connectorName: undefined,
          isConnected: false,
          balances: {},
        }),

      // Chain actions
      setChain: (chainId, chainName) => set({ chainId, chainName }),

      // Balance actions
      setBalance: (token, balance) =>
        set((state) => ({
          balances: { ...state.balances, [token]: balance },
        })),

      clearBalances: () => set({ balances: {} }),

      // Activity tracking
      updateActivity: () => set({ lastActivity: Date.now() }),

      // Preferences
      setAutoConnect: (autoConnect) => set({ autoConnect }),

      setPreferredConnector: (preferredConnector) => set({ preferredConnector }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: "khipu-wallet-store",
      partialize: (state) => ({
        autoConnect: state.autoConnect,
        preferredConnector: state.preferredConnector,
      }),
    }
  )
);

// Selectors
export const selectWalletStatus = (state: WalletStore) => ({
  status: state.status,
  isConnected: state.isConnected,
  address: state.address,
});

export const selectWalletAddress = (state: WalletStore) => state.address;

export const selectChainInfo = (state: WalletStore) => ({
  chainId: state.chainId,
  chainName: state.chainName,
});

export const selectBalance = (token: string) => (state: WalletStore) => state.balances[token];

export const selectAllBalances = (state: WalletStore) => state.balances;

export const selectWalletPreferences = (state: WalletStore) => ({
  autoConnect: state.autoConnect,
  preferredConnector: state.preferredConnector,
});

export const selectLastActivity = (state: WalletStore) => state.lastActivity;
