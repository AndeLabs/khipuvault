"use client";

export const dynamic = "force-dynamic";

import { Coins, TrendingUp, TrendingDown, Gift, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { PriceBadge } from "@/components/mezo/price-display";
import { TransactionStatus } from "@/components/mezo/transaction-status";
import { PageHeader, PageSection } from "@/components/layout";
import { AmountDisplay } from "@/components/common";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatValue,
  StatLabel,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Web3ErrorBoundary } from "@/components/web3-error-boundary";
import {
  useStabilityPoolStats,
  useStabilityPoolDeposit,
  useWithdrawFromStabilityPool,
} from "@/hooks/web3/mezo";
import { cn } from "@/lib/utils";

/**
 * Mezo Stability Pool Page
 *
 * Features:
 * - Deposit MUSD with auto-approval flow
 * - Withdraw MUSD (claims BTC rewards automatically)
 * - Show pending BTC rewards
 * - Claim rewards button (withdraws 0 to claim)
 */
export default function MezoStabilityPoolPage() {
  const { isConnected } = useAccount();

  // Stability Pool stats
  const { totalDeposits, isLoading: isStatsLoading } = useStabilityPoolStats();

  // Combined deposit hook with position and approval
  const {
    compoundedDeposit,
    collateralGain,
    hasPosition,
    hasPendingGains,
    isLoading: isPositionLoading,
    refetchPosition,
    depositWithApproval,
    isDepositPending,
    isDepositConfirming,
    isDepositSuccess,
    depositHash,
    depositValidationError,
    flowStep,
    flowError,
    isApprovalPending,
    isApprovalConfirming,
    resetFlow,
  } = useStabilityPoolDeposit();

  // Withdraw hook
  const {
    withdraw,
    isPending: isWithdrawPending,
    isConfirming: isWithdrawConfirming,
    isSuccess: isWithdrawSuccess,
    hash: withdrawHash,
    validationError: withdrawValidationError,
    parsedError: withdrawError,
  } = useWithdrawFromStabilityPool();

  // Form states
  const [depositInput, setDepositInput] = React.useState("");
  const [withdrawInput, setWithdrawInput] = React.useState("");

  // Handle deposit with approval flow
  const handleDeposit = async () => {
    if (!depositInput || Number(depositInput) <= 0) return;
    const success = await depositWithApproval(depositInput);
    if (success) {
      setDepositInput("");
    }
  };

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!withdrawInput || Number(withdrawInput) <= 0) return;
    const success = await withdraw(withdrawInput, compoundedDeposit);
    if (success) {
      setWithdrawInput("");
    }
  };

  // Handle claim rewards (withdraw 0 to claim)
  const handleClaimRewards = async () => {
    await withdraw("0");
  };

  // Refetch after successful transactions
  React.useEffect(() => {
    if (isDepositSuccess || isWithdrawSuccess) {
      refetchPosition();
      resetFlow();
    }
  }, [isDepositSuccess, isWithdrawSuccess, refetchPosition, resetFlow]);

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Stability Pool"
          description="Connect your wallet to earn BTC rewards from liquidations"
        />
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            Please connect your wallet to access the Stability Pool
          </p>
        </div>
      </div>
    );
  }

  return (
    <Web3ErrorBoundary>
      <div className="animate-slide-up space-y-8">
        {/* Page Header with Price Badge */}
        <div className="flex items-start justify-between">
          <PageHeader
            title="Stability Pool"
            description="Deposit MUSD and earn BTC rewards from liquidations"
          />
          <PriceBadge className="mt-2" />
        </div>

        {/* User's Position Overview */}
        {isPositionLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : hasPosition ? (
          <PageSection>
            <Card variant="surface">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Position</CardTitle>
                    <CardDescription>Stability Pool deposit and rewards</CardDescription>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Deposited Amount */}
                  <div className="space-y-1">
                    <StatLabel>Deposited</StatLabel>
                    <StatValue>
                      <AmountDisplay
                        amount={formatUnits(compoundedDeposit, 18)}
                        symbol="MUSD"
                        size="lg"
                      />
                    </StatValue>
                  </div>

                  {/* BTC Rewards */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <StatLabel>BTC Rewards</StatLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <AlertCircle className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-sm">
                            BTC earned from liquidations. Claim anytime to receive in your wallet.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <StatValue>
                      <AmountDisplay
                        amount={formatUnits(collateralGain, 18)}
                        symbol="BTC"
                        size="lg"
                        className={hasPendingGains ? "text-success" : ""}
                      />
                    </StatValue>
                  </div>

                  {/* Claim Button */}
                  <div className="flex items-end">
                    <Button
                      variant="primary"
                      onClick={handleClaimRewards}
                      disabled={!hasPendingGains || isWithdrawPending || isWithdrawConfirming}
                      className="w-full"
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      {isWithdrawPending || isWithdrawConfirming
                        ? "Claiming..."
                        : hasPendingGains
                          ? "Claim Rewards"
                          : "No Rewards"}
                    </Button>
                  </div>
                </div>

                {/* Reward Info */}
                {hasPendingGains && (
                  <div className="mt-4 rounded-lg border border-success/20 bg-success/5 p-3">
                    <div className="flex items-center gap-2 text-sm text-success">
                      <Coins className="h-4 w-4" />
                      <span>You have pending BTC rewards to claim!</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </PageSection>
        ) : null}

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Deposit/Withdraw */}
          <div className="space-y-8 lg:col-span-2">
            <Card variant="surface">
              <CardContent className="p-0">
                <Tabs defaultValue="deposit">
                  <TabsList className="w-full rounded-none border-b">
                    <TabsTrigger value="deposit" className="flex-1 gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Deposit
                    </TabsTrigger>
                    <TabsTrigger value="withdraw" className="flex-1 gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Withdraw
                    </TabsTrigger>
                  </TabsList>

                  {/* Deposit Tab */}
                  <TabsContent value="deposit" className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold">Deposit MUSD</h3>
                        <p className="text-sm text-muted-foreground">
                          Add MUSD to earn BTC from liquidations
                        </p>
                      </div>

                      {/* Amount Input */}
                      <div className="space-y-2">
                        <Label htmlFor="deposit-amount">Amount (MUSD)</Label>
                        <Input
                          id="deposit-amount"
                          type="number"
                          step="1"
                          placeholder="0"
                          value={depositInput}
                          onChange={(e) => setDepositInput(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Minimum: 1 MUSD</p>
                      </div>

                      {/* Info Box */}
                      <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-success">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>How it works</span>
                        </div>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• Your MUSD absorbs debt from liquidations</li>
                          <li>• You receive liquidated BTC at a discount</li>
                          <li>• Withdraw anytime, no lock-up period</li>
                        </ul>
                      </div>

                      {/* Flow Status */}
                      {flowStep !== "idle" && flowStep !== "success" && flowStep !== "error" && (
                        <div className="rounded-lg border border-lavanda/20 bg-lavanda/5 p-3">
                          <p className="text-sm text-muted-foreground">
                            {flowStep === "approving" && "Requesting MUSD approval..."}
                            {flowStep === "waiting_approval" &&
                              "Waiting for approval confirmation..."}
                            {flowStep === "depositing" && "Submitting deposit..."}
                            {flowStep === "waiting_deposit" &&
                              "Waiting for deposit confirmation..."}
                          </p>
                        </div>
                      )}

                      {/* Validation/Flow Errors */}
                      {depositValidationError && (
                        <p className="text-sm text-red-500">{depositValidationError}</p>
                      )}
                      {flowError && <p className="text-sm text-red-500">{flowError}</p>}

                      {/* Deposit Button */}
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={handleDeposit}
                        disabled={
                          !depositInput ||
                          Number(depositInput) <= 0 ||
                          isDepositPending ||
                          isDepositConfirming ||
                          isApprovalPending ||
                          isApprovalConfirming
                        }
                      >
                        {isApprovalPending || isApprovalConfirming
                          ? "Approving MUSD..."
                          : isDepositPending || isDepositConfirming
                            ? "Depositing..."
                            : "Deposit MUSD"}
                      </Button>

                      {/* Transaction Status */}
                      {(isDepositPending || isDepositConfirming || isDepositSuccess) && (
                        <TransactionStatus
                          isPending={isDepositPending}
                          isConfirming={isDepositConfirming}
                          isSuccess={isDepositSuccess}
                          hash={depositHash}
                        />
                      )}
                    </div>
                  </TabsContent>

                  {/* Withdraw Tab */}
                  <TabsContent value="withdraw" className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold">Withdraw MUSD</h3>
                        <p className="text-sm text-muted-foreground">
                          Remove MUSD (rewards claimed automatically)
                        </p>
                      </div>

                      {/* Amount Input */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="withdraw-amount">Amount (MUSD)</Label>
                          <button
                            type="button"
                            onClick={() => setWithdrawInput(formatUnits(compoundedDeposit, 18))}
                            className="text-xs text-lavanda hover:underline"
                          >
                            Max: {formatUnits(compoundedDeposit, 18)} MUSD
                          </button>
                        </div>
                        <Input
                          id="withdraw-amount"
                          type="number"
                          step="1"
                          placeholder="0"
                          value={withdrawInput}
                          onChange={(e) => setWithdrawInput(e.target.value)}
                        />
                      </div>

                      {/* Info about auto-claim */}
                      {hasPendingGains && (
                        <div className="rounded-lg border border-success/20 bg-success/5 p-3">
                          <p className="text-sm text-success">
                            Your BTC rewards ({formatUnits(collateralGain, 18)} BTC) will be
                            automatically claimed when you withdraw
                          </p>
                        </div>
                      )}

                      {/* Validation Error */}
                      {withdrawValidationError && (
                        <p className="text-sm text-red-500">{withdrawValidationError}</p>
                      )}

                      {/* Withdraw Button */}
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={handleWithdraw}
                        disabled={
                          !withdrawInput ||
                          Number(withdrawInput) <= 0 ||
                          !hasPosition ||
                          isWithdrawPending ||
                          isWithdrawConfirming
                        }
                      >
                        {isWithdrawPending || isWithdrawConfirming
                          ? "Withdrawing..."
                          : "Withdraw MUSD"}
                      </Button>

                      {/* Transaction Status */}
                      {(isWithdrawPending ||
                        isWithdrawConfirming ||
                        isWithdrawSuccess ||
                        withdrawError) && (
                        <TransactionStatus
                          isPending={isWithdrawPending}
                          isConfirming={isWithdrawConfirming}
                          isSuccess={isWithdrawSuccess}
                          hash={withdrawHash}
                          error={withdrawError}
                        />
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-8">
            {/* Pool Statistics */}
            <Card variant="surface">
              <CardHeader>
                <CardTitle>Pool Statistics</CardTitle>
                <CardDescription>Global metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {isStatsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <StatLabel>Total Value Locked</StatLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <AlertCircle className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-sm">Total MUSD deposited by all users</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <StatValue>
                      <AmountDisplay
                        amount={formatUnits(totalDeposits, 18)}
                        symbol="MUSD"
                        size="lg"
                      />
                    </StatValue>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card variant="glass" className="border-success/20 bg-success/5">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                    <Coins className="h-5 w-5 text-success" />
                  </div>
                  <h3 className="font-semibold">Why Deposit?</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-success" />
                    <span>Earn BTC at a discount during liquidations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-success" />
                    <span>No impermanent loss</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-success" />
                    <span>Withdraw anytime with no lock-up</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-success" />
                    <span>Help stabilize the protocol</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Risk Info */}
            <Card variant="glass" className="border-warning/20 bg-warning/5">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
                    <AlertCircle className="h-5 w-5 text-warning" />
                  </div>
                  <h3 className="font-semibold">Important Notes</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-warning" />
                    <span>Your deposit absorbs debt from liquidations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-warning" />
                    <span>You receive BTC collateral in exchange</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-warning" />
                    <span>Best returns during liquidation events</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/dashboard/mezo"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Mezo Dashboard
          </Link>
        </div>
      </div>
    </Web3ErrorBoundary>
  );
}
