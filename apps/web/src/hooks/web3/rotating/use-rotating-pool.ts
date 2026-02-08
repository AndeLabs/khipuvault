/**
 * Hook to interact with RotatingPool (ROSCA) contract
 * @module hooks/web3/rotating/use-rotating-pool
 *
 * Best Practices 2026:
 * - Wagmi 2.x patterns with staleTime/gcTime
 * - React Query 5 configuration
 * - Type-safe with Viem
 * - Conditional fetching with enabled
 */

import { Address } from "viem";
import { useReadContract, useAccount } from "wagmi";

import RotatingPoolABI from "@/contracts/abis/RotatingPool.json";

// Contract address - Deployed on Mezo Testnet (v2 with native BTC support)
const ROTATING_POOL_ADDRESS = "0x0Bac59e87Af0D2e95711846BaDb124164382aafC" as Address;

/**
 * Pool status enum matching Solidity
 */
export enum PoolStatus {
  FORMING = 0,
  ACTIVE = 1,
  COMPLETED = 2,
  CANCELLED = 3,
}

/**
 * Pool information type
 */
export interface PoolInfo {
  poolId: bigint;
  name: string;
  creator: Address;
  memberCount: bigint;
  contributionAmount: bigint;
  periodDuration: bigint;
  currentPeriod: bigint;
  totalPeriods: bigint;
  startTime: bigint;
  totalBtcCollected: bigint;
  totalMusdMinted: bigint;
  totalYieldGenerated: bigint;
  yieldDistributed: bigint;
  status: PoolStatus;
  autoAdvance: boolean;
}

/**
 * Member information type
 */
export interface MemberInfo {
  memberAddress: Address;
  memberIndex: bigint;
  contributionsMade: bigint;
  totalContributed: bigint;
  payoutReceived: bigint;
  yieldReceived: bigint;
  hasReceivedPayout: boolean;
  active: boolean;
}

/**
 * Period information type
 */
export interface PeriodInfo {
  periodNumber: bigint;
  startTime: bigint;
  endTime: bigint;
  recipient: Address;
  payoutAmount: bigint;
  yieldAmount: bigint;
  completed: boolean;
  paid: boolean;
}

/**
 * Get pool information
 * @param poolId - Pool ID
 */
export function usePoolInfo(poolId: bigint | undefined) {
  return useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "pools",
    args: poolId !== undefined ? [poolId] : undefined,
    query: {
      enabled: poolId !== undefined,
      staleTime: 1000 * 60 * 5, // 5 min
      gcTime: 1000 * 60 * 30, // 30 min
      retry: 3,
    },
  });
}

/**
 * Get member information for a specific pool
 * @param poolId - Pool ID
 * @param memberAddress - Member address (defaults to connected wallet)
 */
export function useMemberInfo(poolId: bigint | undefined, memberAddress?: Address) {
  const { address } = useAccount();
  const member = memberAddress ?? address;

  return useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "poolMembers",
    args: poolId !== undefined && member ? [poolId, member] : undefined,
    query: {
      enabled: poolId !== undefined && !!member,
      staleTime: 1000 * 60 * 2, // 2 min (member data changes more frequently)
      gcTime: 1000 * 60 * 15, // 15 min
      retry: 3,
    },
  });
}

/**
 * Get period information
 * @param poolId - Pool ID
 * @param periodNumber - Period number
 */
export function usePeriodInfo(poolId: bigint | undefined, periodNumber: bigint | undefined) {
  return useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "poolPeriods",
    args: poolId !== undefined && periodNumber !== undefined ? [poolId, periodNumber] : undefined,
    query: {
      enabled: poolId !== undefined && periodNumber !== undefined,
      staleTime: 1000 * 60 * 3, // 3 min
      gcTime: 1000 * 60 * 20, // 20 min
      retry: 3,
    },
  });
}

/**
 * Get pool member order (address at index)
 * @param poolId - Pool ID
 * @param memberIndex - Member index
 */
export function usePoolMemberOrder(poolId: bigint | undefined, memberIndex: bigint | undefined) {
  return useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "poolMemberOrder",
    args: poolId !== undefined && memberIndex !== undefined ? [poolId, memberIndex] : undefined,
    query: {
      enabled: poolId !== undefined && memberIndex !== undefined,
      staleTime: 1000 * 60 * 10, // 10 min (order doesn't change)
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 3,
    },
  });
}

/**
 * Get pool counter (total pools created)
 */
export function usePoolCounter() {
  return useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "poolCounter",
    query: {
      staleTime: 1000 * 30, // 30 sec (changes frequently)
      gcTime: 1000 * 60 * 5, // 5 min
      retry: 3,
    },
  });
}

/**
 * Combined hook to get all pool data
 * @param poolId - Pool ID
 */
export function useRotatingPool(poolId: bigint | undefined) {
  const poolInfo = usePoolInfo(poolId);
  const memberInfo = useMemberInfo(poolId);
  const { data: poolData } = poolInfo;
  const currentPeriod = poolData && Array.isArray(poolData) ? (poolData[6] as bigint) : undefined;
  const periodInfo = usePeriodInfo(poolId, currentPeriod);

  return {
    poolInfo,
    memberInfo,
    periodInfo,
    isPending: poolInfo.isPending || memberInfo.isPending || periodInfo.isPending,
    isError: poolInfo.isError || memberInfo.isError || periodInfo.isError,
    error: poolInfo.error ?? memberInfo.error ?? periodInfo.error,
  };
}

/**
 * Get constants from contract
 */
export function useRotatingPoolConstants() {
  const minMembers = useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "MIN_MEMBERS",
    query: { staleTime: Infinity }, // Constants never change
  });

  const maxMembers = useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "MAX_MEMBERS",
    query: { staleTime: Infinity },
  });

  const minContribution = useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "MIN_CONTRIBUTION",
    query: { staleTime: Infinity },
  });

  const maxContribution = useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "MAX_CONTRIBUTION",
    query: { staleTime: Infinity },
  });

  const minPeriodDuration = useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "MIN_PERIOD_DURATION",
    query: { staleTime: Infinity },
  });

  const maxPeriodDuration = useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "MAX_PERIOD_DURATION",
    query: { staleTime: Infinity },
  });

  return {
    minMembers: minMembers.data,
    maxMembers: maxMembers.data,
    minContribution: minContribution.data,
    maxContribution: maxContribution.data,
    minPeriodDuration: minPeriodDuration.data,
    maxPeriodDuration: maxPeriodDuration.data,
    isPending:
      minMembers.isPending ||
      maxMembers.isPending ||
      minContribution.isPending ||
      maxContribution.isPending ||
      minPeriodDuration.isPending ||
      maxPeriodDuration.isPending,
  };
}
