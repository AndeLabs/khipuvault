/**
 * @fileoverview Pools Browse Component - V3
 *
 * Features:
 * - Search by name or pool ID
 * - Filter by status
 * - Sort by various criteria
 * - Pool statistics cards
 * - Responsive grid layout
 */

"use client";

import { Search, Filter, Plus, Users, Bitcoin, TrendingUp, Sparkles } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonCard } from "@/components/ui/skeleton";
import {
  useAllCooperativePools,
  sortPools,
  filterPoolsByStatus,
  searchPools,
  type SortBy,
  type FilterStatus,
} from "@/hooks/web3/use-all-cooperative-pools";
import { formatBTCCompact } from "@/hooks/web3/use-cooperative-pool";

import { PoolCardV3 } from "./pool-card-v3";

interface PoolsBrowseV3Props {
  onJoinPool?: (poolId: number) => void;
  onViewDetails?: (poolId: number) => void;
  onManagePool?: (poolId: number) => void;
  onCreatePool?: () => void;
}

export function PoolsBrowseV3({
  onJoinPool,
  onViewDetails,
  onManagePool,
  onCreatePool,
}: PoolsBrowseV3Props) {
  const { pools, statistics, isLoading } = useAllCooperativePools();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<FilterStatus>("all");
  const [sortBy, setSortBy] = React.useState<SortBy>("newest");

  // Apply filters and sorting
  const filteredPools = React.useMemo(() => {
    let result = pools;

    // Search
    result = searchPools(result, searchQuery);

    // Filter by status
    result = filterPoolsByStatus(result, filterStatus);

    // Sort
    result = sortPools(result, sortBy);

    return result;
  }, [pools, searchQuery, filterStatus, sortBy]);

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        {/* Statistics Skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {["pools", "members", "btc", "user"].map((key) => (
            <div key={key} className="h-24 animate-shimmer rounded-lg bg-surface-elevated" />
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="flex gap-3">
          <div className="h-10 flex-1 animate-shimmer rounded bg-surface-elevated" />
          <div className="h-10 w-32 animate-shimmer rounded bg-surface-elevated" />
          <div className="h-10 w-32 animate-shimmer rounded bg-surface-elevated" />
        </div>

        {/* Cards Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {["card1", "card2", "card3", "card4", "card5", "card6"].map((key) => (
            <SkeletonCard key={key} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-6">
      {/* Pool Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Pools</p>
                <p className="font-heading text-2xl font-bold">{statistics.totalPools}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Active Members</p>
                <p className="font-heading text-2xl font-bold">{statistics.totalMembers}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">BTC Locked</p>
                <p className="font-heading font-mono text-2xl font-bold">
                  {formatBTCCompact(statistics.totalBtcLocked)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                <Bitcoin className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Your Pools</p>
                <p className="font-heading text-2xl font-bold">{statistics.userMemberships}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-2xl font-semibold">Browse Pools</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{filteredPools.length} Pools</Badge>
            {filterStatus !== "all" && (
              <Badge variant="outline" className="capitalize">
                {filterStatus}
              </Badge>
            )}
          </div>
        </div>
        <Button variant="accent" onClick={onCreatePool}>
          <Plus className="mr-2 h-4 w-4" />
          Create Pool
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or pool ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filterStatus}
          onValueChange={(value) => setFilterStatus(value as FilterStatus)}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="accepting">Accepting</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="members">Most Members</SelectItem>
            <SelectItem value="deposits">Highest Deposits</SelectItem>
            <SelectItem value="yields">Highest Yields</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pools Grid */}
      {filteredPools.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-4 text-muted-foreground">
            {searchQuery || filterStatus !== "all"
              ? "No pools match your filters"
              : "No pools available yet"}
          </p>
          {!searchQuery && filterStatus === "all" && (
            <Button variant="accent" onClick={onCreatePool}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Pool
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPools.map((pool) => (
            <PoolCardV3
              key={pool.poolId}
              pool={pool}
              onJoin={onJoinPool}
              onViewDetails={onViewDetails}
              onManage={onManagePool}
            />
          ))}
        </div>
      )}
    </div>
  );
}
