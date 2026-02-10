/**
 * @fileoverview MUSD Balance Hook
 * @module hooks/web3/use-musd-balance
 *
 * Simple hook to get user's mUSD token balance
 */

"use client";

import { formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";

import { MEZO_TESTNET_ADDRESSES, MUSD_ABI } from "@/lib/web3/contracts";

const MUSD_ADDRESS = MEZO_TESTNET_ADDRESSES.musd as `0x${string}`;

/**
 * Hook to get mUSD balance for the connected user
 */
export function useMusdBalance() {
  const { address, isConnected } = useAccount();

  const {
    data: balance,
    isLoading,
    refetch,
  } = useReadContract({
    address: MUSD_ADDRESS,
    abi: MUSD_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
      staleTime: 10 * 1000,
    },
  });

  const balanceValue = balance ? BigInt(balance as bigint) : BigInt(0);

  return {
    balance: balanceValue,
    formatted: formatUnits(balanceValue, 18),
    isLoading,
    refetch,
  };
}

/**
 * Format mUSD amount for display
 */
export function formatMusd(amount: bigint): string {
  const formatted = formatUnits(amount, 18);
  const num = parseFloat(formatted);

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}k`;
  }
  if (num >= 1) {
    return num.toFixed(2);
  }
  if (num >= 0.01) {
    return num.toFixed(4);
  }
  return num.toFixed(6);
}
