"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, Dot } from "lucide-react";

interface TandaCalendarCardProps {
    turn: number;
    totalTurns: number;
    userTurn: number | null;
}

export function TandaCalendarCard({ turn, totalTurns, userTurn }: TandaCalendarCardProps) {
  return (
    <div className="p-3 bg-background/50 rounded-lg">
      <p className="text-xs text-muted-foreground mb-2">Línea de tiempo de turnos</p>
      <TooltipProvider>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalTurns }).map((_, i) => {
            const currentTurn = i + 1;
            let status = "pending";
            if (currentTurn < turn) status = "completed";
            if (currentTurn === turn) status = "active";
            if (currentTurn === userTurn) status = "user";

            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div className="flex-1 h-2 rounded-full relative cursor-pointer">
                    {status === "completed" && (
                        <div className="w-full h-full bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                        </div>
                    )}
                    {status === "active" && (
                        <div className="w-full h-full bg-secondary rounded-full animate-pulse flex items-center justify-center" />
                    )}
                    {status === "pending" && (
                        <div className="w-full h-full bg-muted rounded-full" />
                    )}
                     {status === "user" && currentTurn !== turn && (
                        <div className="w-full h-full bg-primary rounded-full flex items-center justify-center" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Turno #{currentTurn}
                    {currentTurn === userTurn ? " (Tu Turno)" : ""}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
