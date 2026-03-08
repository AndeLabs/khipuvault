/**
 * @fileoverview PWA Module
 * @module lib/pwa
 *
 * Progressive Web App utilities for offline support, push notifications,
 * and app installation. Complements next-pwa configuration.
 */

// ============================================================================
// SERVICE WORKER CONFIG
// ============================================================================

export {
  CACHE_STRATEGIES,
  CACHEABLE_ROUTES,
  RUNTIME_CACHING,
  CACHE_NAMES,
  shouldCache,
  getCacheConfig,
  clearAllCaches,
  clearCache,
  getCacheSize,
  type CacheStrategy,
  type CacheConfig,
  type RoutePattern,
} from "./service-worker-config";

// ============================================================================
// OFFLINE STORAGE
// ============================================================================

export {
  openDatabase,
  saveOfflineData,
  getOfflineData,
  getAllOfflineData,
  deleteOfflineData,
  clearOfflineData,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  syncWhenOnline,
  setupAutoSync,
  type OfflineData,
  type SyncQueueItem,
} from "./offline-storage";

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

export {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  areNotificationsEnabled,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
  sendLocalNotification,
  notifyTransaction,
  notifyLottery,
  notifyROSCA,
  savePushSubscription,
  type NotificationOptions,
  type NotificationPermission,
  type PushSubscriptionConfig,
} from "./push-notifications";

// ============================================================================
// INSTALL PROMPT
// ============================================================================

export {
  useInstallPrompt,
  isStandalone,
  isInstallable,
  getIOSInstructions,
  checkPWASupport,
  trackInstallation,
  getInstallDate,
  type InstallPromptState,
} from "./install-prompt";

// ============================================================================
// RE-EXPORTS FOR INTERNAL USE
// ============================================================================

import {
  checkPWASupport as _checkPWASupport,
  isStandalone as _isStandalone,
  isInstallable as _isInstallable,
  trackInstallation as _trackInstallation,
} from "./install-prompt";
import { setupAutoSync as _setupAutoSync, type SyncQueueItem } from "./offline-storage";
import {
  areNotificationsEnabled as _areNotificationsEnabled,
  requestNotificationPermission as _requestNotificationPermission,
} from "./push-notifications";

// ============================================================================
// PWA STATUS
// ============================================================================

/**
 * Get comprehensive PWA status
 */
export function getPWAStatus() {
  const support = _checkPWASupport();

  return {
    isSupported: support.serviceWorker && support.manifest,
    isStandalone: _isStandalone(),
    isInstallable: _isInstallable(),
    notificationsEnabled: _areNotificationsEnabled(),
    features: support,
  };
}

/**
 * Initialize PWA features
 * Call this in your app's entry point
 */
export async function initializePWA(options?: {
  enableAutoSync?: boolean;
  requestNotifications?: boolean;
  onSync?: (item: SyncQueueItem) => Promise<boolean>;
}): Promise<void> {
  const { enableAutoSync = true, requestNotifications = false, onSync } = options || {};

  // Setup auto sync for offline data
  if (enableAutoSync) {
    _setupAutoSync(onSync);
  }

  // Request notification permission if enabled
  if (requestNotifications && _areNotificationsEnabled() === false) {
    await _requestNotificationPermission();
  }

  // Track installation if in standalone mode
  if (_isStandalone()) {
    _trackInstallation();
  }
}
