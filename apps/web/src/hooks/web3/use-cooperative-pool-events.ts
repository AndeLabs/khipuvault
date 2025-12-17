/**
 * @fileoverview Event listener hook for Cooperative Pool contract events
 * @module hooks/web3/use-cooperative-pool-events
 *
 * This hook watches for contract events and automatically triggers
 * refetchQueries() to keep all pool data in sync with blockchain.
 *
 * This replaces inefficient polling with event-driven updates.
 * When events occur, ALL active TanStack Query queries are refetched.
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useWatchContractEvent } from "wagmi";

import {
  MEZO_TESTNET_ADDRESSES,
  COOPERATIVE_POOL_ABI,
} from "@/lib/web3/contracts-v3";

/**
 * Hook to watch for CooperativePool contract events and auto-refetch queries
 *
 * Events monitored:
 * - PoolCreated: New pool created
 * - PoolClosed: Pool closed
 * - MemberJoined: User joined a pool
 * - MemberLeft: User left a pool
 * - YieldClaimed: User claimed yield
 *
 * When any event is detected, ALL active queries are refetched immediately
 * using TanStack Query's refetchQueries({ type: 'active' })
 *
 * This is the best practice for real-time updates as recommended by TanStack Query docs
 */
export function useCooperativePoolEvents() {
  const queryClient = useQueryClient();
  const poolAddress = MEZO_TESTNET_ADDRESSES.cooperativePoolV3;

  // Watch for PoolCreated events
  useWatchContractEvent({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    eventName: "PoolCreated",
    onLogs(logs) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("🔔 PoolCreated event detected:", logs);
      }
      // Refetch ALL active queries immediately
      void queryClient.refetchQueries({ type: "active" });
    },
  });

  // Watch for PoolClosed events
  useWatchContractEvent({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    eventName: "PoolClosed",
    onLogs(logs) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("🔔 PoolClosed event detected:", logs);
      }
      void queryClient.refetchQueries({ type: "active" });
    },
  });

  // Watch for MemberJoined events
  useWatchContractEvent({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    eventName: "MemberJoined",
    onLogs(logs) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("🔔 MemberJoined event detected:", logs);
      }
      void queryClient.refetchQueries({ type: "active" });
    },
  });

  // Watch for MemberLeft events
  useWatchContractEvent({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    eventName: "MemberLeft",
    onLogs(logs) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("🔔 MemberLeft event detected:", logs);
      }
      void queryClient.refetchQueries({ type: "active" });
    },
  });

  // Watch for YieldClaimed events
  useWatchContractEvent({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    eventName: "YieldClaimed",
    onLogs(logs) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("🔔 YieldClaimed event detected:", logs);
      }
      void queryClient.refetchQueries({ type: "active" });
    },
  });

  // Watch for PartialWithdrawal events (V3)
  useWatchContractEvent({
    address: poolAddress,
    abi: COOPERATIVE_POOL_ABI,
    eventName: "PartialWithdrawal",
    onLogs(logs) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("🔔 PartialWithdrawal event detected:", logs);
      }
      void queryClient.refetchQueries({ type: "active" });
    },
  });
}
