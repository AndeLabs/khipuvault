"use client";

import {
  Copy,
  Check,
  Gift,
  Users,
  Award,
  Share2,
  ExternalLink,
} from "lucide-react";
import * as React from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { AmountDisplay } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useClaimReferralRewards } from "@/hooks/web3/use-pool-transactions";
import { cn } from "@/lib/utils";
import { V3_FEATURES } from "@/lib/web3/contracts-v3";

interface ReferralDashboardProps {
  referralCount?: bigint;
  totalRewards?: bigint;
  referrerAddress?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function ReferralDashboard({
  referralCount = BigInt(0),
  totalRewards = BigInt(0),
  referrerAddress,
  onRefresh,
  className,
}: ReferralDashboardProps) {
  const { address } = useAccount();
  const [copied, setCopied] = React.useState(false);
  const { claimReferralRewards, isClaiming, isConfirming, isSuccess } =
    useClaimReferralRewards();

  // Generate referral link
  const referralLink = address
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/individual-savings?ref=${address}`
    : "";

  // Format rewards
  const formattedRewards = React.useMemo(() => {
    try {
      return Number(formatUnits(totalRewards, 18)).toFixed(4);
    } catch {
      return "0.0000";
    }
  }, [totalRewards]);

  // Referral bonus percentage
  const referralBonus = (
    V3_FEATURES.individualPool.referralBonus / 100
  ).toFixed(2);

  // Copy to clipboard
  const handleCopyLink = async () => {
    if (!referralLink) {return;}

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleCopyAddress = async () => {
    if (!address) {return;}

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Handle claim
  const handleClaimRewards = async () => {
    try {
      await claimReferralRewards();
      if (onRefresh) {
        setTimeout(() => onRefresh(), 3000);
      }
    } catch (error) {
      console.error("Failed to claim rewards:", error);
    }
  };

  // Success effect
  React.useEffect(() => {
    if (isSuccess && onRefresh) {
      setTimeout(() => onRefresh(), 2000);
    }
  }, [isSuccess, onRefresh]);

  const hasRewards = totalRewards > BigInt(0);
  const hasReferrals = Number(referralCount) > 0;

  return (
    <Card variant="surface" hover="glow-orange" className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-accent flex items-center justify-center">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Referral Dashboard</CardTitle>
              <CardDescription>
                Earn {referralBonus}% of every deposit from users you refer
              </CardDescription>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="gap-1.5">
                  <Award className="h-3 w-3" />
                  {referralBonus}% Bonus
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm max-w-xs">
                  You earn {referralBonus}% of the deposit amount when someone
                  uses your referral code. Rewards are paid in mUSD and can be
                  claimed anytime.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Total Referrals */}
          <div className="space-y-2 p-4 rounded-lg bg-surface-elevated border border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Total Referrals</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {Number(referralCount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasReferrals ? "Active users" : "No referrals yet"}
            </p>
          </div>

          {/* Total Rewards */}
          <div className="space-y-2 p-4 rounded-lg bg-surface-elevated border border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>Total Rewards</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-accent">
              <AmountDisplay
                amount={formattedRewards}
                symbol="mUSD"
                size="md"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {hasRewards ? "Available to claim" : "Start referring!"}
            </p>
          </div>

          {/* Your Referrer */}
          <div className="space-y-2 p-4 rounded-lg bg-surface-elevated border border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Share2 className="h-4 w-4" />
              <span>Your Referrer</span>
            </div>
            {referrerAddress &&
            referrerAddress !== "0x0000000000000000000000000000000000000000" ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-surface px-2 py-1 rounded">
                    {referrerAddress.slice(0, 6)}...{referrerAddress.slice(-4)}
                  </code>
                  <a
                    href={`https://explorer.mezo.org/address/${referrerAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground">
                  You were referred by this address
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">None</p>
                <p className="text-xs text-muted-foreground">
                  You joined directly
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Claim Rewards Section */}
        {hasRewards && (
          <div className="p-4 rounded-lg bg-gradient-accent/10 border border-accent/20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">
                  You have unclaimed rewards!
                </p>
                <p className="text-xs text-muted-foreground">
                  Claim your {formattedRewards} mUSD referral rewards now
                </p>
              </div>
              <Button
                onClick={handleClaimRewards}
                loading={isClaiming || isConfirming}
                disabled={!hasRewards}
                className="shrink-0"
              >
                <Award className="h-4 w-4 mr-2" />
                Claim Rewards
              </Button>
            </div>
          </div>
        )}

        {/* Share Your Referral Link */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Share Your Referral Link</h3>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                readOnly
                value={referralLink}
                className="pr-10 font-mono text-xs"
                placeholder="Connect wallet to get your referral link"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              disabled={!address}
              className={cn(
                "shrink-0 transition-colors",
                copied && "bg-success/10 border-success text-success",
              )}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                readOnly
                value={address ?? ""}
                className="pr-10 font-mono text-xs"
                placeholder="Your wallet address"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-xs text-muted-foreground px-2 py-1 rounded bg-surface">
                        Code
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">
                        This is your referral code (wallet address)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyAddress}
              disabled={!address}
              className={cn(
                "shrink-0 transition-colors",
                copied && "bg-success/10 border-success text-success",
              )}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="p-3 rounded-lg bg-surface-elevated border border-border text-xs space-y-2">
            <p className="font-semibold text-foreground">How it works:</p>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>Share your referral link or code with friends</li>
              <li>They paste your wallet address when depositing</li>
              <li>You earn {referralBonus}% of their deposit amount in mUSD</li>
              <li>Claim your rewards anytime - no minimum required</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
