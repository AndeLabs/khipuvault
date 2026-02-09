/**
 * @fileoverview MetaMask-Only Wallet Connection
 * @module components/wallet/connect-button
 *
 * Production-ready MetaMask connection using official Wagmi connector.
 *
 * Features:
 * - Uses metaMask() connector from Wagmi (not injected())
 * - Ignores other wallet extensions at config level
 * - No complex UI filtering needed
 * - Shows BTC balance when connected
 * - SSR-safe with proper hydration
 *
 * @see https://wagmi.sh/react/api/connectors/metaMask
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
 * Simple and reliable MetaMask connection.
 * The Wagmi config uses metaMask() connector, so connectors[0] is always MetaMask.
 */
export function ConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: btcBalance } = useBalance({
    address: address as `0x${string}` | undefined,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration errors
  if (!mounted) {
    return <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />;
  }

  // Connected state - show wallet dropdown
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
          <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            <ChevronDown className="h-4 w-4" />
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

            <DropdownMenuItem
              onClick={() =>
                window.open(
                  `https://explorer.testnet.mezo.org/address/${address}`,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View in Explorer
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

  // Get MetaMask connector (it's the only one configured)
  const metaMaskConnector = connectors[0];

  // No MetaMask connector found (shouldn't happen with proper config)
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

  // Handle connection
  const handleConnect = () => {
    connect({ connector: metaMaskConnector });
  };

  // Disconnected state - show connect button
  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleConnect} disabled={isPending} className="gap-2">
        {/* MetaMask Fox Icon */}
        <svg className="h-5 w-5" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M32.96 1L19.7 10.93l2.45-5.8L32.96 1z"
            fill="#E2761B"
            stroke="#E2761B"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2.02 1l13.14 10.03-2.33-5.9L2.02 1zM28.15 23.83l-3.53 5.4 7.55 2.08 2.17-7.36-6.19-.12zM.69 23.95l2.15 7.36 7.55-2.08-3.53-5.4-6.17.12z"
            fill="#E4761B"
            stroke="#E4761B"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.92 14.51l-2.1 3.18 7.49.34-.27-8.05-5.12 4.53zM25.06 14.51l-5.18-4.63-.17 8.15 7.47-.34-2.12-3.18zM10.39 29.23l4.51-2.2-3.89-3.04-.62 5.24zM20.08 27.03l4.53 2.2-.64-5.24-3.89 3.04z"
            fill="#E4761B"
            stroke="#E4761B"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24.61 29.23l-4.53-2.2.36 2.95-.04 1.25 4.21-2zM10.39 29.23l4.21 2-.03-1.25.34-2.95-4.52 2.2z"
            fill="#D7C1B3"
            stroke="#D7C1B3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14.69 22.08l-3.75-1.1 2.65-1.22 1.1 2.32zM20.29 22.08l1.1-2.32 2.67 1.22-3.77 1.1z"
            fill="#233447"
            stroke="#233447"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.39 29.23l.65-5.4-4.18.12 3.53 5.28zM23.96 23.83l.65 5.4 3.54-5.28-4.19-.12zM27.18 17.69l-7.47.34.7 3.87 1.1-2.32 2.67 1.22 3-3.11zM10.94 20.8l2.65-1.22 1.1 2.32.7-3.87-7.49-.34 3.04 3.11z"
            fill="#CD6116"
            stroke="#CD6116"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7.9 17.69l3.15 6.15-.11-3.04-3.04-3.11zM24.18 20.8l-.13 3.04 3.13-6.15-3 3.11zM15.39 18.03l-.7 3.87.87 4.5.2-5.93-.37-2.44zM19.71 18.03l-.36 2.42.18 5.95.87-4.5-.69-3.87z"
            fill="#E4751F"
            stroke="#E4751F"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20.4 21.9l-.87 4.5.62.44 3.89-3.04.13-3.04-3.77 1.14zM10.94 20.76l.11 3.04 3.89 3.04.62-.44-.87-4.5-3.75-1.14z"
            fill="#F6851B"
            stroke="#F6851B"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20.47 31.23l.04-1.25-.34-.29h-5.34l-.32.29.03 1.25-4.21-2 1.47 1.2 2.99 2.07h5.42l3-2.07 1.47-1.2-4.21 2z"
            fill="#C0AD9E"
            stroke="#C0AD9E"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20.08 27.03l-.62-.44h-3.94l-.62.44-.34 2.95.32-.29h5.34l.34.29-.48-2.95z"
            fill="#161616"
            stroke="#161616"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M33.52 11.49l1.13-5.42L32.96 1l-12.88 9.56 4.96 4.19 7.01 2.05 1.55-1.81-.67-.49 1.07-.97-.82-.63 1.07-.82-.71-.54zM.33 6.07l1.13 5.42-.72.54 1.07.82-.82.63 1.07.97-.67.49 1.55 1.81 7.01-2.05 4.96-4.19L2.02 1 .33 6.07z"
            fill="#763D16"
            stroke="#763D16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M32.05 16.8l-7.01-2.05 2.12 3.18-3.13 6.15 4.13-.05h6.19l-2.3-7.23zM9.92 14.75l-7.01 2.05-2.29 7.23h6.17l4.13.05-3.13-6.15 2.13-3.18zM19.71 18.03l.44-7.7 2.02-5.46H12.82l2 5.46.46 7.7.17 2.46.02 5.91h3.94l.02-5.91.28-2.46z"
            fill="#F6851B"
            stroke="#F6851B"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {isPending ? "Connecting..." : "Connect MetaMask"}
      </Button>

      {/* Show connection error if any */}
      {error && <p className="max-w-xs text-xs text-destructive">{error.message}</p>}
    </div>
  );
}

/**
 * Wallet Info Display Component
 * Shows connected wallet details and balances
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
      {btcBalance && (
        <div className="flex flex-col items-end">
          <div className="text-sm text-muted-foreground">Balance BTC</div>
          <div className="font-code text-lg font-semibold">
            {Number(btcBalance.formatted).toFixed(6)} BTC
          </div>
        </div>
      )}

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
 */
export function WalletStatus() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
