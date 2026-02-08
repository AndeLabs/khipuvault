"use client";

import { ReactNode } from "react";

import { ComingSoon } from "@/components/coming-soon";
import { getCurrentNetwork } from "@khipu/shared";

interface NetworkGateProps {
  children: ReactNode;
}

/**
 * Network Gate Component
 *
 * Controls what content is shown based on the current network:
 * - Testnet: Show the full app
 * - Mainnet: Show "Coming Soon" page
 *
 * This allows quick switching between environments via NEXT_PUBLIC_NETWORK env var
 */
export function NetworkGate({ children }: NetworkGateProps) {
  const network = getCurrentNetwork();

  // On mainnet, show coming soon page
  if (network === "mainnet") {
    return <ComingSoon />;
  }

  // On testnet, show the app
  return <>{children}</>;
}
