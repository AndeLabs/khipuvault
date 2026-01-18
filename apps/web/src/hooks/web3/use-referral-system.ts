/**
 * @fileoverview Referral System Hook - IndividualPoolV3 Feature
 *
 * Features:
 * - Get referral stats (count, rewards, referrer)
 * - Claim referral rewards
 * - Deposit with referral code
 *
 * Production-ready with proper error handling
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { parseEther, type Address } from "viem";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";

import { MEZO_TESTNET_ADDRESSES } from "@/lib/web3/contracts";

const POOL_ADDRESS = MEZO_TESTNET_ADDRESSES.individualPool as Address;
const MUSD_ADDRESS = MEZO_TESTNET_ADDRESSES.musd as Address;

const POOL_ABI = [
  {
    name: "getReferralStats",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "count", type: "uint256" },
      { name: "rewards", type: "uint256" },
      { name: "referrer", type: "address" },
    ],
  },
  {
    name: "claimReferralRewards",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "depositWithReferral",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "musdAmount", type: "uint256" },
      { name: "referrer", type: "address" },
    ],
    outputs: [],
  },
] as const;

const MUSD_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

type ReferralState =
  | "idle"
  | "approving"
  | "waitingApproval"
  | "claiming"
  | "processing"
  | "success"
  | "error";

export interface ReferralStats {
  count: bigint;
  rewards: bigint;
  referrer: Address;
}

export function useReferralSystem() {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const [state, setState] = useState<ReferralState>("idle");
  const [error, setError] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<bigint>(0n);
  const [referrerAddress, setReferrerAddress] = useState<Address | null>(null);

  // Read referral stats
  const {
    data: stats,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = useReadContract({
    address: POOL_ADDRESS,
    abi: POOL_ABI,
    functionName: "getReferralStats",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 30_000,
    },
  });

  // Read allowance for deposit with referral
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: MUSD_ADDRESS,
    abi: MUSD_ABI,
    functionName: "allowance",
    args: address ? [address, POOL_ADDRESS] : undefined,
  });

  // Approve transaction
  const {
    writeContract: approveWrite,
    data: approveTxHash,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract();

  const { isLoading: isApprovePending, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt(
    {
      hash: approveTxHash,
    }
  );

  // Claim/Deposit transaction
  const {
    writeContract: claimWrite,
    data: claimTxHash,
    error: claimError,
    reset: resetClaim,
  } = useWriteContract();

  const {
    isLoading: isClaimPending,
    isSuccess: isClaimSuccess,
    data: claimReceipt,
  } = useWaitForTransactionReceipt({
    hash: claimTxHash,
  });

  // Handle approval flow
  useEffect(() => {
    if (isApproveSuccess && state === "waitingApproval") {
      void refetchAllowance().then(() => {
        setState("claiming");

        claimWrite({
          address: POOL_ADDRESS,
          abi: POOL_ABI,
          functionName: "depositWithReferral",
          args: [depositAmount, referrerAddress!],
        });
      });
    }
  }, [isApproveSuccess, state, depositAmount, referrerAddress, claimWrite, refetchAllowance]);

  // Handle success
  useEffect(() => {
    if (isClaimSuccess && state === "processing") {
      // Invalidate specific queries instead of all
      void queryClient.invalidateQueries({ queryKey: ["individual-pool-v3"] });
      void refetchStats();

      setState("success");
    }
  }, [isClaimSuccess, state, queryClient, claimReceipt, refetchStats]);

  // Handle state transitions
  useEffect(() => {
    if (isApprovePending && state === "approving") {
      setState("waitingApproval");
    }
  }, [isApprovePending, state]);

  useEffect(() => {
    if (isClaimPending && state === "claiming") {
      setState("processing");
    }
  }, [isClaimPending, state]);

  // Handle errors
  useEffect(() => {
    if (approveError ?? claimError) {
      const err = approveError ?? claimError;
      setState("error");

      const msg = err?.message ?? "";
      if (msg.includes("User rejected") || msg.includes("user rejected")) {
        setError("Rechazaste la transacción en tu wallet");
      } else if (msg.includes("NoReferralRewards")) {
        setError("No tienes recompensas para reclamar");
      } else if (msg.includes("SelfReferralNotAllowed")) {
        setError("No puedes usar tu propia dirección como referidor");
      } else {
        setError("Error en la operación");
      }
    }
  }, [approveError, claimError]);

  // Claim referral rewards
  const claimRewards = async () => {
    if (!address) {
      setError("Conecta tu wallet primero");
      setState("error");
      return;
    }

    try {
      setState("idle");
      setError("");
      resetClaim();

      setState("claiming");

      claimWrite({
        address: POOL_ADDRESS,
        abi: POOL_ABI,
        functionName: "claimReferralRewards",
      });
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Deposit with referral
  const depositWithReferral = async (amountString: string, referrer: Address) => {
    if (!address) {
      setError("Conecta tu wallet primero");
      setState("error");
      return;
    }

    if (!referrer || referrer === address) {
      setError("Dirección de referidor inválida");
      setState("error");
      return;
    }

    try {
      setState("idle");
      setError("");
      resetApprove();
      resetClaim();

      const amount = parseEther(amountString);
      setDepositAmount(amount);
      setReferrerAddress(referrer);

      // Validate minimum
      if (amount < parseEther("10")) {
        setError("El mínimo es 10 MUSD");
        setState("error");
        return;
      }

      // Check if need approval
      if (!allowance || allowance < amount) {
        setState("approving");

        const MAX_UINT256 = BigInt(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        );

        approveWrite({
          address: MUSD_ADDRESS,
          abi: MUSD_ABI,
          functionName: "approve",
          args: [POOL_ADDRESS, MAX_UINT256],
        });
      } else {
        setState("claiming");

        claimWrite({
          address: POOL_ADDRESS,
          abi: POOL_ABI,
          functionName: "depositWithReferral",
          args: [amount, referrer],
        });
      }
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const reset = () => {
    setState("idle");
    setError("");
    resetApprove();
    resetClaim();
  };

  // Parse stats
  const referralStats: ReferralStats | null = stats
    ? {
        count: stats[0],
        rewards: stats[1],
        referrer: stats[2],
      }
    : null;

  return {
    // Data
    stats: referralStats,
    hasRewards: referralStats ? referralStats.rewards > 0n : false,
    hasReferrer: referralStats
      ? referralStats.referrer !== "0x0000000000000000000000000000000000000000"
      : false,
    loadingStats,

    // Actions
    claimRewards,
    depositWithReferral,
    reset,

    // State
    state,
    error,
    txHash: claimReceipt?.transactionHash ?? claimTxHash ?? approveTxHash,
    isProcessing: state !== "idle" && state !== "success" && state !== "error",
    canClaim:
      (state === "idle" || state === "error" || state === "success") &&
      referralStats &&
      referralStats.rewards > 0n,
  };
}
