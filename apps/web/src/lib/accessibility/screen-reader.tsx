/**
 * @fileoverview Screen Reader Utilities
 * @module lib/accessibility/screen-reader
 *
 * Utilities for improving screen reader experience through
 * ARIA live regions, announcements, and formatting.
 */

"use client";

import { useEffect, useRef, useCallback } from "react";

// ============================================================================
// ARIA LIVE ANNOUNCEMENTS
// ============================================================================

let liveRegion: HTMLDivElement | null = null;

/**
 * Get or create the global ARIA live region
 */
function getLiveRegion(): HTMLDivElement {
  if (!liveRegion) {
    liveRegion = document.createElement("div");
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.className = "sr-only";
    document.body.appendChild(liveRegion);
  }
  return liveRegion;
}

/**
 * Announce a message to screen readers via ARIA live region
 *
 * @param message - Message to announce
 * @param priority - Announcement priority (polite or assertive)
 * @param clearDelay - Delay in ms before clearing the message (default: 1000ms)
 *
 * @example
 * // Polite announcement
 * announce("Item added to cart");
 *
 * // Assertive announcement for errors
 * announce("Error: Transaction failed", "assertive");
 */
export function announce(
  message: string,
  priority: "polite" | "assertive" = "polite",
  clearDelay = 1000
): void {
  const region = getLiveRegion();

  // Update the aria-live attribute
  region.setAttribute("aria-live", priority);

  // Clear any existing message first (helps with repeated announcements)
  region.textContent = "";

  // Use setTimeout to ensure screen readers detect the change
  setTimeout(() => {
    region.textContent = message;

    // Clear the message after delay
    if (clearDelay > 0) {
      setTimeout(() => {
        region.textContent = "";
      }, clearDelay);
    }
  }, 100);
}

/**
 * Announce a transaction status to screen readers
 *
 * @param status - Transaction status
 * @param details - Additional details (optional)
 *
 * @example
 * announceTransaction("pending", "Deposit transaction submitted");
 * announceTransaction("success", "50 mUSD deposited successfully");
 */
export function announceTransaction(
  status: "idle" | "pending" | "confirming" | "success" | "error",
  details?: string
): void {
  const messages = {
    idle: "Ready to submit transaction",
    pending: "Transaction pending, please wait",
    confirming: "Transaction confirming on blockchain",
    success: "Transaction completed successfully",
    error: "Transaction failed",
  };

  const message = details ? `${messages[status]}. ${details}` : messages[status];
  const priority = status === "error" ? "assertive" : "polite";

  announce(message, priority);
}

/**
 * Announce a loading state to screen readers
 *
 * @param isLoading - Whether content is loading
 * @param loadingMessage - Custom loading message
 * @param completeMessage - Custom completion message
 *
 * @example
 * announceLoading(true, "Loading pool data");
 * announceLoading(false, undefined, "Pool data loaded");
 */
export function announceLoading(
  isLoading: boolean,
  loadingMessage = "Loading",
  completeMessage = "Loading complete"
): void {
  announce(isLoading ? loadingMessage : completeMessage, "polite");
}

// ============================================================================
// REACT HOOK FOR ANNOUNCEMENTS
// ============================================================================

/**
 * Hook for making announcements to screen readers
 *
 * @returns Announce function with memoized reference
 *
 * @example
 * function MyComponent() {
 *   const announce = useAnnouncer();
 *
 *   const handleSubmit = () => {
 *     // ... submit logic
 *     announce("Form submitted successfully");
 *   };
 *
 *   return <button onClick={handleSubmit}>Submit</button>;
 * }
 */
export function useAnnouncer() {
  return useCallback(
    (message: string, priority: "polite" | "assertive" = "polite", clearDelay = 1000) => {
      announce(message, priority, clearDelay);
    },
    []
  );
}

/**
 * Hook to announce changes to a value
 *
 * @param value - Value to watch for changes
 * @param formatter - Function to format the announcement message
 *
 * @example
 * const [balance, setBalance] = useState(100);
 * useAnnounceChange(
 *   balance,
 *   (value) => `Balance updated to ${value} mUSD`
 * );
 */
export function useAnnounceChange<T>(
  value: T,
  formatter: (value: T) => string,
  enabled = true
): void {
  const announce = useAnnouncer();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip announcement on initial render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (enabled) {
      announce(formatter(value));
    }
  }, [value, formatter, announce, enabled]);
}

// ============================================================================
// SCREEN READER ONLY COMPONENT
// ============================================================================

/**
 * Component that renders content only for screen readers
 *
 * @example
 * <ScreenReaderOnly>
 *   Additional context for screen reader users
 * </ScreenReaderOnly>
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

/**
 * Component for visually hidden but accessible descriptions
 *
 * @example
 * <button>
 *   <TrashIcon />
 *   <VisuallyHidden>Delete item</VisuallyHidden>
 * </button>
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// ============================================================================
// FORMAT FOR SCREEN READER
// ============================================================================

/**
 * Format a number for screen reader announcement
 *
 * @param value - Number to format
 * @param options - Formatting options
 * @returns Screen reader friendly text
 *
 * @example
 * formatNumber(1234.56); // "1,234.56"
 * formatNumber(0.000123, { precision: 6 }); // "0.000123"
 */
export function formatNumber(
  value: number,
  options: {
    precision?: number;
    locale?: string;
  } = {}
): string {
  const { precision, locale = "en-US" } = options;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  return formatter.format(value);
}

