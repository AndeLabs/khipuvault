import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBTC(value: bigint | undefined): string {
  if (!value) return "0.000000";
  return (Number(value) / 1e18).toFixed(6);
}
