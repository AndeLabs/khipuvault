"use client";

import { DollarSign, PieChart, Users } from "lucide-react";

import { StatCard } from "./stat-card";

interface PerformanceMetricsProps {
  poolAPR: number;
  performanceFee: number;
  activeDepositors: number;
}

export function PerformanceMetrics({
  poolAPR,
  performanceFee,
  activeDepositors,
}: PerformanceMetricsProps) {
  const formattedPerformanceFee = (performanceFee / 100).toFixed(2);

  return (
    <>
      <StatCard
        icon={<PieChart className="h-4 w-4" />}
        label="Current APR"
        value={`${poolAPR.toFixed(2)}%`}
        description="Estimated annual return"
        tooltipText="Current Annual Percentage Rate based on recent yield performance. This rate can fluctuate based on Stability Pool activity."
        variant="default"
      />

      <StatCard
        icon={<DollarSign className="h-4 w-4" />}
        label="Performance Fee"
        value={`${formattedPerformanceFee}%`}
        description="On yields only"
        tooltipText="Fee charged on yields only (not on deposits). This fee goes to the KhipuVault treasury to support protocol development and operations."
        variant="default"
      />

      <StatCard
        icon={<Users className="h-4 w-4" />}
        label="Active Users"
        value={activeDepositors.toString()}
        description="Unique depositors"
        tooltipText="Number of unique addresses with active deposits in the pool. More depositors indicates higher trust and adoption."
        variant="default"
      />
    </>
  );
}
