"use client";

import { useWatchContractEvent } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { MEZO_V3_ADDRESSES } from "@/lib/web3/contracts-v3";
import { useAccount } from "wagmi";
import IndividualPoolV3ABI from "@/contracts/abis/IndividualPoolV3.json";

const POOL_ABI = (IndividualPoolV3ABI as any).abi;

/**
 * Hook to watch for IndividualPoolV3 contract events and auto-refetch queries
 * This replaces inefficient polling with event-driven updates
 *
 * Best Practice: Use refetchQueries instead of invalidateQueries for immediate updates
 * Source: https://tanstack.com/query/v5/docs/reference/QueryClient
 */
export function usePoolEvents() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const poolAddress = MEZO_V3_ADDRESSES.individualPoolV3 as `0x${string}`;

  // Watch for Deposited events
  useWatchContractEvent({
    address: poolAddress,
    abi: POOL_ABI,
    eventName: "Deposited",
    onLogs(logs) {
      // Only refetch individual pool queries to reduce RPC load
      queryClient.refetchQueries({ queryKey: ["individual-pool-v3"] });
    },
  });

  // Watch for PartialWithdrawn events (V3: renamed from Withdrawn)
  useWatchContractEvent({
    address: poolAddress,
    abi: POOL_ABI,
    eventName: "PartialWithdrawn",
    onLogs(logs) {
      queryClient.refetchQueries({ queryKey: ["individual-pool-v3"] });
    },
  });

  // Watch for FullWithdrawal events (V3: new event for full withdrawals)
  useWatchContractEvent({
    address: poolAddress,
    abi: POOL_ABI,
    eventName: "FullWithdrawal",
    onLogs(logs) {
      queryClient.refetchQueries({ queryKey: ["individual-pool-v3"] });
    },
  });

  // Watch for YieldClaimed events
  useWatchContractEvent({
    address: poolAddress,
    abi: POOL_ABI,
    eventName: "YieldClaimed",
    onLogs(logs) {
      queryClient.refetchQueries({ queryKey: ["individual-pool-v3"] });
    },
  });

  // Watch for AutoCompound events (V3: AutoCompounded not YieldAutoCompounded)
  useWatchContractEvent({
    address: poolAddress,
    abi: POOL_ABI,
    eventName: "AutoCompounded",
    onLogs(logs) {
      queryClient.refetchQueries({ queryKey: ["individual-pool-v3"] });
    },
  });
}
