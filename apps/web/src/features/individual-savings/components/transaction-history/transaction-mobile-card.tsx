"use client";

import { AmountDisplay } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { TransactionLink } from "@/components/ui/transaction-link";
import { cn } from "@/lib/utils";

import { TRANSACTION_LABELS } from "./constants";
import { formatAmount, formatTimestamp } from "./utils";

import type { Transaction } from "./types";

interface TransactionMobileCardProps {
  transaction: Transaction;
}

export function TransactionMobileCard({ transaction }: TransactionMobileCardProps) {
  const txInfo = TRANSACTION_LABELS[transaction.type];

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-elevated p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full bg-surface",
              txInfo.color
            )}
          >
            {txInfo.icon}
          </div>
          <div>
            <p className="font-medium">{txInfo.label}</p>
            <p className="text-xs text-muted-foreground">
              {formatTimestamp(transaction.timestamp)}
            </p>
          </div>
        </div>
        <Badge
          variant={(() => {
            if (transaction.status === "success") {
              return "success";
            }
            if (transaction.status === "pending") {
              return "secondary";
            }
            return "error";
          })()}
          className="text-xs"
        >
          {transaction.status}
        </Badge>
      </div>

      {transaction.amount > BigInt(0) && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className={cn("font-mono font-semibold", txInfo.color)}>
            <AmountDisplay
              amount={formatAmount(transaction.amount, transaction.type)}
              symbol="mUSD"
              size="sm"
            />
          </span>
        </div>
      )}

      <div className="border-t border-border pt-2">
        <TransactionLink txHash={transaction.hash} />
      </div>
    </div>
  );
}
