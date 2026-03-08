import { V3_FEATURES } from "@/lib/web3/contracts-v3";

/**
 * Formatting utilities for IndividualPool data
 * Separated from hooks to enable tree-shaking and reuse
 */

export function formatMUSD(value: bigint | undefined): string {
  if (!value) return "0.00";
  const num = Number(value) / 1e18;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatMUSDCompact(value: bigint | undefined): string {
  if (!value) return "0";
  const num = Number(value) / 1e18;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

export function formatAPR(apr: bigint | number): string {
  const value = typeof apr === "bigint" ? Number(apr) / 100 : apr;
  return `${value.toFixed(2)}%`;
}

export function formatDays(days: bigint | number): string {
  const value = typeof days === "bigint" ? Number(days) : days;
  if (value === 0) return "Hoy";
  if (value === 1) return "1 día";
  return `${value} días`;
}

export function formatReferralBonus(): string {
  return `${(V3_FEATURES.individualPool.referralBonus / 100).toFixed(2)}%`;
}

export function calculateFee(amount: bigint, feeBps: number): bigint {
  return (amount * BigInt(feeBps)) / BigInt(10000);
}

export function calculateNetAmount(gross: bigint, feeBps: number): bigint {
  const fee = calculateFee(gross, feeBps);
  return gross - fee;
}
