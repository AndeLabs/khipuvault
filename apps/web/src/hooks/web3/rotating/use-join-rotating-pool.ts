/**
 * Hook to join an existing Rotating Pool (ROSCA)
 * @module hooks/web3/rotating/use-join-rotating-pool
 *
 * Best Practices 2026:
 * - Wagmi 2.x useWriteContract
 * - Transaction waiting
 * - Query invalidation on success
 */

import { useQueryClient } from "@tanstack/react-query";
import { Address } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

import RotatingPoolABI from "@/contracts/abis/RotatingPool.json";

// Contract address
const ROTATING_POOL_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

/**
 * Hook to join a rotating pool
 */
export function useJoinRotatingPool(poolId: bigint | undefined) {
  const queryClient = useQueryClient();

  // Write contract
  const {
    data: hash,
    isPending: isWritePending,
    writeContract,
    error: writeError,
  } = useWriteContract();

  // Wait for transaction
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Join pool function
   */
  const joinPool = () => {
    if (poolId === undefined) {
      throw new Error("Pool ID is required");
    }

    writeContract({
      address: ROTATING_POOL_ADDRESS,
      abi: RotatingPoolABI.abi,
      functionName: "joinPool",
      args: [poolId],
    });
  };

  // Invalidate queries on success
  if (isConfirmed && poolId !== undefined) {
    // Invalidate pool info and member info
    void queryClient.invalidateQueries({ queryKey: ["rotating-pool", poolId] });
    void queryClient.invalidateQueries({ queryKey: ["rotating-pool-member", poolId] });
    void queryClient.invalidateQueries({ queryKey: ["rotating-pools"] });
  }

  return {
    joinPool,
    hash,
    isPending: isWritePending || isConfirming,
    isWritePending,
    isConfirming,
    isConfirmed,
    isSuccess: isConfirmed,
    error: writeError ?? confirmError,
  };
}

/**
 * Hook to make a contribution to the pool
 */
export function useContributeToPool(poolId: bigint | undefined) {
  const queryClient = useQueryClient();

  const {
    data: hash,
    isPending: isWritePending,
    writeContract,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Contribute to pool
   */
  const contribute = (amount: bigint) => {
    if (poolId === undefined) {
      throw new Error("Pool ID is required");
    }

    writeContract({
      address: ROTATING_POOL_ADDRESS,
      abi: RotatingPoolABI.abi,
      functionName: "contribute",
      args: [poolId],
      value: amount, // Send BTC with transaction
    });
  };

  // Invalidate on success
  if (isConfirmed && poolId !== undefined) {
    void queryClient.invalidateQueries({ queryKey: ["rotating-pool", poolId] });
    void queryClient.invalidateQueries({ queryKey: ["rotating-pool-member", poolId] });
    void queryClient.invalidateQueries({ queryKey: ["rotating-pool-period", poolId] });
  }

  return {
    contribute,
    hash,
    isPending: isWritePending || isConfirming,
    isWritePending,
    isConfirming,
    isConfirmed,
    isSuccess: isConfirmed,
    error: writeError ?? confirmError,
  };
}

/**
 * Hook to claim payout when it's your turn
 */
export function useClaimPayout(poolId: bigint | undefined) {
  const queryClient = useQueryClient();

  const {
    data: hash,
    isPending: isWritePending,
    writeContract,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Claim payout
   */
  const claimPayout = () => {
    if (poolId === undefined) {
      throw new Error("Pool ID is required");
    }

    writeContract({
      address: ROTATING_POOL_ADDRESS,
      abi: RotatingPoolABI.abi,
      functionName: "claimPayout",
      args: [poolId],
    });
  };

  // Invalidate on success
  if (isConfirmed && poolId !== undefined) {
    void queryClient.invalidateQueries({ queryKey: ["rotating-pool", poolId] });
    void queryClient.invalidateQueries({ queryKey: ["rotating-pool-member", poolId] });
    void queryClient.invalidateQueries({ queryKey: ["rotating-pool-period", poolId] });
  }

  return {
    claimPayout,
    hash,
    isPending: isWritePending || isConfirming,
    isWritePending,
    isConfirming,
    isConfirmed,
    isSuccess: isConfirmed,
    error: writeError ?? confirmError,
  };
}
