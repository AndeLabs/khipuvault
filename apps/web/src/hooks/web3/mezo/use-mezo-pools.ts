/**
 * @fileoverview Mezo Liquidity Pool Hooks
 * @module hooks/web3/mezo/use-mezo-pools
 *
 * Hooks for interacting with Mezo's liquidity pools (MUSD/BTC, MUSD/USDC, etc.)
 * These pools are part of Mezo's swap infrastructure and generate fees
 * that flow to veBTC holders.
 *
 * Pool Addresses (Mainnet):
 * - MUSD/BTC: 0x52e604c44417233b6CcEDDDc0d640A405Caacefb
 * - MUSD/USDC: 0xEd812AEc0Fecc8fD882Ac3eccC43f3aA80A6c356
 * - MUSD/USDT: 0x10906a9E9215939561597b4C8e4b98F93c02031A
 */

"use client";

import { formatUnits } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";

// Mezo Pool Addresses (Mainnet)
export const MEZO_POOL_ADDRESSES = {
  POOL_FACTORY: "0x83FE469C636C4081b87bA5b3Ae9991c6Ed104248" as `0x${string}`,
  MUSD_BTC_POOL: "0x52e604c44417233b6CcEDDDc0d640A405Caacefb" as `0x${string}`,
  MUSD_USDC_POOL: "0xEd812AEc0Fecc8fD882Ac3eccC43f3aA80A6c356" as `0x${string}`,
  MUSD_USDT_POOL: "0x10906a9E9215939561597b4C8e4b98F93c02031A" as `0x${string}`,
} as const;

// Standard AMM Pool ABI (Curve-style)
const POOL_ABI = [
  {
    type: "function",
    name: "get_virtual_price",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balances",
    inputs: [{ name: "i", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "fee",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

/**
 * Hook to get MUSD/BTC pool statistics
 */
export function useMusdBtcPool() {
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: MEZO_POOL_ADDRESSES.MUSD_BTC_POOL,
        abi: POOL_ABI,
        functionName: "get_virtual_price",
      },
      {
        address: MEZO_POOL_ADDRESSES.MUSD_BTC_POOL,
        abi: POOL_ABI,
        functionName: "totalSupply",
      },
      {
        address: MEZO_POOL_ADDRESSES.MUSD_BTC_POOL,
        abi: POOL_ABI,
        functionName: "balances",
        args: [0n], // MUSD balance
      },
      {
        address: MEZO_POOL_ADDRESSES.MUSD_BTC_POOL,
        abi: POOL_ABI,
        functionName: "balances",
        args: [1n], // BTC balance
      },
      {
        address: MEZO_POOL_ADDRESSES.MUSD_BTC_POOL,
        abi: POOL_ABI,
        functionName: "fee",
      },
    ],
    query: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  });

  const virtualPrice = (data?.[0]?.result as bigint) ?? 0n;
  const totalSupply = (data?.[1]?.result as bigint) ?? 0n;
  const musdBalance = (data?.[2]?.result as bigint) ?? 0n;
  const btcBalance = (data?.[3]?.result as bigint) ?? 0n;
  const fee = (data?.[4]?.result as bigint) ?? 0n;

  // Fee is in 1e10 format (0.04% = 4000000)
  const feePercent = (Number(fee) / 1e10) * 100;

  return {
    /** Virtual price of LP token (18 decimals) */
    virtualPrice,
    virtualPriceFormatted: formatUnits(virtualPrice, 18),
    /** Total LP token supply */
    totalSupply,
    totalSupplyFormatted: formatUnits(totalSupply, 18),
    /** MUSD balance in pool */
    musdBalance,
    musdBalanceFormatted: formatUnits(musdBalance, 18),
    /** BTC balance in pool */
    btcBalance,
    btcBalanceFormatted: formatUnits(btcBalance, 18),
    /** Swap fee percentage */
    feePercent,
    feeFormatted: `${feePercent.toFixed(4)}%`,
    /** Pool TVL (MUSD + BTC value) - simplified as MUSD * 2 */
    tvl: musdBalance * 2n,
    tvlFormatted: formatUnits(musdBalance * 2n, 18),
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get user's LP position in MUSD/BTC pool
 */
export function useUserMusdBtcPosition() {
  const { address, isConnected } = useAccount();

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: MEZO_POOL_ADDRESSES.MUSD_BTC_POOL,
        abi: POOL_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: MEZO_POOL_ADDRESSES.MUSD_BTC_POOL,
        abi: POOL_ABI,
        functionName: "totalSupply",
      },
      {
        address: MEZO_POOL_ADDRESSES.MUSD_BTC_POOL,
        abi: POOL_ABI,
        functionName: "get_virtual_price",
      },
    ],
    query: {
      enabled: !!address && isConnected,
      staleTime: 30 * 1000,
    },
  });

  const lpBalance = (data?.[0]?.result as bigint) ?? 0n;
  const totalSupply = (data?.[1]?.result as bigint) ?? 0n;
  const virtualPrice = (data?.[2]?.result as bigint) ?? 0n;

  // Calculate share percentage
  const sharePercent = totalSupply > 0n ? (Number(lpBalance) / Number(totalSupply)) * 100 : 0;

  // Calculate USD value of LP tokens
  const lpValueUsd = (lpBalance * virtualPrice) / BigInt(1e18);

  return {
    /** User's LP token balance */
    lpBalance,
    lpBalanceFormatted: formatUnits(lpBalance, 18),
    /** User's share of pool */
    sharePercent,
    shareFormatted: `${sharePercent.toFixed(4)}%`,
    /** USD value of LP tokens */
    lpValueUsd,
    lpValueFormatted: formatUnits(lpValueUsd, 18),
    /** Whether user has LP tokens */
    hasPosition: lpBalance > 0n,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get all Mezo pool TVLs
 */
export function useMezoPoolsTVL() {
  const musdBtc = useMusdBtcPool();

  const totalTVL = musdBtc.tvl;

  return {
    pools: {
      musdBtc: {
        address: MEZO_POOL_ADDRESSES.MUSD_BTC_POOL,
        name: "MUSD/BTC",
        tvl: musdBtc.tvl,
        tvlFormatted: musdBtc.tvlFormatted,
        fee: musdBtc.feePercent,
      },
    },
    totalTVL,
    totalTVLFormatted: formatUnits(totalTVL, 18),
    isLoading: musdBtc.isLoading,
  };
}
