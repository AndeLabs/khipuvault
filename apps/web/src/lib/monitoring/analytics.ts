/**
 * @fileoverview Analytics Event Tracking
 * @module lib/monitoring/analytics
 *
 * Lightweight analytics for tracking user behavior:
 * - Wallet connections/disconnections
 * - Transaction attempts (deposit, withdraw, etc.)
 * - Navigation patterns
 * - Error occurrences
 * - Feature usage
 *
 * Privacy-first: No PII collected, wallet addresses are hashed
 */

import type { AnalyticsEvent } from "./types";

// Event queue for batching
const eventQueue: AnalyticsEvent[] = [];
const MAX_QUEUE_SIZE = 50;
const FLUSH_INTERVAL = 30000; // 30 seconds

// User session info (no PII)
let sessionId: string | null = null;
let userHash: string | null = null;

/**
 * Standard analytics event names
 */
export const AnalyticsEvents = {
  // Wallet events
  WALLET_CONNECTED: "wallet_connected",
  WALLET_DISCONNECTED: "wallet_disconnected",
  WALLET_SWITCHED: "wallet_switched",
  NETWORK_SWITCHED: "network_switched",

  // Transaction events
  DEPOSIT_STARTED: "deposit_started",
  DEPOSIT_COMPLETED: "deposit_completed",
  DEPOSIT_FAILED: "deposit_failed",
  WITHDRAW_STARTED: "withdraw_started",
  WITHDRAW_COMPLETED: "withdraw_completed",
  WITHDRAW_FAILED: "withdraw_failed",
  APPROVAL_STARTED: "approval_started",
  APPROVAL_COMPLETED: "approval_completed",

  // Pool interactions
  POOL_VIEWED: "pool_viewed",
  POOL_JOINED: "pool_joined",
  POOL_LEFT: "pool_left",
  LOTTERY_TICKET_PURCHASED: "lottery_ticket_purchased",
  YIELD_CLAIMED: "yield_claimed",

  // Navigation
  PAGE_VIEW: "page_view",
  MODAL_OPENED: "modal_opened",
  MODAL_CLOSED: "modal_closed",
  TAB_CHANGED: "tab_changed",

  // Errors
  ERROR_BOUNDARY_TRIGGERED: "error_boundary_triggered",
  TRANSACTION_ERROR: "transaction_error",
  NETWORK_ERROR: "network_error",

  // Features
  FEATURE_USED: "feature_used",
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_COMPLETED: "onboarding_completed",
  ONBOARDING_SKIPPED: "onboarding_skipped",
} as const;

/**
 * Generate a simple session ID (not for security purposes)
 */
function generateSessionId(): string {
  // Use crypto.randomUUID if available, fallback to timestamp-based
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${performance.now().toString(36).replace(".", "")}`;
}

/**
 * Hash a wallet address for privacy
 */
async function hashAddress(address: string): Promise<string> {
  if (!crypto?.subtle) {
    // Fallback for environments without Web Crypto
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(address.toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Initialize analytics session
 */
export function initAnalytics(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionId = generateSessionId();

  // Set up periodic flush
  setInterval(() => {
    void flushEvents();
  }, FLUSH_INTERVAL);

  // Flush on page unload
  window.addEventListener("beforeunload", () => {
    void flushEvents();
  });

  // Track page visibility changes
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void flushEvents();
    }
  });

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[Analytics] Session initialized:", sessionId);
  }
}

/**
 * Set user context (call when wallet connects)
 */
export async function setAnalyticsUser(address: string | null): Promise<void> {
  if (address) {
    userHash = await hashAddress(address);
  } else {
    userHash = null;
  }
}

/**
 * Track an analytics event
 */
export function trackEvent(
  name: string,
  category: AnalyticsEvent["category"],
  properties?: Record<string, string | number | boolean>
): void {
  const event: AnalyticsEvent = {
    name,
    category,
    properties: {
      ...properties,
      sessionId: sessionId ?? "unknown",
      userHash: userHash ?? "anonymous",
      page: typeof window !== "undefined" ? window.location.pathname : "/",
    },
    timestamp: Date.now(),
  };

  // Log in development
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[Analytics]", name, properties);
  }

  // Add to queue
  eventQueue.push(event);

  // Flush if queue is full
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    void flushEvents();
  }
}

/**
 * Flush queued events to analytics endpoint
 */
async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) {
    return;
  }

  const events = [...eventQueue];
  eventQueue.length = 0;

  const analyticsEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  if (!analyticsEndpoint) {
    // No endpoint configured - events logged in dev, discarded in prod
    return;
  }

  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob(
        [
          JSON.stringify({
            type: "events",
            events,
            timestamp: Date.now(),
          }),
        ],
        { type: "application/json" }
      );
      navigator.sendBeacon(analyticsEndpoint, blob);
    } else {
      await fetch(analyticsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "events",
          events,
          timestamp: Date.now(),
        }),
        keepalive: true,
      });
    }
  } catch {
    // Silently fail - don't break the app for analytics
  }
}

/**
 * Analytics API
 */
export const analytics = {
  init: initAnalytics,
  setUser: setAnalyticsUser,
  track: trackEvent,

  // Convenience methods
  trackPageView: (page: string, referrer?: string) => {
    trackEvent(AnalyticsEvents.PAGE_VIEW, "navigation", { page, referrer: referrer ?? "" });
  },

  trackWalletConnected: (walletType: string) => {
    trackEvent(AnalyticsEvents.WALLET_CONNECTED, "wallet", { walletType });
  },

  trackWalletDisconnected: () => {
    trackEvent(AnalyticsEvents.WALLET_DISCONNECTED, "wallet");
  },

  trackTransaction: (
    type: "deposit" | "withdraw" | "approval" | "claim",
    status: "started" | "completed" | "failed",
    amount?: string,
    poolType?: string
  ) => {
    const eventName = `${type}_${status}`;
    trackEvent(eventName, "transaction", {
      amount: amount ?? "0",
      poolType: poolType ?? "unknown",
    });
  },

  trackError: (errorType: string, message: string, component?: string) => {
    trackEvent(AnalyticsEvents.TRANSACTION_ERROR, "error", {
      errorType,
      message: message.slice(0, 200), // Truncate long messages
      component: component ?? "unknown",
    });
  },

  trackFeature: (featureName: string, action: string) => {
    trackEvent(AnalyticsEvents.FEATURE_USED, "user", { feature: featureName, action });
  },
};
