"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { getCurrentNetwork } from "@khipu/shared";

/**
 * Testnet Environment Indicator
 *
 * Displays a minimal, non-intrusive indicator when running on testnet.
 * Designed to match the dark theme while remaining visible.
 *
 * Features:
 * - Only shows on testnet (based on NEXT_PUBLIC_NETWORK env var)
 * - Dismissible with X button
 * - Subtle dark design that matches the site aesthetic
 * - Slim, minimal presence
 */
export function TestnetBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const network = getCurrentNetwork();

  // Only show on testnet
  if (network !== "testnet" || isDismissed) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 border-b border-border/50 bg-surface/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-8 items-center justify-center gap-3 px-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-accent" />
          <span className="text-xs font-medium tracking-wide text-muted-foreground">TESTNET</span>
          <span className="hidden text-xs text-muted-foreground/60 sm:inline">
            — Test environment • No real value
          </span>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="ml-2 text-muted-foreground/60 transition-colors hover:text-foreground"
          aria-label="Dismiss testnet indicator"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
