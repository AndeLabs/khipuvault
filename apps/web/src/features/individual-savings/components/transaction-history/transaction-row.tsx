"use client";

import { AmountDisplay } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";
import { TransactionLink } from "@/components/ui/transaction-link";
import { cn } from "@/lib/utils";

import { TRANSACTION_LABELS } from "./constants";
import { formatAmount, formatTimestamp } from "./utils";

import type { Transaction } from "./types";

interface TransactionRowProps {
  transaction: Transaction;
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const txInfo = TRANSACTION_LABELS[transaction.type];

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated",
              txInfo.color
            )}
          >
            {txInfo.icon}
          </div>
          <span className="font-medium">{txInfo.label}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className={cn("font-mono font-semibold", txInfo.color)}>
          {transaction.amount > BigInt(0) ? (
            <AmountDisplay
              amount={formatAmount(transaction.amount, transaction.type)}
              symbol="mUSD"
              size="sm"
            />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {formatTimestamp(transaction.timestamp)}
        </span>
      </TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell className="text-right">
        <TransactionLink txHash={transaction.hash} />
      </TableCell>
    </TableRow>
  );
}
