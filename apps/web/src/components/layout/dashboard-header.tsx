/**
 * @fileoverview Dashboard Header Component
 * @module components/layout/dashboard-header
 *
 * Production-ready dashboard header with wallet integration
 * Safe client-side rendering with proper hydration handling
 */

"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Menu, LogOut } from "lucide-react";
import { ConnectButton } from "@/components/wallet/connect-button";
import { useAccount, useBalance, useDisconnect } from "wagmi";
import { useState, useEffect } from "react";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps = {}) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
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
        {/* BTC Balance Display (cuando está conectado) */}
        {isConnected && balanceData && (
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-primary/10">
            <Icons.bitcoin className="h-5 w-5" style={{ color: "#F7931A" }} />
            <span className="font-code font-semibold text-sm">
              {Number(balanceData.formatted).toFixed(6)} BTC
            </span>
          </div>
        )}

        {/* Custom Connect Button */}
        <ConnectButton />

        {/* Botón de desconexión manual como respaldo */}
        {isConnected && (
          <Button
            onClick={() => {
              console.log("🔌 Desconectando wallet manualmente...");
              disconnect();
            }}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Desconectar</span>
          </Button>
        )}
      </div>
    </header>
  );
}
