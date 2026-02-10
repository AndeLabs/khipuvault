/**
 * @fileoverview Empty state when user has no pools
 */

import { Users } from "lucide-react";

export function PoolsEmptyState() {
  return (
    <div className="animate-fade-in space-y-4 py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="font-heading text-xl font-semibold">No Pools Yet</h3>
        <p className="mx-auto max-w-md text-muted-foreground">
          You haven't joined or created any cooperative pools yet. Start by browsing available pools
          or creating your own.
        </p>
      </div>
    </div>
  );
}
