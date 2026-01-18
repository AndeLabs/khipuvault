import { z } from "zod";

export const TransactionTypeSchema = z.enum([
  "deposit",
  "withdraw",
  "claim_yield",
  "compound",
  "pool_created",
  "pool_joined",
  "pool_left",
]);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TransactionStatusSchema = z.enum(["pending", "confirmed", "failed"]);
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

export interface Transaction {
  id: string;
  userId: string;
  poolId: string;
  type: TransactionType;
  amount: string; // BigInt as string
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  status: TransactionStatus;
  gasUsed?: string;
  error?: string;
}
