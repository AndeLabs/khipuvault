"use client";

import { TrendingUp, Calculator, BarChart3 } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ProjectionsCalculator } from "./projections-calculator";
import { YieldHistoryChart } from "./yield-history-chart";

// ============================================================================
// TYPES
// ============================================================================

interface YieldAnalyticsProps {
  currentAPR?: number;
  currentDeposit?: string;
  /** Performance fee percentage (e.g., 1 = 1%). Fetched from contract */
  performanceFeePercent?: number;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function YieldAnalytics({
  currentAPR = 0,
  currentDeposit = "0",
  performanceFeePercent = 1,
  className,
}: YieldAnalyticsProps) {
  return (
    <Card variant="surface" className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-lavanda flex h-10 w-10 items-center justify-center rounded-full">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>Yield Analytics</CardTitle>
            <CardDescription>Track your earnings and project future yields</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="projections" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projections" className="gap-2">
              <Calculator className="h-4 w-4" />
              Projections
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projections" className="mt-6">
            <ProjectionsCalculator
              currentAPR={currentAPR}
              currentDeposit={currentDeposit}
              performanceFeePercent={performanceFeePercent}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <YieldHistoryChart currentDeposit={currentDeposit} currentAPR={currentAPR} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
