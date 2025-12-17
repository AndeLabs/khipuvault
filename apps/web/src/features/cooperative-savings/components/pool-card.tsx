"use client";

import { Users, Calendar, TrendingUp, Clock } from "lucide-react";
import * as React from "react";

import { AmountDisplay } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PoolCardProps {
  poolId: string;
  poolName?: string;
  totalDeposits?: string;
  memberCount?: number;
  maxMembers?: number;
  cycleLength?: number;
  currentCycle?: number;
  apy?: number;
  isActive?: boolean;
  isMember?: boolean;
  onJoin?: (poolId: string) => void;
  onViewDetails?: (poolId: string) => void;
  className?: string;
}

export function PoolCard({
  poolId,
  poolName = `Pool #${poolId}`,
  totalDeposits = "0",
  memberCount = 0,
  maxMembers = 10,
  cycleLength = 30,
  currentCycle = 1,
  apy = 15.0,
  isActive = true,
  isMember = false,
  onJoin,
  onViewDetails,
  className,
}: PoolCardProps) {
  const isFull = memberCount >= maxMembers;
  const occupancyPercentage = (memberCount / maxMembers) * 100;

  return (
    <Card
      variant="surface"
      hover={isActive && !isFull ? "glow-orange" : "glow"}
      className={cn(!isActive && "opacity-60", className)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-xl">{poolName}</CardTitle>
              {isMember && (
                <Badge variant="lavanda" className="text-[10px]">
                  Member
                </Badge>
              )}
            </div>
            <CardDescription>
              Cycle {currentCycle} • {cycleLength} days
            </CardDescription>
          </div>
          <Badge variant={isActive ? "success" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Total Deposits */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Deposits</p>
              <AmountDisplay amount={totalDeposits} symbol="mUSD" size="sm" />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">APY</p>
            <span className="text-sm font-semibold text-success tabular-nums">
              {apy.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Members Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Members</span>
            </div>
            <span className="font-semibold">
              {memberCount}/{maxMembers}
            </span>
          </div>
          <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-base",
                isFull ? "bg-success" : "bg-accent",
              )}
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </div>

        {/* Member Avatars */}
        {memberCount > 0 && (
          <div className="flex items-center gap-1">
            {[...Array(Math.min(memberCount, 5))].map((_, i) => (
              <Avatar key={i} className="h-8 w-8 border-2 border-surface">
                <AvatarFallback className="bg-lavanda/20 text-lavanda text-xs">
                  M{i + 1}
                </AvatarFallback>
              </Avatar>
            ))}
            {memberCount > 5 && (
              <div className="h-8 w-8 rounded-full bg-surface-elevated flex items-center justify-center text-xs text-muted-foreground">
                +{memberCount - 5}
              </div>
            )}
          </div>
        )}

        {/* Cycle Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Cycle {currentCycle}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{cycleLength} days</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        {isMember ? (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onViewDetails?.(poolId)}
          >
            View Details
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => onViewDetails?.(poolId)}
            >
              Details
            </Button>
            <Button
              variant="accent"
              className="flex-1"
              onClick={() => onJoin?.(poolId)}
              disabled={!isActive || isFull}
            >
              {isFull ? "Full" : "Join Pool"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
