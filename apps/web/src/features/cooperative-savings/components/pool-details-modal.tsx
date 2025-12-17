/**
 * @fileoverview Pool Details Modal - V3
 *
 * Comprehensive pool view with:
 * - Pool info and statistics
 * - Members list with contributions
 * - User position (if member)
 * - Pool actions
 * - Activity timeline
 */

"use client";

import {
  Users,
  Bitcoin,
  Coins,
  TrendingUp,
  Calendar,
  User,
  Crown,
  Copy,
  ExternalLink,
  Shield,
} from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SkeletonCard } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  usePoolInfo,
  usePoolMembers,
  useMemberInfo,
  useMemberYield,

  formatBTCCompact,
  formatMUSD,
  getPoolStatusBadge,
  formatDate,
  formatPercentage} from "@/hooks/web3/use-cooperative-pool";

interface PoolDetailsModalProps {
  poolId: number | null;
  open: boolean;
  onClose: () => void;
  onJoin?: (poolId: number) => void;
  onLeave?: (poolId: number) => void;
  onClaim?: (poolId: number) => void;
}

export function PoolDetailsModal({
  poolId,
  open,
  onClose,
  onJoin,
  onLeave,
  onClaim,
}: PoolDetailsModalProps) {
  const { toast } = useToast();
  const { poolInfo, isLoading: loadingPool } = usePoolInfo(poolId || 0);
  const { members, isLoading: loadingMembers } = usePoolMembers(poolId || 0);
  const { memberInfo, isLoading: loadingMember } = useMemberInfo(poolId || 0);
  const { pendingYield } = useMemberYield(poolId || 0);

  const isLoading = loadingPool || loadingMembers || loadingMember;
  const isMember = memberInfo?.active || false;
  const totalShares = members.reduce((sum, m) => sum + m.shares, BigInt(0));

  const copyAddress = (address: string) => {
    void navigator.clipboard.writeText(address);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  if (!poolId) {return null;}

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl font-heading">
            Pool Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this cooperative pool
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="px-6 pb-6">
            <SkeletonCard />
          </div>
        ) : !poolInfo ? (
          <div className="px-6 pb-6 text-center py-12">
            <p className="text-muted-foreground">Pool not found</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="px-6 pb-6 space-y-6">
              {/* Pool Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-heading font-semibold mb-1">
                      {poolInfo.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Pool #{poolId}
                    </p>
                  </div>
                  <Badge variant={getPoolStatusBadge(poolInfo.status).variant}>
                    {getPoolStatusBadge(poolInfo.status).label}
                  </Badge>
                </div>

                {/* Creator */}
                <div className="flex items-center gap-2 text-sm">
                  <Crown className="h-4 w-4 text-accent" />
                  <span className="text-muted-foreground">Created by:</span>
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">
                    {poolInfo.creator.slice(0, 6)}...
                    {poolInfo.creator.slice(-4)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyAddress(poolInfo.creator)}
                    aria-label="Copy creator address"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* User Position (if member) */}
              {isMember && memberInfo && (
                <Card className="border-accent/20 bg-accent/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-accent">
                      Your Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Contributed
                        </p>
                        <p className="font-mono font-semibold">
                          {formatBTCCompact(memberInfo.btcContributed)} BTC
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Shares</p>
                        <p className="font-mono font-semibold">
                          {memberInfo.shares.toString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Share %</p>
                        <p className="font-semibold">
                          {formatPercentage(memberInfo.shares, totalShares)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Pending Yield
                        </p>
                        <p className="font-mono font-semibold text-success">
                          {formatMUSD(pendingYield)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {pendingYield > BigInt(0) && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => onClaim?.(poolId)}
                        >
                          <TrendingUp className="h-4 w-4 mr-1.5" />
                          Claim Yield
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onLeave?.(poolId)}
                      >
                        Leave Pool
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="members">
                    Members ({poolInfo.currentMembers})
                  </TabsTrigger>
                  <TabsTrigger value="stats">Statistics</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                  {/* Pool Capacity */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        Pool Capacity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Members</span>
                        <span className="font-medium">
                          {poolInfo.currentMembers} / {poolInfo.maxMembers}
                        </span>
                      </div>
                      <Progress
                        value={
                          (poolInfo.currentMembers / poolInfo.maxMembers) * 100
                        }
                        className="h-2"
                      />
                    </CardContent>
                  </Card>

                  {/* Pool Statistics */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <Bitcoin className="h-5 w-5 text-orange-500" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">
                              Total BTC
                            </p>
                            <p className="font-mono font-semibold">
                              {formatBTCCompact(poolInfo.totalBtcDeposited)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Coins className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">
                              MUSD Minted
                            </p>
                            <p className="font-mono font-semibold">
                              {formatMUSD(poolInfo.totalMusdMinted)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-success" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">
                              Total Yields
                            </p>
                            <p className="font-mono font-semibold text-success">
                              {formatMUSD(poolInfo.totalYieldGenerated)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-accent" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">
                              Created
                            </p>
                            <p className="text-sm font-medium">
                              {formatDate(poolInfo.createdAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Contribution Range */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Contribution Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Minimum</span>
                        <span className="font-mono font-semibold">
                          {formatBTCCompact(poolInfo.minContribution)} BTC
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Maximum</span>
                        <span className="font-mono font-semibold">
                          {formatBTCCompact(poolInfo.maxContribution)} BTC
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Accepting New Members
                        </span>
                        <Badge
                          variant={
                            poolInfo.allowNewMembers ? "success" : "error"
                          }
                        >
                          {poolInfo.allowNewMembers ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Join Button */}
                  {!isMember &&
                    poolInfo.allowNewMembers &&
                    poolInfo.currentMembers < poolInfo.maxMembers && (
                      <Button
                        variant="accent"
                        className="w-full"
                        onClick={() => onJoin?.(poolId)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Join This Pool
                      </Button>
                    )}
                </TabsContent>

                {/* Members Tab */}
                <TabsContent value="members" className="mt-4">
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Contribution</TableHead>
                            <TableHead>Shares</TableHead>
                            <TableHead>Share %</TableHead>
                            <TableHead>Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-muted-foreground"
                              >
                                No members yet
                              </TableCell>
                            </TableRow>
                          ) : (
                            members.map((member) => (
                              <TableRow key={member.address}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <code className="text-xs bg-muted px-2 py-0.5 rounded">
                                      {member.address.slice(0, 6)}...
                                      {member.address.slice(-4)}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() =>
                                        copyAddress(member.address)
                                      }
                                      aria-label="Copy member address"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    {member.address === poolInfo.creator && (
                                      <Crown className="h-3.5 w-3.5 text-accent" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono">
                                  {formatBTCCompact(member.btcContributed)} BTC
                                </TableCell>
                                <TableCell className="font-mono">
                                  {member.shares.toString()}
                                </TableCell>
                                <TableCell className="font-semibold">
                                  {formatPercentage(member.shares, totalShares)}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {formatDate(member.joinedAt)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Statistics Tab */}
                <TabsContent value="stats" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Average Contribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-mono font-bold">
                          {poolInfo.currentMembers > 0
                            ? formatBTCCompact(
                                poolInfo.totalBtcDeposited /
                                  BigInt(poolInfo.currentMembers),
                              )
                            : "0"}{" "}
                          BTC
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Yield per BTC
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-mono font-bold text-success">
                          {poolInfo.totalBtcDeposited > BigInt(0) &&
                          poolInfo.totalYieldGenerated > BigInt(0)
                            ? formatMUSD(
                                (poolInfo.totalYieldGenerated * BigInt(1e18)) /
                                  poolInfo.totalBtcDeposited,
                              )
                            : "0"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Pool Utilization
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {(
                            (poolInfo.currentMembers / poolInfo.maxMembers) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Shares
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-mono font-bold">
                          {totalShares.toString()}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
