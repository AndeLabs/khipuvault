/**
 * @fileoverview MetaMask-Only Wallet Connection
 * @module components/wallet/connect-button
 *
 * Production-ready MetaMask connection (ONLY MetaMask, no other wallets)
 *
 * Features:
 * - Connects ONLY to MetaMask (ignores Rabby, OKX, etc.)
 * - Simple, clean UX
 * - Shows BTC balance when connected
 * - SSR-safe with proper hydration
 * - Professional and scalable
 *
 * How It Works:
 * - injected({ target: 'metaMask' }) forces MetaMask only
 * - Checks window.ethereum.isMetaMask to verify
 * - Ignores all other wallet extensions
 *
 * @see https://wagmi.sh/react/api/connectors/injected
 */

"use client";

import { Wallet, Copy, ExternalLink, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useIndividualPoolV3 } from "@/hooks/web3/use-individual-pool-v3";

/**
 * MetaMask Connect Button
 *
 * Connects ONLY to MetaMask. Other wallets (Rabby, OKX, etc.) are ignored.
 *
 * Features:
 * - MetaMask-only connection (target: 'metaMask')
 * - Shows BTC balance when connected
 * - Clean, professional UX
 * - SSR-safe with hydration
 *
 * How It Works:
 * 1. injected({ target: 'metaMask' }) in config forces MetaMask
 * 2. Connector checks window.ethereum.isMetaMask
 * 3. Ignores Rabby, OKX, and other wallets
 * 4. Simple and reliable
 */
export function ConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected, connector } = useAccount();
  // Wagmi 2.x exposes connect (not mutate) - internally renamed from useMutation
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: btcBalance } = useBalance({
    address: address as `0x${string}` | undefined,
  });

  useEffect(() => {
    setMounted(true);

    // Debug: Log detailed state
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("🔍 Wallet State:", {
        isConnected,
        address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "none",
        connector: connector?.name || "none",
        connectorId: connector?.id || "none",
      });

      // Fix stale connection state: if we have address or connector but isConnected is false
      if (!isConnected && (address || connector)) {
        // eslint-disable-next-line no-console
        console.log("⚠️ Detected stale connection (address/connector present but isConnected=false). Disconnecting...");
        disconnect();
      }
    }
  }, [mounted, isConnected, address, connector, disconnect]);

  // Prevent hydration errors
  if (!mounted) {
    return <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />;
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {/* Balance Display */}
        {btcBalance && (
          <div className="hidden items-center gap-2 text-sm md:flex">
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-code font-semibold">
              {Number(btcBalance.formatted).toFixed(6)} BTC
            </span>
          </div>
        )}

        {/* Connected Wallet Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm">
              <div className="font-medium">Connected Wallet</div>
              <div className="font-mono text-xs text-muted-foreground">{address}</div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(address);
                } catch {
                  // Clipboard API may fail on HTTP or when denied
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
              Copy Address
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <a
                href={`https://explorer.testnet.mezo.org/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View in Explorer
              </a>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => disconnect()}
              className="text-destructive focus:text-destructive"
            >
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Filter for MetaMask ONLY from all EIP-6963 detected wallets
  // EIP-6963 detects ALL wallets (Yoroi, Rabby, OKX, MetaMask)
  // We filter to show ONLY MetaMask
  const metaMaskConnector = connectors.find((c) => {
    // MetaMask via EIP-6963 has id: 'io.metamask' or 'io.metamask.mobile'
    if (c.id === "io.metamask" || c.id === "io.metamask.mobile") {
      return true;
    }

    // Fallback: check name (case-insensitive)
    if (c.name.toLowerCase().includes("metamask")) {
      // Make sure it's not a fake MetaMask (Rabby, etc.)
      // These wallets won't have the exact 'io.metamask' id
      return c.id.includes("metamask");
    }

    return false;
  });

  // Debug: show all detected wallets
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(
      "🔌 Connectors detected via EIP-6963:",
      connectors.map((c) => ({ id: c.id, name: c.name, type: c.type }))
    );
    // eslint-disable-next-line no-console
    console.log(
      "🎯 MetaMask connector:",
      metaMaskConnector ? { id: metaMaskConnector.id, name: metaMaskConnector.name } : "NOT FOUND"
    );
  }

  if (!metaMaskConnector) {
    return (
      <div className="flex flex-col items-end gap-2">
        <Button disabled className="gap-2">
          <Wallet className="h-4 w-4" />
          MetaMask Not Detected
        </Button>
        <p className="text-xs text-muted-foreground">
          Install{" "}
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            MetaMask extension
          </a>
        </p>
      </div>
    );
  }

  // Handle connection - force disconnect if already connected
  const handleConnect = async () => {
    try {
      // If connector is already connected, disconnect first
      // This fixes the "Connector already connected" error
      if (metaMaskConnector && "connected" in metaMaskConnector) {
        const isConnectorConnected = await metaMaskConnector.isAuthorized?.();
        if (isConnectorConnected) {
          // eslint-disable-next-line no-console
          console.log("🔄 Disconnecting stale connection...");
          disconnect();
          // Wait a bit for disconnect to complete
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // Now connect
      // eslint-disable-next-line no-console
      console.log("🔌 Connecting to MetaMask...");
      connect({ connector: metaMaskConnector });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("❌ Connection error:", err);
    }
  };

  // Force reset - clear all state
  const handleReset = () => {
    // eslint-disable-next-line no-console
    console.log("🔄 Force reset - clearing all state...");
    disconnect();
    if (typeof window !== "undefined") {
      // Clear Wagmi state from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("wagmi.") || key.includes("wallet")) {
          localStorage.removeItem(key);
        }
      });
    }
    // Reload page
    setTimeout(() => window.location.reload(), 500);
  };

  // Botón que conecta SOLO a MetaMask
  // El conector está configurado con target: 'metaMask' para ignorar otras wallets
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button onClick={handleConnect} disabled={isPending} className="gap-2">
          {/* MetaMask Fox Icon SVG */}
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.05 8.54l-3.78-2.82-.06-.05a.97.97 0 00-1.16 0l-.06.05-3.78 2.82a.97.97 0 00-.36.75v4.62c0 .3.14.59.36.75l3.78 2.82.06.05a.97.97 0 001.16 0l.06-.05 3.78-2.82a.97.97 0 00.36-.75V9.29a.97.97 0 00-.36-.75z" />
            <path d="M8.95 8.54l-3.78-2.82-.06-.05a.97.97 0 00-1.16 0l-.06.05-3.78 2.82A.97.97 0 000 9.29v4.62c0 .3.14.59.36.75l3.78 2.82.06.05a.97.97 0 001.16 0l.06-.05 3.78-2.82a.97.97 0 00.36-.75V9.29a.97.97 0 00-.36-.75z" />
          </svg>
          {isPending ? "Connecting..." : "Connect MetaMask"}
        </Button>

        {/* Temporary debug button - remove in production */}
        {process.env.NODE_ENV === "development" && (
          <Button onClick={handleReset} variant="outline" size="sm">
            Reset
          </Button>
        )}
      </div>

      {/* Show connection error if any */}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}

