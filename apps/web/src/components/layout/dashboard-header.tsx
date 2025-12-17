/**
 * @fileoverview Dashboard Header Component
 * @module components/layout/dashboard-header
 *
 * Production-ready dashboard header with wallet integration
 * Safe client-side rendering with proper hydration handling
 * Supports both Privy and basic wallet connection
 */

"use client";

import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { SmartConnectButton } from "@/components/wallet/smart-connect-button";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps = {}) {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({
    address: address as `0x${string}` | undefined,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="animate-pulse flex items-center gap-2 ml-auto h-10 w-32 bg-muted rounded" />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      {/* Mobile menu button */}
      {onMenuClick && (
        <Button
          size="icon"
          variant="ghost"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      )}

      <div className="flex items-center gap-3 ml-auto">
        {/* BTC Balance Display (when connected) - Hidden on mobile as SmartConnectButton shows it */}
        {isConnected && balanceData && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-primary/10">
            <Icons.bitcoin className="h-5 w-5" style={{ color: "#F7931A" }} />
            <span className="font-code font-semibold text-sm">
              {Number(balanceData.formatted).toFixed(6)} BTC
            </span>
          </div>
        )}

        {/* Smart Connect Button - handles Privy or basic wallet */}
        <SmartConnectButton />
      </div>
    </header>
  );
}
