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
import {
  AmountDisplay,
  TransactionStatus,
  type TransactionState,
} from "@/components/common";
import { ArrowDown, ArrowUp, Users, Award, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "deposit" | "withdraw" | "claim" | "join_pool" | "create_pool";
  amount?: string;
  timestamp: number;
  status: TransactionState;
  txHash?: string;
  poolName?: string;
}

interface RecentActivityProps {
  activities?: Activity[];
  isLoading?: boolean;
  maxItems?: number;
}

const activityConfig = {
  deposit: {
    icon: ArrowDown,
    label: "Deposit",
    color: "text-success",
    bgColor: "bg-success/20",
  },
  withdraw: {
    icon: ArrowUp,
    label: "Withdraw",
    color: "text-accent",
    bgColor: "bg-accent/20",
  },
  claim: {
    icon: Award,
    label: "Claim Yields",
    color: "text-lavanda",
    bgColor: "bg-lavanda/20",
  },
  join_pool: {
    icon: Users,
    label: "Join Pool",
    color: "text-orange",
    bgColor: "bg-accent/20",
  },
  create_pool: {
    icon: Users,
    label: "Create Pool",
    color: "text-lavanda",
    bgColor: "bg-lavanda/20",
  },
};

export function RecentActivity({
  activities = [],
  isLoading,
  maxItems = 10,
}: RecentActivityProps) {
  const displayedActivities = activities.slice(0, maxItems);

  if (isLoading) {
    return (
      <Card variant="surface">
        <CardHeader>
          <div className="h-6 w-32 bg-surface-elevated animate-shimmer rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-surface-elevated animate-shimmer rounded"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="surface">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest transactions and actions</CardDescription>
      </CardHeader>
      <CardContent>
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No activity yet</p>
            <p className="text-sm mt-1">
              Start saving to see your transactions here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedActivities.map((activity) => {
              const config = activityConfig[activity.type];
              const Icon = config.icon;

              return (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                    activity.status === "success"
                      ? "border-border bg-surface-elevated"
                      : activity.status === "error"
                        ? "border-error/30 bg-error/5"
                        : "border-border bg-surface-elevated",
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      config.bgColor,
                    )}
                  >
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{config.label}</p>
                      {activity.poolName && (
                        <Badge variant="secondary" className="text-[10px]">
                          {activity.poolName}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                      {activity.txHash && (
                        <a
                          href={`https://explorer.mezo.org/tx/${activity.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lavanda hover:underline inline-flex items-center gap-1"
                        >
                          View
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Amount & Status */}
                  <div className="text-right">
                    {activity.amount && (
                      <AmountDisplay
                        amount={activity.amount}
                        symbol="mUSD"
                        size="sm"
                        className={cn(
                          activity.type === "deposit" ||
                            activity.type === "claim"
                            ? "text-success"
                            : activity.type === "withdraw"
                              ? "text-accent"
                              : "",
                        )}
                      />
                    )}
                    <div className="mt-1">
                      <TransactionStatus
                        status={activity.status}
                        variant="badge"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
