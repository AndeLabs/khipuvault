/**
 * @fileoverview Privy Connect Button for KhipuVault
 * @module components/wallet/privy-connect-button
 *
 * Mobile-first wallet connection with:
 * - Email/Social/Passkey login
 * - Embedded wallet for new users
 * - External wallet support
 * - Beautiful, accessible UI
 */

"use client";

import {
  usePrivy,
  useWallets,
  useLogin,
  useLogout,
} from "@privy-io/react-auth";
import {
  Wallet,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  User,
  Mail,
  Smartphone,
  Shield,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

/**
 * Privy Connect Button Component
 *
 * Features:
 * - One-click login with email/social
 * - Passkey support for biometric auth
 * - Embedded wallet for new Web3 users
 * - External wallet connection (MetaMask, etc.)
 * - Mobile-optimized UX
 */
export function PrivyConnectButton() {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Privy hooks
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { login } = useLogin();
  const { logout } = useLogout();

  // Wagmi hooks for balance
  const { address } = useAccount();
  const { data: btcBalance } = useBalance({
    address: address as `0x${string}` | undefined,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get the active wallet
  const activeWallet = wallets.find((w) => w.address === address) ?? wallets[0];

  // Get user display info
  const getUserDisplayName = () => {
    if (!user) {
      return "User";
    }
    if (user.email?.address) {
      return user.email.address;
    }
    if (user.google?.email) {
      return user.google.email;
    }
    if (user.twitter?.username) {
      return `@${user.twitter.username}`;
    }
    if (user.apple?.email) {
      return user.apple.email;
    }
    if (address) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return "User";
  };

  // Get login method icon
  const getLoginMethodIcon = () => {
    if (!user) {
      return <User className="h-4 w-4" />;
    }
    if (user.email?.address) {
      return <Mail className="h-4 w-4" />;
    }
    if (user.google?.email ?? user.apple?.email) {
      return <User className="h-4 w-4" />;
    }
    if (user.wallet) {
      return <Wallet className="h-4 w-4" />;
    }
    return <User className="h-4 w-4" />;
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Prevent hydration errors
  if (!mounted || !ready) {
    return <div className="h-10 w-40 animate-pulse bg-muted rounded-lg" />;
  }

  // Connected state
  if (authenticated && address) {
    return (
      <div className="flex items-center gap-3">
        {/* Balance Display - Hidden on small screens */}
        {btcBalance && (
          <div className="hidden lg:flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-semibold font-code">
              {Number(btcBalance.formatted).toFixed(6)} BTC
            </span>
          </div>
        )}

        {/* Connected Wallet Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              {getLoginMethodIcon()}
              <span className="hidden sm:inline max-w-[120px] truncate">
                {getUserDisplayName()}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64">
            {/* User Info */}
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{getUserDisplayName()}</p>
                {address && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {address.slice(0, 10)}...{address.slice(-8)}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Wallet Info */}
            {activeWallet && (
              <>
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {activeWallet.walletClientType === "privy" ? (
                      <>
                        <Shield className="h-3 w-3" />
                        <span>Embedded Wallet</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="h-3 w-3" />
                        <span>{activeWallet.walletClientType}</span>
                      </>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Balance (mobile) */}
            {btcBalance && (
              <>
                <div className="px-2 py-1.5 lg:hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Balance
                    </span>
                    <span className="text-sm font-semibold font-code">
                      {Number(btcBalance.formatted).toFixed(6)} BTC
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator className="lg:hidden" />
              </>
            )}

            {/* Actions */}
            <DropdownMenuItem onClick={copyAddress}>
              <Copy className="h-4 w-4 mr-2" />
              {copied ? "Copied!" : "Copy Address"}
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <a
                href={`https://explorer.testnet.mezo.org/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Explorer
              </a>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Disconnected state - Show login button
  return (
    <Button onClick={login} className="gap-2">
      <Smartphone className="h-4 w-4" />
      <span className="hidden sm:inline">Connect</span>
      <span className="sm:hidden">Login</span>
    </Button>
  );
}

/**
 * Compact version for mobile headers
 */
export function PrivyConnectButtonCompact() {
  const [mounted, setMounted] = useState(false);
  const { ready, authenticated } = usePrivy();
  const { login } = useLogin();
  const { logout } = useLogout();
  const { address } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !ready) {
    return <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />;
  }

  if (authenticated && address) {
    return (
      <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Logout</span>
      </Button>
    );
  }

  return (
    <Button variant="default" size="sm" onClick={login}>
      <Wallet className="h-4 w-4 mr-1" />
      Login
    </Button>
  );
}

/**
 * Wallet status indicator
 */
export function PrivyWalletStatus() {
  const [mounted, setMounted] = useState(false);
  const { ready, authenticated } = usePrivy();
  const { address } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !ready) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const isConnected = authenticated && address;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-2 w-2 rounded-full transition-colors ${
          isConnected ? "bg-green-500" : "bg-yellow-500"
        }`}
      />
      <span className="text-sm text-muted-foreground">
        {isConnected ? "Connected" : "Not connected"}
      </span>
    </div>
  );
}
