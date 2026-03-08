# KhipuVault State Management

This directory contains centralized Zustand stores for managing application state.

## Stores

### UI Store (`ui-store.ts`)

Manages UI-related state including sidebar, modals, notifications, loading states, and theme.

**State:**

- Sidebar (open/collapsed)
- Active modals
- Notifications queue
- Global loading state
- Theme preference

**Persisted:** `isSidebarCollapsed`, `theme`

**Example:**

```typescript
import { useUI, useNotify } from '@/hooks/use-stores';

function MyComponent() {
  const { isSidebarOpen, toggleSidebar } = useUI();
  const notify = useNotify();

  const handleAction = () => {
    notify.success('Action completed!');
  };

  return <button onClick={handleAction}>Do Something</button>;
}
```

### Wallet Store (`wallet-store.ts`)

Manages wallet connection state, chain information, and cached balances.

**State:**

- Connection status (disconnected/connecting/connected)
- Wallet address
- Chain ID and name
- Connector information
- Token balances cache
- User preferences (auto-connect, preferred connector)

**Persisted:** `autoConnect`, `preferredConnector`

**Example:**

```typescript
import { useWallet, useTokenBalance } from '@/hooks/use-stores';

function WalletInfo() {
  const { address, isConnected, chainName } = useWallet();
  const musdBalance = useTokenBalance('MUSD');

  if (!isConnected) return <div>Not connected</div>;

  return (
    <div>
      <p>Address: {address}</p>
      <p>Chain: {chainName}</p>
      <p>MUSD Balance: {musdBalance}</p>
    </div>
  );
}
```

### Transaction Store (`transaction-store.ts`)

Tracks pending transactions with status updates, confirmations, and history.

**State:**

- Pending transactions array
- Transaction history
- Settings (max pending, history size, auto-remove)

**Persisted:** `transactions`, `history`, `autoRemoveConfirmed`, `autoRemoveDelay`

**Example:**

```typescript
import { useTransactionTracker, usePendingTransactions } from '@/hooks/use-stores';
import { useWaitForTransactionReceipt } from 'wagmi';

function DepositButton() {
  const { trackTransaction } = useTransactionTracker();
  const { writeContract, data: hash } = useWriteContract();

  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      tracker.setStatus('confirmed');
    },
    onError: () => {
      tracker.setStatus('failed', 'Transaction reverted');
    }
  });

  let tracker: ReturnType<typeof trackTransaction>;

  const handleDeposit = () => {
    writeContract({
      address: POOL_ADDRESS,
      abi: POOL_ABI,
      functionName: 'deposit',
      args: [amount],
    });

    if (hash) {
      tracker = trackTransaction(hash, 'deposit', address);
    }
  };

  return <button onClick={handleDeposit}>Deposit</button>;
}
```

## Convenience Hooks

All stores can be accessed through convenient hooks in `/hooks/use-stores.ts`:

### UI Hooks

- `useUI()` - Full UI store
- `useSidebar()` - Sidebar state only
- `useNotifications()` - Notifications only
- `useModals()` - Modals only
- `useTheme()` - Theme only
- `useGlobalLoading()` - Loading state only
- `useNotify()` - Helper for adding notifications

### Wallet Hooks

- `useWallet()` - Full wallet store
- `useWalletStatus()` - Connection status only
- `useWalletAddress()` - Address only
- `useChainInfo()` - Chain info only
- `useWalletPreferences()` - Preferences only
- `useTokenBalance(token)` - Specific token balance
- `useAllBalances()` - All balances

### Transaction Hooks

- `useTransactions()` - Full transaction store
- `usePendingTransactions()` - Pending txs only (optimized)
- `useHasPendingTransactions()` - Boolean check
- `usePendingTransactionsCount()` - Count only
- `useTransactionTracker()` - Helper for tracking new txs

## Best Practices

### 1. Use Shallow Comparison

All convenience hooks use `useShallow` for better performance. Only re-renders when selected values change.

```typescript
// Good - uses shallow comparison
const { address, isConnected } = useWallet();

// Avoid - creates new object reference on every render
const wallet = useWalletStore((state) => ({
  address: state.address,
  isConnected: state.isConnected,
}));
```

### 2. Use Selectors for Specific Data

```typescript
// Good - only re-renders when MUSD balance changes
const musdBalance = useTokenBalance("MUSD");

// Avoid - re-renders when any balance changes
const { balances } = useWallet();
const musdBalance = balances["MUSD"];
```

### 3. Sync with Wagmi

Use `useSyncWalletState` in your top-level layout to keep Zustand in sync with Wagmi:

```typescript
'use client';

import { useAccount } from 'wagmi';
import { useSyncWalletState } from '@/hooks/use-stores';

export function Layout({ children }) {
  const { address, isConnected, chainId, connector } = useAccount();

  useSyncWalletState(address, isConnected, chainId, connector?.name);

  return <>{children}</>;
}
```

### 4. Notifications Pattern

```typescript
const notify = useNotify();

// Success
notify.success("Deposit successful", "Your funds are now in the pool");

// Error
notify.error("Transaction failed", error.message);

// Warning
notify.warning("Low balance", "You may not have enough funds");

// Info
notify.info("New feature", "Check out our new analytics dashboard");
```

### 5. Transaction Tracking Pattern

```typescript
function useDeposit() {
  const { trackTransaction } = useTransactionTracker();
  const { writeContract, data: hash } = useWriteContract();
  const { address } = useAccount();

  useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      // Transaction confirmed on-chain
    },
  });

  const deposit = (amount: bigint) => {
    writeContract({
      address: POOL_ADDRESS,
      abi: POOL_ABI,
      functionName: "deposit",
      args: [amount],
    });

    // Track transaction immediately
    if (hash && address) {
      const { setStatus, setConfirmations } = trackTransaction(
        hash,
        "deposit",
        address,
        { amount: amount.toString() } // Optional metadata
      );
    }
  };

  return { deposit };
}
```

## Persistence

Stores use `zustand/middleware/persist` with localStorage:

- **khipu-ui-store**: Sidebar collapsed state and theme
- **khipu-wallet-store**: Auto-connect and preferred connector
- **khipu-transaction-store**: Pending transactions and history

This ensures user preferences and pending transactions persist across sessions.

## TypeScript Support

All stores are fully typed. Import types as needed:

```typescript
import type {
  UIStore,
  WalletStore,
  TransactionStore,
  NotificationType,
  TransactionType,
  PendingTransaction,
} from "@/lib/stores";
```

## Testing

For testing, you can reset stores to initial state:

```typescript
import { useUIStore, useWalletStore, useTransactionStore } from "@/lib/stores";

beforeEach(() => {
  useUIStore.getState().reset();
  useWalletStore.getState().reset();
  useTransactionStore.getState().reset();
});
```
