"use client";

import { AlertCircle, Gift, Loader2, PartyPopper } from "lucide-react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemberInfo, usePeriodInfo, useClaimPayout, PoolStatus } from "@/hooks/web3/rotating";

interface ClaimPayoutCardProps {
  poolId: bigint;
  currentPeriod: bigint;
  memberCount: bigint;
  contributionAmount: bigint;
  status: PoolStatus;
}

export function ClaimPayoutCard({
  poolId,
  currentPeriod,
  memberCount,
  contributionAmount,
  status,
}: ClaimPayoutCardProps) {
  const { address } = useAccount();
  const { data: memberData, isPending: isMemberPending } = useMemberInfo(poolId);
  const { data: periodData, isPending: isPeriodPending } = usePeriodInfo(poolId, currentPeriod);
  const { claimPayout, isPending: isClaimPending, error } = useClaimPayout(poolId);

  // Parse member data
  const memberIndex = memberData ? ((memberData as unknown[])[1] as bigint) : 0n;
  const hasReceivedPayout = memberData ? ((memberData as unknown[])[6] as boolean) : false;
  const isActive = memberData ? ((memberData as unknown[])[7] as boolean) : false;

  // Parse period data
  const periodRecipient = periodData ? ((periodData as unknown[])[3] as string) : "";
  const payoutAmount = periodData ? ((periodData as unknown[])[4] as bigint) : 0n;
  const periodCompleted = periodData ? ((periodData as unknown[])[6] as boolean) : false;
  const periodPaid = periodData ? ((periodData as unknown[])[7] as boolean) : false;

  // Calculate payout (all members contribute, minus fees)
  const estimatedPayout = contributionAmount * memberCount;

  // Check if it's this user's turn
  const isRecipient = address && periodRecipient.toLowerCase() === address.toLowerCase();
  const canClaim = isRecipient && !periodPaid && isActive && status === PoolStatus.ACTIVE;

  if (isMemberPending || isPeriodPending) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Not a member
  if (!isActive) {
    return null;
  }

  return (
    <Card className={canClaim ? "shadow-glow border-success/50" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Payout Status
        </CardTitle>
        <CardDescription>
          {hasReceivedPayout
            ? "You have already received your payout"
            : `Your payout position: #${(Number(memberIndex) + 1).toString()}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current period recipient info */}
        <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Period</span>
            <span className="font-medium">#{(Number(currentPeriod) + 1).toString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Recipient</span>
            <span className="font-code text-xs">
              {periodRecipient
                ? `${periodRecipient.slice(0, 6)}...${periodRecipient.slice(-4)}`
                : "Pending"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payout Amount</span>
            <span className="font-code font-medium text-success">
              {payoutAmount > 0n ? formatEther(payoutAmount) : formatEther(estimatedPayout)} BTC
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium">
              {periodPaid ? "Paid" : periodCompleted ? "Ready" : "Collecting"}
            </span>
          </div>
        </div>

        {/* Your turn alert */}
        {isRecipient && !periodPaid && (
          <Alert className="border-success/50 bg-success/10">
            <PartyPopper className="h-4 w-4 text-success" />
            <AlertTitle className="text-success">It&apos;s Your Turn!</AlertTitle>
            <AlertDescription>
              All contributions collected. You can now claim your payout of{" "}
              <span className="font-code font-medium">{formatEther(estimatedPayout)} BTC</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Already received payout */}
        {hasReceivedPayout && (
          <Alert>
            <Gift className="h-4 w-4" />
            <AlertTitle>Payout Received</AlertTitle>
            <AlertDescription>
              You have already received your payout for this ROSCA. Continue contributing to help
              other members.
            </AlertDescription>
          </Alert>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message || "Failed to claim payout"}</AlertDescription>
          </Alert>
        )}

        {/* Claim button */}
        {canClaim && (
          <Button
            onClick={() => claimPayout()}
            disabled={isClaimPending}
            className="w-full"
            size="lg"
          >
            {isClaimPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-4 w-4" />
                Claim Payout
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
