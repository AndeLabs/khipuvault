"use client";

import {
  Zap,
  Gift,
  TrendingUp,
  CheckCircle2,
  Info,
  ArrowRight,
} from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTransactionExecute } from "@/features/transactions";
import { cn } from "@/lib/utils";

interface ActionsCardProps {
  canClaimYields?: boolean;
  pendingYields?: string;
  autoCompoundEnabled?: boolean;
  onClaimYields?: () => Promise<any>;
  onToggleAutoCompound?: () => Promise<any>;
  isLoading?: boolean;
  className?: string;
}

export function ActionsCard({
  canClaimYields = false,
  pendingYields = "0",
  autoCompoundEnabled = false,
  onClaimYields,
  onToggleAutoCompound,
  isLoading,
  className,
}: ActionsCardProps) {
  const { execute: executeClaimYields } = useTransactionExecute({
    type: "Claim Yields",
  });
  const { execute: executeAutoCompound } = useTransactionExecute({
    type: autoCompoundEnabled
      ? "Disable Auto-Compound"
      : "Enable Auto-Compound",
  });

  const handleClaimYields = async () => {
    if (!onClaimYields) {return;}
    await executeClaimYields(onClaimYields);
  };

  const handleToggleAutoCompound = async () => {
    if (!onToggleAutoCompound) {return;}
    await executeAutoCompound(onToggleAutoCompound);
  };

  return (
    <Card variant="surface" className={className}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Manage your savings and optimize returns
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Auto-Compound */}
        <div
          className={cn(
            "flex flex-col gap-4 p-4 rounded-lg border transition-all duration-base",
            autoCompoundEnabled
              ? "border-success bg-success/5"
              : "border-border bg-surface-elevated",
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                autoCompoundEnabled ? "bg-success/20" : "bg-surface",
              )}
            >
              <Zap
                className={cn(
                  "h-5 w-5",
                  autoCompoundEnabled
                    ? "text-success"
                    : "text-muted-foreground",
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">Auto-Compound</h4>
                {autoCompoundEnabled && (
                  <Badge variant="success" className="text-[10px]">
                    Active
                  </Badge>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground ml-auto"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p className="font-semibold mb-2">
                        How Auto-Compound Works:
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-success" />
                          <span>
                            Your yields are automatically reinvested into the
                            pool
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-success" />
                          <span>
                            Earns compound interest on top of your yields
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-success" />
                          <span>
                            Maximizes returns over time (up to 30% more)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-success" />
                          <span>
                            No gas fees - done automatically by the protocol
                          </span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {autoCompoundEnabled
                  ? "Yields are automatically reinvested for maximum returns"
                  : "Enable to automatically reinvest your yields"}
              </p>
            </div>
          </div>

          {/* Visual explanation when disabled */}
          {!autoCompoundEnabled && (
            <div className="p-3 rounded-lg bg-surface border border-border">
              <p className="text-xs font-medium text-foreground mb-2">
                How it works:
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">Deposit</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-mono">Earn Yields</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-mono text-success">Auto-Reinvest</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-mono">Higher Returns</span>
              </div>
            </div>
          )}

          <Button
            variant={autoCompoundEnabled ? "outline" : "primary"}
            size="sm"
            onClick={handleToggleAutoCompound}
            loading={isLoading}
            className="w-full"
          >
            {autoCompoundEnabled ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Enabled
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Enable Auto-Compound
              </>
            )}
          </Button>
        </div>

        {/* Claim Yields */}
        <div
          className={cn(
            "flex flex-col gap-4 p-4 rounded-lg border transition-all duration-base",
            canClaimYields
              ? "border-lavanda bg-lavanda/5"
              : "border-border bg-surface-elevated",
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                canClaimYields ? "bg-lavanda/20" : "bg-surface",
              )}
            >
              <Gift
                className={cn(
                  "h-5 w-5",
                  canClaimYields ? "text-lavanda" : "text-muted-foreground",
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">Claim Yields</h4>
                {canClaimYields && (
                  <Badge variant="lavanda" className="text-[10px]">
                    Available
                  </Badge>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground ml-auto"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p className="font-semibold mb-2">About Yields:</p>
                      <div className="space-y-2 text-sm">
                        <p>
                          Yields are the profits generated from your mUSD
                          deposits in Mezo's Stability Pool.
                        </p>
                        <p className="font-medium mt-2">You can either:</p>
                        <div className="flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-lavanda mt-1.5" />
                          <span>
                            <strong>Claim manually</strong> to receive yields in
                            your wallet
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-lavanda mt-1.5" />
                          <span>
                            <strong>Enable auto-compound</strong> to
                            automatically reinvest them
                          </span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                {canClaimYields
                  ? `${pendingYields} mUSD ready to claim`
                  : "No yields available to claim yet"}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                {canClaimYields
                  ? "Transfer accumulated yields to your wallet"
                  : "Yields accumulate daily from Mezo Stability Pool"}
              </p>
            </div>
          </div>

          {/* Pending yields display */}
          {canClaimYields && (
            <div className="p-3 rounded-lg bg-gradient-lavanda border border-lavanda/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Claimable Amount
                </span>
                <span className="text-sm font-semibold text-lavanda">
                  {pendingYields} mUSD
                </span>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleClaimYields}
            disabled={!canClaimYields}
            loading={isLoading}
            className="w-full"
          >
            {canClaimYields ? (
              <>
                <Gift className="h-4 w-4 mr-2" />
                Claim {pendingYields} mUSD
              </>
            ) : (
              "No Yields Available"
            )}
          </Button>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-lavanda border border-lavanda/20">
          <TrendingUp className="h-4 w-4 text-lavanda mt-0.5" />
          <div className="flex-1 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">
              Maximize your returns
            </p>
            <p>
              Enable auto-compound to automatically reinvest yields and benefit
              from compound interest
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
