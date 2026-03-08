/**
 * @fileoverview Lottery Pool Helper Functions
 * @module hooks/web3/lottery/lottery-helpers
 *
 * Utility functions for formatting and displaying lottery data
 */

import { formatEther, zeroAddress } from "viem";

import { MEZO_TESTNET_ADDRESSES } from "@/lib/web3/contracts-v3";

/**
 * Helper: Format BTC amount
 */
export function formatBTC(amount: bigint): string {
  return formatEther(amount);
}

/**
 * Helper: Get lottery type text
 */
export function getLotteryTypeText(type: number): string {
  switch (type) {
    case 0:
      return "Semanal";
    case 1:
      return "Mensual";
    case 2:
      return "Personalizado";
    default:
      return "Desconocido";
  }
}

/**
 * Helper: Get status text
 */
export function getStatusText(status: number): string {
  switch (status) {
    case 0:
      return "Abierto";
    case 1:
      return "Sorteando";
    case 2:
      return "Completado";
    case 3:
      return "Cancelado";
    default:
      return "Desconocido";
  }
}

/**
 * Helper: Get status color
 */
export function getStatusColor(status: number): string {
  switch (status) {
    case 0:
      return "green";
    case 1:
      return "yellow";
    case 2:
      return "blue";
    case 3:
      return "red";
    default:
      return "gray";
  }
}

/**
 * Helper: Calculate time remaining
 */
export function getTimeRemaining(endTime: bigint): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const now = Math.floor(Date.now() / 1000);
  const end = Number(endTime);
  const total = Math.max(0, end - now);

  return {
    total,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Helper: Format probability as percentage
 */
export function formatProbability(basisPoints: bigint): string {
  // Basis points: 10000 = 100%
  const percentage = (Number(basisPoints) / 100).toFixed(2);
  return `${percentage}%`;
}

/**
 * Check if lottery pool is deployed
 */
export function isLotteryPoolDeployed(): boolean {
  return MEZO_TESTNET_ADDRESSES.lotteryPool !== zeroAddress;
}

/**
 * Helper: Format USD amount
 */
export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
}

/**
 * Helper: Format Ethereum address
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Helper: Get round status text (SimpleLotteryPool enum)
 */
export function getRoundStatus(status: number): string {
  switch (status) {
    case 0:
      return "Activo"; // OPEN
    case 1:
      return "Completado"; // COMPLETED
    case 2:
      return "Cancelado"; // CANCELLED
    default:
      return "Desconocido";
  }
}
