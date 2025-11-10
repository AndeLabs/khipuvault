/**
 * @fileoverview Skeleton loader for pool cards
 * Professional loading state for cooperative pool cards
 */

'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PoolCardSkeleton() {
  return (
    <Card className="bg-card border-primary/20 animate-pulse">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            {/* Pool name */}
            <Skeleton className="h-6 w-3/4 bg-muted" />
            {/* Creator address */}
            <Skeleton className="h-4 w-1/2 bg-muted/70" />
          </div>
          {/* Status badge */}
          <Skeleton className="h-6 w-20 rounded-full bg-muted" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 bg-muted/70" />
            <Skeleton className="h-5 w-24 bg-muted" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 bg-muted/70" />
            <Skeleton className="h-5 w-24 bg-muted" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 bg-muted/70" />
            <Skeleton className="h-5 w-16 bg-muted" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 bg-muted/70" />
            <Skeleton className="h-5 w-12 bg-muted" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 bg-muted" />
          <Skeleton className="h-10 w-24 bg-muted/70" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Grid of skeleton pool cards
 */
interface PoolCardSkeletonGridProps {
  count?: number
}

export function PoolCardSkeletonGrid({ count = 6 }: PoolCardSkeletonGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PoolCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Loading state with message
 */
interface LoadingStateProps {
  message?: string
  count?: number
}

export function PoolsLoadingState({
  message = 'Cargando pools desde blockchain...',
  count = 6
}: LoadingStateProps) {
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      </div>
      <PoolCardSkeletonGrid count={count} />
    </div>
  )
}
