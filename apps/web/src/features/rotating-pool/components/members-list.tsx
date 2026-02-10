"use client";

import { CheckCircle, Gift, Loader2, User, XCircle } from "lucide-react";
import { Address } from "viem";
import { useAccount } from "wagmi";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  usePoolMemberOrder,
  useMemberInfo,
  usePeriodInfo,
  PoolStatus,
} from "@/hooks/web3/rotating";

interface MembersListProps {
  poolId: bigint;
  memberCount: bigint;
  currentPeriod: bigint;
  status: PoolStatus;
}

interface MemberRowProps {
  poolId: bigint;
  memberIndex: bigint;
  currentPeriod: bigint;
  isCurrentRecipient: boolean;
}

function MemberRow({ poolId, memberIndex, currentPeriod, isCurrentRecipient }: MemberRowProps) {
  const { address: userAddress } = useAccount();
  const { data: memberAddress, isPending: isAddressPending } = usePoolMemberOrder(
    poolId,
    memberIndex
  );
  const { data: memberData, isPending: isMemberPending } = useMemberInfo(
    poolId,
    memberAddress as Address | undefined
  );

  if (isAddressPending || isMemberPending) {
    return (
      <div className="flex animate-pulse items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="h-8 w-8 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="h-3 w-1/3 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!memberAddress || !memberData) {
    return null;
  }

  // Parse member data tuple
  const contributionsMade = (memberData as unknown[])[2] as bigint;
  const hasReceivedPayout = (memberData as unknown[])[6] as boolean;
  const isActive = (memberData as unknown[])[7] as boolean;

  const address = memberAddress as string;
  const isCurrentUser = userAddress && address.toLowerCase() === userAddress.toLowerCase();
  const position = Number(memberIndex) + 1;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
        isCurrentRecipient
          ? "border-success/50 bg-success/10"
          : isCurrentUser
            ? "border-primary/50 bg-primary/10"
            : "border-border bg-muted/30"
      }`}
    >
      {/* Position indicator */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          isCurrentRecipient
            ? "text-success-foreground bg-success"
            : hasReceivedPayout
              ? "bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground"
        }`}
      >
        {position}
      </div>

      {/* Member info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-code text-sm">
            {`${address.slice(0, 6)}...${address.slice(-4)}`}
          </span>
          {isCurrentUser && (
            <Badge variant="outline" className="text-xs">
              You
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{contributionsMade.toString()} contributions</span>
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-2">
        {isCurrentRecipient && (
          <Badge variant="success" className="gap-1">
            <Gift className="h-3 w-3" />
            Recipient
          </Badge>
        )}
        {hasReceivedPayout && (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Paid
          </Badge>
        )}
        {!isActive && (
          <Badge variant="error" className="gap-1">
            <XCircle className="h-3 w-3" />
            Inactive
          </Badge>
        )}
      </div>
    </div>
  );
}

export function MembersList({ poolId, memberCount, currentPeriod, status }: MembersListProps) {
  const { data: periodData, isPending: isPeriodPending } = usePeriodInfo(poolId, currentPeriod);

  // Get current recipient address from period data
  const currentRecipient = periodData ? ((periodData as unknown[])[3] as string) : "";

  const memberIndices = Array.from({ length: Number(memberCount) }, (_, i) => BigInt(i));

  if (memberCount === 0n) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Members
          </CardTitle>
          <CardDescription>No members have joined this ROSCA yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <User className="mr-2 h-5 w-5" />
            <span>Be the first to join!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Members ({memberCount.toString()})
        </CardTitle>
        <CardDescription>
          {status === PoolStatus.ACTIVE
            ? "Members receive payouts in order of their position"
            : status === PoolStatus.FORMING
              ? "Waiting for all members to join"
              : "ROSCA has completed"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isPeriodPending ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          memberIndices.map((index) => {
            // We need to check each member address against currentRecipient
            return (
              <MemberRowWithRecipientCheck
                key={index.toString()}
                poolId={poolId}
                memberIndex={index}
                currentPeriod={currentPeriod}
                currentRecipient={currentRecipient}
              />
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// Wrapper to check if member is current recipient
function MemberRowWithRecipientCheck({
  poolId,
  memberIndex,
  currentPeriod,
  currentRecipient,
}: {
  poolId: bigint;
  memberIndex: bigint;
  currentPeriod: bigint;
  currentRecipient: string;
}) {
  const { data: memberAddress } = usePoolMemberOrder(poolId, memberIndex);

  const isCurrentRecipient = memberAddress
    ? (memberAddress as string).toLowerCase() === currentRecipient.toLowerCase()
    : false;

  return (
    <MemberRow
      poolId={poolId}
      memberIndex={memberIndex}
      currentPeriod={currentPeriod}
      isCurrentRecipient={isCurrentRecipient}
    />
  );
}
