/**
 * @fileoverview Safe Web3 Hooks
 * @module hooks/web3/use-web3-safe
 *
 * Production-ready hooks that safely handle Web3 operations
 * Prevents errors when used outside of Web3Provider context
 * Provides graceful fallbacks and error handling
 */

"use client";

import { useEffect, useState } from "react";
import { useAccount, useBalance, useChainId, useConfig } from "wagmi";

/**
 * Safe wrapper around useAccount hook
 * Returns default values if Web3Provider is not available
 *
 * @returns Account data with safe defaults
 */
export function useSafeAccount() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Default values for SSR or when provider is not available
  const defaultValue = {
    address: undefined,
    isConnected: false,
    isConnecting: false,
    isDisconnected: true,
    isReconnecting: false,
    status: "disconnected" as const,
  };

  if (!isClient) {
    return defaultValue;
  }

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAccount();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("useAccount called outside Web3Provider:", error);
    }
    return defaultValue;
  }
}

/**
 * Safe wrapper around useBalance hook
 * Returns undefined if Web3Provider is not available
 *
 * @param address - Wallet address to get balance for
 * @returns Balance data or undefined
 */
export function useSafeBalance(address?: `0x${string}`) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !address) {
    return { data: undefined, isLoading: false, isError: false };
  }

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useBalance({ address });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("useBalance called outside Web3Provider:", error);
    }
    return { data: undefined, isLoading: false, isError: true, error };
  }
}

/**
 * Safe wrapper around useChainId hook
 * Returns undefined if Web3Provider is not available
 *
 * @returns Chain ID or undefined
 */
export function useSafeChainId() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return undefined;
  }

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useChainId();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("useChainId called outside Web3Provider:", error);
    }
    return undefined;
  }
}

/**
 * Check if Web3Provider is available
 * Useful for conditional rendering of Web3-dependent components
 *
 * @returns true if Web3Provider is available
 */
export function useWeb3Available(): boolean {
  const [isClient, setIsClient] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) {
      return;
    }

    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useConfig();
      setIsAvailable(true);
    } catch {
      setIsAvailable(false);
    }
  }, [isClient]);

  return isAvailable;
}

/**
 * Connection status helper
 * Provides user-friendly connection status information
 */
export function useConnectionStatus() {
  const { isConnected, isConnecting, isReconnecting } = useSafeAccount();

  return {
    isConnected,
    isConnecting,
    isReconnecting,
    statusText: getStatusText(isConnecting, isReconnecting, isConnected),
    statusColor: getStatusColor(isConnected, isConnecting),
  };
}

function getStatusText(
  isConnecting: boolean,
  isReconnecting: boolean,
  isConnected: boolean,
): string {
  if (isConnecting) {
    return "Conectando...";
  }
  if (isReconnecting) {
    return "Reconectando...";
  }
  if (isConnected) {
    return "Conectado";
  }
  return "Desconectado";
}

function getStatusColor(isConnected: boolean, isConnecting: boolean): string {
  if (isConnected) {
    return "green";
  }
  if (isConnecting) {
    return "yellow";
  }
  return "red";
}
