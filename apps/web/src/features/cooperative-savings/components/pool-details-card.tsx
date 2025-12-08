"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AmountDisplay } from "@/components/common";
import { Users, Calendar, TrendingUp, Award, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  address: string;
  joinedAt: number;
  hasReceived: boolean;
  position: number;
}

interface PoolDetailsCardProps {
  poolName?: string;
  totalDeposits?: string;
  depositPerMember?: string;
  members?: Member[];
  maxMembers?: number;
  cycleLength?: number;
  currentCycle?: number;
  nextRecipient?: string;
  nextDistribution?: number;
  apy?: number;
  totalYields?: string;
  isActive?: boolean;
  className?: string;
}

export function PoolDetailsCard({
  poolName = "Unnamed Pool",
  totalDeposits = "0",
  depositPerMember = "0",
  members = [],
  maxMembers = 10,
  cycleLength = 30,
  currentCycle = 1,
  nextRecipient,
  nextDistribution,
  apy = 15.0,
  totalYields = "0",
  isActive = true,
  className,
}: PoolDetailsCardProps) {
  const memberCount = members.length;
  const completedCycles = members.filter((m) => m.hasReceived).length;

  return (
    <Card variant="surface" className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CardTitle>{poolName}</CardTitle>
              <Badge variant={isActive ? "success" : "secondary"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <CardDescription>
              Cycle {currentCycle} of {maxMembers}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">APY</p>
            <p className="text-xl font-bold text-success tabular-nums">
              {apy.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Total Pool</span>
            </div>
            <AmountDisplay amount={totalDeposits} symbol="mUSD" size="sm" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>Members</span>
            </div>
            <p className="text-lg font-semibold">
              {memberCount}/{maxMembers}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Cycle Length</span>
            </div>
            <p className="text-lg font-semibold">{cycleLength} days</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Award className="h-3 w-3" />
              <span>Total Yields</span>
            </div>
            <AmountDisplay amount={totalYields} symbol="mUSD" size="sm" />
          </div>
        </div>

        {/* Next Distribution */}
        {nextRecipient && nextDistribution && (
          <div className="p-4 rounded-lg bg-gradient-lavanda border border-lavanda/20">
            <div className="flex items-center gap-2 text-sm font-medium mb-3">
              <Clock className="h-4 w-4 text-lavanda" />
              Next Distribution
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Recipient</p>
                <p className="font-mono text-sm">
                  {nextRecipient.slice(0, 6)}...{nextRecipient.slice(-4)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">In</p>
                <p className="text-lg font-semibold">
                  {Math.max(
                    0,
                    Math.ceil(
                      (nextDistribution - Date.now()) / (1000 * 60 * 60 * 24),
                    ),
                  )}{" "}
                  days
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Members</h4>
            <span className="text-xs text-muted-foreground">
              {completedCycles} completed
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No members yet
              </p>
            ) : (
              members.map((member, index) => (
                <div
                  key={member.address}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                    member.address === nextRecipient
                      ? "bg-lavanda/10 border border-lavanda/20"
                      : "bg-surface-elevated",
                  )}
                >
                  <Avatar className="h-10 w-10 border-2 border-surface">
                    <AvatarFallback className="bg-lavanda/20 text-lavanda">
                      {member.position}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm truncate">
                      {member.address.slice(0, 10)}...{member.address.slice(-8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.address === nextRecipient && (
                      <Badge variant="lavanda" className="text-[10px]">
                        Next
                      </Badge>
                    )}
                    {member.hasReceived && (
                      <Badge variant="success" className="text-[10px]">
                        ✓ Paid
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Deposit Info */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Deposit per Member</span>
            <AmountDisplay amount={depositPerMember} symbol="mUSD" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
