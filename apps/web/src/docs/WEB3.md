# KhipuVault Web3 Integration Guide

> Guide for blockchain interactions in `apps/web`

## Table of Contents

- [Overview](#overview)
- [Connecting Wallet](#connecting-wallet)
- [Reading Contract Data](#reading-contract-data)
- [Writing Transactions](#writing-transactions)
- [Error Handling](#error-handling)
- [Contract Addresses](#contract-addresses)
- [Testing Web3 Code](#testing-web3-code)

---

## Overview

KhipuVault uses the following stack for Web3 interactions:

| Library            | Version | Purpose                      |
| ------------------ | ------- | ---------------------------- |
| **Wagmi**          | 2.x     | React hooks for Ethereum     |
| **Viem**           | 2.x     | TypeScript Ethereum library  |
| **TanStack Query** | 5.x     | Caching and state management |

### Network Configuration

- **Network:** Mezo Testnet
- **Chain ID:** 31611
- **RPC URL:** `https://rpc.testnet.mezo.org`
- **Explorer:** `https://explorer.testnet.mezo.org`

### Connector

KhipuVault uses **MetaMask only** via the official `metaMask()` connector from Wagmi.

---

## Connecting Wallet

### Basic Connection

Use the `ConnectButton` component or the Wagmi hooks directly.

```tsx
import { useAccount, useConnect, useDisconnect } from "wagmi";

function WalletConnection() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div>
        <p>Connected: {address}</p>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return (
    <button onClick={() => connect({ connector: connectors[0] })} disabled={isConnecting}>
      {isConnecting ? "Connecting..." : "Connect MetaMask"}
    </button>
  );
}
```

### Check Network

```tsx
import { useChainId, useSwitchChain } from "wagmi";
import { mezoTestnet } from "@/lib/web3/chains";

function NetworkCheck() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isCorrectNetwork = chainId === mezoTestnet.id;

  if (!isCorrectNetwork) {
    return (
      <button onClick={() => switchChain({ chainId: mezoTestnet.id })}>
        Switch to Mezo Testnet
      </button>
    );
  }

  return <span>Connected to Mezo Testnet</span>;
}
```

### Get Balances

```tsx
import { useBalance } from "wagmi";

function Balances() {
  const { address } = useAccount();

  // Native BTC balance
  const { data: btcBalance } = useBalance({ address });

  // MUSD token balance
  const { data: musdBalance } = useBalance({
    address,
    token: "0x..." as `0x${string}`, // MUSD address
  });

  return (
    <div>
      <p>BTC: {btcBalance?.formatted}</p>
      <p>MUSD: {musdBalance?.formatted}</p>
    </div>
  );
}
```

---

## Reading Contract Data

### Using useReadContract

For single contract reads:

```tsx
import { useReadContract } from "wagmi";
import { MEZO_V3_ADDRESSES, INDIVIDUAL_POOL_V3_ABI } from "@/lib/web3/contracts-v3";

function UserInfo() {
  const { address } = useAccount();

  const { data, isLoading, error } = useReadContract({
    address: MEZO_V3_ADDRESSES.individualPool as `0x${string}`,
    abi: INDIVIDUAL_POOL_V3_ABI,
    functionName: "getUserInfo",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 60 * 1000, // 1 minute
    },
  });

  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      <p>Deposit: {formatMUSD(data?.deposit)}</p>
      <p>Yields: {formatMUSD(data?.yields)}</p>
    </div>
  );
}
```

### Using Custom Hooks

Prefer using the provided hooks that wrap `useReadContract`:

```tsx
import { useIndividualPoolV3 } from "@/hooks/web3/use-individual-pool-v3";
import { useRotatingPool } from "@/hooks/web3/rotating";
import { useCurrentRound } from "@/hooks/web3/lottery";

function Dashboard() {
  // Individual pool data
  const { userInfo, poolStats, isLoading } = useIndividualPoolV3();

  // Rotating pool data
  const { poolInfo, memberInfo } = useRotatingPool(poolId);

  // Lottery data
  const { data: currentRound } = useCurrentRound();

  // ...
}
```

### Query Configuration

Use query presets from `lib/query-config.ts`:

```typescript
import { QUERY_PRESETS } from "@/lib/query-config";

// Available presets:
QUERY_PRESETS.STATIC; // Never refetch (constants)
QUERY_PRESETS.SLOW; // Refetch every 5 minutes
QUERY_PRESETS.NORMAL; // Refetch every 1 minute
QUERY_PRESETS.FAST; // Refetch every 30 seconds
QUERY_PRESETS.BLOCKCHAIN_READ; // Optimized for blockchain reads
```

### Direct Contract Reads (No Hook)

For one-off reads outside React:

```typescript
import { readContract } from "wagmi/actions";
import { getWagmiConfig } from "@/lib/web3/config";

const config = getWagmiConfig();

const data = await readContract(config, {
  address: MEZO_V3_ADDRESSES.individualPool,
  abi: INDIVIDUAL_POOL_V3_ABI,
  functionName: "getUserInfo",
  args: [userAddress],
});
```

---

## Writing Transactions

### Basic Pattern: useWriteContract

```tsx
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";

function DepositForm() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleDeposit = () => {
    writeContract({
      address: POOL_ADDRESS,
      abi: POOL_ABI,
      functionName: "deposit",
      args: [parseEther("100")],
    });
  };

  return (
    <div>
      <button onClick={handleDeposit} disabled={isPending || isConfirming}>
        {isPending && "Confirm in wallet..."}
        {isConfirming && "Confirming..."}
        {!isPending && !isConfirming && "Deposit"}
      </button>

      {isSuccess && <p>Deposit successful!</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### Approve + Execute Pattern

For ERC20 token operations, use the `useApproveAndExecute` hook:

```tsx
import { useApproveAndExecute } from "@/hooks/web3/common/use-approve-and-execute";
import { parseEther } from "viem";

function DepositWithApproval() {
  const { execute, isApproving, isExecuting, isProcessing, isSuccess, step, error } =
    useApproveAndExecute<[bigint]>();

  const handleDeposit = async () => {
    const amount = parseEther("100");

    await execute({
      contractAddress: POOL_ADDRESS,
      abi: POOL_ABI,
      functionName: "deposit",
      args: [amount],
      requiredAllowance: amount,
      invalidateKeys: [["individual-pool-v3"]],
    });
  };

  return (
    <div>
      <button onClick={handleDeposit} disabled={isProcessing}>
        {step === "checking" && "Checking..."}
        {step === "approving" && "Approving MUSD..."}
        {step === "awaiting-approval" && "Confirming approval..."}
        {step === "executing" && "Depositing..."}
        {step === "idle" && "Deposit"}
      </button>
    </div>
  );
}
```

### Using Pre-built Hooks

For common operations, use the provided hooks:

```tsx
// Individual Pool
import { useDepositWithApprove } from "@/hooks/web3/use-deposit-with-approve";

const { deposit, isProcessing, step, error } = useDepositWithApprove();
await deposit("100"); // Handles approval automatically

// Lottery
import { useBuyTicketsWithApprove } from "@/hooks/web3/lottery";

const { buyTickets, isProcessing } = useBuyTicketsWithApprove();
await buyTickets(roundId, ticketCount);
```

### Cache Invalidation After Transactions

Use the query keys factory for precise invalidation:

```tsx
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys, invalidationPresets } from "@/lib/query-keys";

function AfterTransaction() {
  const queryClient = useQueryClient();

  // Invalidate specific queries
  await queryClient.invalidateQueries({
    queryKey: queryKeys.individualPool.userInfo(address),
  });

  // Or use presets
  await invalidationPresets.afterDeposit(queryClient, address);
  await invalidationPresets.afterWithdraw(queryClient, address);
  await invalidationPresets.afterJoinPool(queryClient, poolId, address);
}
```

---

## Error Handling

### Web3 Error Parser

Use the centralized error parser for user-friendly messages:

```tsx
import { parseWeb3Error, getErrorMessage, isRecoverableError } from "@/lib/errors/web3-errors";

try {
  await someTransaction();
} catch (error) {
  const parsed = parseWeb3Error(error);

  console.log(parsed.category); // "user_rejected" | "insufficient_funds" | etc.
  console.log(parsed.userMessage); // Spanish user-friendly message
  console.log(parsed.isRecoverable); // Can user retry?
  console.log(parsed.recoveryAction); // Suggested action

  // Or just get the message
  const message = getErrorMessage(error);
  toast.error(message);
}
```

### Error Categories

| Category             | Description              | Example                       |
| -------------------- | ------------------------ | ----------------------------- |
| `user_rejected`      | User cancelled in wallet | "User rejected the request"   |
| `insufficient_funds` | Not enough gas or tokens | "Insufficient funds for gas"  |
| `contract_error`     | Smart contract revert    | "NoActiveDeposit", "PoolFull" |
| `network_error`      | RPC or connection issues | "Network timeout"             |
| `validation_error`   | Invalid input            | "Amount too small"            |
| `unknown`            | Unclassified             | Any other error               |

### Contract Error Messages

The parser maps contract errors to Spanish messages:

```typescript
// Contract throws: "InsufficientBalance"
// User sees: "Saldo insuficiente"

// Contract throws: "DepositTooSmall"
// User sees: "El deposito es muy pequeno"
// Recovery: "El minimo es 10 mUSD"
```

### Using useErrorHandler Hook

```tsx
import { useErrorHandler } from "@/hooks";

function Component() {
  const { handleError, handleTxError, isUserRejection } = useErrorHandler("DepositCard");

  try {
    await deposit();
  } catch (err) {
    if (isUserRejection(err)) {
      // User cancelled - show warning, not error
      return;
    }

    handleTxError(err, txHash);
  }
}
```

### Error Boundaries for Web3

Wrap Web3 components in error boundaries:

```tsx
import { Web3ErrorBoundary } from "@/components/web3-error-boundary";

<Web3ErrorBoundary>
  <DashboardContent />
</Web3ErrorBoundary>;
```

---

## Contract Addresses

### Getting Addresses

```typescript
import { MEZO_V3_ADDRESSES, getAddress } from "@/lib/web3/contracts-v3";

// Direct access
const poolAddress = MEZO_V3_ADDRESSES.individualPool;
const musdAddress = MEZO_V3_ADDRESSES.musd;

// Dynamic access
import { getAddress } from "@khipu/shared";
const address = getAddress("INDIVIDUAL_POOL");
```

### Available Contracts

| Contract         | Key               | Description           |
| ---------------- | ----------------- | --------------------- |
| Individual Pool  | `individualPool`  | Personal savings pool |
| Cooperative Pool | `cooperativePool` | Group savings pool    |
| Rotating Pool    | `rotatingPool`    | ROSCA pool            |
| Lottery Pool     | `lotteryPool`     | Prize-linked savings  |
| Yield Aggregator | `yieldAggregator` | Yield optimization    |
| MUSD Token       | `musd`            | Mezo stablecoin       |

### Mezo Protocol Contracts

| Contract            | Key                  | Description            |
| ------------------- | -------------------- | ---------------------- |
| Borrower Operations | `borrowerOperations` | Open/close troves      |
| Trove Manager       | `troveManager`       | Trove state management |
| Price Feed          | `priceFeed`          | BTC/USD price oracle   |
| Stability Pool      | `stabilityPool`      | MUSD stability pool    |
| Hint Helpers        | `hintHelpers`        | Gas optimization hints |
| Sorted Troves       | `sortedTroves`       | Trove ordering         |

### Contract ABIs

```typescript
import {
  INDIVIDUAL_POOL_V3_ABI,
  COOPERATIVE_POOL_V3_ABI,
  LOTTERY_POOL_V3_ABI,
  ROTATING_POOL_ABI,
  MUSD_ABI,
  MEZO_TROVE_MANAGER_ABI,
  MEZO_PRICE_FEED_ABI,
} from "@/lib/web3/contracts-v3";
```

---

## Testing Web3 Code

### Mocking Wagmi Hooks

```tsx
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";

// Mock useAccount
vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useAccount: () => ({
      address: "0x1234...5678",
      isConnected: true,
    }),
    useBalance: () => ({
      data: { formatted: "1.5", value: 1500000000000000000n },
    }),
    useReadContract: () => ({
      data: mockData,
      isLoading: false,
    }),
  };
});

test("renders user balance", () => {
  render(<BalanceDisplay />);
  expect(screen.getByText("1.5 BTC")).toBeInTheDocument();
});
```

### Testing Transaction Hooks

```tsx
import { renderHook, act } from "@testing-library/react";
import { useDeposit } from "@/hooks/web3/individual";

test("deposit hook", async () => {
  const { result } = renderHook(() => useDeposit(), {
    wrapper: TestProviders,
  });

  await act(async () => {
    await result.current.deposit(parseEther("100"));
  });

  expect(result.current.isSuccess).toBe(true);
});
```

### Test Utilities

```tsx
// test/setup.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { getWagmiConfig } from "@/lib/web3/config";

export function TestProviders({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <WagmiProvider config={getWagmiConfig()}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
```

---

## Best Practices

### 1. Always Check Connection

```tsx
function Component() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return <ConnectPrompt />;
  }

  // Safe to use address
}
```

### 2. Handle Loading States

```tsx
const { data, isLoading, error } = useReadContract({...});

if (isLoading) return <Skeleton />;
if (error) return <ErrorDisplay error={error} />;
if (!data) return <EmptyState />;

return <DataDisplay data={data} />;
```

### 3. Use Query Keys Factory

```tsx
// Good
queryKey: queryKeys.individualPool.userInfo(address);

// Bad
queryKey: ["individual-pool", "user-info", address];
```

### 4. Invalidate Cache After Mutations

```tsx
const queryClient = useQueryClient();

// After successful transaction
await queryClient.invalidateQueries({
  queryKey: queryKeys.individualPool.all,
});
```

### 5. Handle User Rejections Gracefully

```tsx
if (isUserRejection(error)) {
  toast.warning("Transaction cancelled");
  return;
}
toast.error(getErrorMessage(error));
```

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [HOOKS.md](./HOOKS.md) - Custom hooks documentation
- [COMPONENTS.md](./COMPONENTS.md) - UI components
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
