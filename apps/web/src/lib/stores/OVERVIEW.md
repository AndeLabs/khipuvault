# State Management Overview - KhipuVault

## Summary

Centralized state management system using **Zustand** with TypeScript, optimized for Web3 applications.

**Total Lines of Code:** ~950 lines
**Installation:** `pnpm add zustand --filter @khipu/web` (Already installed)

## Architecture

```
apps/web/src/
├── lib/stores/               # Zustand stores
│   ├── ui-store.ts          # UI state (sidebar, modals, notifications)
│   ├── wallet-store.ts      # Wallet connection state
│   ├── transaction-store.ts # Pending transactions tracking
│   ├── index.ts             # Re-exports
│   ├── examples.tsx         # Code examples
│   ├── README.md            # Documentation
│   ├── MIGRATION_GUIDE.md   # Migration patterns
│   └── OVERVIEW.md          # This file
└── hooks/
    └── use-stores.ts        # Convenience hooks (19 hooks)
```

## Stores

### 1. UI Store (4.1 KB)

- **Purpose:** Manage UI-related state
- **State:**
  - Sidebar (open/collapsed)
  - Active modals
  - Notifications queue
  - Global loading
  - Theme preference
- **Persisted:** `isSidebarCollapsed`, `theme`
- **Hooks:** `useUI()`, `useSidebar()`, `useNotifications()`, `useModals()`, `useTheme()`, `useGlobalLoading()`, `useNotify()`

### 2. Wallet Store (3.9 KB)

- **Purpose:** Centralize wallet connection state
- **State:**
  - Connection status
  - Wallet address
  - Chain ID and name
  - Connector info
  - Token balances (cache)
  - User preferences
- **Persisted:** `autoConnect`, `preferredConnector`
- **Hooks:** `useWallet()`, `useWalletStatus()`, `useWalletAddress()`, `useChainInfo()`, `useWalletPreferences()`, `useTokenBalance()`, `useAllBalances()`, `useSyncWalletState()`

### 3. Transaction Store (8.5 KB)

- **Purpose:** Track pending transactions
- **State:**
  - Pending transactions array
  - Transaction history
  - Auto-removal settings
- **Persisted:** `transactions`, `history`, `autoRemoveConfirmed`, `autoRemoveDelay`
- **Hooks:** `useTransactions()`, `usePendingTransactions()`, `useHasPendingTransactions()`, `usePendingTransactionsCount()`, `useTransactionTracker()`

## Key Features

### 1. TypeScript Support

All stores are fully typed with exported interfaces:

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

### 2. Persistence

Uses `zustand/middleware/persist` with localStorage:

- **khipu-ui-store:** Sidebar collapsed state and theme
- **khipu-wallet-store:** Auto-connect and preferred connector
- **khipu-transaction-store:** Pending transactions and history

### 3. Optimized Selectors

All hooks use `useShallow` for efficient re-renders:

```typescript
// Only re-renders when address or isConnected changes
const { address, isConnected } = useWallet();
```

### 4. Wagmi Integration

Sync Wagmi state to Zustand store:

```typescript
const { address, isConnected, chainId, connector } = useAccount();
useSyncWalletState(address, isConnected, chainId, connector?.name);
```

### 5. Transaction Tracking

Easy transaction tracking with status updates:

```typescript
const { trackTransaction } = useTransactionTracker();
const { setStatus } = trackTransaction(hash, "deposit", address);
setStatus("confirmed");
```

### 6. Notifications

Simple notification system:

```typescript
const notify = useNotify();
notify.success("Deposit successful");
notify.error("Transaction failed");
```

## Usage Patterns

### Basic Usage

```typescript
import { useWallet, useNotify, usePendingTransactions } from '@/hooks/use-stores';

function MyComponent() {
  const { address, isConnected } = useWallet();
  const notify = useNotify();
  const { count: pendingCount } = usePendingTransactions();

  if (!isConnected) {
    return <div>Not connected</div>;
  }

  return (
    <div>
      <p>Address: {address}</p>
      <p>Pending: {pendingCount}</p>
      <button onClick={() => notify.success('Hello')}>Notify</button>
    </div>
  );
}
```

### Transaction Tracking

