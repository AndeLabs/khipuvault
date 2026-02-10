"use client";

import { Info } from "lucide-react";
import * as React from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  tooltipText: string;
  variant?: "success" | "lavanda" | "accent" | "default";
}

const variantClasses = {
  success: "bg-gradient-success/10 border-success/20 text-success",
  lavanda: "bg-gradient-lavanda/10 border-lavanda/20 text-lavanda",
  accent: "bg-gradient-accent/10 border-accent/20 text-accent",
  default: "bg-surface-elevated border-border",
};

export function StatCard({
  icon,
  label,
  value,
  description,
  tooltipText,
  variant = "default",
}: StatCardProps) {
  const baseClasses = "space-y-2 rounded-lg border p-4";
  const variantClass = variantClasses[variant];

  return (
    <div className={`${baseClasses} ${variantClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-muted-foreground hover:text-foreground">
                <Info className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="space-y-1">
        <div
          className={`text-2xl font-bold tabular-nums ${variant !== "default" ? variantClasses[variant].split(" ")[2] : ""}`}
        >
          {value}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
