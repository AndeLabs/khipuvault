/**
 * @fileoverview Liquidation Monitoring Hook
 * @module hooks/web3/mezo/use-liquidation-monitor
 *
 * Real-time monitoring of liquidation risk for Troves.
 * Uses Mezo v6's enhanced price feeds for accurate calculations.
 *
 * Features:
 * - Real-time collateral ratio monitoring
 * - Recovery mode detection
 * - Liquidation risk alerts
 * - Price impact simulation
 *
 * Security Features:
 * - Safe division to prevent divide-by-zero
 * - Safe BigInt to Number conversion
 * - Stale price awareness
 */

"use client";

import { useCallback, useMemo } from "react";
import { formatUnits, parseUnits } from "viem";

import { useMezoPriceFeed } from "./use-mezo-price-feed";
import { safeBigIntToNumber, safeDivide } from "./utils/validation";
import {
  useUserTrove,
  useTroveManagerStats,
  useRecoveryMode,
  useSystemTCR,
} from "./use-mezo-trove-manager";

// Risk levels for liquidation
export const LiquidationRisk = {
  SAFE: "safe",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
  LIQUIDATABLE: "liquidatable",
} as const;

export type LiquidationRiskLevel = (typeof LiquidationRisk)[keyof typeof LiquidationRisk];

interface LiquidationRiskInfo {
  level: LiquidationRiskLevel;
  label: string;
  color: string;
  description: string;
}

/**
 * Get risk info based on collateral ratio
 */
function getRiskInfo(
  crPercent: number,
  mcr: number,
  ccr: number,
  isRecoveryMode: boolean
): LiquidationRiskInfo {
  const effectiveLiquidationThreshold = isRecoveryMode ? ccr : mcr;

  if (crPercent <= effectiveLiquidationThreshold) {
    return {
      level: LiquidationRisk.LIQUIDATABLE,
      label: "Liquidatable",
      color: "red",
      description: "Your Trove can be liquidated immediately!",
    };
  }

  if (crPercent < effectiveLiquidationThreshold + 5) {
    return {
      level: LiquidationRisk.CRITICAL,
      label: "Critical",
      color: "red",
      description: "Extremely high liquidation risk. Add collateral immediately!",
    };
  }

  if (crPercent < effectiveLiquidationThreshold + 15) {
    return {
      level: LiquidationRisk.HIGH,
      label: "High Risk",
      color: "orange",
      description: "High liquidation risk. Consider adding more collateral.",
    };
  }

  if (crPercent < effectiveLiquidationThreshold + 40) {
    return {
      level: LiquidationRisk.MEDIUM,
      label: "Medium Risk",
      color: "yellow",
      description: "Moderate risk. Monitor price movements closely.",
    };
  }

  if (crPercent < effectiveLiquidationThreshold + 80) {
    return {
      level: LiquidationRisk.LOW,
      label: "Low Risk",
      color: "green",
      description: "Low liquidation risk. Your position is relatively safe.",
    };
  }

  return {
    level: LiquidationRisk.SAFE,
    label: "Safe",
    color: "emerald",
    description: "Very safe position with high collateralization.",
  };
}

/**
 * Hook to monitor liquidation risk for user's Trove
 *
 * @description Provides real-time liquidation risk assessment by combining:
 * - Current BTC/USD price from Mezo's Pyth oracle
 * - User's Trove collateral and debt
 * - System parameters (MCR, CCR, Recovery Mode)
 */
