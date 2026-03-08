/**
 * Examples of using Zustand stores in KhipuVault
 *
 * These are practical examples showing how to integrate the stores
 * into your components. Copy and adapt these patterns as needed.
 *
 * NOTE: This file is for documentation purposes only.
 * Import your actual UI components before using these examples.
 */

"use client";

import { useEffect } from "react";
import { parseEther } from "viem";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";

import {
  useUI,
  useWallet,
  useNotify,
  usePendingTransactions,
  useTransactionTracker,
  useSyncWalletState,
} from "@/hooks/use-stores";

// Placeholder types - replace with actual component imports in your code
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
declare const Button: React.ComponentType<any>;
declare const Card: React.ComponentType<any>;
declare const CardContent: React.ComponentType<any>;
declare const CardHeader: React.ComponentType<any>;
declare const CardTitle: React.ComponentType<any>;

// ============================================================================
// Example 1: Sidebar Toggle with Store
// ============================================================================
export function SidebarToggleButton() {
  const { isSidebarOpen, toggleSidebar } = useUI();

  return (
    <Button onClick={toggleSidebar}>{isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}</Button>
  );
}

// ============================================================================
// Example 2: Notifications with Store
// ============================================================================
export function NotificationExample() {
  const notify = useNotify();

  const handleSuccess = () => {
    notify.success("Operation completed", "Your transaction was successful");
  };

  const handleError = () => {
    notify.error("Operation failed", "Please try again later");
  };

  const handleWarning = () => {
    notify.warning("Low balance", "You may not have enough funds for gas");
  };

  return (
    <div className="space-x-2">
      <Button onClick={handleSuccess}>Show Success</Button>
      <Button onClick={handleError} variant="destructive">
        Show Error
      </Button>
      <Button onClick={handleWarning} variant="outline">
        Show Warning
      </Button>
    </div>
  );
}

// ============================================================================
// Example 3: Wallet State Display
// ============================================================================
export function WalletStateDisplay() {
  const { address, isConnected, chainName, connectorName } = useWallet();

  if (!isConnected) {
    return <div>Wallet not connected</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">
          <strong>Address:</strong> {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
        <p className="text-sm">
          <strong>Chain:</strong> {chainName || "Unknown"}
        </p>
        <p className="text-sm">
          <strong>Connector:</strong> {connectorName || "Unknown"}
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Example 4: Pending Transactions Display
// ============================================================================
export function PendingTransactionsList() {
  const { all: pendingTxs, count } = usePendingTransactions();

  if (count === 0) {
    return <div>No pending transactions</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Transactions ({count})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {pendingTxs.map((tx) => (
            <div key={tx.id} className="border-b pb-2">
              <p className="text-sm font-medium">{tx.type.toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">
                {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
              </p>
              <p className="text-xs">
                Status: <span className="capitalize">{tx.status}</span>
              </p>
              {tx.confirmations > 0 && <p className="text-xs">Confirmations: {tx.confirmations}</p>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Example 5: Transaction Tracking with Deposit
// ============================================================================
export function DepositWithTracking() {
  const { address } = useAccount();
  const { trackTransaction } = useTransactionTracker();
  const notify = useNotify();

  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Track transaction when hash is available
  useEffect(() => {
    if (hash && address) {
      const { setStatus } = trackTransaction(hash, "deposit", address, {
        amount: "1000000000000000000", // 1 ETH in wei
      });

      // Update status based on confirmation
      if (isSuccess) {
        setStatus("confirmed");
        notify.success("Deposit confirmed", "Your funds are now in the pool");
      }
    }
  }, [hash, address, isSuccess, trackTransaction, notify]);

  const handleDeposit = () => {
    if (!address) {
      notify.error("No wallet", "Please connect your wallet first");
      return;
    }

    // Example: deposit to a pool
    writeContract({
      address: "0x..." as `0x${string}`,
      abi: [], // Your ABI here
      functionName: "deposit",
      value: parseEther("1"),
    });
  };

  return (
    <Button onClick={handleDeposit} disabled={isPending || isConfirming}>
      {isPending ? "Confirming..." : isConfirming ? "Processing..." : "Deposit 1 ETH"}
    </Button>
  );
}

// ============================================================================
// Example 6: Sync Wagmi State with Zustand (Top-level Layout)
// ============================================================================
export function WalletStateSyncProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected, chainId, connector } = useAccount();

  // This keeps Zustand store in sync with Wagmi
  useSyncWalletState(address, isConnected, chainId, connector?.name);

  return <>{children}</>;
}

// ============================================================================
// Example 7: Global Loading State
// ============================================================================
export function AsyncOperationExample() {
  const { setGlobalLoading } = useUI();
  const notify = useNotify();

  const handleLongOperation = async () => {
    try {
      setGlobalLoading(true, "Processing your request...");

      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 3000));

      notify.success("Operation completed");
    } catch (error) {
      notify.error("Operation failed", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setGlobalLoading(false);
    }
  };

  return <Button onClick={handleLongOperation}>Start Long Operation</Button>;
}

// ============================================================================
// Example 8: Modal Management
// ============================================================================
export function ModalExample() {
  const { openModal, closeModal, activeModals } = useUI();

  const handleOpenModal = () => {
    const modalId = openModal("deposit-modal", {
      poolAddress: "0x123...",
      minAmount: "1000000000000000000",
    });

    // Auto-close after 5 seconds (example)
    setTimeout(() => {
      closeModal(modalId);
    }, 5000);
  };

  return (
    <div>
      <Button onClick={handleOpenModal}>Open Modal</Button>

      <p className="mt-2 text-sm">Active modals: {activeModals.length}</p>

      {activeModals.map((modal) => (
        <div key={modal.id} className="mt-2 border p-4">
          <p>Modal: {modal.component}</p>
          <Button onClick={() => closeModal(modal.id)} size="sm">
            Close
          </Button>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Example 9: Theme Toggle
// ============================================================================
export function ThemeToggle() {
  const { theme, setTheme } = useUI();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button onClick={toggleTheme} variant="outline">
      Current: {theme} - Toggle
    </Button>
  );
}

// ============================================================================
// Example 10: Optimized Balance Display
// ============================================================================
export function TokenBalanceDisplay({ token }: { token: string }) {
  const { balances } = useWallet();
  const balance = balances[token];

  return (
    <div className="text-sm">
      <span className="font-medium">{token}:</span>{" "}
      {balance ? (balance / BigInt(1e18)).toString() : "0"}
    </div>
  );
}
