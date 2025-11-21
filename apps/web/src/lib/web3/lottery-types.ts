/**
 * @fileoverview Type Definitions for SimpleLotteryPool
 * @module lib/web3/lottery-types
 *
 * Type definitions matching the SimpleLotteryPool contract
 */

/**
 * Round Status Enum (matches contract)
 */
export enum RoundStatus {
  OPEN = 0,
  DRAWING = 1,
  COMPLETED = 2,
}

/**
 * Round Information from Contract
 */
export interface RoundInfo {
  roundId: bigint
  ticketPrice: bigint
  maxTickets: bigint
  totalTicketsSold: bigint
  totalPrize: bigint
  startTime: bigint
  endTime: bigint
  winner: `0x${string}`
  status: RoundStatus
}

/**
 * User's Lottery Participation
 */
export interface UserLotteryInfo {
  ticketCount: bigint
  investment: bigint
  probability: bigint // in basis points (10000 = 100%)
  hasClaimed: boolean
  isWinner: boolean
}

/**
 * Helper functions for status
 */
export function getRoundStatusName(status: RoundStatus): string {
  switch (status) {
    case RoundStatus.OPEN:
      return 'Accepting Tickets'
    case RoundStatus.DRAWING:
      return 'Drawing Winner'
    case RoundStatus.COMPLETED:
      return 'Completed'
    default:
      return 'Unknown'
  }
}

export function getRoundStatusColor(status: RoundStatus): 'success' | 'warning' | 'default' {
  switch (status) {
    case RoundStatus.OPEN:
      return 'success'
    case RoundStatus.DRAWING:
      return 'warning'
    case RoundStatus.COMPLETED:
      return 'default'
    default:
      return 'default'
  }
}

/**
 * Calculate time remaining
 */
export function getTimeRemaining(endTime: bigint): {
  total: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
} {
  const now = Math.floor(Date.now() / 1000)
  const end = Number(endTime)
  const total = end - now

  if (total <= 0) {
    return {
      total: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    }
  }

  return {
    total,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    isExpired: false,
  }
}

/**
 * Format countdown display
 */
export function formatCountdown(endTime: bigint): string {
  const time = getTimeRemaining(endTime)

  if (time.isExpired) {
    return 'Ended'
  }

  if (time.days > 0) {
    return `${time.days}d ${time.hours}h ${time.minutes}m`
  }

  if (time.hours > 0) {
    return `${time.hours}h ${time.minutes}m ${time.seconds}s`
  }

  if (time.minutes > 0) {
    return `${time.minutes}m ${time.seconds}s`
  }

  return `${time.seconds}s`
}

/**
 * Format probability as percentage
 */
export function formatProbability(basisPoints: bigint): string {
  const percentage = Number(basisPoints) / 100
  return `${percentage.toFixed(2)}%`
}

/**
 * Calculate expected value
 */
export function calculateExpectedValue(
  probability: bigint,
  prizeAmount: bigint,
  ticketCost: bigint
): bigint {
  // EV = (probability * prize) - cost
  // probability is in basis points (10000 = 100% = 1.0)
  const expectedReturn = (probability * prizeAmount) / BigInt(10000)
  return expectedReturn - ticketCost
}
