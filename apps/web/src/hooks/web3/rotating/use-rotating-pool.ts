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

import { QUERY_PRESETS } from "@/lib/query-config";
import RotatingPoolABI from "@/contracts/abis/RotatingPool.json";
import { CONTRACT_ADDRESSES } from "@/contracts/addresses";

// Contract address - Deployed on Mezo Testnet (V3 with UUPS proxy)
const ROTATING_POOL_ADDRESS = CONTRACT_ADDRESSES.ROTATING_POOL as Address;

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
  useNativeBtc: boolean;
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
      ...QUERY_PRESETS.SLOW,
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
      ...QUERY_PRESETS.NORMAL,
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
      ...QUERY_PRESETS.NORMAL,
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
      ...QUERY_PRESETS.SLOW,
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
      ...QUERY_PRESETS.BLOCKCHAIN_READ,
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
    query: { ...QUERY_PRESETS.STATIC }, // Constants never change
  });

  const maxMembers = useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "MAX_MEMBERS",
    query: { ...QUERY_PRESETS.STATIC },
  });

  const minContribution = useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "MIN_CONTRIBUTION",
    query: { ...QUERY_PRESETS.STATIC },
  });

  const maxContribution = useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "MAX_CONTRIBUTION",
    query: { ...QUERY_PRESETS.STATIC },
  });

  const minPeriodDuration = useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "MIN_PERIOD_DURATION",
    query: { ...QUERY_PRESETS.STATIC },
  });

  const maxPeriodDuration = useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "MAX_PERIOD_DURATION",
    query: { ...QUERY_PRESETS.STATIC },
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

/**
 * Get all members of a pool
 * @param poolId - Pool ID
 */
export function usePoolMembers(poolId: bigint | undefined) {
  return useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "getPoolMembers",
    args: poolId !== undefined ? [poolId] : undefined,
    query: {
      enabled: poolId !== undefined,
      ...QUERY_PRESETS.NORMAL,
    },
  });
}

/**
 * Get pool statistics
 * @param poolId - Pool ID
 */
export function usePoolStats(poolId: bigint | undefined) {
  return useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "getPoolStats",
    args: poolId !== undefined ? [poolId] : undefined,
    query: {
      enabled: poolId !== undefined,
      ...QUERY_PRESETS.NORMAL,
    },
  });
}

/**
 * Check if user can claim refund (for cancelled pools)
 * @param poolId - Pool ID
 * @param memberAddress - Member address
 */
export function useHasClaimedRefund(poolId: bigint | undefined, memberAddress?: Address) {
  const { address } = useAccount();
  const member = memberAddress ?? address;

  return useReadContract({
    address: ROTATING_POOL_ADDRESS,
    abi: RotatingPoolABI.abi,
    functionName: "hasClaimedRefund",
    args: poolId !== undefined && member ? [poolId, member] : undefined,
    query: {
      enabled: poolId !== undefined && !!member,
      ...QUERY_PRESETS.NORMAL,
    },
  });
}

// Export contract address for use in mutation hooks
export { ROTATING_POOL_ADDRESS };
