import { CheckCircle2, XCircle, Clock, Loader2, AlertCircle } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Transaction Status Component
 * 7-step transaction feedback system based on DeFi best practices
 */

export type TransactionState =
  | "idle"
  | "pending"
  | "signing"
  | "confirming"
  | "success"
  | "error"
  | "rejected";

const statusConfig = {
  idle: {
    icon: Clock,
    label: "Not Started",
    variant: "secondary" as const,
    color: "text-muted-foreground",
  },
  pending: {
    icon: Loader2,
    label: "Pending",
    variant: "warning" as const,
    color: "text-warning",
    animate: true,
  },
  signing: {
    icon: Loader2,
    label: "Sign Transaction",
    variant: "lavanda" as const,
    color: "text-lavanda",
    animate: true,
  },
  confirming: {
    icon: Loader2,
    label: "Confirming",
    variant: "orange" as const,
    color: "text-accent",
    animate: true,
  },
  success: {
    icon: CheckCircle2,
    label: "Success",
    variant: "success" as const,
    color: "text-success",
  },
  error: {
    icon: XCircle,
    label: "Failed",
    variant: "error" as const,
    color: "text-error",
  },
  rejected: {
    icon: AlertCircle,
    label: "Rejected",
    variant: "warning" as const,
    color: "text-warning",
  },
};

interface TransactionStatusProps {
  status: TransactionState;
  message?: string;
  txHash?: string;
  className?: string;
  variant?: "badge" | "inline" | "detailed";
}

export function TransactionStatus({
  status,
  message,
  txHash,
  className,
  variant = "inline",
}: TransactionStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  if (variant === "badge") {
    return (
      <Badge variant={config.variant} className={cn("gap-1.5", className)}>
        <Icon
          className={cn(
            "h-3 w-3",
            "animate" in config && "animate" in config && config.animate && "animate-spin"
          )}
        />
        {config.label}
      </Badge>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Icon
          className={cn(
            "h-4 w-4",
            config.color,
            "animate" in config && config.animate && "animate-spin"
          )}
        />
        <span className={cn("text-sm font-medium", config.color)}>{message ?? config.label}</span>
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "h-5 w-5",
            config.color,
            "animate" in config && config.animate && "animate-spin"
          )}
        />
        <span className={cn("text-base font-semibold", config.color)}>{config.label}</span>
      </div>
      {message && <p className="pl-7 text-sm text-muted-foreground">{message}</p>}
      {txHash && (
        <a
          href={`https://explorer.mezo.org/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 pl-7 text-sm text-lavanda hover:underline"
        >
          View on Explorer
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      )}
    </div>
  );
}

/**
 * Transaction Steps - Shows multi-step transaction progress
 */
interface TransactionStep {
  label: string;
  status: "pending" | "active" | "complete" | "error";
}

interface TransactionStepsProps {
  steps: TransactionStep[];
  className?: string;
}

export function TransactionSteps({ steps, className }: TransactionStepsProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <div key={`step-${step.label}-${index}`} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  step.status === "complete" && "bg-success text-white",
                  step.status === "active" && "bg-lavanda text-white",
                  step.status === "error" && "bg-error text-white",
                  step.status === "pending" &&
                    "border-2 border-border bg-surface text-muted-foreground"
                )}
              >
                {(() => {
                  if (step.status === "complete") {
                    return <CheckCircle2 className="h-4 w-4" />;
                  }
                  if (step.status === "error") {
                    return <XCircle className="h-4 w-4" />;
                  }
                  return index + 1;
                })()}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "mt-1 h-8 w-0.5",
                    step.status === "complete" ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </div>
            <div className="flex-1 pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.status === "active" && "text-foreground",
                  step.status === "complete" && "text-success",
                  step.status === "error" && "text-error",
                  step.status === "pending" && "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