/**
 * Format currency for screen reader announcement
 *
 * @param amount - Amount to format
 * @param currency - Currency code
 * @param locale - Locale for formatting
 * @returns Screen reader friendly currency text
 *
 * @example
 * formatCurrency(1234.56, "USD"); // "1,234.56 US dollars"
 * formatCurrency(0.5, "BTC"); // "0.5 Bitcoin"
 */
export function formatCurrency(amount: number, currency: string, locale = "en-US"): string {
  // Special handling for crypto currencies
  if (currency === "BTC") {
    return `${formatNumber(amount, { precision: 8 })} Bitcoin`;
  }

  if (currency === "mUSD" || currency === "MUSD") {
    return `${formatNumber(amount, { precision: 2 })} Mezo USD`;
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  });

  return formatter.format(amount);
}

/**
 * Format percentage for screen reader announcement
 *
 * @param value - Percentage value (0-100)
 * @param precision - Number of decimal places
 * @returns Screen reader friendly percentage text
 *
 * @example
 * formatPercentage(12.5); // "12.5 percent"
 * formatPercentage(99.999, 2); // "100 percent"
 */
export function formatPercentage(value: number, precision = 2): string {
  return `${value.toFixed(precision)} percent`;
}

/**
 * Format a date for screen reader announcement
 *
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Screen reader friendly date text
 *
 * @example
 * formatDate(new Date()); // "January 1, 2025"
 * formatDate(new Date(), { includeTime: true }); // "January 1, 2025 at 3:30 PM"
 */
export function formatDate(
  date: Date,
  options: {
    includeTime?: boolean;
    locale?: string;
  } = {}
): string {
  const { includeTime = false, locale = "en-US" } = options;

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const dateStr = dateFormatter.format(date);

  if (includeTime) {
    const timeStr = timeFormatter.format(date);
    return `${dateStr} at ${timeStr}`;
  }

  return dateStr;
}

/**
 * Format a time duration for screen reader announcement
 *
 * @param seconds - Duration in seconds
 * @returns Screen reader friendly duration text
 *
 * @example
 * formatDuration(90); // "1 minute 30 seconds"
 * formatDuration(3600); // "1 hour"
 * formatDuration(86400); // "1 day"
 */
export function formatDuration(seconds: number): string {
  const units = [
    { name: "day", seconds: 86400 },
    { name: "hour", seconds: 3600 },
    { name: "minute", seconds: 60 },
    { name: "second", seconds: 1 },
  ];

  const parts: string[] = [];

  for (const unit of units) {
    const count = Math.floor(seconds / unit.seconds);
    if (count > 0) {
      parts.push(`${count} ${unit.name}${count !== 1 ? "s" : ""}`);
      seconds -= count * unit.seconds;
    }
  }

  if (parts.length === 0) {
    return "0 seconds";
  }

  if (parts.length === 1) {
    return parts[0];
  }

  // Join with "and" for last item
  const lastPart = parts.pop();
  return `${parts.join(", ")} and ${lastPart}`;
}

/**
 * Format transaction hash for screen reader announcement
 *
 * @param hash - Transaction hash
 * @returns Screen reader friendly hash text
 *
 * @example
 * formatTxHash("0x1234...5678"); // "Transaction hash 0x1234 through 5678"
 */
export function formatTxHash(hash: string): string {
  if (!hash) {
    return "No transaction hash";
  }

  // Truncate long hashes for better screen reader experience
  if (hash.length > 20) {
    const start = hash.slice(0, 6);
    const end = hash.slice(-4);
    return `Transaction hash ${start} through ${end}`;
  }

  return `Transaction hash ${hash}`;
}

/**
 * Format wallet address for screen reader announcement
 *
 * @param address - Wallet address
 * @returns Screen reader friendly address text
 *
 * @example
 * formatAddress("0x1234...5678"); // "Wallet address 0x1234 through 5678"
 */
export function formatAddress(address: string): string {
  if (!address) {
    return "No wallet address";
  }

  // Truncate for better screen reader experience
  if (address.length > 20) {
    const start = address.slice(0, 6);
    const end = address.slice(-4);
    return `Wallet address ${start} through ${end}`;
  }

  return `Wallet address ${address}`;
}

/**
 * Format pool status for screen reader announcement
 *
 * @param status - Pool status
 * @returns Screen reader friendly status text
 *
 * @example
 * formatPoolStatus("OPEN"); // "Pool is open for participation"
 */
export function formatPoolStatus(status: string): string {
  const statusMap: Record<string, string> = {
    OPEN: "Pool is open for participation",
    ACTIVE: "Pool is active",
    CLOSED: "Pool is closed",
    COMPLETED: "Pool has completed",
    CANCELLED: "Pool was cancelled",
  };

  return statusMap[status.toUpperCase()] || `Pool status: ${status}`;
}

/**
 * Format health score for screen reader announcement
 *
 * @param score - Health score (0-100)
 * @returns Screen reader friendly health score text
 *
 * @example
 * formatHealthScore(85); // "Health score 85 percent, Good"
 * formatHealthScore(30); // "Health score 30 percent, Critical. Action recommended"
 */
export function formatHealthScore(score: number): string {
  let status: string;
  let action = "";

  if (score >= 80) {
    status = "Excellent";
  } else if (score >= 60) {
    status = "Good";
  } else if (score >= 40) {
    status = "Fair";
    action = " Monitor closely";
  } else if (score >= 20) {
    status = "Poor";
    action = " Action recommended";
  } else {
    status = "Critical";
    action = " Immediate action required";
  }

  return `Health score ${score} percent, ${status}.${action}`;
}
