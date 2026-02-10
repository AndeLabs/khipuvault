/**
 * @fileoverview Protocol-wide statistics hook
 * @module hooks/use-protocol-stats
 *
 * Aggregates TVL and APY from all pools (Individual, Cooperative, Lottery)
 *
 * SSR-Safe: Works both with and without WagmiProvider context.
 * Falls back to standalone publicClient when no Wagmi context.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";

import { getPublicClient } from "@/lib/web3/config";
import {
  COOPERATIVE_POOL_ABI,
  INDIVIDUAL_POOL_V3_ABI,
  MEZO_V3_ADDRESSES,
} from "@/lib/web3/contracts-v3";

const INDIVIDUAL_POOL_ADDRESS = MEZO_V3_ADDRESSES.individualPoolV3 as `0x${string}`;
const COOPERATIVE_POOL_ADDRESS = MEZO_V3_ADDRESSES.cooperativePoolV3 as `0x${string}`;

export interface ProtocolStats {
  /** Total Value Locked across all pools in mUSD */
  totalTVL: bigint;
  /** Formatted TVL string (e.g., "$1.2M") */
  formattedTVL: string;
  /** Average APY across pools (basis points, 100 = 1%) */
  averageAPY: number;
  /** Formatted APY string (e.g., "12.5%") */
  formattedAPY: string;
  /** Individual pool TVL */
  individualTVL: bigint;
  /** Cooperative pool TVL */
  cooperativeTVL: bigint;
  /** Is loading */
  isLoading: boolean;
}

/**
 * Format large numbers to readable format
 */
function formatTVL(value: bigint): string {
  const numValue = Number(formatUnits(value, 18));

  if (numValue >= 1_000_000) {
    return `$${(numValue / 1_000_000).toFixed(1)}M`;
  } else if (numValue >= 1_000) {
    return `$${(numValue / 1_000).toFixed(1)}K`;
  } else if (numValue > 0) {
    return `$${numValue.toFixed(2)}`;
  }
  return "$0";
}

/**
 * Hook to fetch protocol-wide statistics
 *
 * Works both with and without WagmiProvider context:
 * - Uses standalone publicClient from config (no Wagmi required)
 * - Safe for landing pages without Web3 context
 */
export function useProtocolStats(): ProtocolStats {
  // Use standalone client - no Wagmi context required
  const publicClient = getPublicClient();

  // Fetch Individual Pool TVL
  const { data: individualTVL, isLoading: isLoadingIndividual } = useQuery({
    queryKey: ["protocol-stats", "individual-tvl"],
    queryFn: async () => {
      try {
        const result = await publicClient.readContract({
          address: INDIVIDUAL_POOL_ADDRESS,
          abi: INDIVIDUAL_POOL_V3_ABI,
          functionName: "totalMusdDeposited",
          args: [],
        });
        return BigInt(result as unknown as bigint);
      } catch {
        return 0n;
      }
    },
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // 1 minute
  });

  // Fetch Cooperative Pool count and TVL
  const { data: cooperativeTVL, isLoading: isLoadingCooperative } = useQuery({
    queryKey: ["protocol-stats", "cooperative-tvl"],
    queryFn: async () => {
      try {
        // Get pool counter
        const poolCounter = await publicClient.readContract({
          address: COOPERATIVE_POOL_ADDRESS,
          abi: COOPERATIVE_POOL_ABI,
          functionName: "poolCounter",
          args: [],
        });

        const count = Number(poolCounter);
        if (count === 0) {
          return 0n;
        }

        // Sum TVL from all pools
        let total = 0n;
        for (let i = 1; i <= count; i++) {
          try {
            const poolInfo = await publicClient.readContract({
              address: COOPERATIVE_POOL_ADDRESS,
              abi: COOPERATIVE_POOL_ABI,
              functionName: "getPoolInfo",
              args: [BigInt(i)],
            });
            // poolInfo.totalMusdMinted is the TVL
            const tvl = (poolInfo as any).totalMusdMinted || 0n;
            total += BigInt(tvl);
          } catch {
            // Skip pools that fail to load
          }
        }
        return total;
      } catch {
        return 0n;
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Calculate totals
  const totalTVL = (individualTVL || 0n) + (cooperativeTVL || 0n);
  const isLoading = isLoadingIndividual || isLoadingCooperative;

  // APY will be variable based on Mezo protocol yields
  // Currently on testnet - show as variable until real yield data available
  const averageAPY = 0; // Will be fetched from YieldAggregator on mainnet
  const formattedAPY = "Variable";

  return {
    totalTVL,
    formattedTVL: formatTVL(totalTVL),
    averageAPY,
    formattedAPY,
    individualTVL: individualTVL || 0n,
    cooperativeTVL: cooperativeTVL || 0n,
    isLoading,
  };
}
