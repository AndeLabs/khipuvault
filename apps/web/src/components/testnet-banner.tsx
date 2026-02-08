"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

import { getCurrentNetwork } from "@khipu/shared";

import { Button } from "@/components/ui/button";

/**
 * Testnet Warning Banner
 *
 * Displays a prominent warning banner when the app is running on testnet.
 * Users can dismiss it, but it will reappear on page reload.
 *
 * Features:
 * - Only shows on testnet (based on NEXT_PUBLIC_NETWORK env var)
 * - Dismissible with X button
 * - Bright warning colors for visibility
 * - Sticky positioning at top of page
 */
export function TestnetBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const network = getCurrentNetwork();

  // Only show on testnet
  if (network !== "testnet" || isDismissed) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 border-b border-warning/20 bg-warning/90 px-4 py-3 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-warning-foreground h-5 w-5 flex-shrink-0" />
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <p className="text-warning-foreground text-sm font-semibold">Testnet Environment</p>
            <p className="text-warning-foreground/90 text-xs">
              You're using KhipuVault Testnet. Funds have no real value. Mainnet launching soon!
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 hover:bg-warning/20"
          aria-label="Dismiss testnet warning"
        >
          <X className="text-warning-foreground h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
