/**
 * @fileoverview Offline Storage with IndexedDB
 * @module lib/pwa/offline-storage
 *
 * Provides persistent offline storage for critical data using IndexedDB.
 * Enables the app to function offline and sync when connection is restored.
 */

import { logger } from "@/lib/monitoring/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface OfflineData {
  key: string;
  value: unknown;
  timestamp: number;
  synced: boolean;
}

export interface SyncQueueItem {
  id: string;
  type: "transaction" | "pool-action" | "lottery-ticket";
  data: unknown;
  timestamp: number;
  retries: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DB_NAME = "khipuvault-offline";
const DB_VERSION = 1;
const STORE_NAME = "offline-data";
const SYNC_QUEUE_STORE = "sync-queue";

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

/**
 * Open or create IndexedDB database
 */
export async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB not supported"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      logger.error("Failed to open IndexedDB", request.error, {
        category: "general",
        source: "offline-storage",
      });
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create offline data store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("synced", "synced", { unique: false });
      }

      // Create sync queue store
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: "id" });
        syncStore.createIndex("timestamp", "timestamp", { unique: false });
        syncStore.createIndex("type", "type", { unique: false });
      }
    };
  });
}

// ============================================================================
// DATA OPERATIONS
// ============================================================================

/**
 * Save data to offline storage
 */
export async function saveOfflineData(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const data: OfflineData = {
      key,
      value,
      timestamp: Date.now(),
      synced: false,
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();

    logger.debug(`Saved offline data: ${key}`, {
      category: "general",
      source: "offline-storage",
    });
  } catch (error) {
    logger.error("Failed to save offline data", error, {
      category: "general",
      source: "offline-storage",
      metadata: { key },
    });
    throw error;
  }
}

/**
 * Get data from offline storage
 */
export async function getOfflineData<T = unknown>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const data = await new Promise<OfflineData | undefined>((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();

    return data ? (data.value as T) : null;
  } catch (error) {
    logger.error("Failed to get offline data", error, {
      category: "general",
      source: "offline-storage",
      metadata: { key },
    });
    return null;
  }
}

/**
 * Get all offline data
 */
export async function getAllOfflineData(): Promise<OfflineData[]> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const data = await new Promise<OfflineData[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return data;
  } catch (error) {
    logger.error("Failed to get all offline data", error, {
      category: "general",
      source: "offline-storage",
    });
    return [];
  }
}

/**
 * Delete specific offline data
 */
export async function deleteOfflineData(key: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();

    logger.debug(`Deleted offline data: ${key}`, {
      category: "general",
      source: "offline-storage",
    });
  } catch (error) {
    logger.error("Failed to delete offline data", error, {
      category: "general",
      source: "offline-storage",
      metadata: { key },
    });
    throw error;
  }
}

/**
 * Clear all offline data
 */
export async function clearOfflineData(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME, SYNC_QUEUE_STORE], "readwrite");

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(STORE_NAME).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(SYNC_QUEUE_STORE).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
    ]);

    db.close();

    logger.info("Cleared all offline data", {
      category: "general",
      source: "offline-storage",
    });
  } catch (error) {
    logger.error("Failed to clear offline data", error, {
      category: "general",
      source: "offline-storage",
    });
    throw error;
  }
}

// ============================================================================
// SYNC QUEUE OPERATIONS
// ============================================================================

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(item: Omit<SyncQueueItem, "id">): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([SYNC_QUEUE_STORE], "readwrite");
    const store = transaction.objectStore(SYNC_QUEUE_STORE);

    const queueItem: SyncQueueItem = {
      ...item,
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? `${item.type}-${crypto.randomUUID()}`
          : `${item.type}-${Date.now()}-${performance.now().toString(36).replace(".", "")}`,
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.add(queueItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();

    logger.debug(`Added to sync queue: ${queueItem.id}`, {
      category: "general",
      source: "offline-storage",
      metadata: { type: item.type },
    });
  } catch (error) {
    logger.error("Failed to add to sync queue", error, {
      category: "general",
      source: "offline-storage",
    });
    throw error;
  }
}

/**
 * Get all items from sync queue
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([SYNC_QUEUE_STORE], "readonly");
    const store = transaction.objectStore(SYNC_QUEUE_STORE);

    const items = await new Promise<SyncQueueItem[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return items;
  } catch (error) {
    logger.error("Failed to get sync queue", error, {
      category: "general",
      source: "offline-storage",
    });
    return [];
  }
}

/**
 * Remove item from sync queue
 */
export async function removeFromSyncQueue(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([SYNC_QUEUE_STORE], "readwrite");
    const store = transaction.objectStore(SYNC_QUEUE_STORE);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();

    logger.debug(`Removed from sync queue: ${id}`, {
      category: "general",
      source: "offline-storage",
    });
  } catch (error) {
    logger.error("Failed to remove from sync queue", error, {
      category: "general",
      source: "offline-storage",
      metadata: { id },
    });
  }
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Sync offline data when connection is restored
 */
export async function syncWhenOnline(
  onSync?: (item: SyncQueueItem) => Promise<boolean>
): Promise<void> {
  if (!navigator.onLine) {
    logger.debug("Device is offline, skipping sync", {
      category: "general",
      source: "offline-storage",
    });
    return;
  }

  try {
    const queue = await getSyncQueue();

    if (queue.length === 0) {
      logger.debug("Sync queue is empty", {
        category: "general",
        source: "offline-storage",
      });
      return;
    }

    logger.info(`Syncing ${queue.length} items...`, {
      category: "general",
      source: "offline-storage",
    });

    for (const item of queue) {
      try {
        // If custom sync handler provided, use it
        if (onSync) {
          const success = await onSync(item);
          if (success) {
            await removeFromSyncQueue(item.id);
          }
        } else {
          // Default: just remove from queue
          await removeFromSyncQueue(item.id);
        }
      } catch (error) {
        logger.error(`Failed to sync item: ${item.id}`, error, {
          category: "general",
          source: "offline-storage",
        });
        // Keep item in queue for retry
      }
    }

    logger.info("Sync completed", {
      category: "general",
      source: "offline-storage",
    });
  } catch (error) {
    logger.error("Sync failed", error, {
      category: "general",
      source: "offline-storage",
    });
  }
}

// ============================================================================
// ONLINE STATUS MONITORING
// ============================================================================

/**
 * Setup automatic sync when connection is restored
 */
export function setupAutoSync(onSync?: (item: SyncQueueItem) => Promise<boolean>): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleOnline = () => {
    logger.info("Connection restored, starting sync...", {
      category: "general",
      source: "offline-storage",
    });
    syncWhenOnline(onSync);
  };

  window.addEventListener("online", handleOnline);

  // Return cleanup function
  return () => {
    window.removeEventListener("online", handleOnline);
  };
}
