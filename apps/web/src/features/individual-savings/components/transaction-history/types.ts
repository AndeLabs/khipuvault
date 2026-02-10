export type TransactionType =
  | "deposit"
  | "withdraw"
  | "claim"
  | "claim_yield"
  | "claim_referral"
  | "compound"
  | "auto_compound"
  | "toggle_auto_compound";

export interface Transaction {
  hash: string;
  type: TransactionType;
  amount: bigint;
  timestamp: number;
  status: "success" | "pending" | "failed";
  gasUsed?: bigint;
  referrer?: string;
}

export interface TransactionInfo {
  label: string;
  icon: React.ReactNode;
  color: string;
}
