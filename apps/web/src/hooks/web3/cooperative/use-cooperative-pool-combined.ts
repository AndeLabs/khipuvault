/**
 * @fileoverview Combined Cooperative Pool Hook
 * @module hooks/web3/cooperative/use-cooperative-pool-combined
 *
 * Main hook combining all cooperative pool functionality
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";

import { MEZO_TESTNET_ADDRESSES } from "@/lib/web3/contracts";

import { QUERY_KEYS } from "./constants";
import {
  useCreatePool,
  useJoinPool,
  useLeavePool,
  useClaimYield,
  useClosePool,
} from "./use-pool-mutations";
import { usePoolCounter, usePerformanceFee, useEmergencyMode } from "./use-pool-queries";

/**
 * Main hook combining all cooperative pool functionality
 * This is the primary hook that should be used in components
 */
export function useCooperativePool() {
  const queryClient = useQueryClient();

  // Queries
  const poolCounterQuery = usePoolCounter();
  const performanceFeeQuery = usePerformanceFee();
  const emergencyModeQuery = useEmergencyMode();

  // Mutations
  const createPoolMutation = useCreatePool();
  const joinPoolMutation = useJoinPool();
  const leavePoolMutation = useLeavePool();
  const claimYieldMutation = useClaimYield();
  const closePoolMutation = useClosePool();

  // Utility functions
  const refetchAll = () => {
    return queryClient.refetchQueries({ queryKey: QUERY_KEYS.BASE });
  };

  const invalidateAll = () => {
    return queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BASE });
  };

  // Return combined interface
  return {
    // Pool creation
    createPool: createPoolMutation.createPool,

    // Pool membership
    joinPool: joinPoolMutation.joinPool,
    leavePool: leavePoolMutation.leavePool,

    // Yield management
    claimYield: claimYieldMutation.claimYield,

    // Pool management
    closePool: closePoolMutation.closePool,

    // Utility functions
    reset: createPoolMutation.reset, // Any mutation's reset works
    refetchAll,
    invalidateAll,

    // Transaction state (prioritize the most recent action)
    state: (() => {
      if (createPoolMutation.state !== "idle") {
        return createPoolMutation.state;
      }
      if (joinPoolMutation.state !== "idle") {
        return joinPoolMutation.state;
      }
      if (leavePoolMutation.state !== "idle") {
        return leavePoolMutation.state;
      }
      if (claimYieldMutation.state !== "idle") {
        return claimYieldMutation.state;
      }
      if (closePoolMutation.state !== "idle") {
        return closePoolMutation.state;
      }
      return "idle";
    })(),

    error:
      createPoolMutation.error ??
      joinPoolMutation.error ??
      leavePoolMutation.error ??
      claimYieldMutation.error ??
      closePoolMutation.error,

    txHash:
      createPoolMutation.txHash ??
      joinPoolMutation.txHash ??
      leavePoolMutation.txHash ??
      claimYieldMutation.txHash ??
      closePoolMutation.txHash,

    isProcessing:
      createPoolMutation.isProcessing ||
      joinPoolMutation.isProcessing ||
      leavePoolMutation.isProcessing ||
      claimYieldMutation.isProcessing ||
      closePoolMutation.isProcessing,

    // Pool data from queries
    poolCounter: poolCounterQuery.data ?? 0,
    performanceFee: performanceFeeQuery.data ?? 100, // 1% default
    emergencyMode: emergencyModeQuery.data ?? false,

    // Connection info
    isConnected: createPoolMutation.isConnected,
    address: createPoolMutation.address,

    // Contract address (fixed: was incorrectly using user address)
    poolAddress: MEZO_TESTNET_ADDRESSES.cooperativePool,
  };
}
