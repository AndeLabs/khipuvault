/**
 * @fileoverview Claim Yields Hook - IndividualPoolV3 Feature
 *
 * Allows users to claim their accumulated yields without withdrawing principal
 * Production-ready with proper error handling
 */

"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { type Address } from "viem";
import { MEZO_TESTNET_ADDRESSES } from "@/lib/web3/contracts";

const POOL_ADDRESS = MEZO_TESTNET_ADDRESSES.individualPool as Address;

const POOL_ABI = [
  {
    name: "claimYield",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [{ name: "netYield", type: "uint256" }],
  },
] as const;

type ClaimState = "idle" | "confirming" | "processing" | "success" | "error";

export function useClaimYields() {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const [state, setState] = useState<ClaimState>("idle");
  const [error, setError] = useState<string>("");

  const {
    writeContract,
    data: txHash,
    error: txError,
    reset: resetTx,
  } = useWriteContract();

  const {
    isLoading: isPending,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle state transitions
  useEffect(() => {
    if (isPending && state === "confirming") {
      setState("processing");
    }
  }, [isPending, state]);

  useEffect(() => {
    if (isSuccess && state === "processing") {
      // Immediately invalidate pool queries to update UI
      // The usePoolEvents hook also listens for YieldClaimed events
      queryClient.invalidateQueries({ queryKey: ["individual-pool-v3"] });
      queryClient.invalidateQueries({ queryKey: ["individual-pool"] });

      setState("success");
    }
  }, [isSuccess, state, queryClient, receipt]);

  // Handle errors
  useEffect(() => {
    if (txError) {
      setState("error");

      const msg = txError.message || "";
      if (msg.includes("User rejected") || msg.includes("user rejected")) {
        setError("Rechazaste la transacción en tu wallet");
      } else if (msg.includes("NoActiveDeposit")) {
        setError("No tienes un depósito activo");
      } else if (msg.includes("InvalidAmount")) {
        setError("No tienes yields para reclamar");
      } else {
        setError("Error al reclamar yields");
      }
    }
  }, [txError]);

  // Main function
  const claimYields = async () => {
    if (!address) {
      setError("Conecta tu wallet primero");
      setState("error");
      return;
    }

    try {
      setState("idle");
      setError("");
      resetTx();

      setState("confirming");

      writeContract({
        address: POOL_ADDRESS,
        abi: POOL_ABI,
        functionName: "claimYield",
      });
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const reset = () => {
    setState("idle");
    setError("");
    resetTx();
  };

  return {
    claimYields,
    reset,
    state,
    error,
    txHash: receipt?.transactionHash || txHash,
    isProcessing: state === "confirming" || state === "processing",
    canClaim: state === "idle" || state === "error" || state === "success",
  };
}
