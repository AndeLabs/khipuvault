/**
 * Launch Configuration
 *
 * Controls whether the app is in pre-launch (landing) or live (full app) mode.
 *
 * Environment Variables:
 * - LAUNCH_MODE: "pre-launch" | "live"
 * - NETWORK: "testnet" | "mainnet" (managed by shared package)
 *
 * Deployment Configuration (see .env.example for details):
 *
 * PRE-LAUNCH (Current State):
 * - khipuvault.com: Shows landing page, invites to testnet
 * - testnet.khipuvault.com: Shows full app connected to testnet
 *
 * MAINNET LAUNCH (Future):
 * - Both sites show full app (mainnet and testnet respectively)
 *
 * TO LAUNCH MAINNET:
 * 1. In Vercel, go to khipuvault.com project settings
 * 2. Change LAUNCH_MODE from "pre-launch" to "live"
 * 3. Redeploy
 */

// Re-export network functions from shared (single source of truth)
// These are used by the landing page and other components
export { getCurrentNetwork, isMainnet, isTestnet, type Network } from "@khipu/shared";

export type LaunchMode = "pre-launch" | "live";

/**
 * Get current launch mode
 *
 * SMART DEFAULTS (if NEXT_PUBLIC_LAUNCH_MODE is not set):
 * - mainnet → "pre-launch" (landing page, safe default)
 * - testnet → "live" (full app for testing)
 *
 * This prevents accidentally showing the full app on mainnet
 * before it's ready to launch.
 */
export function getLaunchMode(): LaunchMode {
  const mode = process.env.NEXT_PUBLIC_LAUNCH_MODE;

  // Explicit mode always wins
  if (mode === "pre-launch") {
    return "pre-launch";
  }
  if (mode === "live") {
    return "live";
  }

  // Smart defaults when no LAUNCH_MODE is set
  const network = process.env.NEXT_PUBLIC_NETWORK;

  // Mainnet defaults to pre-launch (safe - shows landing page)
  if (network === "mainnet") {
    return "pre-launch";
  }

  // Testnet defaults to live (full app for testing)
  return "live";
}

/**
 * Check if we should show the landing page
 * True when in pre-launch mode
 */
export function shouldShowLanding(): boolean {
  return getLaunchMode() === "pre-launch";
}

/**
 * Check if we should show the full app
 */
export function shouldShowApp(): boolean {
  return getLaunchMode() === "live";
}

/**
 * Get configuration summary for debugging
 */
export function getConfigSummary() {
  return {
    launchMode: getLaunchMode(),
    network: process.env.NEXT_PUBLIC_NETWORK ?? "testnet",
    showLanding: shouldShowLanding(),
    showApp: shouldShowApp(),
  };
}
