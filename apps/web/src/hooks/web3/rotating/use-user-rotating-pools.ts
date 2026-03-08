/**
 * Hook to get user's ROSCA pools and stats
 * @module hooks/web3/rotating/use-user-rotating-pools
 *
 * Fetches all pools and filters by user membership
 * since contract doesn't have getUserPools function
 */

import { useQuery } from "@tanstack/react-query";
import { getAddress } from "@khipu/shared";
import { Address, formatUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";

import { QUERY_PRESETS } from "@/lib/query-config";
import RotatingPoolABI from "@/contracts/abis/RotatingPool.json";

import { PoolStatus, type PoolInfo, type MemberInfo } from "./use-rotating-pool";

const ROTATING_POOL_ADDRESS = getAddress("ROTATING_POOL") as Address;

export interface UserPoolData {
  poolId: bigint;
  poolInfo: PoolInfo;
  memberInfo: MemberInfo;
}

export interface UserPoolsResult {
  pools: UserPoolData[];
  totalPools: number;
  totalYields: bigint;
  totalYieldsFormatted: string;
  activePools: number;
  completedPools: number;
}

/**
 * Get user's ROSCA pools with membership data
 * Iterates through all pools and checks membership
 */
export function useUserRotatingPools() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["rotating-pool", "user-pools", address],
    queryFn: async (): Promise<UserPoolsResult> => {
      if (!address || !publicClient) {
        return {
          pools: [],
          totalPools: 0,
          totalYields: BigInt(0),
          totalYieldsFormatted: "0.000",
          activePools: 0,
          completedPools: 0,
        };
      }

      // Get pool counter
      const poolCounter = (await publicClient.readContract({
        address: ROTATING_POOL_ADDRESS,
        abi: RotatingPoolABI.abi,
        functionName: "poolCounter",
      })) as bigint;

      if (!poolCounter || poolCounter === BigInt(0)) {
        return {
          pools: [],
          totalPools: 0,
          totalYields: BigInt(0),
          totalYieldsFormatted: "0.000",
          activePools: 0,
          completedPools: 0,
        };
      }

      const userPools: UserPoolData[] = [];
      let totalYields = BigInt(0);
      let activePools = 0;
      let completedPools = 0;

      // Iterate through pools and check membership
      // Use Promise.allSettled for parallel fetching
      const poolPromises = Array.from({ length: Number(poolCounter) }, async (_, i) => {
        const poolId = BigInt(i + 1);

        try {
          // Get member info for this pool
          const memberData = (await publicClient.readContract({
            address: ROTATING_POOL_ADDRESS,
            abi: RotatingPoolABI.abi,
            functionName: "poolMembers",
            args: [poolId, address],
          })) as unknown[];

          // Check if user is an active member (active flag is at index 7)
          const isActive = memberData[7] as boolean;
          const totalContributed = memberData[3] as bigint;

          // User is member if active or has contributed
          if (isActive || totalContributed > BigInt(0)) {
            // Get pool info
            const poolData = (await publicClient.readContract({
              address: ROTATING_POOL_ADDRESS,
              abi: RotatingPoolABI.abi,
              functionName: "pools",
              args: [poolId],
            })) as unknown[];

            const poolInfo: PoolInfo = {
              poolId: poolData[0] as bigint,
              name: poolData[1] as string,
              creator: poolData[2] as Address,
              memberCount: poolData[3] as bigint,
              contributionAmount: poolData[4] as bigint,
              periodDuration: poolData[5] as bigint,
              currentPeriod: poolData[6] as bigint,
              totalPeriods: poolData[7] as bigint,
              startTime: poolData[8] as bigint,
              totalBtcCollected: poolData[9] as bigint,
              totalMusdMinted: poolData[10] as bigint,
              totalYieldGenerated: poolData[11] as bigint,
              yieldDistributed: poolData[12] as bigint,
              status: poolData[13] as PoolStatus,
              autoAdvance: poolData[14] as boolean,
              useNativeBtc: poolData[15] as boolean,
            };

            const memberInfo: MemberInfo = {
              memberAddress: memberData[0] as Address,
              memberIndex: memberData[1] as bigint,
              contributionsMade: memberData[2] as bigint,
              totalContributed: memberData[3] as bigint,
              payoutReceived: memberData[4] as bigint,
              yieldReceived: memberData[5] as bigint,
              hasReceivedPayout: memberData[6] as boolean,
              active: memberData[7] as boolean,
            };

            return { poolId, poolInfo, memberInfo };
          }

          return null;
        } catch {
          return null;
        }
      });

      const results = await Promise.allSettled(poolPromises);

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          const data = result.value;
          userPools.push(data);
          totalYields += data.memberInfo.yieldReceived;

          if (
            data.poolInfo.status === PoolStatus.ACTIVE ||
            data.poolInfo.status === PoolStatus.FORMING
          ) {
            activePools++;
          } else if (data.poolInfo.status === PoolStatus.COMPLETED) {
            completedPools++;
          }
        }
      }

      return {
        pools: userPools,
        totalPools: userPools.length,
        totalYields,
        totalYieldsFormatted: formatUnits(totalYields, 18),
        activePools,
        completedPools,
      };
    },
    enabled: !!address && !!publicClient,
    ...QUERY_PRESETS.NORMAL,
  });
}

/**
 * Get pools filtered by status
 */
export function usePoolsByStatus(status: PoolStatus) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["rotating-pool", "by-status", status],
    queryFn: async (): Promise<bigint[]> => {
      if (!publicClient) return [];

      // Get pool counter
      const poolCounter = (await publicClient.readContract({
        address: ROTATING_POOL_ADDRESS,
        abi: RotatingPoolABI.abi,
        functionName: "poolCounter",
      })) as bigint;

      if (!poolCounter || poolCounter === BigInt(0)) return [];

      const matchingPools: bigint[] = [];

      // Check each pool's status
      const promises = Array.from({ length: Number(poolCounter) }, async (_, i) => {
        const poolId = BigInt(i + 1);

        try {
          const poolData = (await publicClient.readContract({
            address: ROTATING_POOL_ADDRESS,
            abi: RotatingPoolABI.abi,
            functionName: "pools",
            args: [poolId],
          })) as unknown[];

          const poolStatus = poolData[13] as PoolStatus;
          if (poolStatus === status) {
            return poolId;
          }
          return null;
        } catch {
          return null;
        }
      });

      const results = await Promise.allSettled(promises);

      for (const result of results) {
        if (result.status === "fulfilled" && result.value !== null) {
          matchingPools.push(result.value);
        }
      }

      return matchingPools;
    },
    enabled: !!publicClient,
    ...QUERY_PRESETS.SLOW,
  });
}
