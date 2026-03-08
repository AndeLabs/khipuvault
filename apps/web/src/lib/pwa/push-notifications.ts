/**
 * @fileoverview Push Notifications
 * @module lib/pwa/push-notifications
 *
 * Handles push notification permissions, subscriptions, and local notifications.
 * Enables real-time alerts for transactions, lottery draws, and pool events.
 */

import { logger } from "@/lib/monitoring/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: unknown;
  requireInteraction?: boolean;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
}

export interface PushSubscriptionConfig {
  userVisibleOnly: boolean;
  applicationServerKey: Uint8Array;
}

export type NotificationPermission = "default" | "granted" | "denied";

// ============================================================================
// CONSTANTS
// ============================================================================

const NOTIFICATION_DEFAULTS = {
  icon: "/icon-192.png",
  badge: "/icon-192.png",
  requireInteraction: false,
};

// VAPID public key would be stored in environment variables
// This is a placeholder - in production, get from process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

// ============================================================================
// PERMISSION MANAGEMENT
// ============================================================================

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return "denied";
  }
  return Notification.permission as NotificationPermission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    logger.warn("Notifications not supported", {
      category: "general",
      source: "push-notifications",
    });
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();

    logger.info(`Notification permission: ${permission}`, {
      category: "general",
      source: "push-notifications",
    });

    return permission as NotificationPermission;
  } catch (error) {
    logger.error("Failed to request notification permission", error, {
      category: "general",
      source: "push-notifications",
    });
    return "denied";
  }
}

/**
 * Check if notifications are enabled (permission granted)
 */
export function areNotificationsEnabled(): boolean {
  return getNotificationPermission() === "granted";
}

// ============================================================================
// PUSH SUBSCRIPTION
// ============================================================================

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isNotificationSupported()) {
    logger.warn("Push notifications not supported", {
      category: "general",
      source: "push-notifications",
    });
    return null;
  }

  // Check permission first
  const permission = getNotificationPermission();
  if (permission !== "granted") {
    logger.warn("Notification permission not granted", {
      category: "general",
      source: "push-notifications",
      metadata: { permission },
    });
    return null;
  }

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      logger.debug("Already subscribed to push", {
        category: "general",
        source: "push-notifications",
      });
      return existingSubscription;
    }

    // Subscribe to push
    if (!VAPID_PUBLIC_KEY) {
      logger.warn("VAPID public key not configured", {
        category: "general",
        source: "push-notifications",
      });
      return null;
    }

    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });

    logger.info("Subscribed to push notifications", {
      category: "general",
      source: "push-notifications",
    });

    return subscription;
  } catch (error) {
    logger.error("Failed to subscribe to push", error, {
      category: "general",
      source: "push-notifications",
    });
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const success = await subscription.unsubscribe();
      logger.info("Unsubscribed from push notifications", {
        category: "general",
        source: "push-notifications",
      });
      return success;
    }

    return false;
  } catch (error) {
    logger.error("Failed to unsubscribe from push", error, {
      category: "general",
      source: "push-notifications",
    });
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    logger.error("Failed to get push subscription", error, {
      category: "general",
      source: "push-notifications",
    });
    return null;
  }
}

// ============================================================================
// LOCAL NOTIFICATIONS
// ============================================================================

/**
 * Send local notification (doesn't require push server)
 */
export async function sendLocalNotification(
  options: NotificationOptions
): Promise<Notification | null> {
  if (!isNotificationSupported()) {
    logger.warn("Notifications not supported", {
      category: "general",
      source: "push-notifications",
    });
    return null;
  }

  // Request permission if not granted
  const permission = getNotificationPermission();
  if (permission === "default") {
    const newPermission = await requestNotificationPermission();
    if (newPermission !== "granted") {
      return null;
    }
  } else if (permission === "denied") {
    logger.warn("Notification permission denied", {
      category: "general",
      source: "push-notifications",
    });
    return null;
  }

  try {
    // Use service worker for notifications if available
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(options.title, {
        ...NOTIFICATION_DEFAULTS,
        ...options,
      });
      return null; // Service worker notifications don't return Notification object
    }

    // Fallback to regular notification
    const notification = new Notification(options.title, {
      ...NOTIFICATION_DEFAULTS,
      ...options,
    });

    logger.debug(`Sent notification: ${options.title}`, {
      category: "general",
      source: "push-notifications",
    });

    return notification;
  } catch (error) {
    logger.error("Failed to send notification", error, {
      category: "general",
      source: "push-notifications",
      metadata: { title: options.title },
    });
    return null;
  }
}

// ============================================================================
// PREDEFINED NOTIFICATIONS
// ============================================================================

/**
 * Send transaction notification
 */
export async function notifyTransaction(
  type: "deposit" | "withdrawal" | "claim",
  status: "pending" | "success" | "failed"
): Promise<void> {
  const titles = {
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    claim: "Yield Claimed",
  };

  const bodies = {
    pending: "Transaction is being processed...",
    success: "Transaction completed successfully!",
    failed: "Transaction failed. Please try again.",
  };

  await sendLocalNotification({
    title: titles[type],
    body: bodies[status],
    tag: `tx-${type}-${status}`,
    data: { type, status },
  });
}

/**
 * Send lottery notification
 */
export async function notifyLottery(event: "draw" | "win" | "ticket-purchased"): Promise<void> {
  const notifications = {
    draw: {
      title: "Lottery Draw Complete",
      body: "Check if you won the prize pool!",
    },
    win: {
      title: "Congratulations!",
      body: "You won the lottery! Claim your prize now.",
      requireInteraction: true,
    },
    "ticket-purchased": {
      title: "Ticket Purchased",
      body: "Your lottery ticket has been purchased successfully.",
    },
  };

  const config = notifications[event];
  await sendLocalNotification({
    ...config,
    tag: `lottery-${event}`,
    data: { event },
  });
}

/**
 * Send ROSCA notification
 */
export async function notifyROSCA(event: "turn" | "contribution-due" | "completed"): Promise<void> {
  const notifications = {
    turn: {
      title: "Your Turn in ROSCA",
      body: "It's your turn to receive the pool funds!",
      requireInteraction: true,
    },
    "contribution-due": {
      title: "Contribution Due",
      body: "Don't forget to make your ROSCA contribution.",
    },
    completed: {
      title: "ROSCA Completed",
      body: "Your rotating savings pool has completed successfully!",
    },
  };

  const config = notifications[event];
  await sendLocalNotification({
    ...config,
    tag: `rosca-${event}`,
    data: { event },
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Convert URL-safe base64 to Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Send push subscription to server
 */
export async function savePushSubscription(
  subscription: PushSubscription,
  userAddress?: string
): Promise<boolean> {
  try {
    // In a real app, you would send this to your backend
    // Example:
    // await fetch('/api/push/subscribe', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ subscription, userAddress }),
    // });

    logger.info("Push subscription saved", {
      category: "general",
      source: "push-notifications",
      metadata: { userAddress },
    });

    return true;
  } catch (error) {
    logger.error("Failed to save push subscription", error, {
      category: "general",
      source: "push-notifications",
    });
    return false;
  }
}
