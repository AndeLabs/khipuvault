"use client";

export const dynamic = "force-dynamic";

import { Shield, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { PriceBadge } from "@/components/mezo/price-display";
import { LiquidationRiskBadge, HealthFactorBar } from "@/components/mezo/liquidation-risk-badge";
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
import { Badge } from "@/components/ui/badge";
import { Web3ErrorBoundary } from "@/components/web3-error-boundary";
import {
  useUserTrove,
  useUserBtcBalance,
  useOpenTrove,
  useCloseTrove,
  useAddCollateral,
  useWithdrawCollateral,
  useBorrowMusd,
  useRepayMusd,
  useMinNetDebt,
  useCalculateBorrowingFee,
  useMezoPriceFeed,
} from "@/hooks/web3/mezo";

/**
 * Mezo Borrow Page - Trove Management
 */
export default function MezoBorrowPage() {
  const { isConnected } = useAccount();

  // Price feed
  const { price: btcPrice, isLoading: isPriceLoading } = useMezoPriceFeed();

  // User's Trove
  const {
    hasActiveTrove,
    collateral,
    debt,
    collateralRatio,
    collateralRatioFormatted,
    isLoading: isTroveLoading,
    refetch: refetchTrove,
  } = useUserTrove();

  // User's BTC balance
  const {
    balance: btcBalance,
    balanceFormatted,
    isLoading: isBalanceLoading,
  } = useUserBtcBalance();

  // System parameters
  const { minNetDebt, minNetDebtFormatted } = useMinNetDebt();

  // Form states
  const [openCollateral, setOpenCollateral] = React.useState("");
  const [openDebt, setOpenDebt] = React.useState("");
  const [adjustCollateral, setAdjustCollateral] = React.useState("");
  const [adjustDebt, setAdjustDebt] = React.useState("");

  // Calculate borrowing fee
  const { fee, feeFormatted, totalDebt, totalDebtFormatted } = useCalculateBorrowingFee(openDebt);

  // Transaction hooks
  const {
    openTrove,
    isPending: isOpenPending,
    isConfirming: isOpenConfirming,
    isSuccess: isOpenSuccess,
    hash: openHash,
    validationError: openValidationError,
    parsedError: openError,
  } = useOpenTrove();

  const {
    closeTrove,
    isPending: isClosePending,
    isConfirming: isCloseConfirming,
    isSuccess: isCloseSuccess,
    hash: closeHash,
    error: closeError,
  } = useCloseTrove();

  const {
    addCollateral,
    isPending: isAddCollPending,
    isConfirming: isAddCollConfirming,
    isSuccess: isAddCollSuccess,
    hash: addCollHash,
    validationError: addCollValidationError,
  } = useAddCollateral();

  const {
    withdrawCollateral,
    isPending: isWithdrawCollPending,
    isConfirming: isWithdrawCollConfirming,
    isSuccess: isWithdrawCollSuccess,
    hash: withdrawCollHash,
    validationError: withdrawCollValidationError,
  } = useWithdrawCollateral();

  const {
    borrowMusd,
    isPending: isBorrowPending,
    isConfirming: isBorrowConfirming,
    isSuccess: isBorrowSuccess,
    hash: borrowHash,
    validationError: borrowValidationError,
  } = useBorrowMusd();

  const {
    repayMusd,
    isPending: isRepayPending,
    isConfirming: isRepayConfirming,
    isSuccess: isRepaySuccess,
    hash: repayHash,
    validationError: repayValidationError,
  } = useRepayMusd();

  // Handlers
  const handleOpenTrove = async () => {
    if (!openCollateral || !openDebt) return;
    await openTrove(openCollateral, openDebt, btcBalance);
  };

  const handleCloseTrove = async () => {
    await closeTrove();
  };

  const handleAddCollateral = async () => {
    if (!adjustCollateral) return;
    await addCollateral(adjustCollateral, btcBalance);
  };

  const handleWithdrawCollateral = async () => {
    if (!adjustCollateral) return;
    await withdrawCollateral(adjustCollateral, collateral);
  };

  const handleBorrowMore = async () => {
    if (!adjustDebt) return;
    await borrowMusd(adjustDebt);
  };

  const handleRepay = async () => {
    if (!adjustDebt) return;
    await repayMusd(adjustDebt, debt);
  };

  // Refetch after successful transactions
  React.useEffect(() => {
    if (
      isOpenSuccess ||
      isCloseSuccess ||
      isAddCollSuccess ||
      isWithdrawCollSuccess ||
      isBorrowSuccess ||
      isRepaySuccess
    ) {
      refetchTrove();
      setOpenCollateral("");
      setOpenDebt("");
      setAdjustCollateral("");
      setAdjustDebt("");
    }
  }, [
    isOpenSuccess,
    isCloseSuccess,
    isAddCollSuccess,
    isWithdrawCollSuccess,
    isBorrowSuccess,
    isRepaySuccess,
    refetchTrove,
  ]);

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <PageHeader title="Borrow MUSD" description="Connect your wallet to manage your Trove" />
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            Please connect your wallet to access borrowing features
          </p>
        </div>
      </div>
    );
  }

  return (
    <Web3ErrorBoundary>
      <div className="animate-slide-up space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <PageHeader
            title="Borrow MUSD"
            description="Open or manage your Trove to borrow MUSD against BTC"
          />
          <PriceBadge className="mt-2" />
        </div>

        {isTroveLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : hasActiveTrove ? (
          /* Active Trove Management */
          <div className="space-y-8">
            {/* Current Position */}
            <Card variant="surface">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Trove</CardTitle>
                    <CardDescription>Current borrowing position</CardDescription>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <StatLabel>Collateral</StatLabel>
                    <StatValue>
                      <AmountDisplay amount={formatUnits(collateral, 18)} symbol="BTC" size="lg" />
                    </StatValue>
                  </div>
                  <div>
                    <StatLabel>Debt</StatLabel>
                    <StatValue>
                      <AmountDisplay amount={formatUnits(debt, 18)} symbol="MUSD" size="lg" />
                    </StatValue>
                  </div>
                  <div>
                    <StatLabel>Collateral Ratio</StatLabel>
                    <StatValue>{collateralRatioFormatted}</StatValue>
                  </div>
                </div>

                <HealthFactorBar />
                <LiquidationRiskBadge showDetails />
              </CardContent>
            </Card>

            {/* Adjust Trove */}
            <Card variant="surface">
              <CardHeader>
                <CardTitle>Adjust Trove</CardTitle>
                <CardDescription>Add/remove collateral or borrow/repay MUSD</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="collateral">
                  <TabsList className="mb-6">
                    <TabsTrigger value="collateral">Manage Collateral</TabsTrigger>
                    <TabsTrigger value="debt">Manage Debt</TabsTrigger>
                  </TabsList>

                  <TabsContent value="collateral" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="adjust-coll">Amount (BTC)</Label>
                      <Input
                        id="adjust-coll"
                        type="number"
                        step="0.0001"
                        placeholder="0.0"
                        value={adjustCollateral}
                        onChange={(e) => setAdjustCollateral(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Balance: {balanceFormatted} BTC
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleAddCollateral}
                        disabled={!adjustCollateral || isAddCollPending || isAddCollConfirming}
                      >
                        {isAddCollPending || isAddCollConfirming ? "Adding..." : "Add Collateral"}
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={handleWithdrawCollateral}
                        disabled={
                          !adjustCollateral || isWithdrawCollPending || isWithdrawCollConfirming
                        }
                      >
                        {isWithdrawCollPending || isWithdrawCollConfirming
                          ? "Withdrawing..."
                          : "Withdraw"}
                      </Button>
                    </div>

                    {addCollValidationError && (
                      <p className="text-sm text-red-500">{addCollValidationError}</p>
                    )}
                    {withdrawCollValidationError && (
                      <p className="text-sm text-red-500">{withdrawCollValidationError}</p>
                    )}
                  </TabsContent>

                  <TabsContent value="debt" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="adjust-debt">Amount (MUSD)</Label>
                      <Input
                        id="adjust-debt"
                        type="number"
                        step="1"
                        placeholder="0"
                        value={adjustDebt}
                        onChange={(e) => setAdjustDebt(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current debt: {formatUnits(debt, 18)} MUSD
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleBorrowMore}
                        disabled={!adjustDebt || isBorrowPending || isBorrowConfirming}
                      >
                        {isBorrowPending || isBorrowConfirming ? "Borrowing..." : "Borrow More"}
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={handleRepay}
                        disabled={!adjustDebt || isRepayPending || isRepayConfirming}
                      >
                        {isRepayPending || isRepayConfirming ? "Repaying..." : "Repay"}
                      </Button>
                    </div>

                    {borrowValidationError && (
                      <p className="text-sm text-red-500">{borrowValidationError}</p>
                    )}
                    {repayValidationError && (
                      <p className="text-sm text-red-500">{repayValidationError}</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Close Trove */}
            <Card variant="surface" className="border-red-500/20">
              <CardHeader>
                <CardTitle>Close Trove</CardTitle>
                <CardDescription>Repay all debt and withdraw all collateral</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={handleCloseTrove}
                  disabled={isClosePending || isCloseConfirming}
                  className="w-full"
                >
                  {isClosePending || isCloseConfirming ? "Closing..." : "Close Trove"}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Open New Trove */
          <Card variant="surface">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lavanda/20">
                  <Shield className="h-6 w-6 text-lavanda" />
                </div>
                <div>
                  <CardTitle>Open a Trove</CardTitle>
                  <CardDescription>Deposit BTC as collateral and borrow MUSD</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="open-coll">Collateral (BTC)</Label>
                  <Input
                    id="open-coll"
                    type="number"
                    step="0.0001"
                    placeholder="0.0"
                    value={openCollateral}
                    onChange={(e) => setOpenCollateral(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Balance: {balanceFormatted} BTC</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="open-debt">Borrow Amount (MUSD)</Label>
                  <Input
                    id="open-debt"
                    type="number"
                    step="1"
                    placeholder="0"
                    value={openDebt}
                    onChange={(e) => setOpenDebt(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Min: {minNetDebtFormatted} MUSD</p>
                </div>
              </div>

              {/* Fee Info */}
              {openDebt && Number(openDebt) > 0 && (
                <div className="rounded-lg border border-lavanda/20 bg-lavanda/5 p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-lavanda" />
                    <span>Borrowing fee: {feeFormatted} MUSD (0.5%)</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Total debt: {totalDebtFormatted} MUSD
                  </p>
                </div>
              )}

              {openValidationError && <p className="text-sm text-red-500">{openValidationError}</p>}

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleOpenTrove}
                disabled={!openCollateral || !openDebt || isOpenPending || isOpenConfirming}
              >
                <Plus className="mr-2 h-5 w-5" />
                {isOpenPending || isOpenConfirming ? "Opening Trove..." : "Open Trove"}
              </Button>

              {/* Transaction Status */}
              {(isOpenPending || isOpenConfirming || isOpenSuccess || openError) && (
                <TransactionStatus
                  isPending={isOpenPending}
                  isConfirming={isOpenConfirming}
                  isSuccess={isOpenSuccess}
                  hash={openHash}
                  error={openError}
                />
              )}
            </CardContent>
          </Card>
        )}

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
