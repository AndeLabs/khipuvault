/**
 * @fileoverview Buy Tickets Hook with Auto Approve and Network Switching
 * @module hooks/web3/lottery/use-buy-tickets-with-approve
 *
 * Handles ticket purchase with:
 * - Automatic network switching
 * - Automatic MUSD approval for lottery pool
 * - Atomic state management
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useState, useRef } from "react";
import { parseEther, maxUint256 } from "viem";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useConfig,
  useSwitchChain,
} from "wagmi";
import { readContract } from "wagmi/actions";

import { mezoTestnet } from "@/lib/web3/chains";
import { MEZO_TESTNET_ADDRESSES } from "@/lib/web3/contracts";
import { LOTTERY_POOL_ABI } from "@/lib/web3/lottery-pool-abi";

const LOTTERY_POOL_ADDRESS = MEZO_TESTNET_ADDRESSES.lotteryPool as `0x${string}`;
const MUSD_ADDRESS = MEZO_TESTNET_ADDRESSES.musd as `0x${string}`;

const ERC20_ABI = [
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

type BuyTicketsStep =
  | "idle"
  | "switching-network"
  | "checking"
  | "approving"
  | "awaiting-approval"
  | "verifying-allowance"
  | "buying";

interface BuyTicketsState {
  isProcessing: boolean;
  buyHash: string | null;
  approveHash: string | null;
  step: BuyTicketsStep;
  error: string | null;
  operationId: number;
}

export function useBuyTicketsWithApprove() {
  const { address, chain } = useAccount();
  const config = useConfig();
  const queryClient = useQueryClient();
  const { switchChainAsync } = useSwitchChain();

  const operationLockRef = useRef(false);
  const currentOperationIdRef = useRef(0);

  const [localState, setLocalState] = useState<BuyTicketsState>({
    isProcessing: false,
    buyHash: null,
    approveHash: null,
    step: "idle",
    error: null,
    operationId: 0,
  });

  const [pendingPurchase, setPendingPurchase] = useState<{
    roundId: bigint;
    ticketCount: bigint;
    totalCost: bigint;
  } | null>(null);

  const {
    writeContract: writeApprove,
    data: approveHash,
    reset: resetApprove,
  } = useWriteContract();
  const { writeContract: writeBuy, data: buyHash, reset: resetBuy } = useWriteContract();

  const { isLoading: isApproving, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
    pollingInterval: 3000,
  });

  const { isLoading: isBuying, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({
    hash: buyHash,
    pollingInterval: 3000,
  });

  // After approve succeeds, verify allowance and buy tickets
  useEffect(() => {
    if (isApproveSuccess && pendingPurchase && localState.step === "awaiting-approval") {
      const operationId = localState.operationId;
      setLocalState((prev) => ({ ...prev, step: "verifying-allowance" }));

      const verifyAndBuy = async () => {
        try {
          if (currentOperationIdRef.current !== operationId) {
            return;
          }

          if (!address) {
            throw new Error("Wallet disconnected");
          }

          const allowance = (await readContract(config, {
            address: MUSD_ADDRESS,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [address, LOTTERY_POOL_ADDRESS],
          })) as bigint;

          if (allowance < pendingPurchase.totalCost) {
            throw new Error("Allowance verification failed");
          }

          setLocalState((prev) => ({ ...prev, step: "buying" }));

          writeBuy(
            {
              address: LOTTERY_POOL_ADDRESS,
              abi: LOTTERY_POOL_ABI,
              functionName: "buyTickets",
              args: [pendingPurchase.roundId, pendingPurchase.ticketCount],
            },
            {
              onSuccess: (hash) => {
                setLocalState((prev) => ({ ...prev, buyHash: hash }));
              },
              onError: (error) => {
                operationLockRef.current = false;
                setLocalState((prev) => ({
                  ...prev,
                  step: "idle",
                  isProcessing: false,
                  error: error.message,
                }));
              },
            }
          );
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Verification failed";
          operationLockRef.current = false;
          setLocalState((prev) => ({
            ...prev,
            step: "idle",
            isProcessing: false,
            error: errorMsg,
          }));
        }
      };

      void verifyAndBuy();
    }
  }, [
    isApproveSuccess,
    pendingPurchase,
    localState.step,
    localState.operationId,
    address,
    config,
    writeBuy,
  ]);

  // After buy succeeds, cleanup and refetch
  useEffect(() => {
    if (isBuySuccess && buyHash) {
      void queryClient.invalidateQueries({ queryKey: ["lottery-pool"] });
      void queryClient.invalidateQueries({ queryKey: ["lotteryPool"] });
      operationLockRef.current = false;
      setLocalState((prev) => ({
        ...prev,
        isProcessing: false,
        step: "idle",
      }));
      setPendingPurchase(null);
    }
  }, [isBuySuccess, buyHash, queryClient]);

  const buyTickets = useCallback(
    async (roundId: number, ticketCount: number, ticketPrice: bigint) => {
      if (operationLockRef.current) {
        throw new Error("A purchase operation is already in progress.");
      }

      try {
        if (!address) {
          throw new Error("Wallet not connected");
        }

        operationLockRef.current = true;
        const operationId = ++currentOperationIdRef.current;

        resetApprove();
        resetBuy();

        const totalCost = ticketPrice * BigInt(ticketCount);
        setPendingPurchase({
          roundId: BigInt(roundId),
          ticketCount: BigInt(ticketCount),
          totalCost,
        });

        // Check network
        if (chain?.id !== mezoTestnet.id) {
          setLocalState({
            step: "switching-network",
            isProcessing: true,
            buyHash: null,
            approveHash: null,
            error: null,
            operationId,
          });

          try {
            await switchChainAsync({ chainId: mezoTestnet.id });
          } catch {
            operationLockRef.current = false;
            setLocalState((prev) => ({
              ...prev,
              step: "idle",
              isProcessing: false,
              error: "Please switch to Mezo Testnet",
            }));
            throw new Error("Network switch required");
          }
        }

        setLocalState({
          step: "checking",
          isProcessing: true,
          buyHash: null,
          approveHash: null,
          error: null,
          operationId,
        });

        const allowance = (await readContract(config, {
          address: MUSD_ADDRESS,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, LOTTERY_POOL_ADDRESS],
        })) as bigint;

        if (allowance >= totalCost) {
          // Already approved, just buy
          setLocalState((prev) => ({ ...prev, step: "buying" }));

          writeBuy(
            {
              address: LOTTERY_POOL_ADDRESS,
              abi: LOTTERY_POOL_ABI,
              functionName: "buyTickets",
              args: [BigInt(roundId), BigInt(ticketCount)],
            },
            {
              onSuccess: (hash) => {
                setLocalState((prev) => ({ ...prev, buyHash: hash }));
              },
              onError: (error) => {
                operationLockRef.current = false;
                setLocalState((prev) => ({
                  ...prev,
                  step: "idle",
                  isProcessing: false,
                  error: error.message,
                }));
              },
            }
          );
        } else {
          // Need to approve first
          setLocalState((prev) => ({ ...prev, step: "approving" }));

          writeApprove(
            {
              address: MUSD_ADDRESS,
              abi: ERC20_ABI,
              functionName: "approve",
              args: [LOTTERY_POOL_ADDRESS, maxUint256],
            },
            {
              onSuccess: (hash) => {
                setLocalState((prev) => ({
                  ...prev,
                  step: "awaiting-approval",
                  approveHash: hash,
                }));
              },
              onError: (error) => {
                operationLockRef.current = false;
                setLocalState((prev) => ({
                  ...prev,
                  step: "idle",
                  isProcessing: false,
                  error: error.message,
                }));
              },
            }
          );
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        operationLockRef.current = false;
        setLocalState((prev) => ({
          ...prev,
          isProcessing: false,
          step: "idle",
          error: errorMsg,
        }));
        throw error;
      }
    },
    [address, chain, config, switchChainAsync, writeApprove, writeBuy, resetApprove, resetBuy]
  );

  const reset = useCallback(() => {
    operationLockRef.current = false;
    resetApprove();
    resetBuy();
    setPendingPurchase(null);
    setLocalState({
      isProcessing: false,
      buyHash: null,
      approveHash: null,
      step: "idle",
      error: null,
      operationId: 0,
    });
  }, [resetApprove, resetBuy]);

  return {
    buyTickets,
    reset,
    isApproving,
    isBuying,
    isProcessing: localState.isProcessing,
    isSuccess: isBuySuccess,
    approveHash,
    buyHash,
    step: localState.step,
    error: localState.error,
  };
}