export function useLiquidationMonitor() {
  const {
    price: btcPrice,
    priceRaw,
    isLoading: priceLoading,
    isPriceStale,
    priceStatus,
  } = useMezoPriceFeed();
  const { mcr, ccr, isLoading: statsLoading } = useTroveManagerStats();
  const { isRecoveryMode, isLoading: recoveryLoading } = useRecoveryMode(priceRaw);
  const { tcr, tcrPercent, isLoading: tcrLoading } = useSystemTCR(priceRaw);
  const {
    hasActiveTrove,
    collateral,
    debt,
    collateralRatio,
    isLoading: troveLoading,
  } = useUserTrove();

  const isLoading = priceLoading || statsLoading || recoveryLoading || tcrLoading || troveLoading;

  // Calculate risk info
  const riskInfo = useMemo(() => {
    if (!hasActiveTrove || collateralRatio === 0) {
      return {
        level: LiquidationRisk.SAFE,
        label: "No Trove",
        color: "gray",
        description: "You don't have an active Trove.",
      } as LiquidationRiskInfo;
    }

    return getRiskInfo(collateralRatio, mcr, ccr, isRecoveryMode);
  }, [hasActiveTrove, collateralRatio, mcr, ccr, isRecoveryMode]);

  // Calculate price drop tolerance (how much BTC price can drop before liquidation)
  const priceDropTolerance = useMemo(() => {
    if (!hasActiveTrove || debt === 0n || collateral === 0n || btcPrice === 0) {
      return { percentage: 0, absoluteUSD: 0, liquidationPrice: 0 };
    }

    const effectiveThreshold = isRecoveryMode ? ccr : mcr;
    const thresholdRatio = effectiveThreshold / 100;

    // Use safe BigInt to Number conversion
    const collateralBTC = safeBigIntToNumber(collateral, 18);
    const debtValueUSD = safeBigIntToNumber(debt, 18);

    // Calculate the price at which CR = threshold
    // CR = (collateral * price) / debt
    // threshold = (collateral * newPrice) / debt
    // newPrice = (threshold * debt) / collateral
    // Use safe division to prevent divide-by-zero
    const liquidationPrice = safeDivide(thresholdRatio * debtValueUSD, collateralBTC, 0);

    // Use safe division for percentage calculation
    const dropPercentage = safeDivide(btcPrice - liquidationPrice, btcPrice, 0) * 100;
    const dropAbsolute = btcPrice - liquidationPrice;

    return {
      percentage: Math.max(0, dropPercentage),
      absoluteUSD: Math.max(0, dropAbsolute),
      liquidationPrice: Math.max(0, liquidationPrice),
    };
  }, [hasActiveTrove, debt, collateral, btcPrice, mcr, ccr, isRecoveryMode]);

  // Simulate price impact on CR
  const simulatePriceImpact = useCallback(
    (newPriceUSD: number) => {
      if (!hasActiveTrove || debt === 0n || collateral === 0n) {
        return { newCR: 0, riskInfo: getRiskInfo(0, mcr, ccr, isRecoveryMode) };
      }

      // Use safe BigInt to Number conversion
      const collateralBTC = safeBigIntToNumber(collateral, 18);
      const debtUSD = safeBigIntToNumber(debt, 18);

      const newCollateralValueUSD = collateralBTC * newPriceUSD;
      // Use safe division to prevent divide-by-zero
      const newCR = safeDivide(newCollateralValueUSD, debtUSD, 0) * 100;

      return {
        newCR,
        riskInfo: getRiskInfo(newCR, mcr, ccr, isRecoveryMode),
      };
    },
    [hasActiveTrove, debt, collateral, mcr, ccr, isRecoveryMode]
  );

  return {
    // Current state
    hasActiveTrove,
    btcPrice,
    collateralRatio,
    collateralRatioFormatted: `${collateralRatio.toFixed(2)}%`,

    // Risk assessment
    riskInfo,
    riskLevel: riskInfo.level,
    isLiquidatable: riskInfo.level === LiquidationRisk.LIQUIDATABLE,
    isCritical:
      riskInfo.level === LiquidationRisk.CRITICAL ||
      riskInfo.level === LiquidationRisk.LIQUIDATABLE,

    // Price tolerance
    priceDropTolerance,
    canSurvivePriceDrop: (dropPercent: number) => priceDropTolerance.percentage >= dropPercent,

    // System state
    isRecoveryMode,
    systemTCR: tcrPercent,
    systemTCRFormatted: `${tcrPercent.toFixed(2)}%`,
    mcr,
    ccr,

    // Simulation
    simulatePriceImpact,

    // Loading state
    isLoading,

    // Price health (Security: stale price awareness)
    /** True if the price data is stale */
    isPriceStale,
    /** Price status for UI feedback */
    priceStatus,
    /** Warning message if price is stale */
    priceWarning: isPriceStale
      ? "Warning: Price data may be stale. Risk calculations may be inaccurate."
      : null,
  };
}

/**
 * Hook to monitor multiple Troves for liquidation opportunities
 *
 * @description For liquidation bots or dashboards that need to monitor
 * which Troves are eligible for liquidation.
 */
export function useLiquidatableTroves() {
  const { priceRaw, isLoading: priceLoading } = useMezoPriceFeed();
  const { mcr, ccr, troveCount, isLoading: statsLoading } = useTroveManagerStats();
  const { isRecoveryMode, isLoading: recoveryLoading } = useRecoveryMode(priceRaw);

  const isLoading = priceLoading || statsLoading || recoveryLoading;

  const effectiveThreshold = isRecoveryMode ? ccr : mcr;

  return {
    /** Current BTC price (raw, 18 decimals) */
    price: priceRaw,
    /** Total number of Troves in the system */
    troveCount,
    /** Whether system is in Recovery Mode */
    isRecoveryMode,
    /** Effective liquidation threshold (MCR in normal mode, CCR in recovery mode) */
    effectiveThreshold,
    effectiveThresholdFormatted: `${effectiveThreshold.toFixed(0)}%`,
    /** Minimum Collateral Ratio */
    mcr,
    /** Critical Collateral Ratio */
    ccr,
    isLoading,
  };
}

/**
 * Calculate health factor (CR / MCR)
 * Health factor > 1 = safe, < 1 = liquidatable
 */
export function calculateHealthFactor(cr: number, mcr: number): number {
  if (mcr === 0) return 0;
  return cr / mcr;
}

/**
 * Format health factor for display
 */
export function formatHealthFactor(healthFactor: number): string {
  if (healthFactor >= 2) return "Excellent";
  if (healthFactor >= 1.5) return "Good";
  if (healthFactor >= 1.2) return "Fair";
  if (healthFactor >= 1) return "At Risk";
  return "Unsafe";
}
