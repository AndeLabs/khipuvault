"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { TransactionStatus, TransactionSteps } from "@/components/common";
import { useTransaction } from "../context/transaction-context";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Transaction Modal
 *
 * Shows active transaction progress with:
 * - Current status
 * - Step-by-step progress
 * - Transaction hash link
 * - Error messages
 */

interface TransactionModalProps {
  open?: boolean;
  onClose?: () => void;
}

export function TransactionModal({ open, onClose }: TransactionModalProps) {
  const { activeTransaction } = useTransaction();

  const isOpen = open ?? !!activeTransaction;

  const handleClose = () => {
    if (
      activeTransaction?.status === "success" ||
      activeTransaction?.status === "error" ||
      activeTransaction?.status === "rejected"
    ) {
      onClose?.();
    }
  };

  if (!activeTransaction) return null;

  type StepStatus = "pending" | "active" | "complete" | "error";

  const getStepStatus = (
    condition: boolean,
    active: StepStatus,
    fallback: StepStatus,
  ): StepStatus => (condition ? active : fallback);

  const steps: Array<{ label: string; status: StepStatus }> = [
    {
      label: "Initialize Transaction",
      status:
        activeTransaction.status === "idle"
          ? "active"
          : activeTransaction.status === "error" ||
              activeTransaction.status === "rejected"
            ? "error"
            : "complete",
    },
    {
      label: "Sign with Wallet",
      status:
        activeTransaction.status === "signing"
          ? "active"
          : activeTransaction.status === "error" ||
              activeTransaction.status === "rejected"
            ? "error"
            : activeTransaction.status === "idle" ||
                activeTransaction.status === "pending"
              ? "pending"
              : "complete",
    },
    {
      label: "Confirm on Blockchain",
      status:
        activeTransaction.status === "confirming"
          ? "active"
          : activeTransaction.status === "error"
            ? "error"
            : activeTransaction.status === "success"
              ? "complete"
              : "pending",
    },
    {
      label: "Transaction Complete",
      status:
        activeTransaction.status === "success"
          ? "complete"
          : activeTransaction.status === "error"
            ? "error"
            : "pending",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{activeTransaction.type}</span>
            {(activeTransaction.status === "success" ||
              activeTransaction.status === "error" ||
              activeTransaction.status === "rejected") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {activeTransaction.status === "signing" &&
              "Please confirm the transaction in your wallet"}
            {activeTransaction.status === "confirming" &&
              "Waiting for blockchain confirmation"}
            {activeTransaction.status === "success" &&
              "Transaction completed successfully"}
            {activeTransaction.status === "error" && "Transaction failed"}
            {activeTransaction.status === "rejected" && "Transaction rejected"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Transaction Status */}
          <TransactionStatus
            status={activeTransaction.status}
            message={activeTransaction.message}
            txHash={activeTransaction.txHash}
            variant="detailed"
          />

          {/* Transaction Steps */}
          <TransactionSteps steps={steps} />

          {/* Actions */}
          {activeTransaction.status === "success" && (
            <div className="flex gap-2">
              {activeTransaction.txHash && (
                <a
                  href={`https://explorer.mezo.org/tx/${activeTransaction.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "flex-1",
                  )}
                >
                  View on Explorer
                </a>
              )}
              <Button onClick={handleClose} className="flex-1">
                Done
              </Button>
            </div>
          )}

          {(activeTransaction.status === "error" ||
            activeTransaction.status === "rejected") && (
            <Button onClick={handleClose} variant="outline" className="w-full">
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Transaction History Modal
 * Shows past transactions
 */
export function TransactionHistoryModal() {
  const [open, setOpen] = React.useState(false);
  const { transactions } = useTransaction();

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        View History ({transactions.length})
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
            <DialogDescription>
              Your recent blockchain transactions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No transactions yet
              </p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <TransactionStatus status={tx.status} variant="badge" />
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
