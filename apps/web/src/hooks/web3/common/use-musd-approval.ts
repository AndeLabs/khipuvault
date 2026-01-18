/**
 * @fileoverview MUSD Approval Hook - Production Ready
 * @module hooks/web3/use-musd-approval
 *
 * Handles ERC20 MUSD token approval flow with proper state management
 * Uses Wagmi v2 patterns: useWriteContract + useWaitForTransactionReceipt
 *
 * Features:
 * - Tracks approval state (pending, confirmed, etc.)
 * - Caches approval checks to reduce RPC calls
 * - Auto-refetch on block changes
 * - Proper error handling
 * - Production-grade TypeScript
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { parseEther } from "viem";
import {
  useBlockNumber,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";

import { MEZO_TESTNET_ADDRESSES, MUSD_ABI } from "@/lib/web3/contracts";

const MUSD_ADDRESS = MEZO_TESTNET_ADDRESSES.musd as `0x${string}`;
const POOL_ADDRESS = MEZO_TESTNET_ADDRESSES.individualPool as `0x${string}`;

/**
 * Hook to manage MUSD approval flow
 *
 * Usage:
 * ```tsx
 * const {
 *   musdBalance,
 *   isApprovalNeeded,
 *   approve,
 *   isApproving,
 *   isApprovalConfirmed,
 *   error
 * } = useMusdApproval()
 *
 * // Check if amount needs approval
 * const needsApproval = isApprovalNeeded(parseEther('100'))
 *
 * // Approve
 * await approve(parseEther('100'))
 * ```
 */
export function useMusdApproval() {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  // Watch block number for real-time updates
  const { data: blockNumber } = useBlockNumber({ watch: true });

  // Get MUSD balance
  const { data: musdBalance, isLoading: balanceLoading } = useReadContract({
    address: MUSD_ADDRESS,
    abi: MUSD_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
      staleTime: 10 * 1000, // 10 seconds
    },
  });

  // Get current approval amount
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: MUSD_ADDRESS,
    abi: MUSD_ABI,
    functionName: "allowance",
    args: address ? [address, POOL_ADDRESS] : undefined,
    query: {
      enabled: !!address && isConnected,
      staleTime: 10 * 1000,
    },
  });

  // Refetch allowance on block changes
  useEffect(() => {
    if (blockNumber) {
      void refetchAllowance();
    }
  }, [blockNumber, refetchAllowance]);

  // Write contract: approve
  const {
    writeContract,
    data: approveTxHash,
    error: approveError,
    isPending: isApprovePending,
  } = useWriteContract();

  // Wait for approval transaction
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({
      hash: approveTxHash,
      pollingInterval: 3000, // Check every 3 seconds (balanced responsiveness vs RPC load)
    });

  /**
   * Check if a given amount needs approval
   * Returns true if current allowance < amount
   */
  function isApprovalNeeded(amountWei: bigint): boolean {
    if (!allowance) {
      return true;
    }
    const currentAllowance = BigInt((allowance as unknown as bigint) || 0n);
    return currentAllowance < amountWei;
  }

  /**
   * Approve unlimited MUSD spending
   * Best practice: approve unlimited to avoid repeated approvals
   */
  async function approveUnlimited(): Promise<void> {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    // Approve unlimited (max uint256)
    const MAX_UINT256 = BigInt(
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    );

    writeContract({
      address: MUSD_ADDRESS,
      abi: MUSD_ABI,
      functionName: "approve",
      args: [POOL_ADDRESS, MAX_UINT256],
    });
  }

  /**
   * Approve specific amount
   * Less gas efficient but more secure
   */
  async function approveAmount(amount: string | bigint): Promise<void> {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    const amountWei = typeof amount === "string" ? parseEther(amount) : amount;

    writeContract({
      address: MUSD_ADDRESS,
      abi: MUSD_ABI,
      functionName: "approve",
      args: [POOL_ADDRESS, amountWei],
    });
  }

  /**
   * Auto-refetch allowance when approval is confirmed
   */
  useEffect(() => {
    if (isApproveConfirmed) {
      // Small delay to ensure blockchain state is updated
      const timer = setTimeout(() => {
        void refetchAllowance();
        // Invalidate all relevant queries
        void queryClient.invalidateQueries({
          queryKey: ["individual-pool-v3"],
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isApproveConfirmed, refetchAllowance, queryClient]);

  return {
    // Balance info
    musdBalance: musdBalance ? BigInt((musdBalance as unknown as bigint) || 0n) : undefined,
    balanceFormatted: musdBalance
      ? formatMUSDFromWei(BigInt((musdBalance as unknown as bigint) || 0n))
      : "0.00",

    // Allowance info
    allowance: allowance ? BigInt((allowance as unknown as bigint) || 0n) : undefined,
    isApprovalNeeded,

    // Approval actions
    approveUnlimited,
    approveAmount,

    // Approval states
    isApproving: isApprovePending,
    isApproveConfirming,
    isApprovalConfirmed: isApproveConfirmed,
    isApprovePending: isApprovePending || isApproveConfirming,

    // Errors and states
    error: approveError?.message ?? null,
    isLoading: balanceLoading,
    isConnected: isConnected && !!address,
  };
}

/**
 * Helper: Format MUSD from wei
 * MUSD has 18 decimals
 */
export function formatMUSDFromWei(amount: bigint | number | undefined): string {
  if (!amount) {
    return "0.00";
  }
  const musd = Number(amount) / 1e18;
  return musd.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Helper: Format MUSD (short version)
 */
export function formatMUSDShort(amount: bigint | number | undefined): string {
  if (!amount) {
    return "0";
  }
  const musd = Number(amount) / 1e18;
  if (musd >= 1000) {
    return `${(musd / 1000).toFixed(1)}k`;
  }
  return musd.toFixed(0);
}

/**
 * Helper: Format full MUSD amount
 */
export function formatMUSD(amount: bigint | number | undefined): string {
  if (!amount) {
    return "0.00 MUSD";
  }
  return `${formatMUSDFromWei(amount)} MUSD`;
}
