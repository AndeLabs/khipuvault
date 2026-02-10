/**
 * @fileoverview Simple Withdraw Hook - Production Ready
 * Handles full withdrawal (principal + yields)
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { parseEther, type Address } from "viem";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";

import { getErrorMessage, logWeb3Error } from "@/lib/errors";
import { MEZO_TESTNET_ADDRESSES } from "@/lib/web3/contracts";

const POOL_ADDRESS = MEZO_TESTNET_ADDRESSES.individualPool as Address;

// V3 contract function names - must match actual contract ABI
const POOL_ABI = [
  {
    name: "fullWithdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [
      { name: "musdAmount", type: "uint256" },
      { name: "netYield", type: "uint256" },
    ],
  },
  {
    name: "partialWithdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "musdAmount", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

type WithdrawState =
  | "idle"
  | "confirming" // User confirming in wallet
  | "processing" // TX submitted, waiting for confirmation
  | "success"
  | "error";

export function useSimpleWithdraw() {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const [state, setState] = useState<WithdrawState>("idle");
  const [error, setError] = useState<string>("");

  // Withdraw transaction
  const {
    writeContract: withdrawWrite,
    data: withdrawTxHash,
    error: withdrawError,
    reset: resetWithdraw,
  } = useWriteContract();

  const {
    isLoading: isWithdrawPending,
    isSuccess: isWithdrawSuccess,
    data: withdrawReceipt,
  } = useWaitForTransactionReceipt({
    hash: withdrawTxHash,
  });

  // Handle state transitions
  useEffect(() => {
    if (isWithdrawPending && state === "confirming") {
      setState("processing");
    }
  }, [isWithdrawPending, state]);

  useEffect(() => {
    if (isWithdrawSuccess && state === "processing") {
      // Invalidate all pool-related queries to update UI
      void queryClient.invalidateQueries({ queryKey: ["individual-pool-v3"] });
      void queryClient.invalidateQueries({ queryKey: ["individual-pool"] });
      // Also invalidate MUSD balance queries
      void queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey.some((k) => typeof k === "string" && k.includes("musd")),
      });

      setState("success");
    }
  }, [isWithdrawSuccess, state, queryClient, withdrawReceipt]);

  // Handle errors
  useEffect(() => {
    if (withdrawError) {
      logWeb3Error(withdrawError, "withdraw");
      setState("error");
      setError(getErrorMessage(withdrawError));
    }
  }, [withdrawError]);

  // Main withdraw function (full or partial)
  const withdraw = async (amountString?: string) => {
    if (!address) {
      setError("Conecta tu wallet primero");
      setState("error");
      return;
    }

    try {
      setState("idle");
      setError("");
      resetWithdraw();

      // If amount provided, do partial withdrawal
      if (amountString) {
        const amount = parseEther(amountString);

        // Validate minimum (1 MUSD)
        if (amount < parseEther("1")) {
          setError("El mínimo de retiro parcial es 1 MUSD");
          setState("error");
          return;
        }

        setState("confirming");

        withdrawWrite({
          address: POOL_ADDRESS,
          abi: POOL_ABI,
          functionName: "partialWithdraw",
          args: [amount],
        });
      } else {
        // Full withdrawal
        setState("confirming");

        withdrawWrite({
          address: POOL_ADDRESS,
          abi: POOL_ABI,
          functionName: "fullWithdraw",
        });
      }
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Reset function
  const reset = () => {
    setState("idle");
    setError("");
    resetWithdraw();
  };

  return {
    withdraw,
    reset,
    state,
    error,
    withdrawTxHash: withdrawReceipt?.transactionHash ?? withdrawTxHash,
    isProcessing: state === "confirming" || state === "processing",
    canWithdraw: state === "idle" || state === "error" || state === "success",
  };
}
