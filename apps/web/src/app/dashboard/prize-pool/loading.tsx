/**
 * Prize Pool (Lottery) Loading State
 * Shows skeleton UI while lottery data is loading
 */

import { Skeleton } from "@/components/ui/skeleton";

export default function PrizePoolLoading() {
  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Hero Section */}
      <div className="rounded-lg border border-border bg-card p-8">
        <div className="flex flex-col items-center text-center">
          <Skeleton className="mb-4 h-16 w-16 rounded-full" />
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="mb-4 h-4 w-64" />
          <div className="mb-6 flex gap-8">
            <div className="text-center">
              <Skeleton className="mx-auto h-10 w-20" />
              <Skeleton className="mt-1 h-3 w-16" />
            </div>
            <div className="text-center">
              <Skeleton className="mx-auto h-10 w-24" />
              <Skeleton className="mt-1 h-3 w-20" />
            </div>
            <div className="text-center">
              <Skeleton className="mx-auto h-10 w-16" />
              <Skeleton className="mt-1 h-3 w-14" />
            </div>
          </div>
          <Skeleton className="h-12 w-40" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="mt-2 h-7 w-32" />
            <Skeleton className="mt-1 h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Tabs Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6 flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>

        {/* Tab Content */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Your Tickets Card */}
          <div className="rounded-lg border border-border bg-surface-elevated p-6">
            <Skeleton className="mb-4 h-6 w-28" />
            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </div>

          {/* Probability Calculator Card */}
          <div className="rounded-lg border border-border bg-surface-elevated p-6">
            <Skeleton className="mb-4 h-6 w-40" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
