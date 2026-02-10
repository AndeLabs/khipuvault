/**
 * @fileoverview Action buttons for pool cards
 */

import { Info, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PoolCardActionsProps {
  variant: "created" | "membership";
  poolId: number;
  hasYield?: boolean;
  onViewDetails?: (poolId: number) => void;
  onClaimYield?: (poolId: number) => void;
  onLeavePool?: (poolId: number) => void;
  onManagePool?: (poolId: number) => void;
}

export function PoolCardActions({
  variant,
  poolId,
  hasYield = false,
  onViewDetails,
  onClaimYield,
  onLeavePool,
  onManagePool,
}: PoolCardActionsProps) {
  if (variant === "created") {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onViewDetails?.(poolId)}
        >
          <Info className="mr-1.5 h-4 w-4" />
          Details
        </Button>
        <Button
          variant="accent"
          size="sm"
          className="flex-1"
          onClick={() => onManagePool?.(poolId)}
        >
          Manage Pool
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => onViewDetails?.(poolId)}>
        Details
      </Button>
      {hasYield && (
        <Button variant="success" size="sm" onClick={() => onClaimYield?.(poolId)}>
          <TrendingUp className="mr-1.5 h-4 w-4" />
          Claim Yield
        </Button>
      )}
      <Button variant="destructive" size="sm" onClick={() => onLeavePool?.(poolId)}>
        Leave Pool
      </Button>
    </div>
  );
}
