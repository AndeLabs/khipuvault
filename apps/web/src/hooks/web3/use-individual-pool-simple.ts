/**
 * @fileoverview Simple, Robust Individual Pool Hook - Production Ready
 * Direct blockchain calls, no complex abstractions
 */

"use client";

import { useAccount, usePublicClient, useConfig } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "wagmi/actions";
import { formatUnits, type Address } from "viem";

// Contract addresses
const POOL_ADDRESS = "0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393" as Address;
const MUSD_ADDRESS = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503" as Address;

// Minimal ABI - only what we need
const POOL_ABI = [
  {
    name: "getUserInfo",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "deposit", type: "uint256" },
      { name: "yields", type: "uint256" },
      { name: "netYields", type: "uint256" },
      { name: "daysActive", type: "uint256" },
      { name: "estimatedAPR", type: "uint256" },
      { name: "autoCompoundEnabled", type: "bool" },
    ],
  },
  {
    name: "totalMusdDeposited",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalYieldsGenerated",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const MUSD_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export interface UserInfo {
  deposit: bigint;
  yields: bigint;
  netYields: bigint;
  daysActive: bigint;
  estimatedAPR: bigint;
  autoCompoundEnabled: boolean;
}

export function useIndividualPoolSimple() {
  const { address, isConnected } = useAccount();
  const config = useConfig();

  // Fetch user info
  const {
    data: userInfo,
    isLoading: loadingUserInfo,
    error: userInfoError,
    refetch: refetchUserInfo,
  } = useQuery({
    queryKey: ["pool-simple", "user-info", address],
    queryFn: async (): Promise<UserInfo | null> => {
      if (!address) return null;

      try {
        console.log("🔄 [SIMPLE] Fetching user info for:", address);
        console.log("🔄 [SIMPLE] Pool address:", POOL_ADDRESS);

        const result = await readContract(config, {
          address: POOL_ADDRESS,
          abi: POOL_ABI,
          functionName: "getUserInfo",
          args: [address],
        });

        console.log("✅ [SIMPLE] Raw result:", result);

        if (!result || !Array.isArray(result) || result.length < 6) {
          console.warn("⚠️ [SIMPLE] Invalid result, returning null");
          return null;
        }

        const userInfo: UserInfo = {
          deposit: result[0] || BigInt(0),
          yields: result[1] || BigInt(0),
          netYields: result[2] || BigInt(0),
          daysActive: result[3] || BigInt(0),
          estimatedAPR: result[4] || BigInt(0),
          autoCompoundEnabled: result[5] || false,
        };

        console.log("📊 [SIMPLE] User info:", {
          deposit: formatUnits(userInfo.deposit, 18),
          yields: formatUnits(userInfo.yields, 18),
          netYields: formatUnits(userInfo.netYields, 18),
          daysActive: userInfo.daysActive.toString(),
          apr: (Number(userInfo.estimatedAPR) / 100).toFixed(2) + "%",
          autoCompound: userInfo.autoCompoundEnabled,
        });

        return userInfo;
      } catch (error) {
        console.error("❌ [SIMPLE] Error fetching user info:", error);
        return null;
      }
    },
    enabled: isConnected && !!address,
    staleTime: 5_000,
    refetchInterval: 10_000,
    retry: 3,
  });

  // Fetch pool TVL
  const { data: poolTVL } = useQuery({
    queryKey: ["pool-simple", "tvl"],
    queryFn: async () => {
      try {
        const result = await readContract(config, {
          address: POOL_ADDRESS,
          abi: POOL_ABI,
          functionName: "totalMusdDeposited",
        });
        console.log("💰 [SIMPLE] Pool TVL:", formatUnits(result, 18), "MUSD");
        return result;
      } catch (error) {
        console.error("❌ [SIMPLE] Error fetching TVL:", error);
        return BigInt(0);
      }
    },
    enabled: isConnected,
    staleTime: 30_000,
  });

  // Fetch total yields
  const { data: totalYields } = useQuery({
    queryKey: ["pool-simple", "total-yields"],
    queryFn: async () => {
      try {
        const result = await readContract(config, {
          address: POOL_ADDRESS,
          abi: POOL_ABI,
          functionName: "totalYieldsGenerated",
        });
        console.log(
          "📈 [SIMPLE] Total yields:",
          formatUnits(result, 18),
          "MUSD",
        );
        return result;
      } catch (error) {
        console.error("❌ [SIMPLE] Error fetching yields:", error);
        return BigInt(0);
      }
    },
    enabled: isConnected,
    staleTime: 30_000,
  });

  // Fetch MUSD balance
  const { data: musdBalance } = useQuery({
    queryKey: ["pool-simple", "musd-balance", address],
    queryFn: async () => {
      if (!address) return BigInt(0);
      try {
        const result = await readContract(config, {
          address: MUSD_ADDRESS,
          abi: MUSD_ABI,
          functionName: "balanceOf",
          args: [address],
        });
        console.log(
          "💵 [SIMPLE] MUSD balance:",
          formatUnits(result, 18),
          "MUSD",
        );
        return result;
      } catch (error) {
        console.error("❌ [SIMPLE] Error fetching balance:", error);
        return BigInt(0);
      }
    },
    enabled: isConnected && !!address,
    staleTime: 10_000,
  });

  // Computed values
  const hasActiveDeposit = userInfo ? userInfo.deposit > BigInt(0) : false;
  const canWithdraw = userInfo ? userInfo.deposit >= BigInt(1e18) : false; // 1 MUSD minimum

  return {
    // User data
    userInfo,
    hasActiveDeposit,
    canWithdraw,

    // Pool data
    poolTVL: poolTVL || BigInt(0),
    totalYields: totalYields || BigInt(0),

    // Wallet data
    musdBalance: musdBalance || BigInt(0),

    // Loading states
    isLoading: loadingUserInfo,
    error: userInfoError,

    // Actions
    refetchUserInfo,

    // Contracts
    contracts: {
      pool: POOL_ADDRESS,
      musd: MUSD_ADDRESS,
    },
  };
}

// Format helpers
export function formatMUSD(value: bigint | undefined): string {
  if (!value) return "0.00";
  return Number(formatUnits(value, 18)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatAPR(apr: bigint | number): string {
  const value = typeof apr === "bigint" ? Number(apr) / 100 : apr;
  return `${value.toFixed(2)}%`;
}
