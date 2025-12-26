/**
 * @fileoverview Prize Pool (Lottery) Page - Complete Implementation
 * @module app/dashboard/prize-pool/page
 *
 * Production-ready lottery feature where users never lose their capital
 * Comprehensive UI/UX with all features from smart contract tests:
 * - Buy tickets with BTC
 * - Real-time countdown timers
 * - Probability calculator
 * - Draw history
 * - Winner announcements
 * - Claim prizes/capital
 */

"use client";

export const dynamic = "force-dynamic";

import { useQueryClient } from "@tanstack/react-query";
import {
  Trophy,
  Ticket,
  History,
  HelpCircle,
  BarChart3,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import * as React from "react";
import { useAccount } from "wagmi";

import { PageHeader, PageSection } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ActiveLotteryHero,
  BuyTicketsModal,
  YourTickets,
  ProbabilityCalculator,
  DrawHistory,
  HowItWorks,
  LotteryStats,
} from "@/features/prize-pool";
import { useToast } from "@/hooks/use-toast";

// Hooks
import { useLotteryClaimStatus } from "@/hooks/web3/use-lottery-claim-status";
import { useLotteryPoolEvents } from "@/hooks/web3/use-lottery-pool-events";
import {
  useCurrentRound,
  useAllRounds,
  useUserTickets,
  useUserInvestment,
  useUserProbability,
  useUserLotteryStats,
  useClaimPrize,
  useWithdrawCapital,
  useLotteryPoolOwner,
  useDrawWinner,
  useCreateRound,
} from "@/hooks/web3/use-lottery-pool";

// Components

/**
 * Prize Pool Page - No-Loss Lottery System
 *
 * Features:
 * ✅ Real blockchain data (no hardcoded values)
 * ✅ Connected to actual SimpleLotteryPool contract
 * ✅ Buy tickets with native BTC
 * ✅ Real-time countdown timers
 * ✅ Win probability calculator
 * ✅ Draw history with winners
 * ✅ Claim prizes for winners
 * ✅ Withdraw capital for non-winners
 * ✅ Event-driven updates via TanStack Query
 * ✅ Responsive design
 * ✅ Proper error handling and loading states
 */
