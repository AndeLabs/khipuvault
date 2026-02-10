/**
 * @fileoverview Pool Details Modal - Refactored
 *
 * Orchestrates the pool details view using decomposed subcomponents.
 * Keeps only modal layout, tab management, and action coordination.
 */

"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  usePoolDetails,
  PoolDetailsHeader,
  UserPositionCard,
  PoolOverviewTab,
  PoolMembersTab,
  PoolStatsTab,
} from "./pool-details";

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
  const { poolInfo, members, memberInfo, pendingYield, isLoading, isMember, totalShares } =
    usePoolDetails(poolId);

  if (!poolId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="font-heading text-2xl">Pool Details</DialogTitle>
          <DialogDescription>Complete information about this cooperative pool</DialogDescription>
        </DialogHeader>

        {(() => {
          if (isLoading) {
            return (
              <div className="px-6 pb-6">
                <SkeletonCard />
              </div>
            );
          }

          if (!poolInfo) {
            return (
              <div className="px-6 py-12 pb-6 text-center">
                <p className="text-muted-foreground">Pool not found</p>
              </div>
            );
          }

          return (
            <ScrollArea className="max-h-[calc(90vh-120px)]">
              <div className="space-y-6 px-6 pb-6">
                {/* Pool Header */}
                <PoolDetailsHeader
                  poolId={poolId}
                  poolName={poolInfo.name}
                  status={poolInfo.status}
                  creator={poolInfo.creator}
                />

                {/* User Position (if member) */}
                {isMember && memberInfo && (
                  <UserPositionCard
                    btcContributed={memberInfo.btcContributed}
                    shares={memberInfo.shares}
                    totalShares={totalShares}
                    pendingYield={pendingYield}
                    poolId={poolId}
                    onClaim={onClaim}
                    onLeave={onLeave}
                  />
                )}

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="members">Members ({poolInfo.currentMembers})</TabsTrigger>
                    <TabsTrigger value="stats">Statistics</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview">
                    <PoolOverviewTab
                      currentMembers={poolInfo.currentMembers}
                      maxMembers={poolInfo.maxMembers}
                      totalBtcDeposited={poolInfo.totalBtcDeposited}
                      totalMusdMinted={poolInfo.totalMusdMinted}
                      totalYieldGenerated={poolInfo.totalYieldGenerated}
                      createdAt={poolInfo.createdAt}
                      minContribution={poolInfo.minContribution}
                      maxContribution={poolInfo.maxContribution}
                      allowNewMembers={poolInfo.allowNewMembers}
                      isMember={isMember}
                      poolId={poolId}
                      onJoin={onJoin}
                    />
                  </TabsContent>

                  {/* Members Tab */}
                  <TabsContent value="members">
                    <PoolMembersTab
                      members={members}
                      totalShares={totalShares}
                      creatorAddress={poolInfo.creator}
                    />
                  </TabsContent>

                  {/* Statistics Tab */}
                  <TabsContent value="stats">
                    <PoolStatsTab
                      totalBtcDeposited={poolInfo.totalBtcDeposited}
                      totalYieldGenerated={poolInfo.totalYieldGenerated}
                      currentMembers={poolInfo.currentMembers}
                      maxMembers={poolInfo.maxMembers}
                      totalShares={totalShares}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
