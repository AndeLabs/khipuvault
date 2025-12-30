/**
 * @fileoverview Event listener hook for Lottery Pool contract events
 * @module hooks/web3/use-lottery-pool-events
 *
 * This hook watches for contract events and automatically triggers
 * refetchQueries() to keep all lottery data in sync with blockchain.
 *
 * This replaces inefficient polling with event-driven updates.
 * When events occur, ALL active TanStack Query queries are refetched.
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useWatchContractEvent } from "wagmi";

import { MEZO_TESTNET_ADDRESSES } from "@/lib/web3/contracts";
import { LOTTERY_POOL_ABI } from "@/lib/web3/lottery-pool-abi";

import type { Address } from "viem";

// Use centralized contract address config
const LOTTERY_POOL_ADDRESS = MEZO_TESTNET_ADDRESSES.lotteryPool as Address;

/**
 * Hook to watch for LotteryPool contract events and auto-refetch queries
 *
 * Events monitored (from ABI):
 * - RoundCreated: New lottery round created
 * - TicketsPurchased: User bought tickets
 * - WinnerSelected: Round drawing completed, winner selected
 * - PrizeClaimed: Winner claimed prize
 *
 * When any event is detected, ALL active queries are refetched immediately
 * using TanStack Query's refetchQueries({ type: 'active' })
 *
 * This is the best practice for real-time updates as recommended by TanStack Query docs
 */
export function useLotteryPoolEvents() {
  const queryClient = useQueryClient();

  // Watch for RoundCreated events
  useWatchContractEvent({
    address: LOTTERY_POOL_ADDRESS,
    abi: LOTTERY_POOL_ABI,
    eventName: "RoundCreated",
    onLogs(logs) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("🔔 RoundCreated event detected:", logs);
      }
      void queryClient.refetchQueries({ type: "active" });
    },
  });

  // Watch for TicketsPurchased events
  useWatchContractEvent({
    address: LOTTERY_POOL_ADDRESS,
    abi: LOTTERY_POOL_ABI,
    eventName: "TicketsPurchased",
    onLogs(logs) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("🔔 TicketsPurchased event detected:", logs);
      }
      void queryClient.refetchQueries({ type: "active" });
    },
  });

  // Watch for WinnerSelected events (round drawing completed)
  useWatchContractEvent({
    address: LOTTERY_POOL_ADDRESS,
    abi: LOTTERY_POOL_ABI,
    eventName: "WinnerSelected",
    onLogs(logs) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("🔔 WinnerSelected event detected:", logs);
      }
      void queryClient.refetchQueries({ type: "active" });
    },
  });

  // Watch for PrizeClaimed events
  useWatchContractEvent({
    address: LOTTERY_POOL_ADDRESS,
    abi: LOTTERY_POOL_ABI,
    eventName: "PrizeClaimed",
    onLogs(logs) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("🔔 PrizeClaimed event detected:", logs);
      }
      void queryClient.refetchQueries({ type: "active" });
    },
  });
}
