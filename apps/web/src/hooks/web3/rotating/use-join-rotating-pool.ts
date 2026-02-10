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
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

import RotatingPoolABI from "@/contracts/abis/RotatingPool.json";
import { ROTATING_POOL_ADDRESS } from "./use-rotating-pool";

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
 * Hook to make a native BTC contribution to the pool
 * @param poolId - Pool ID
 * @param contributionAmount - Amount to contribute (from pool info)
 */
export function useContributeNative(poolId: bigint | undefined, contributionAmount?: bigint) {
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
   * Contribute native BTC to pool
   */
  const contribute = () => {
    if (poolId === undefined) {
      throw new Error("Pool ID is required");
    }
    if (!contributionAmount) {
      throw new Error("Contribution amount is required");
    }

    writeContract({
      address: ROTATING_POOL_ADDRESS,
      abi: RotatingPoolABI.abi,
      functionName: "makeContributionNative",
      args: [poolId],
      value: contributionAmount, // Send BTC with transaction
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
 * Hook to make a WBTC contribution to the pool (for WBTC pools)
 * @param poolId - Pool ID
 */
export function useContributeWBTC(poolId: bigint | undefined) {
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
   * Contribute WBTC to pool (requires prior approval)
   */
  const contribute = () => {
    if (poolId === undefined) {
      throw new Error("Pool ID is required");
    }

    writeContract({
      address: ROTATING_POOL_ADDRESS,
      abi: RotatingPoolABI.abi,
      functionName: "makeContribution",
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

/**
 * Hook to claim refund for cancelled pools
 */
export function useClaimRefund(poolId: bigint | undefined) {
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
   * Claim refund for cancelled pool
   */
  const claimRefund = () => {
    if (poolId === undefined) {
      throw new Error("Pool ID is required");
    }

    writeContract({
      address: ROTATING_POOL_ADDRESS,
      abi: RotatingPoolABI.abi,
      functionName: "claimRefund",
      args: [poolId],
    });
  };

  // Invalidate on success
  if (isConfirmed && poolId !== undefined) {
    void queryClient.invalidateQueries({ queryKey: ["rotating-pool", poolId] });
    void queryClient.invalidateQueries({ queryKey: ["rotating-pool-member", poolId] });
  }

  return {
    claimRefund,
    hash,
    isPending: isWritePending || isConfirming,
    isWritePending,
    isConfirming,
    isConfirmed,
    isSuccess: isConfirmed,
    error: writeError ?? confirmError,
  };
}
