/**
 * @fileoverview Feature Flags Configuration
 * @module config/feature-flags
 *
 * Controls which features are enabled based on the network environment.
 * This allows us to:
 * - Test features on testnet before mainnet
 * - Toggle features without code deployments
 * - Gradually roll out features
 * - Quick rollback if issues occur
 */

import { getCurrentNetwork, type Network } from "./network";

/**
 * Feature flag definitions
 * Each flag controls a specific feature or behavior
 */
export interface FeatureFlags {
  // ===== Product Features =====
  /** Individual Savings Pool - Core product */
  showIndividualSavings: boolean;

  /** Community/Cooperative Pools */
  showCommunityPools: boolean;

  /** Rotating Pool (ROSCA/Pasanaku) */
  showRotatingPool: boolean;

  /** Prize Pool (No-loss lottery) */
  showPrizePool: boolean;

  /** Referral system and rewards */
  showReferralSystem: boolean;

  // ===== Core Functionality =====
  /** Auto-compound yields automatically */
  enableAutoCompound: boolean;

  /** Manual yield claiming */
  enableYieldClaiming: boolean;

  /** Partial withdrawals (not just full exit) */
  enablePartialWithdrawals: boolean;

  /** Multi-token support (beyond mUSD) */
  enableMultiToken: boolean;

  // ===== Advanced Features =====
  /** Analytics dashboard */
  enableAnalytics: boolean;

  /** Push notifications */
  enableNotifications: boolean;

  /** Portfolio tracking across pools */
  enablePortfolio: boolean;

  /** Social features (leaderboard, etc.) */
  enableSocial: boolean;

  // ===== System Controls =====
  /** Maintenance mode - show maintenance page */
  maintenanceMode: boolean;

  /** Read-only mode - disable all writes */
  readOnlyMode: boolean;

  /** Show testnet banner */
  showTestnetBanner: boolean;

  /** Enable debug tools (dev only) */
  enableDebugTools: boolean;
}

/**
 * Feature flag configurations per environment
 */
export const FEATURE_FLAGS: Record<Network, FeatureFlags> = {
  /**
   * TESTNET Configuration
   * - Most features enabled for testing
   * - Safe environment to try new things
   */
  testnet: {
    // Product Features
    showIndividualSavings: true,
    showCommunityPools: true,
    showRotatingPool: true,
    showPrizePool: true,
    showReferralSystem: false, // Disabled per user request

    // Core Functionality
    enableAutoCompound: true,
    enableYieldClaiming: true,
    enablePartialWithdrawals: true,
    enableMultiToken: false, // Not implemented yet

    // Advanced Features
    enableAnalytics: true,
    enableNotifications: false, // Not ready yet
    enablePortfolio: true,
    enableSocial: false, // Future feature

    // System Controls
    maintenanceMode: false,
    readOnlyMode: false,
    showTestnetBanner: true,
    enableDebugTools: true,
  },

  /**
   * MAINNET Configuration
   * - Only stable, audited features
   * - Conservative approach for safety
   * - Will gradually enable features after testing
   */
  mainnet: {
    // Product Features - Start with Individual Savings only
    showIndividualSavings: true,
    showCommunityPools: false, // Launch in v1.1
    showRotatingPool: false, // Launch in v1.2
    showPrizePool: false, // Launch in v1.3
    showReferralSystem: false,

    // Core Functionality
    enableAutoCompound: true,
    enableYieldClaiming: true,
    enablePartialWithdrawals: true,
    enableMultiToken: false,

    // Advanced Features
    enableAnalytics: true,
    enableNotifications: false,
    enablePortfolio: false, // Launch in v1.1
    enableSocial: false,

    // System Controls
    maintenanceMode: false,
    readOnlyMode: false,
    showTestnetBanner: false,
    enableDebugTools: false,
  },
};

/**
 * Get feature flags for current network
 */
export function getFeatureFlags(): FeatureFlags {
  const network = getCurrentNetwork();
  return FEATURE_FLAGS[network];
}

/**
 * Check if a specific feature is enabled
 *
 * @param feature - Feature flag name
 * @returns True if feature is enabled, false otherwise
 *
 * @example
 * ```typescript
 * if (isFeatureEnabled("showPrizePool")) {
 *   return <PrizePoolCard />;
 * }
 * ```
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature] ?? false;
}

/**
 * Get all enabled features (useful for debugging)
 */
export function getEnabledFeatures(): string[] {
  const flags = getFeatureFlags();
  return Object.entries(flags)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
}

/**
 * Check if app is in maintenance mode
 */
export function isMaintenanceMode(): boolean {
  return isFeatureEnabled("maintenanceMode");
}

/**
 * Check if app is in read-only mode
 */
export function isReadOnlyMode(): boolean {
  return isFeatureEnabled("readOnlyMode");
}

/**
 * Feature flag hook for React components
 * This is re-exported in @khipu/shared for easy access
 */
export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  // In React, this will re-render if network changes
  // For now, it's static per page load
  return isFeatureEnabled(feature);
}

/**
 * Development helper: Log all feature flags to console
 */
export function logFeatureFlags(): void {
  if (process.env.NODE_ENV !== "development") return;

  const flags = getFeatureFlags();
  const network = getCurrentNetwork();

  console.group(`🚩 Feature Flags (${network})`);
  console.table(flags);
  console.groupEnd();
}
