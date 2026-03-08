/**
 * @fileoverview Centralized URL configuration
 * @module lib/config/urls
 *
 * All external URLs and links should be defined here for easy management
 * and environment-specific configuration.
 */

import { getCurrentNetwork } from "@khipu/shared";

/**
 * Mezo-specific URLs
 */
export const MEZO_URLS = {
  /** Mezo faucet for testnet BTC */
  FAUCET: "https://faucet.mezo.org",
  /** Mezo documentation */
  DOCS: "https://docs.mezo.org",
  /** Mezo mainnet explorer */
  EXPLORER_MAINNET: "https://explorer.mezo.org",
  /** Mezo testnet explorer */
  EXPLORER_TESTNET: "https://explorer.test.mezo.org",
} as const;

/**
 * KhipuVault URLs
 */
export const KHIPU_URLS = {
  /** Production app */
  MAINNET: "https://khipuvault.com",
  /** Testnet app */
  TESTNET: "https://testnet.khipuvault.com",
  /** Documentation/guides */
  DOCS: "https://docs.khipuvault.com",
} as const;

/**
 * Social/external links
 */
export const SOCIAL_URLS = {
  TWITTER: "https://twitter.com/khipuvault",
  DISCORD: "https://discord.gg/khipuvault",
  GITHUB: "https://github.com/khipuvault",
} as const;

/**
 * Get the current explorer URL based on network
 */
export function getExplorerUrl(): string {
  const network = getCurrentNetwork();
  return network === "mainnet" ? MEZO_URLS.EXPLORER_MAINNET : MEZO_URLS.EXPLORER_TESTNET;
}

/**
 * Get explorer URL for an address
 */
export function getAddressExplorerUrl(address: string): string {
  return `${getExplorerUrl()}/address/${address}`;
}

/**
 * Get explorer URL for a transaction
 */
export function getTxExplorerUrl(txHash: string): string {
  return `${getExplorerUrl()}/tx/${txHash}`;
}

/**
 * Get the current app URL based on network
 */
export function getAppUrl(): string {
  const network = getCurrentNetwork();
  return network === "mainnet" ? KHIPU_URLS.MAINNET : KHIPU_URLS.TESTNET;
}
