/**
 * @fileoverview Ultra-Simple Deposit Hook
 *
 * ONE function that does everything:
 * 1. Check approval
 * 2. Approve if needed
 * 3. Deposit
 *
 * Uses useEffect properly - no fighting React
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { parseEther, type Address } from "viem";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";

import { MEZO_V3_ADDRESSES } from "@/lib/web3/contracts-v3";

const MUSD_ADDRESS = MEZO_V3_ADDRESSES.musd as Address;
const POOL_ADDRESS = MEZO_V3_ADDRESSES.individualPoolV3 as Address;

// Minimal ABIs - only what we need
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
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

const POOL_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "musdAmount", type: "uint256" }],
    outputs: [],
  },
] as const;

// Clear state machine
type DepositState =
  | "idle" // Ready to start
  | "approving" // User confirming approval in wallet
  | "waitingApproval" // Waiting for approval tx to confirm
  | "depositing" // User confirming deposit in wallet
  | "waitingDeposit" // Waiting for deposit tx to confirm
  | "success" // All done!
  | "error"; // Something failed

export function useSimpleDeposit() {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  // State
  const [state, setState] = useState<DepositState>("idle");
  const [error, setError] = useState<string>("");
  const [amountToDeposit, setAmountToDeposit] = useState<bigint>(0n);

  // Read MUSD balance
  const { data: musdBalance } = useReadContract({
    address: MUSD_ADDRESS,
    abi: MUSD_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Read allowance
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

  const { isLoading: isApprovePending, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveTxHash,
    });

  // Deposit transaction
  const {
    writeContract: depositWrite,
    data: depositTxHash,
    error: depositError,
    reset: resetDeposit,
  } = useWriteContract();

  const {
    isLoading: isDepositPending,
    isSuccess: isDepositSuccess,
    isError: isDepositError,
  } = useWaitForTransactionReceipt({
    hash: depositTxHash,
  });

  // Effect: Handle approval confirmation
  // After approval succeeds, proceed with deposit immediately
  useEffect(() => {
    if (isApproveSuccess && state === "waitingApproval") {
      // Use async IIFE to properly sequence operations
      const proceedWithDeposit = async () => {
        try {
          // Refetch allowance to confirm approval
          await refetchAllowance();

          setState("depositing");

          // Now call deposit
          depositWrite({
            address: POOL_ADDRESS,
            abi: POOL_ABI,
            functionName: "deposit",
            args: [amountToDeposit],
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Error proceeding with deposit after approval:", err);
          setState("error");
        }
      };

      void proceedWithDeposit();
    }
  }, [
    isApproveSuccess,
    state,
    amountToDeposit,
    depositWrite,
    refetchAllowance,
  ]);

  // Effect: Handle deposit confirmation
  useEffect(() => {
    if (isDepositSuccess && state === "waitingDeposit") {
      // Invalidate all pool-related queries to ensure UI updates
      void queryClient.invalidateQueries({ queryKey: ["individual-pool-v3"] });
      void queryClient.invalidateQueries({ queryKey: ["individual-pool"] });
      // Also invalidate MUSD balance queries
      void queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey.some(
            (k) => typeof k === "string" && k.includes("musd"),
          ),
      });

      setState("success");
    }
  }, [isDepositSuccess, state, queryClient]);

  // Effect: Update state when tx is pending
  useEffect(() => {
    if (isApprovePending && state === "approving") {
      setState("waitingApproval");
    }
  }, [isApprovePending, state]);

  useEffect(() => {
    if (isDepositPending && state === "depositing") {
      setState("waitingDeposit");
    }
  }, [isDepositPending, state]);

  // Effect: Handle errors
  useEffect(() => {
    if (approveError) {
      setState("error");

      const msg = approveError.message ?? "";
      if (msg.includes("User rejected") || msg.includes("user rejected")) {
        setError("Rechazaste la transacción en tu wallet");
      } else if (msg.includes("insufficient funds")) {
        setError("No tienes suficiente BTC para pagar el gas");
      } else {
        setError("Error al aprobar MUSD");
      }
    }
  }, [approveError]);

  useEffect(() => {
    if (depositError) {
      setState("error");

      const msg = depositError.message ?? "";
      if (msg.includes("User rejected") || msg.includes("user rejected")) {
        setError("Rechazaste la transacción en tu wallet");
      } else if (msg.includes("insufficient funds")) {
        setError("No tienes suficiente BTC para pagar el gas");
      } else if (msg.includes("MinimumDepositNotMet")) {
        setError("El mínimo de depósito es 10 MUSD");
      } else if (msg.includes("MaximumDepositExceeded")) {
        setError("El máximo de depósito es 100,000 MUSD");
      } else {
        setError("Error al depositar. Intenta nuevamente.");
      }
    }
  }, [depositError]);

  useEffect(() => {
    if (isDepositError && state === "waitingDeposit") {
      setState("error");
      setError(
        "La transacción falló en la blockchain. Revisa tu wallet o intenta nuevamente.",
      );
    }
  }, [isDepositError, state]);

  // Main function - called by UI
  const deposit = async (amountString: string) => {
    if (!address) {
      setError("Conecta tu wallet primero");
      setState("error");
      return;
    }

    try {
      // Reset
      setState("idle");
      setError("");
      resetApprove();
      resetDeposit();

      // Parse amount
      const amount = parseEther(amountString);
      setAmountToDeposit(amount);

      // Validate
      if (amount < parseEther("10")) {
        setError("El mínimo es 10 MUSD");
        setState("error");
        return;
      }

      if (musdBalance && amount > musdBalance) {
        setError("No tienes suficiente MUSD");
        setState("error");
        return;
      }

      // Check if need approval
      if (!allowance || allowance < amount) {
        setState("approving");

        // Approve unlimited for better UX
        const MAX_UINT256 = BigInt(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        );

        approveWrite({
          address: MUSD_ADDRESS,
          abi: MUSD_ABI,
          functionName: "approve",
          args: [POOL_ADDRESS, MAX_UINT256],
        });
      } else {
        setState("depositing");

        depositWrite({
          address: POOL_ADDRESS,
          abi: POOL_ABI,
          functionName: "deposit",
          args: [amount],
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
    setAmountToDeposit(0n);
    resetApprove();
    resetDeposit();
  };

  // Helper to get progress
  const getProgress = () => {
    switch (state) {
      case "idle":
        return { current: 0, total: 2, message: "Listo para depositar" };
      case "approving":
        return {
          current: 1,
          total: 2,
          message: "Confirma la aprobación en tu wallet",
        };
      case "waitingApproval":
        return {
          current: 1,
          total: 2,
          message: "Esperando confirmación de aprobación...",
        };
      case "depositing":
        return {
          current: 2,
          total: 2,
          message: "Confirma el depósito en tu wallet",
        };
      case "waitingDeposit":
        return {
          current: 2,
          total: 2,
          message: "Esperando confirmación de depósito...",
        };
      case "success":
        return { current: 2, total: 2, message: "¡Depósito exitoso!" };
      case "error":
        return { current: 0, total: 2, message: error };
    }
  };

  return {
    // Main API
    deposit,
    reset,

    // State
    state,
    progress: getProgress(),
    error,

    // Transaction hashes for explorer links (use receipt hash if available, fallback to wagmi hash)
    approveTxHash,
    depositTxHash: depositTxHash,

    // Balance
    musdBalance,
    balanceFormatted: musdBalance
      ? (Number(musdBalance) / 1e18).toFixed(2)
      : "0.00",

    // Flags
    isProcessing: state !== "idle" && state !== "success" && state !== "error",
    canDeposit: state === "idle" || state === "error" || state === "success",
  };
}
