/**
 * @fileoverview Smart Connect Button
 * @module components/wallet/smart-connect-button
 *
 * Automatically uses Privy or basic connect button based on configuration.
 * Provides a unified interface for wallet connection across the app.
 */

"use client";

import { isPrivyConfigured } from "@/lib/privy/config";

import { ConnectButton } from "./connect-button";
import { PrivyConnectButton } from "./privy-connect-button";

/**
 * Smart Connect Button
 *
 * Uses Privy when configured (mobile-friendly with email/social login)
 * Falls back to basic MetaMask connection otherwise
 */
export function SmartConnectButton() {
  if (isPrivyConfigured()) {
    return <PrivyConnectButton />;
  }

  return <ConnectButton />;
}

/**
 * Re-export individual buttons for direct use
 */
export { PrivyConnectButton } from "./privy-connect-button";
export { ConnectButton } from "./connect-button";
