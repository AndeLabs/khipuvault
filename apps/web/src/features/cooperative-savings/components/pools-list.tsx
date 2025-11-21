"use client"

import * as React from "react"
import { PoolCard } from "./pool-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Filter, Plus } from "lucide-react"
import { SkeletonCard } from "@/components/ui/skeleton"

interface Pool {
  poolId: string
  poolName?: string
  totalDeposits?: string
  memberCount?: number
  maxMembers?: number
  cycleLength?: number
  currentCycle?: number
  apy?: number
  isActive?: boolean
  isMember?: boolean
}

interface PoolsListProps {
  pools?: Pool[]
  isLoading?: boolean
  onJoinPool?: (poolId: string) => void
  onViewDetails?: (poolId: string) => void
  onCreatePool?: () => void
}

export function PoolsList({
  pools = [],
  isLoading,
  onJoinPool,
  onViewDetails,
  onCreatePool,
}: PoolsListProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState<string>("all")
  const [filterMembership, setFilterMembership] = React.useState<string>("all")

  const filteredPools = React.useMemo(() => {
    return pools.filter((pool) => {
      // Search filter
      if (
        searchQuery &&
        !pool.poolName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !pool.poolId.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      // Status filter
      if (filterStatus === "active" && !pool.isActive) return false
      if (filterStatus === "inactive" && pool.isActive) return false

      // Membership filter
      if (filterMembership === "member" && !pool.isMember) return false
      if (filterMembership === "available" && pool.isMember) return false

      return true
    })
  }, [pools, searchQuery, filterStatus, filterMembership])

  const stats = React.useMemo(() => {
    const total = pools.length
    const active = pools.filter((p) => p.isActive).length
    const myPools = pools.filter((p) => p.isMember).length
    return { total, active, myPools }
  }, [pools])

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-surface-elevated animate-shimmer rounded" />
          <div className="h-10 w-32 bg-surface-elevated animate-shimmer rounded" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex gap-3">
          <div className="h-10 flex-1 bg-surface-elevated animate-shimmer rounded" />
          <div className="h-10 w-32 bg-surface-elevated animate-shimmer rounded" />
          <div className="h-10 w-32 bg-surface-elevated animate-shimmer rounded" />
        </div>

        {/* Cards Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-heading font-semibold">
            Cooperative Pools
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{stats.total} Total</Badge>
            <Badge variant="success">{stats.active} Active</Badge>
            {stats.myPools > 0 && (
              <Badge variant="lavanda">{stats.myPools} Joined</Badge>
            )}
          </div>
        </div>
        <Button variant="accent" onClick={onCreatePool}>
          <Plus className="h-4 w-4 mr-2" />
          Create Pool
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Membership Filter */}
        <Select value={filterMembership} onValueChange={setFilterMembership}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pools</SelectItem>
            <SelectItem value="member">My Pools</SelectItem>
            <SelectItem value="available">Available</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pools Grid */}
      {filteredPools.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterStatus !== "all" || filterMembership !== "all"
              ? "No pools match your filters"
              : "No pools available yet"}
          </p>
          {!searchQuery && filterStatus === "all" && filterMembership === "all" && (
            <Button variant="accent" onClick={onCreatePool}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Pool
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPools.map((pool) => (
            <PoolCard
              key={pool.poolId}
              {...pool}
              onJoin={onJoinPool}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  )
}