/**
 * Wallet Info Display Component
 * Shows connected wallet details and balances
 *
 * Safe to use in any component wrapped by Web3Provider
 * Handles hydration and loading states gracefully
 */
export function WalletInfo() {
  const { address, isConnected } = useAccount();
  const { data: btcBalance } = useBalance({
    address: address as `0x${string}` | undefined,
  });
  const { userInfo } = useIndividualPoolV3();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server or before hydration
  if (!mounted) {
    return (
      <div className="flex items-center gap-4">
        <div className="h-12 w-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!isConnected) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      {/* BTC Balance */}
      {btcBalance && (
        <div className="flex flex-col items-end">
          <div className="text-sm text-muted-foreground">Balance BTC</div>
          <div className="font-code text-lg font-semibold">
            {Number(btcBalance.formatted).toFixed(6)} BTC
          </div>
        </div>
      )}

      {/* MUSD Amount */}
      {userInfo?.deposit && (
        <div className="flex flex-col items-end border-l border-primary/20 pl-4">
          <div className="text-sm text-muted-foreground">MUSD Generado</div>
          <div className="font-code text-lg font-semibold text-primary">
            {Number(userInfo.deposit / BigInt(1e18)).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Wallet Status Badge
 * Shows connection status and chain info
 *
 * Displays a colored indicator and text showing wallet connection status
 * Safe for SSR and hydration
 */
export function WalletStatus() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render placeholder during SSR and initial hydration
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-muted" />
        <span className="text-sm font-medium text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-2 w-2 rounded-full transition-colors ${
          isConnected ? "bg-green-500" : "bg-yellow-500"
        }`}
      />
      <span className="text-sm font-medium text-muted-foreground">
        {isConnected ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
}
