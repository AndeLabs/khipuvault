/**
 * @fileoverview Service Worker Configuration
 * @module lib/pwa/service-worker-config
 *
 * Defines caching strategies and runtime configuration for the PWA service worker.
 * Complements next-pwa's build-time configuration with runtime behaviors.
 */

// ============================================================================
// TYPES
// ============================================================================

export type CacheStrategy =
  | "network-first"
  | "cache-first"
  | "stale-while-revalidate"
  | "network-only"
  | "cache-only";

export interface CacheConfig {
  /** Cache name identifier */
  name: string;
  /** Caching strategy */
  strategy: CacheStrategy;
  /** Maximum number of entries */
  maxEntries?: number;
  /** Maximum age in seconds */
  maxAgeSeconds?: number;
  /** Network timeout in seconds (for network-first) */
  networkTimeoutSeconds?: number;
}

export interface RoutePattern {
  /** URL pattern to match (regex or string) */
  pattern: RegExp | string;
  /** Cache configuration for this pattern */
  cache: CacheConfig;
  /** Custom handler function (optional) */
  handler?: (request: Request) => Promise<Response>;
}

// ============================================================================
// CACHE STRATEGIES
// ============================================================================

/**
 * Predefined caching strategies for different resource types
 */
export const CACHE_STRATEGIES = {
  /**
   * Network-first: Try network, fallback to cache
   * Best for: API calls, dynamic content
   */
  NETWORK_FIRST: {
    strategy: "network-first" as const,
    networkTimeoutSeconds: 10,
  },

  /**
   * Cache-first: Try cache, fallback to network
   * Best for: Static assets, images
   */
  CACHE_FIRST: {
    strategy: "cache-first" as const,
  },

  /**
   * Stale-while-revalidate: Serve cache immediately, update in background
   * Best for: Semi-dynamic content, balance between speed and freshness
   */
  STALE_WHILE_REVALIDATE: {
    strategy: "stale-while-revalidate" as const,
  },

  /**
   * Network-only: Always fetch from network
   * Best for: Critical real-time data, blockchain state
   */
  NETWORK_ONLY: {
    strategy: "network-only" as const,
  },

  /**
   * Cache-only: Only serve from cache
   * Best for: Offline-first assets
   */
  CACHE_ONLY: {
    strategy: "cache-only" as const,
  },
} as const;

// ============================================================================
// CACHEABLE ROUTES
// ============================================================================

/**
 * Routes that should be cached with specific strategies
 */
export const CACHEABLE_ROUTES: RoutePattern[] = [
  // Static pages - Cache first
  {
    pattern: /^https?:.*\/dashboard$/,
    cache: {
      name: "pages-cache",
      ...CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
      maxEntries: 50,
      maxAgeSeconds: 24 * 60 * 60, // 24 hours
    },
  },

  // Static assets - Cache first, long TTL
  {
    pattern: /\.(png|jpg|jpeg|svg|gif|ico|webp|woff|woff2|ttf|eot)$/,
    cache: {
      name: "static-assets",
      ...CACHE_STRATEGIES.CACHE_FIRST,
      maxEntries: 100,
      maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
    },
  },

  // JavaScript/CSS bundles - Stale while revalidate
  {
    pattern: /\.(js|css)$/,
    cache: {
      name: "bundles-cache",
      ...CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
      maxEntries: 50,
      maxAgeSeconds: 24 * 60 * 60, // 24 hours
    },
  },

  // API routes - Network first with short cache
  {
    pattern: /^https?:.*\/api\//,
    cache: {
      name: "api-cache",
      ...CACHE_STRATEGIES.NETWORK_FIRST,
      maxEntries: 100,
      maxAgeSeconds: 5 * 60, // 5 minutes
      networkTimeoutSeconds: 10,
    },
  },

  // RPC calls - Network first with very short cache
  {
    pattern: /^https:\/\/rpc\.(test\.)?mezo\.org\/.*/,
    cache: {
      name: "rpc-cache",
      ...CACHE_STRATEGIES.NETWORK_FIRST,
      maxEntries: 50,
      maxAgeSeconds: 60, // 1 minute
      networkTimeoutSeconds: 5,
    },
  },

  // External images - Cache first
  {
    pattern: /^https:\/\/(images\.unsplash\.com|placehold\.co|picsum\.photos)\/.*/,
    cache: {
      name: "external-images",
      ...CACHE_STRATEGIES.CACHE_FIRST,
      maxEntries: 100,
      maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
    },
  },
];

// ============================================================================
// RUNTIME CACHING
// ============================================================================

/**
 * Runtime caching configuration for next-pwa
 * This is the format expected by next-pwa's runtimeCaching option
 */
export const RUNTIME_CACHING = CACHEABLE_ROUTES.map((route) => ({
  urlPattern: route.pattern,
  handler:
    route.cache.strategy === "network-first"
      ? "NetworkFirst"
      : route.cache.strategy === "cache-first"
        ? "CacheFirst"
        : route.cache.strategy === "stale-while-revalidate"
          ? "StaleWhileRevalidate"
          : route.cache.strategy === "network-only"
            ? "NetworkOnly"
            : "CacheOnly",
  options: {
    cacheName: route.cache.name,
    ...(route.cache.maxEntries && {
      expiration: {
        maxEntries: route.cache.maxEntries,
        ...(route.cache.maxAgeSeconds && { maxAgeSeconds: route.cache.maxAgeSeconds }),
      },
    }),
    ...(route.cache.networkTimeoutSeconds && {
      networkTimeoutSeconds: route.cache.networkTimeoutSeconds,
    }),
  },
}));

// ============================================================================
// CACHE NAMES
// ============================================================================

/**
 * Cache identifiers used throughout the app
 */
export const CACHE_NAMES = {
  PAGES: "pages-cache",
  STATIC: "static-assets",
  BUNDLES: "bundles-cache",
  API: "api-cache",
  RPC: "rpc-cache",
  IMAGES: "external-images",
  OFFLINE: "offline-data",
} as const;

// ============================================================================
// CACHE UTILITIES
// ============================================================================

/**
 * Check if a URL should be cached
 */
export function shouldCache(url: string): boolean {
  return CACHEABLE_ROUTES.some((route) => {
    if (route.pattern instanceof RegExp) {
      return route.pattern.test(url);
    }
    return url.includes(route.pattern);
  });
}

/**
 * Get cache configuration for a URL
 */
export function getCacheConfig(url: string): CacheConfig | null {
  const route = CACHEABLE_ROUTES.find((r) => {
    if (r.pattern instanceof RegExp) {
      return r.pattern.test(url);
    }
    return url.includes(r.pattern);
  });
  return route?.cache || null;
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return;
  }

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
}

/**
 * Clear specific cache by name
 */
export async function clearCache(cacheName: string): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return false;
  }

  return await caches.delete(cacheName);
}

/**
 * Get cache size estimate
 */
export async function getCacheSize(): Promise<number> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return 0;
  }

  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    totalSize += keys.length;
  }

  return totalSize;
}
