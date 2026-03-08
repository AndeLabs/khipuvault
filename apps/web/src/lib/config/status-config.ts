/**
 * @fileoverview Centralized Status Configuration
 * @module lib/config/status-config
 *
 * Provides consistent status styling across pool types (rotating, cooperative, lottery).
 * Eliminates duplicated switch statements for status badges and colors.
 */

import type { PoolStatus as RotatingPoolStatus } from "@/hooks/web3/rotating";
import type { PoolStatus as CooperativePoolStatus } from "@/hooks/web3/cooperative/constants";

// ============================================================================
// TYPES
// ============================================================================

export interface StatusConfig {
  /** Display label */
  label: string;
  /** Badge variant for UI component */
  variant: "success" | "warning" | "error" | "secondary" | "default" | "outline";
  /** Border color class for cards */
  borderColor: string;
  /** Background color class for subtle backgrounds */
  bgColor: string;
  /** Text color class */
  textColor: string;
}

// ============================================================================
// ROTATING POOL STATUS
// ============================================================================

/**
 * Status configuration for Rotating Pool (ROSCA)
 * Enum values: FORMING=0, ACTIVE=1, COMPLETED=2, CANCELLED=3
 */
export const ROTATING_POOL_STATUS: Record<number, StatusConfig> = {
  0: {
    // FORMING
    label: "Forming",
    variant: "warning",
    borderColor: "border-warning/50",
    bgColor: "bg-warning/10",
    textColor: "text-warning",
  },
  1: {
    // ACTIVE
    label: "Active",
    variant: "success",
    borderColor: "border-success/50",
    bgColor: "bg-success/10",
    textColor: "text-success",
  },
  2: {
    // COMPLETED
    label: "Completed",
    variant: "secondary",
    borderColor: "border-secondary/50",
    bgColor: "bg-secondary/10",
    textColor: "text-secondary-foreground",
  },
  3: {
    // CANCELLED
    label: "Cancelled",
    variant: "error",
    borderColor: "border-destructive/50",
    bgColor: "bg-destructive/10",
    textColor: "text-destructive",
  },
} as const;

// ============================================================================
// COOPERATIVE POOL STATUS
// ============================================================================

/**
 * Status configuration for Cooperative Pool
 * Enum values: ACTIVE=0, PAUSED=1, CLOSED=2
 */
export const COOPERATIVE_POOL_STATUS: Record<number, StatusConfig> = {
  0: {
    // ACTIVE
    label: "Active",
    variant: "success",
    borderColor: "border-success/50",
    bgColor: "bg-success/10",
    textColor: "text-success",
  },
  1: {
    // PAUSED
    label: "Paused",
    variant: "warning",
    borderColor: "border-warning/50",
    bgColor: "bg-warning/10",
    textColor: "text-warning",
  },
  2: {
    // CLOSED
    label: "Closed",
    variant: "secondary",
    borderColor: "border-secondary/50",
    bgColor: "bg-secondary/10",
    textColor: "text-secondary-foreground",
  },
} as const;

// ============================================================================
// LOTTERY ROUND STATUS
// ============================================================================

/**
 * Status configuration for Lottery Rounds
 * Enum values: OPEN=0, COMMIT=1, REVEAL=2, COMPLETED=3, CANCELLED=4
 */
export const LOTTERY_ROUND_STATUS: Record<number, StatusConfig> = {
  0: {
    // OPEN
    label: "Open",
    variant: "success",
    borderColor: "border-success/50",
    bgColor: "bg-success/10",
    textColor: "text-success",
  },
  1: {
    // COMMIT
    label: "Commit Phase",
    variant: "warning",
    borderColor: "border-warning/50",
    bgColor: "bg-warning/10",
    textColor: "text-warning",
  },
  2: {
    // REVEAL
    label: "Reveal Phase",
    variant: "warning",
    borderColor: "border-accent/50",
    bgColor: "bg-accent/10",
    textColor: "text-accent",
  },
  3: {
    // COMPLETED
    label: "Completed",
    variant: "secondary",
    borderColor: "border-secondary/50",
    bgColor: "bg-secondary/10",
    textColor: "text-secondary-foreground",
  },
  4: {
    // CANCELLED
    label: "Cancelled",
    variant: "error",
    borderColor: "border-destructive/50",
    bgColor: "bg-destructive/10",
    textColor: "text-destructive",
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const DEFAULT_STATUS: StatusConfig = {
  label: "Unknown",
  variant: "default",
  borderColor: "border-border",
  bgColor: "bg-muted",
  textColor: "text-muted-foreground",
};

/**
 * Get rotating pool status configuration
 */
export function getRotatingPoolStatus(status: number | RotatingPoolStatus): StatusConfig {
  const numStatus = typeof status === "number" ? status : Number(status);
  return ROTATING_POOL_STATUS[numStatus] ?? DEFAULT_STATUS;
}

/**
 * Get cooperative pool status configuration
 */
export function getCooperativePoolStatus(status: number | CooperativePoolStatus): StatusConfig {
  const numStatus = typeof status === "number" ? status : Number(status);
  return COOPERATIVE_POOL_STATUS[numStatus] ?? DEFAULT_STATUS;
}

/**
 * Get lottery round status configuration
 */
export function getLotteryRoundStatus(status: number): StatusConfig {
  return LOTTERY_ROUND_STATUS[status] ?? DEFAULT_STATUS;
}

/**
 * Generic status getter for any pool type
 */
export type PoolType = "rotating" | "cooperative" | "lottery";

export function getPoolStatus(type: PoolType, status: number): StatusConfig {
  switch (type) {
    case "rotating":
      return getRotatingPoolStatus(status);
    case "cooperative":
      return getCooperativePoolStatus(status);
    case "lottery":
      return getLotteryRoundStatus(status);
    default:
      return DEFAULT_STATUS;
  }
}
