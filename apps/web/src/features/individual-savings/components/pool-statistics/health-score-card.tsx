"use client";

import { Activity } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HealthScoreCardProps {
  emergencyMode: boolean;
  healthScore: number;
  healthColor: string;
  healthLabel: string;
}

export function HealthScoreCard({
  emergencyMode,
  healthScore,
  healthColor,
  healthLabel,
}: HealthScoreCardProps) {
  if (emergencyMode) {
    return (
      <Badge variant="error" className="gap-1.5">
        <Activity className="h-3 w-3" />
        Emergency Mode
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="success" className={`gap-1.5 ${healthColor}`}>
            <Activity className="h-3 w-3" />
            {healthLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Pool Health Score: {healthScore}/100</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
