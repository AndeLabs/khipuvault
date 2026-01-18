/**
 * @fileoverview Privy Configuration for KhipuVault
 * @module lib/privy/config
 *
 * Professional Web3 authentication with:
 * - Email/Social/Passkey login
 * - Embedded wallets (no extension required)
 * - External wallet support (MetaMask, etc.)
 * - Mobile-first UX
 */

import { mezoTestnet } from "@/lib/web3/chains";

import type { PrivyClientConfig } from "@privy-io/react-auth";

/**
 * Privy App ID - Get yours at https://dashboard.privy.io
 * IMPORTANT: Set this in your environment variables
 */
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

/**
 * Privy configuration optimized for KhipuVault
 *
 * Features:
 * - Multiple login methods (email, social, passkeys, wallets)
 * - Automatic embedded wallet creation
 * - Dark theme matching app design
 * - Mezo Testnet as default chain
 */
export const privyConfig: PrivyClientConfig = {
  // Login methods - prioritize mobile-friendly options
  loginMethods: [
    "email",
    "google",
    "apple",
    "twitter",
    "wallet", // External wallets (MetaMask, etc.)
  ],

  // Appearance - match KhipuVault branding
  appearance: {
    theme: "dark",
    accentColor: "#F7931A", // Bitcoin orange
    logo: "/logos/khipu-logo.png",
    showWalletLoginFirst: false, // Show email/social first for better mobile UX
    walletChainType: "ethereum-only",
    walletList: ["metamask", "coinbase_wallet", "rainbow", "wallet_connect"],
  },

  // Embedded wallets configuration
  embeddedWallets: {
    ethereum: {
      // Create wallet for users who login with email/social
      createOnLogin: "users-without-wallets",
    },
    // Show recovery UI
    showWalletUIs: true,
  },

  // Default chain - Mezo Testnet
  defaultChain: mezoTestnet,

  // Supported chains
  supportedChains: [mezoTestnet],

  // Legal links (optional - update with your URLs)
  legal: {
    termsAndConditionsUrl: "https://khipuvault.com/terms",
    privacyPolicyUrl: "https://khipuvault.com/privacy",
  },

  // MFA configuration for enhanced security
  mfa: {
    noPromptOnMfaRequired: false,
  },
};

/**
 * Check if Privy is properly configured
 */
export function isPrivyConfigured(): boolean {
  return Boolean(PRIVY_APP_ID && PRIVY_APP_ID.length > 0);
}

/**
 * Get Privy configuration status
 */
export function getPrivyStatus(): {
  configured: boolean;
  appId: string;
  message: string;
} {
  if (!PRIVY_APP_ID) {
    return {
      configured: false,
      appId: "",
      message: "NEXT_PUBLIC_PRIVY_APP_ID not set. Get one at https://dashboard.privy.io",
    };
  }

  return {
    configured: true,
    appId: PRIVY_APP_ID,
    message: "Privy configured successfully",
  };
}
