/**
 * Hook to fetch user transaction history from blockchain events
 * @module hooks/web3/use-user-transaction-history
 */

import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";

import { MEZO_V3_ADDRESSES } from "@/lib/web3/contracts-v3";

export interface Transaction {
  hash: string;
  type: "deposit" | "withdraw" | "claim" | "compound";
  amount: bigint;
  timestamp: number;
  status: "success" | "failed" | "pending";
  blockNumber?: bigint;
}

/**
 * Fetch user's transaction history from contract events
 */
export function useUserTransactionHistory() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["individual-pool-transactions", address],
    queryFn: async (): Promise<Transaction[]> => {
      if (!address || !publicClient) {
        return [];
      }

      try {
        // Get current block number
        const latestBlock = await publicClient.getBlockNumber();

        // Mezo RPC has a limit of 10,000 blocks per query
        // Query last 9,000 blocks to be safe (roughly 1-2 weeks of data)
        const fromBlock = latestBlock > BigInt(9000) ? latestBlock - BigInt(9000) : BigInt(0);

        // Get contract events for this user
        const [depositEvents, withdrawEvents, claimEvents] = await Promise.all([
          // Deposit events
          publicClient.getLogs({
            address: MEZO_V3_ADDRESSES.individualPoolV3 as `0x${string}`,
            event: {
              type: "event",
              name: "Deposited",
              inputs: [
                { type: "address", indexed: true, name: "user" },
                { type: "uint256", indexed: false, name: "amount" },
                { type: "address", indexed: true, name: "referrer" },
              ],
            },
            args: {
              user: address,
            },
            fromBlock,
            toBlock: "latest",
          }),

          // Withdraw events
          publicClient.getLogs({
            address: MEZO_V3_ADDRESSES.individualPoolV3 as `0x${string}`,
            event: {
              type: "event",
              name: "Withdrawn",
              inputs: [
                { type: "address", indexed: true, name: "user" },
                { type: "uint256", indexed: false, name: "amount" },
              ],
            },
            args: {
              user: address,
            },
            fromBlock,
            toBlock: "latest",
          }),

          // Yield claimed events
          publicClient.getLogs({
            address: MEZO_V3_ADDRESSES.individualPoolV3 as `0x${string}`,
            event: {
              type: "event",
              name: "YieldClaimed",
              inputs: [
                { type: "address", indexed: true, name: "user" },
                { type: "uint256", indexed: false, name: "amount" },
                { type: "uint256", indexed: false, name: "fee" },
              ],
            },
            args: {
              user: address,
            },
            fromBlock,
            toBlock: "latest",
          }),
        ]);

        // Get block timestamps
        const transactions: Transaction[] = [];

        // Process deposit events
        for (const event of depositEvents) {
          const block = await publicClient.getBlock({
            blockNumber: event.blockNumber,
          });
          transactions.push({
            hash: event.transactionHash,
            type: "deposit",
            amount: event.args.amount as bigint,
            timestamp: Number(block.timestamp),
            status: "success",
            blockNumber: event.blockNumber,
          });
        }

        // Process withdraw events
        for (const event of withdrawEvents) {
          const block = await publicClient.getBlock({
            blockNumber: event.blockNumber,
          });
          transactions.push({
            hash: event.transactionHash,
            type: "withdraw",
            amount: event.args.amount as bigint,
            timestamp: Number(block.timestamp),
            status: "success",
            blockNumber: event.blockNumber,
          });
        }

        // Process claim events
        for (const event of claimEvents) {
          const block = await publicClient.getBlock({
            blockNumber: event.blockNumber,
          });
          transactions.push({
            hash: event.transactionHash,
            type: "claim",
            amount: event.args.amount as bigint,
            timestamp: Number(block.timestamp),
            status: "success",
            blockNumber: event.blockNumber,
          });
        }

        // Sort by timestamp descending (newest first)
        return transactions.sort((a, b) => b.timestamp - a.timestamp);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching transaction history:", error);
        return [];
      }
    },
    enabled: !!address && !!publicClient,
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refetch every 60 seconds
  });
}

/**
 * Format transaction for display
 */
export function formatTransaction(tx: Transaction) {
  return {
    ...tx,
    amountFormatted: formatUnits(tx.amount, 18),
    dateFormatted: new Date(tx.timestamp * 1000).toLocaleString(),
    typeLabel: tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
  };
}