```typescript
import { useTransactionTracker } from '@/hooks/use-stores';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

function DepositButton() {
  const { address } = useAccount();
  const { trackTransaction } = useTransactionTracker();
  const { writeContract, data: hash } = useWriteContract();

  useWaitForTransactionReceipt({
    hash,
    onSuccess: () => tracker?.setStatus('confirmed'),
  });

  let tracker: ReturnType<typeof trackTransaction> | null = null;

  const handleDeposit = () => {
    writeContract({ /* ... */ });
    if (hash && address) {
      tracker = trackTransaction(hash, 'deposit', address);
    }
  };

  return <button onClick={handleDeposit}>Deposit</button>;
}
```

## Performance

### Optimization Techniques

1. **Shallow comparison:** All hooks use `useShallow` to prevent unnecessary re-renders
2. **Selective subscriptions:** Use specific hooks (e.g., `useHasPendingTransactions()`) instead of full store
3. **Memoized selectors:** Pre-defined selectors for common access patterns
4. **Persist only necessary data:** Only user preferences are persisted

### Re-render Optimization

```typescript
// Bad - re-renders on any store change
const store = useUIStore();
const { theme } = store;

// Good - only re-renders when theme changes
const { theme } = useUI();

// Best - only re-renders when theme changes (direct selector)
const { theme } = useTheme();
```

## Testing

### Reset Stores

```typescript
import { useUIStore, useWalletStore, useTransactionStore } from "@/lib/stores";

beforeEach(() => {
  useUIStore.getState().reset();
  useWalletStore.getState().reset();
  useTransactionStore.getState().reset();
});
```

### Mock State

```typescript
import { useWalletStore } from "@/lib/stores";

beforeEach(() => {
  useWalletStore.setState({
    address: "0x123..." as `0x${string}`,
    isConnected: true,
  });
});
```

## Migration

See `MIGRATION_GUIDE.md` for detailed migration patterns from:

- useState/useReducer
- Context API
- Local state management

## Examples

See `examples.tsx` for 10 practical examples:

1. Sidebar toggle
2. Notifications
3. Wallet state display
4. Pending transactions list
5. Transaction tracking with deposit
6. Wagmi state sync provider
7. Global loading state
8. Modal management
9. Theme toggle
10. Optimized balance display

## Benefits

### Before (without stores)

- Multiple useState across components
- Props drilling
- Duplicate state
- Context re-render issues
- No persistence
- Hard to test

### After (with stores)

- Centralized state
- No props drilling
- Single source of truth
- Optimized re-renders
- Automatic persistence
- Easy testing

## API Reference

### 19 Convenience Hooks

**UI Hooks:**

- `useUI()` - Full UI store
- `useSidebar()` - Sidebar state only
- `useNotifications()` - Notifications only
- `useModals()` - Modals only
- `useTheme()` - Theme only
- `useGlobalLoading()` - Loading state only
- `useNotify()` - Helper for adding notifications

**Wallet Hooks:**

- `useWallet()` - Full wallet store
- `useWalletStatus()` - Connection status only
- `useWalletAddress()` - Address only
- `useChainInfo()` - Chain info only
- `useWalletPreferences()` - Preferences only
- `useTokenBalance(token)` - Specific token balance
- `useAllBalances()` - All balances
- `useSyncWalletState()` - Sync Wagmi to store

**Transaction Hooks:**

- `useTransactions()` - Full transaction store
- `usePendingTransactions()` - Pending txs only
- `useHasPendingTransactions()` - Boolean check
- `usePendingTransactionsCount()` - Count only
- `useTransactionTracker()` - Helper for tracking

## Next Steps

1. **Integration:** Add `useSyncWalletState` to root layout
2. **Migration:** Start migrating components one by one
3. **Testing:** Update tests to reset stores
4. **Cleanup:** Remove old state management code

## Resources

- **Zustand Docs:** https://zustand.docs.pmnd.rs/
- **React Query Integration:** Already integrated in project
- **Wagmi Docs:** https://wagmi.sh/

## Status

- ✅ Stores created and typed
- ✅ Hooks implemented with shallow comparison
- ✅ Persistence configured
- ✅ Examples provided
- ✅ Documentation complete
- ✅ TypeScript compilation verified
- ⏳ Integration pending (add to root layout)
- ⏳ Migration pending (replace existing state)

---

**Total Implementation:**

- 3 stores (~16 KB)
- 19 convenience hooks (~9 KB)
- 10 examples (~9 KB)
- Full documentation (~25 KB)
- **Total:** ~950 lines of code
