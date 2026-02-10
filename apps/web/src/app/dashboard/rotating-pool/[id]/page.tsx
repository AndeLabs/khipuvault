"use client";

import { ArrowLeft, Users, Calendar, Coins, TrendingUp, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ClaimPayoutCard } from "@/features/rotating-pool/components/claim-payout-card";
import { ContributeModal } from "@/features/rotating-pool/components/contribute-modal";
import { MembersList } from "@/features/rotating-pool/components/members-list";
import { usePoolInfo, useMemberInfo, useJoinRotatingPool, PoolStatus } from "@/hooks/web3/rotating";

export default function RoscaDetailsPage() {
  const params = useParams();
  const poolId = BigInt(params.id as string);
  const { address, isConnected } = useAccount();
  const { data: poolData, isPending, error } = usePoolInfo(poolId);
  const { data: memberData } = useMemberInfo(poolId);
  const { joinPool, isPending: isJoinPending } = useJoinRotatingPool(poolId);

  const [contributeModalOpen, setContributeModalOpen] = useState(false);

  if (isPending) {
    return (
      <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !poolData) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading ROSCA</CardTitle>
            <CardDescription>
              {error?.message ?? "Could not load ROSCA details. Please try again."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/rotating-pool">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to ROSCA List
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse pool data
  const [
    _id,
    rawName,
    rawCreator,
    rawMemberCount,
    rawContributionAmount,
    rawPeriodDuration,
    rawCurrentPeriod,
    rawTotalPeriods,
    rawStartTime,
    _totalBtcCollected,
    _totalMusdMinted,
    rawTotalYieldGenerated,
    _yieldDistributed,
    rawStatus,
    _autoAdvance,
    rawUseNativeBtc,
  ] = poolData as unknown[];

  const name = rawName as string;
  const creator = rawCreator as string;
  const memberCount = rawMemberCount as bigint;
  const contributionAmount = rawContributionAmount as bigint;
  const periodDuration = rawPeriodDuration as bigint;
  const currentPeriod = rawCurrentPeriod as bigint;
  const totalPeriods = rawTotalPeriods as bigint;
  const startTime = rawStartTime as bigint;
  const totalYieldGenerated = rawTotalYieldGenerated as bigint;
  const status = rawStatus as PoolStatus;
  const useNativeBtc = rawUseNativeBtc as boolean;

  const periodInDays = Number(periodDuration) / (24 * 60 * 60);
  const progressPercentage =
    status === PoolStatus.ACTIVE ? ((Number(currentPeriod) + 1) / Number(totalPeriods)) * 100 : 0;

  // Member status
  const isMember = memberData ? ((memberData as unknown[])[7] as boolean) : false;
  const isCreator = address && creator.toLowerCase() === address.toLowerCase();

  const getStatusBadge = (status: PoolStatus) => {
    switch (status) {
      case PoolStatus.FORMING:
        return <Badge variant="warning">Forming</Badge>;
      case PoolStatus.ACTIVE:
        return <Badge variant="success">Active</Badge>;
      case PoolStatus.COMPLETED:
        return <Badge variant="secondary">Completed</Badge>;
      case PoolStatus.CANCELLED:
        return <Badge variant="error">Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const handleJoinPool = () => {
    joinPool();
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/dashboard/rotating-pool"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to ROSCA List
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{name}</h1>
            {getStatusBadge(status)}
            <Badge variant="outline" className="text-xs">
              {useNativeBtc ? "Native BTC" : "WBTC"}
            </Badge>
            {isCreator && (
              <Badge variant="outline" className="gap-1">
                Creator
              </Badge>
            )}
            {isMember && (
              <Badge variant="outline" className="gap-1 border-success/50 text-success">
                Member
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberCount.toString()}</div>
            <p className="text-xs text-muted-foreground">Total participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contribution</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-code text-2xl font-bold">
              {parseFloat(formatEther(contributionAmount)).toFixed(4)} BTC
            </div>
            <p className="text-xs text-muted-foreground">Per period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Period Length</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {periodInDays} {periodInDays === 1 ? "day" : "days"}
            </div>
            <p className="text-xs text-muted-foreground">Rotation cycle</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Yield</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-code text-2xl font-bold text-success">
              {parseFloat(formatEther(totalYieldGenerated)).toFixed(6)}
            </div>
            <p className="text-xs text-muted-foreground">MUSD generated</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {status === PoolStatus.ACTIVE && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Period Progress
            </CardTitle>
            <CardDescription>
              Currently in period {(Number(currentPeriod) + 1).toString()} of{" "}
              {totalPeriods.toString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progressPercentage.toFixed(1)}% Complete</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions & Payout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Participate in this ROSCA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isConnected ? (
              <p className="text-sm text-muted-foreground">Connect your wallet to participate</p>
            ) : status === PoolStatus.FORMING && !isMember ? (
              <Button
                className="w-full"
                size="lg"
                onClick={handleJoinPool}
                disabled={isJoinPending}
              >
                {isJoinPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Pool"
                )}
              </Button>
            ) : status === PoolStatus.ACTIVE && isMember ? (
              <>
                <Button className="w-full" size="lg" onClick={() => setContributeModalOpen(true)}>
                  <Coins className="mr-2 h-4 w-4" />
                  Make Contribution
                </Button>
              </>
            ) : status === PoolStatus.COMPLETED ? (
              <Button className="w-full" variant="secondary" size="lg" disabled>
                Pool Completed
              </Button>
            ) : status === PoolStatus.FORMING && isMember ? (
              <p className="text-sm text-muted-foreground">Waiting for all members to join...</p>
            ) : (
              <p className="text-sm text-muted-foreground">Pool is not accepting new members</p>
            )}
          </CardContent>
        </Card>

        {/* Payout Card - Only show for active members */}
        {isMember && status === PoolStatus.ACTIVE ? (
          <ClaimPayoutCard
            poolId={poolId}
            currentPeriod={currentPeriod}
            memberCount={memberCount}
            contributionAmount={contributionAmount}
            status={status}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Pool Information</CardTitle>
              <CardDescription>Key details and requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground">Pool ID</span>
                <span className="font-code text-sm font-medium">#{poolId.toString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-medium">{getStatusBadge(status)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground">Current Period</span>
                <span className="text-sm font-medium">
                  {status === PoolStatus.ACTIVE
                    ? `${(Number(currentPeriod) + 1).toString()} / ${totalPeriods.toString()}`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground">Start Time</span>
                <span className="text-sm font-medium">
                  {Number(startTime) > 0
                    ? new Date(Number(startTime) * 1000).toLocaleDateString()
                    : "Not started"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Payout</span>
                <span className="font-code text-sm font-medium">
                  {parseFloat(formatEther(contributionAmount * memberCount)).toFixed(4)} BTC
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Member List */}
      <MembersList
        poolId={poolId}
        memberCount={memberCount}
        currentPeriod={currentPeriod}
        status={status}
      />

      {/* Contribute Modal */}
      <ContributeModal
        open={contributeModalOpen}
        onOpenChange={setContributeModalOpen}
        poolId={poolId}
        contributionAmount={contributionAmount}
        useNativeBtc={useNativeBtc}
      />
    </div>
  );
}
