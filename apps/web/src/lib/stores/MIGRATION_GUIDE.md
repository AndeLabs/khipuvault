# Migration Guide: Using Zustand Stores

This guide helps you migrate existing code to use the new centralized Zustand stores.

## Before You Start

Make sure you have installed zustand:

```bash
pnpm add zustand --filter @khipu/web
```

## Migration Patterns

### 1. Migrating Local Notification State

**Before (useState):**

```typescript
function MyComponent() {
  const [notification, setNotification] = useState<string | null>(null);

  const handleAction = async () => {
    try {
      await someAction();
      setNotification('Success!');
    } catch (error) {
      setNotification('Error occurred');
    }
  };

  return (
    <>
      {notification && <Toast>{notification}</Toast>}
      <button onClick={handleAction}>Do Action</button>
    </>
  );
}
```

**After (useNotify):**

```typescript
import { useNotify } from '@/hooks/use-stores';

function MyComponent() {
  const notify = useNotify();

  const handleAction = async () => {
    try {
      await someAction();
      notify.success('Success!');
    } catch (error) {
      notify.error('Error occurred');
    }
  };

  return <button onClick={handleAction}>Do Action</button>;
}
```

### 2. Migrating Wagmi Wallet State

**Before (useAccount directly):**

```typescript
function WalletInfo() {
  const { address, isConnected } = useAccount();

  // Using these in multiple places creates multiple subscriptions
  return (
    <div>
      <p>{address}</p>
      <p>{isConnected ? 'Connected' : 'Disconnected'}</p>
    </div>
  );
}
```

**After (useWallet with centralized state):**

```typescript
import { useWallet } from '@/hooks/use-stores';

function WalletInfo() {
  const { address, isConnected } = useWallet();

  // More efficient, single source of truth
  return (
    <div>
      <p>{address}</p>
      <p>{isConnected ? 'Connected' : 'Disconnected'}</p>
    </div>
  );
}
```

**Add this to your root layout:**

```typescript
'use client';

import { useAccount } from 'wagmi';
import { useSyncWalletState } from '@/hooks/use-stores';

export function RootLayout({ children }) {
  const { address, isConnected, chainId, connector } = useAccount();

  // Sync Wagmi state to Zustand
  useSyncWalletState(address, isConnected, chainId, connector?.name);

  return <>{children}</>;
}
```

### 3. Migrating Transaction Tracking

**Before (local state):**

```typescript
function DepositButton() {
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const { writeContract, data: hash } = useWriteContract();

  const { isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => setTxStatus('success'),
    onError: () => setTxStatus('error'),
  });

  useEffect(() => {
    if (hash) setTxStatus('pending');
  }, [hash]);

  return <button>Deposit</button>;
}
```

**After (useTransactionTracker):**

```typescript
import { useTransactionTracker } from '@/hooks/use-stores';

function DepositButton() {
  const { address } = useAccount();
  const { trackTransaction } = useTransactionTracker();
  const { writeContract, data: hash } = useWriteContract();

  useWaitForTransactionReceipt({
    hash,
    onSuccess: () => tracker?.setStatus('confirmed'),
    onError: () => tracker?.setStatus('failed'),
  });

  let tracker: ReturnType<typeof trackTransaction> | null = null;

  const handleDeposit = () => {
    writeContract({
      address: POOL_ADDRESS,
      abi: POOL_ABI,
      functionName: 'deposit',
      args: [amount],
    });

    if (hash && address) {
      tracker = trackTransaction(hash, 'deposit', address);
    }
  };

  return <button onClick={handleDeposit}>Deposit</button>;
}
```

### 4. Migrating Sidebar State

**Before (Context API):**

```typescript
// SidebarContext.tsx
const SidebarContext = createContext<{
  isOpen: boolean;
  toggle: () => void;
}>({ isOpen: true, toggle: () => {} });

export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  const toggle = () => setIsOpen(!isOpen);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Component.tsx
function SidebarToggle() {
  const { toggle } = useContext(SidebarContext);
  return <button onClick={toggle}>Toggle</button>;
}
```

**After (useSidebar):**

```typescript
import { useSidebar } from '@/hooks/use-stores';

function SidebarToggle() {
  const { toggle } = useSidebar();
  return <button onClick={toggle}>Toggle</button>;
}
```

