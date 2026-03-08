"use client";

import { TrendingUp, Info } from "lucide-react";
import * as React from "react";

import { AmountDisplay } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type TimePeriod = "1month" | "3months" | "6months" | "1year";

export interface ProjectionResult {
  principal: number;
  grossYield: number;
  performanceFee: number;
  netYield: number;
  finalAmount: number;
  effectiveAPR: number;
}

interface ProjectionsCalculatorProps {
  currentAPR: number;
  currentDeposit: string;
  performanceFeePercent: number;
}

// ============================================================================
// HOOK: useProjections
// ============================================================================

function useProjections(
  amount: string,
  timePeriod: TimePeriod,
  currentAPR: number,
  autoCompound: boolean,
  performanceFeePercent: number
): ProjectionResult {
  return React.useMemo(() => {
    const principal = Number(amount) || 0;
    const apr = currentAPR / 100;

    const periods: Record<TimePeriod, number> = {
      "1month": 1 / 12,
      "3months": 3 / 12,
      "6months": 6 / 12,
      "1year": 1,
    };

    const years = periods[timePeriod];

    // Simple interest (no auto-compound)
    const simpleInterest = principal * apr * years;

    // Compound interest (monthly compounding with auto-compound)
    const compoundingPeriods = years * 12;
    const compoundFinal = principal * Math.pow(1 + apr / 12, compoundingPeriods);
    const compoundInterest = compoundFinal - principal;

    const totalYield = autoCompound ? compoundInterest : simpleInterest;

    // Performance fee (from contract)
    const performanceFee = totalYield * (performanceFeePercent / 100);
    const netYield = totalYield - performanceFee;

    return {
      principal,
      grossYield: totalYield,
      performanceFee,
      netYield,
      finalAmount: principal + netYield,
      effectiveAPR: autoCompound ? (compoundInterest / principal / years) * 100 : currentAPR,
    };
  }, [amount, timePeriod, currentAPR, autoCompound, performanceFeePercent]);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProjectionsCalculator({
  currentAPR,
  currentDeposit,
  performanceFeePercent,
}: ProjectionsCalculatorProps) {
  const [amount, setAmount] = React.useState(currentDeposit);
  const [timePeriod, setTimePeriod] = React.useState<TimePeriod>("1year");
  const [autoCompound, setAutoCompound] = React.useState(true);

  const projections = useProjections(
    amount,
    timePeriod,
    currentAPR,
    autoCompound,
    performanceFeePercent
  );

  return (
    <div className="space-y-6">
      {/* Calculator Inputs */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="calc-amount">Deposit Amount (mUSD)</Label>
          <Input
            id="calc-amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label>Time Period</Label>
          <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AutoCompoundToggle
          enabled={autoCompound}
          onToggle={() => setAutoCompound(!autoCompound)}
        />
      </div>

      {/* Results */}
      {Number(amount) > 0 && (
        <ProjectionResults
          projections={projections}
          performanceFeePercent={performanceFeePercent}
          autoCompound={autoCompound}
          currentAPR={currentAPR}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function AutoCompoundToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface-elevated p-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Auto-Compound</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-muted-foreground hover:text-foreground">
              <Info className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">
              With auto-compound enabled, your yields are automatically reinvested, earning compound
              interest for higher returns.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          enabled ? "bg-success" : "bg-surface"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            enabled ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

function ProjectionResults({
  projections,
  performanceFeePercent,
  autoCompound,
  currentAPR,
}: {
  projections: ProjectionResult;
  performanceFeePercent: number;
  autoCompound: boolean;
  currentAPR: number;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-lavanda rounded-lg border border-lavanda/20 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Initial Deposit</span>
            <AmountDisplay amount={projections.principal.toFixed(2)} symbol="mUSD" size="sm" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Gross Yield</span>
            <AmountDisplay
              amount={projections.grossYield.toFixed(4)}
              symbol="mUSD"
              size="sm"
              className="text-success"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Performance Fee ({performanceFeePercent}%)
            </span>
            <AmountDisplay
              amount={projections.performanceFee.toFixed(4)}
              symbol="mUSD"
              size="sm"
              className="text-error"
            />
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Net Yield</span>
            <AmountDisplay
              amount={projections.netYield.toFixed(4)}
              symbol="mUSD"
              size="md"
              className="font-bold text-success"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Final Amount</span>
            <AmountDisplay
              amount={projections.finalAmount.toFixed(2)}
              symbol="mUSD"
              size="md"
              className="font-bold"
            />
          </div>
        </div>
      </div>

      {/* APR Info */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface-elevated p-3 text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-success" />
          <span className="text-muted-foreground">
            {autoCompound ? "Effective APY" : "Base APR"}
          </span>
        </div>
        <span className="font-bold text-success">{projections.effectiveAPR.toFixed(2)}%</span>
      </div>

      {/* Comparison */}
      {autoCompound && (
        <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-xs">
          <p className="mb-1 font-semibold text-success">Auto-Compound Advantage</p>
          <p className="text-muted-foreground">
            You'll earn{" "}
            <span className="font-semibold text-foreground">
              {(((projections.effectiveAPR - currentAPR) / currentAPR) * 100).toFixed(1)}%
            </span>{" "}
            more compared to simple interest thanks to compound returns!
          </p>
        </div>
      )}
    </div>
  );
}
