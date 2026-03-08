/**
 * @fileoverview Nonce Generation and Management
 * @module middleware/auth/nonce-manager
 *
 * Handles cryptographically secure nonce generation and storage
 * for SIWE authentication. Uses Redis when available, falls back
 * to in-memory storage.
 */

import * as crypto from "crypto";

import { logger } from "../../lib/logger";
import { getStore, isRedisEnabled } from "../../lib/redis";

import type { NonceData, NonceStats } from "./types";

// Nonce configuration
export const NONCE_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
export const NONCE_EXPIRATION_SECONDS = 10 * 60;
const MAX_NONCES = 10000; // Maximum nonces for in-memory store
const NONCE_PREFIX = "nonce:";

// In-memory nonce storage (fallback when Redis not available)
const memoryNonceStore = new Map<string, NonceData>();

// Automatic cleanup interval
let cleanupInterval: NodeJS.Timeout | null = null;

function startPeriodicCleanup(): void {
  if (cleanupInterval) {
    return;
  }
  cleanupInterval = setInterval(
    () => {
      cleanupExpiredNonces();
      logger.debug({ nonceCount: memoryNonceStore.size }, "Periodic nonce cleanup completed");
    },
    5 * 60 * 1000
  );
  cleanupInterval.unref();
}

// Start cleanup on module load
startPeriodicCleanup();

/**
 * Clean up expired nonces from in-memory storage
 * Redis handles expiration automatically via TTL
 */
export function cleanupExpiredNonces(): void {
  const now = Date.now();
  const entries = Array.from(memoryNonceStore.entries());
  for (let i = 0; i < entries.length; i++) {
    const [nonce, data] = entries[i];
    if (now - data.timestamp > NONCE_EXPIRATION_MS) {
      memoryNonceStore.delete(nonce);
    }
  }
}

/**
 * Generate a cryptographically secure random nonce
 * Uses Redis when available, falls back to in-memory store
 */
export async function generateNonce(): Promise<string> {
  const nonce = crypto.randomBytes(32).toString("base64url");

  if (isRedisEnabled) {
    const store = getStore();
    await store.set(
      `${NONCE_PREFIX}${nonce}`,
      Date.now().toString(),
      "EX",
      NONCE_EXPIRATION_SECONDS
    );
    return nonce;
  }

  // Fallback to in-memory store
  if (memoryNonceStore.size >= MAX_NONCES) {
    cleanupExpiredNonces();
    if (memoryNonceStore.size >= MAX_NONCES) {
      const entries = Array.from(memoryNonceStore.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );
      const toDelete = Math.floor(entries.length * 0.1);
      for (let i = 0; i < toDelete; i++) {
        memoryNonceStore.delete(entries[i][0]);
      }
      logger.warn(
        { deleted: toDelete, remaining: memoryNonceStore.size },
        "Forced nonce cleanup due to limit"
      );
    }
  }

  memoryNonceStore.set(nonce, {
    timestamp: Date.now(),
    used: false,
  });

  return nonce;
}

/**
 * Validate and consume a nonce atomically
 * Returns true if nonce is valid, false otherwise
 */
export async function validateAndConsumeNonce(
  nonce: string
): Promise<{ valid: boolean; error?: string }> {
  const nonceKey = `${NONCE_PREFIX}${nonce}`;
  const now = Date.now();

  if (isRedisEnabled) {
    const store = getStore();
    const nonceTimestamp = await store.get(nonceKey);
    await store.del(nonceKey); // Delete immediately for atomicity

    if (!nonceTimestamp) {
      return { valid: false, error: "Invalid nonce: nonce not found or expired" };
    }

    const timestamp = parseInt(nonceTimestamp, 10);
    if (now - timestamp > NONCE_EXPIRATION_MS) {
      return { valid: false, error: "Invalid nonce: nonce expired" };
    }

    return { valid: true };
  }

  // In-memory fallback
  const nonceData = memoryNonceStore.get(nonce);
  memoryNonceStore.delete(nonce); // Delete immediately for atomicity

  if (!nonceData) {
    return { valid: false, error: "Invalid nonce: nonce not found" };
  }

  if (nonceData.used) {
    return { valid: false, error: "Invalid nonce: nonce already used" };
  }

  if (now - nonceData.timestamp > NONCE_EXPIRATION_MS) {
    return { valid: false, error: "Invalid nonce: nonce expired" };
  }

  return { valid: true };
}

/**
 * Get nonce store statistics (for monitoring/debugging)
 */
export function getNonceStats(): NonceStats {
  if (isRedisEnabled) {
    return {
      total: -1, // Unknown for Redis
      used: -1,
      unused: -1,
      expired: -1,
      storeType: "redis",
    };
  }

  cleanupExpiredNonces();

  let used = 0;
  let unused = 0;
  let expired = 0;
  const now = Date.now();

  const entries = Array.from(memoryNonceStore.entries());
  for (let i = 0; i < entries.length; i++) {
    const [_, data] = entries[i];
    if (now - data.timestamp > NONCE_EXPIRATION_MS) {
      expired++;
    } else if (data.used) {
      used++;
    } else {
      unused++;
    }
  }

  return {
    total: memoryNonceStore.size,
    used,
    unused,
    expired,
    storeType: "memory",
  };
}