### 5. Migrating Modal State

**Before (useState):**

```typescript
function MyPage() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowDepositModal(true)}>Deposit</button>
      <button onClick={() => setShowWithdrawModal(true)}>Withdraw</button>

      {showDepositModal && <DepositModal onClose={() => setShowDepositModal(false)} />}
      {showWithdrawModal && <WithdrawModal onClose={() => setShowWithdrawModal(false)} />}
    </>
  );
}
```

**After (useModals):**

```typescript
import { useModals } from '@/hooks/use-stores';

function MyPage() {
  const { open, close, activeModals } = useModals();

  const handleDeposit = () => {
    open('deposit-modal', { poolAddress: '0x123...' });
  };

  const handleWithdraw = () => {
    open('withdraw-modal', { amount: '1000' });
  };

  return (
    <>
      <button onClick={handleDeposit}>Deposit</button>
      <button onClick={handleWithdraw}>Withdraw</button>

      {/* Render modals based on activeModals */}
      {activeModals.map(modal => {
        if (modal.component === 'deposit-modal') {
          return <DepositModal key={modal.id} {...modal.props} onClose={() => close(modal.id)} />;
        }
        if (modal.component === 'withdraw-modal') {
          return <WithdrawModal key={modal.id} {...modal.props} onClose={() => close(modal.id)} />;
        }
        return null;
      })}
    </>
  );
}
```

## Performance Optimization

### Use Shallow Selectors

**Before:**

```typescript
// Re-renders on ANY store change
const store = useUIStore();
const { isSidebarOpen, theme } = store;
```

**After:**

```typescript
// Only re-renders when isSidebarOpen or theme changes
const { isSidebarOpen, theme } = useUI();
```

### Use Specific Selectors

**Before:**

```typescript
// Re-renders when any transaction changes
const { transactions } = useTransactions();
const hasPending = transactions.some((tx) => tx.status === "pending");
```

**After:**

```typescript
// Only re-renders when pending transaction count changes
const hasPending = useHasPendingTransactions();
```

## Testing

### Reset Stores in Tests

```typescript
import { useUIStore, useWalletStore, useTransactionStore } from "@/lib/stores";

beforeEach(() => {
  // Reset all stores to initial state
  useUIStore.getState().reset();
  useWalletStore.getState().reset();
  useTransactionStore.getState().reset();
});
```

### Mock Store State

```typescript
import { useUIStore } from "@/lib/stores";

beforeEach(() => {
  useUIStore.setState({
    isSidebarOpen: true,
    theme: "dark",
  });
});
```

## Common Pitfalls

### 1. Don't Destructure Inside Render

**Bad:**

```typescript
function Component() {
  // Creates new object on every render
  const wallet = useWalletStore((state) => ({
    address: state.address,
    isConnected: state.isConnected,
  }));
}
```

**Good:**

```typescript
function Component() {
  // Uses shallow comparison
  const { address, isConnected } = useWallet();
}
```

### 2. Don't Call Actions During Render

**Bad:**

```typescript
function Component() {
  const { setTheme } = useUI();
  setTheme('dark'); // Called on every render!

  return <div>Content</div>;
}
```

**Good:**

```typescript
function Component() {
  const { setTheme } = useUI();

  useEffect(() => {
    setTheme('dark'); // Only called once
  }, [setTheme]);

  return <div>Content</div>;
}
```

### 3. Don't Forget to Sync Wagmi State

Always add `useSyncWalletState` in your root layout:

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

## Checklist

- [ ] Install zustand
- [ ] Add `useSyncWalletState` to root layout
- [ ] Migrate notification state to `useNotify`
- [ ] Migrate wallet state to `useWallet`
- [ ] Migrate transaction tracking to `useTransactionTracker`
- [ ] Migrate sidebar state to `useSidebar`
- [ ] Migrate modal state to `useModals`
- [ ] Update tests to reset stores
- [ ] Remove old context providers
- [ ] Verify no unnecessary re-renders

## Next Steps

1. Start with one store at a time
2. Test thoroughly after each migration
3. Remove old state management code
4. Update documentation

For more examples, see `examples.tsx` in this directory.