export default function PrizePoolPage() {
  const { isConnected, address } = useAccount();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Real contract data - current round
  const {
    roundInfo: currentRound,
    currentRoundId,
    isLoading: isLoadingRound,
    error: roundError,
  } = useCurrentRound();

  // User data for current round
  const { ticketCount, isLoading: isLoadingTickets } = useUserTickets(
    currentRoundId ? Number(currentRoundId) : undefined,
  );
  const { investment, isLoading: isLoadingInvestment } = useUserInvestment(
    currentRoundId ? Number(currentRoundId) : undefined,
  );
  const { probability, isLoading: isLoadingProbability } = useUserProbability(
    currentRoundId ? Number(currentRoundId) : undefined,
  );

  // All rounds for history
  const { rounds, isLoading: isLoadingRounds } = useAllRounds();

  // User stats across all rounds
  const { stats, isLoading: isLoadingStats } = useUserLotteryStats();

  // Check if user has already claimed/withdrawn for current round
  const { hasClaimed: hasClaimedOrWithdrawn, isLoading: isLoadingClaimStatus } =
    useLotteryClaimStatus(currentRoundId ? Number(currentRoundId) : undefined);

  // Claim/withdraw hooks
  const {
    claimPrize,
    isPending: isClaiming,
    isSuccess: isClaimSuccess,
  } = useClaimPrize();
  const {
    withdrawCapital,
    isPending: isWithdrawing,
    isSuccess: isWithdrawSuccess,
  } = useWithdrawCapital();

  // Admin hooks
  const { isOwner: isAdmin } = useLotteryPoolOwner();
  const {
    drawWinner,
    isPending: isDrawing,
    isSuccess: isDrawSuccess,
  } = useDrawWinner();
  const {
    createRound,
    isPending: isCreatingRound,
    isSuccess: isCreateSuccess,
  } = useCreateRound();

  // Watch for events and auto-refetch
  useLotteryPoolEvents();

  // UI state
  const [isBuyModalOpen, setIsBuyModalOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("overview");

  // Check if user is winner
  const isWinner =
    currentRound && address
      ? currentRound.winner.toLowerCase() === address.toLowerCase()
      : false;

  // Check if user can claim/withdraw
  const canClaim =
    currentRound &&
    currentRound.status === 1 &&
    ticketCount &&
    ticketCount > BigInt(0);

  // Handle claim prize (for winners)
  const handleClaimPrize = async () => {
    if (!currentRoundId) {
      return;
    }

    try {
      await claimPrize(Number(currentRoundId));
      toast({
        title: "Prize Claimed!",
        description: "Your prize has been transferred to your wallet",
      });
      // Refetch is handled by useLotteryPoolEvents hook and useEffect below
    } catch (_errorInfo) {
      // eslint-disable-next-line no-console
      console.error("Claim error:", _errorInfo);
      toast({
        title: "Claim Failed",
        description:
          _errorInfo instanceof Error
            ? _errorInfo.message
            : "Failed to claim prize",
        variant: "destructive",
      });
    }
  };

  // Handle withdraw capital (for non-winners)
  const handleWithdrawCapital = async () => {
    if (!currentRoundId) {
      return;
    }

    try {
      await withdrawCapital(Number(currentRoundId));
      toast({
        title: "Capital Withdrawn!",
        description: "Your capital has been returned to your wallet",
      });
      // Refetch is handled by useLotteryPoolEvents hook and useEffect below
    } catch (_errorInfo) {
      // eslint-disable-next-line no-console
      console.error("Withdraw error:", _errorInfo);
      toast({
        title: "Withdraw Failed",
        description:
          _errorInfo instanceof Error
            ? _errorInfo.message
            : "Failed to withdraw capital",
        variant: "destructive",
      });
    }
  };

  // Manual refetch
  const handleRefresh = () => {
    void queryClient.refetchQueries({ type: "active" });
    toast({
      title: "Refreshing...",
      description: "Fetching latest lottery data",
    });
  };

  // Handle draw winner (admin)
  const handleDrawWinner = async () => {
    if (!currentRoundId) {
      return;
    }

    try {
      await drawWinner(Number(currentRoundId));
      toast({
        title: "Drawing Winner...",
        description: "Transaction submitted. Winner will be selected shortly.",
      });
    } catch (_errorInfo) {
      // eslint-disable-next-line no-console
      console.error("Draw error:", _errorInfo);
      toast({
        title: "Draw Failed",
        description:
          _errorInfo instanceof Error
            ? _errorInfo.message
            : "Failed to draw winner",
        variant: "destructive",
      });
    }
  };

  // Quick create round with defaults (7 days, 0.001 BTC/ticket, 1000 max)
  const handleQuickCreateRound = async () => {
    try {
      const ticketPrice = BigInt("1000000000000000"); // 0.001 BTC per ticket
      const maxTickets = 1000;
      const duration = 7 * 24 * 60 * 60; // 7 days

      await createRound(ticketPrice, maxTickets, duration);
      toast({
        title: "Creating New Round...",
        description: "Transaction submitted. New lottery round starting soon.",
      });
    } catch (_errorInfo) {
      // eslint-disable-next-line no-console
      console.error("Create round error:", _errorInfo);
      toast({
        title: "Failed to Create Round",
        description:
          _errorInfo instanceof Error
            ? _errorInfo.message
            : "Failed to create new round",
        variant: "destructive",
      });
    }
  };

  // Watch for claim/withdraw/admin success
  React.useEffect(() => {
    if (
      isClaimSuccess ||
      isWithdrawSuccess ||
      isDrawSuccess ||
      isCreateSuccess
    ) {
      void queryClient.refetchQueries({ type: "active" });
    }
  }, [
    isClaimSuccess,
    isWithdrawSuccess,
    isDrawSuccess,
    isCreateSuccess,
    queryClient,
  ]);

  // Not connected state
  if (!isConnected) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Prize Pool"
          description="No-loss lottery where you never lose your capital"
        />
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Connect Your Wallet</p>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to participate in the prize pool lottery
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (roundError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Prize Pool"
          description="No-loss lottery where you never lose your capital"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load lottery data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Page Header */}
      <PageHeader
        title="Prize Pool"
        description="Join the no-loss lottery powered by Mezo's yield generation"
        actions={
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {/* Winner/Claim Alert */}
      {canClaim && isWinner && !hasClaimedOrWithdrawn && (
        <Alert className="border-success/50 bg-success/5">
          <Trophy className="h-4 w-4 text-success" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-success-foreground font-medium">
              Congratulations! You won the lottery! Claim your prize now.
            </span>
            <Button
              onClick={handleClaimPrize}
              disabled={isClaiming}
              size="sm"
              className="bg-success hover:bg-success/90"
            >
              {isClaiming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Claim Prize"
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {canClaim && !isWinner && !hasClaimedOrWithdrawn && (
        <Alert className="border-info/50 bg-info/5">
          <AlertCircle className="h-4 w-4 text-info" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-info-foreground">
              Round ended. Withdraw your capital to participate in the next
              round.
            </span>
            <Button
              onClick={handleWithdrawCapital}
              disabled={isWithdrawing}
              size="sm"
              variant="outline"
            >
              {isWithdrawing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Withdraw Capital"
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Active Lottery Hero */}
      <PageSection>
        <ActiveLotteryHero
          roundInfo={currentRound ?? null}
          userTicketCount={ticketCount ?? undefined}
          isLoading={isLoadingRound}
          onBuyTickets={() => setIsBuyModalOpen(true)}
          isAdmin={isAdmin}
          onDrawWinner={handleDrawWinner}
          onCreateNewRound={handleQuickCreateRound}
          isDrawing={isDrawing || isCreatingRound}
        />
      </PageSection>

      {/* Statistics Cards */}
      <PageSection>
        <LotteryStats
          roundInfo={currentRound ?? null}
          isLoading={isLoadingRound}
        />
      </PageSection>

      {/* Main Content - Tabs */}
      <PageSection>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-2xl h-auto gap-1">
            <TabsTrigger
              value="overview"
              className="gap-1 md:gap-2 text-xs md:text-sm py-2"
            >
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger
              value="tickets"
              className="gap-1 md:gap-2 text-xs md:text-sm py-2"
            >
              <Ticket className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Your Tickets</span>
              <span className="sm:hidden">Tickets</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="gap-1 md:gap-2 text-xs md:text-sm py-2"
            >
              <History className="h-3 w-3 md:h-4 md:w-4" />
              History
            </TabsTrigger>
            <TabsTrigger
              value="how-it-works"
              className="gap-1 md:gap-2 text-xs md:text-sm py-2"
            >
              <HelpCircle className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">How It Works</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <YourTickets
                ticketCount={ticketCount ?? undefined}
                investment={investment ?? undefined}
                probability={probability ?? undefined}
                isWinner={isWinner}
                isLoading={
                  isLoadingTickets ||
                  isLoadingInvestment ||
                  isLoadingProbability
                }
              />

              <ProbabilityCalculator roundInfo={currentRound ?? null} />
            </div>

            {/* User Stats */}
            {stats && (stats.roundsPlayed > 0 || isLoadingStats) && (
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                <div className="p-3 md:p-4 rounded-lg bg-surface-elevated border border-border text-center">
                  <div className="text-xl md:text-2xl font-bold text-lavanda">
                    {isLoadingStats ? "-" : stats.roundsPlayed}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Rounds
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-lg bg-surface-elevated border border-border text-center">
                  <div className="text-xl md:text-2xl font-bold text-accent">
                    {isLoadingStats ? "-" : stats.totalTickets}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Tickets
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-lg bg-surface-elevated border border-border text-center">
                  <div className="text-xl md:text-2xl font-bold text-success">
                    {isLoadingStats
                      ? "-"
                      : `${Number(stats.totalInvested) / 1e18}`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Invested (BTC)
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-lg bg-surface-elevated border border-border text-center">
                  <div className="text-xl md:text-2xl font-bold text-warning">
                    {isLoadingStats
                      ? "-"
                      : `${Number(stats.totalWinnings) / 1e18}`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Won (BTC)
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Your Tickets Tab */}
          <TabsContent value="tickets" className="mt-6">
            <div className="grid gap-8 lg:grid-cols-2">
              <YourTickets
                ticketCount={ticketCount ?? undefined}
                investment={investment ?? undefined}
                probability={probability ?? undefined}
                isWinner={isWinner}
                isLoading={
                  isLoadingTickets ||
                  isLoadingInvestment ||
                  isLoadingProbability
                }
              />

              <ProbabilityCalculator roundInfo={currentRound ?? null} />
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <DrawHistory
              rounds={rounds}
              isLoading={isLoadingRounds}
              userAddress={address}
            />
          </TabsContent>

          {/* How It Works Tab */}
          <TabsContent value="how-it-works" className="mt-6">
            <HowItWorks />
          </TabsContent>
        </Tabs>
      </PageSection>

      {/* Buy Tickets Modal */}
      <BuyTicketsModal
        open={isBuyModalOpen}
        onOpenChange={setIsBuyModalOpen}
        roundInfo={currentRound ?? null}
        currentUserTickets={ticketCount ?? undefined}
      />
    </div>
  );
}
