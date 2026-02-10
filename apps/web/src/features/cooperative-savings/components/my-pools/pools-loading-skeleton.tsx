/**
 * @fileoverview Loading skeleton for my pools dashboard
 */

import { SkeletonCard } from "@/components/ui/skeleton";

export function PoolsLoadingSkeleton() {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={`stat-skeleton-${i}`}
            className="h-24 animate-shimmer rounded-lg bg-surface-elevated"
          />
        ))}
      </div>

      {/* Cards Skeleton */}
      <div className="grid gap-6">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={`card-skeleton-${i}`} />
        ))}
      </div>
    </div>
  );
}
