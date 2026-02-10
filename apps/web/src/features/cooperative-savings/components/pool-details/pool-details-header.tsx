/**
 * @fileoverview Pool Details Header Component
 *
 * Displays pool name, ID, status badge, and creator information.
 */

"use client";

import { Crown, Copy } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getPoolStatusBadge } from "@/hooks/web3/use-cooperative-pool";

interface PoolDetailsHeaderProps {
  poolId: number;
  poolName: string;
  status: number;
  creator: string;
}

export function PoolDetailsHeader({ poolId, poolName, status, creator }: PoolDetailsHeaderProps) {
  const { toast } = useToast();

  const copyAddress = (address: string) => {
    void navigator.clipboard.writeText(address);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="mb-1 font-heading text-xl font-semibold">{poolName}</h3>
          <p className="text-sm text-muted-foreground">Pool #{poolId}</p>
        </div>
        <Badge variant={getPoolStatusBadge(status).variant}>
          {getPoolStatusBadge(status).label}
        </Badge>
      </div>

      {/* Creator */}
      <div className="flex items-center gap-2 text-sm">
        <Crown className="h-4 w-4 text-accent" />
        <span className="text-muted-foreground">Created by:</span>
        <code className="rounded bg-muted px-2 py-0.5 text-xs">
          {creator.slice(0, 6)}...
          {creator.slice(-4)}
        </code>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => copyAddress(creator)}
          aria-label="Copy creator address"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
