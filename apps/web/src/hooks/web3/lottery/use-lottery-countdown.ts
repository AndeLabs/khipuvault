/**
 * @fileoverview Lottery Countdown Hook
 * @module hooks/web3/lottery/use-lottery-countdown
 *
 * Manages countdown timer state for lottery rounds.
 * Updates every second and handles cleanup.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

import { getTimeRemaining } from "./lottery-helpers";

// ============================================================================
// TYPES
// ============================================================================

/** Re-export the TimeRemaining type from lottery-helpers for convenience */
export type TimeRemaining = ReturnType<typeof getTimeRemaining>;

export interface UseLotteryCountdownOptions {
  /** End time as Unix timestamp in seconds */
  endTime: bigint | number | undefined;
  /** Update interval in ms (default: 1000) */
  interval?: number;
  /** Whether to enable the countdown (default: true) */
  enabled?: boolean;
}

export interface UseLotteryCountdownReturn {
  /** Time remaining breakdown */
  timeRemaining: TimeRemaining;
  /** Whether the countdown has expired */
  isExpired: boolean;
  /** Formatted time string (HH:MM:SS or Dd HH:MM:SS) */
  formattedTime: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const INITIAL_TIME: TimeRemaining = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  total: 0,
};

/**
 * Format time remaining as string
 */
export function formatTimeRemaining(time: TimeRemaining): string {
  if (time.total <= 0) {
    return "00:00:00";
  }

  const parts = [
    String(time.hours).padStart(2, "0"),
    String(time.minutes).padStart(2, "0"),
    String(time.seconds).padStart(2, "0"),
  ];

  if (time.days > 0) {
    return `${time.days}d ${parts.join(":")}`;
  }

  return parts.join(":");
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing lottery countdown timer
 *
 * @example
 * ```tsx
 * const { timeRemaining, isExpired, formattedTime } = useLotteryCountdown({
 *   endTime: roundInfo.endTime,
 * });
 *
 * return (
 *   <div>
 *     {isExpired ? "Ended" : formattedTime}
 *   </div>
 * );
 * ```
 */
export function useLotteryCountdown({
  endTime,
  interval = 1000,
  enabled = true,
}: UseLotteryCountdownOptions): UseLotteryCountdownReturn {
  // Convert endTime to bigint for the helper function
  const endTimeBigInt = endTime !== undefined ? BigInt(endTime) : undefined;

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    endTimeBigInt ? getTimeRemaining(endTimeBigInt) : INITIAL_TIME
  );

  // Update time remaining
  const updateTime = useCallback(() => {
    if (endTimeBigInt) {
      setTimeRemaining(getTimeRemaining(endTimeBigInt));
    }
  }, [endTimeBigInt]);

  // Set up interval for countdown
  useEffect(() => {
    if (!enabled || !endTimeBigInt) {
      return;
    }

    // Initial update
    updateTime();

    // Set up interval
    const intervalId = setInterval(updateTime, interval);

    return () => clearInterval(intervalId);
  }, [endTimeBigInt, interval, enabled, updateTime]);

  // Reset when endTime changes
  useEffect(() => {
    if (endTimeBigInt) {
      setTimeRemaining(getTimeRemaining(endTimeBigInt));
    } else {
      setTimeRemaining(INITIAL_TIME);
    }
  }, [endTimeBigInt]);

  const isExpired = timeRemaining.total <= 0;
  const formattedTime = formatTimeRemaining(timeRemaining);

  return {
    timeRemaining,
    isExpired,
    formattedTime,
  };
}
