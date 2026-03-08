# KhipuVault Custom Hooks

> Complete documentation of all custom React hooks in `apps/web/src/hooks`

## Table of Contents

- [UI and State Hooks](#ui-and-state-hooks)
- [Data Hooks](#data-hooks)
- [Web3 Common Hooks](#web3-common-hooks)
- [Individual Pool Hooks](#individual-pool-hooks)
- [Cooperative Pool Hooks](#cooperative-pool-hooks)
- [Rotating Pool Hooks](#rotating-pool-hooks)
- [Lottery Pool Hooks](#lottery-pool-hooks)
- [Mezo Protocol Hooks](#mezo-protocol-hooks)

---

## UI and State Hooks

### useToast

Toast notification system with helpers for common scenarios.

**Location:** `hooks/use-toast.ts`

```typescript
import { useToast, toast, toastSuccess, toastError, toastTransaction } from "@/hooks";

// Hook usage
function Component() {
  const { toasts, toast, dismiss } = useToast();

  // Show a toast
  toast({ title: "Hello", description: "World" });

  // Dismiss a toast
  dismiss(toastId);
}

// Direct helpers (no hook needed)
toastSuccess("Deposit successful!", "Your funds are now earning yield");
toastError(error, "Transaction failed");
toastWarning("Low balance", "Consider adding more funds");
toastInfo("Processing", "Your transaction is being confirmed");
toastTransaction("pending", "Waiting for confirmation...");
toastTransaction("success", "Transaction confirmed!");
toastTransaction("error", "Transaction reverted");
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `toasts` | `ToasterToast[]` | Current toast notifications |
| `toast` | `(props: Toast) => { id, dismiss, update }` | Show a new toast |
| `dismiss` | `(toastId?: string) => void` | Dismiss a toast |

---

### useErrorHandler

Centralized error handling with logging and categorization.

**Location:** `hooks/use-error-handler.ts`

```typescript
import { useErrorHandler } from "@/hooks";

function Component() {
  const { handleError, handleTxError, handleWalletError, isUserRejection } =
    useErrorHandler("DepositCard");

  try {
    await doSomething();
  } catch (err) {
    // General error handling
    handleError(err, {
      category: "contract",
      fallbackMessage: "Operation failed",
      silent: false, // set true to suppress toast
    });

    // Transaction-specific
    handleTxError(err, txHash);

    // Wallet errors
    handleWalletError(err);

    // Check if user rejected
    if (isUserRejection(err)) {
      // User cancelled - don't show error
    }
  }
}
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `defaultSource` | `string` | Optional component/hook name for logging |

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `handleError` | `(error, options?) => void` | Handle any error |
| `handleTxError` | `(error, txHash?) => void` | Handle transaction errors |
| `handleWalletError` | `(error) => void` | Handle wallet errors |
| `handleApiError` | `(error, endpoint?) => void` | Handle API errors |
| `isUserRejection` | `(error) => boolean` | Check if user rejected |
| `getUserMessage` | `(error, fallback?) => string` | Get user-friendly message |

---

### useModalFlow

State machine for transaction-based modal flows.

**Location:** `hooks/use-modal-flow.ts`

```typescript
import { useModalFlow, useTransactionMonitor } from "@/hooks";

function DepositModal({ open, onOpenChange }) {
  const { mutate, isPending, isSuccess, error, hash } = useDeposit();

  const flow = useModalFlow({
    onSuccess: (txHash) => {
      console.log("Success:", txHash);
    },
    onError: (error) => {
      console.error("Error:", error);
    },
    invalidateKeys: [["individual-pool-v3"]],
    autoCloseDelay: 2000,
    onClose: () => onOpenChange(false),
    successMessage: "Deposit successful!",
  });

  // Connect transaction state to modal flow
  useTransactionMonitor({
    isPending,
    isSuccess,
    error,
    hash,
    flow,
  });

  const handleSubmit = async () => {
    flow.startConfirming();
    await mutate({ amount });
  };

  return (
    <Dialog>
      {flow.step === "input" && <InputStep />}
      {flow.step === "confirming" && <ConfirmingStep />}
      {flow.step === "processing" && <ProcessingStep />}
      {flow.step === "success" && <SuccessStep txHash={flow.txHash} />}
      {flow.step === "error" && <ErrorStep message={flow.error} onRetry={flow.reset} />}
    </Dialog>
  );
}
```

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onSuccess` | `(txHash?) => void` | - | Success callback |
| `onError` | `(error) => void` | - | Error callback |
| `invalidateKeys` | `readonly unknown[][]` | - | Query keys to invalidate |
| `invalidateDelay` | `number` | 2000 | Delay before invalidation (ms) |
| `autoCloseDelay` | `number` | 2000 | Auto-close delay (ms), 0 to disable |
| `onClose` | `() => void` | - | Close modal function |
| `showToasts` | `boolean` | true | Show toast notifications |
| `successMessage` | `string` | "Transaction successful!" | Success toast message |

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `step` | `ModalStep` | Current step: idle, input, confirming, processing, success, error |
| `setStep` | `(step) => void` | Set current step |
| `error` | `string \| null` | Error message |
| `txHash` | `string \| null` | Transaction hash |
| `isProcessing` | `boolean` | Is confirming or processing |
| `isComplete` | `boolean` | Step is success |
| `reset` | `() => void` | Reset to input state |
| `executeAction` | `(action) => Promise<T>` | Wrap async action with state management |
| `handleSuccess` | `(txHash?) => void` | Call on success |
| `handleError` | `(error) => void` | Call on error |
| `startConfirming` | `() => void` | Transition to confirming |
| `startProcessing` | `() => void` | Transition to processing |

---

## Data Hooks

### useBTCPrice

Fetch current BTC price from API.

**Location:** `hooks/use-btc-price.ts`

```typescript
import { useBTCPrice } from "@/hooks";

function PriceDisplay() {
  const { price, isLoading, error } = useBTCPrice();

  return <span>${price?.toLocaleString()}</span>;
}
```

---

### useProtocolStats

Protocol-wide statistics.

**Location:** `hooks/use-protocol-stats.ts`

```typescript
import { useProtocolStats } from "@/hooks";

function Stats() {
  const { data, isLoading } = useProtocolStats();

  return (
    <div>
      <span>TVL: {data?.tvl}</span>
      <span>Users: {data?.totalUsers}</span>
    </div>
  );
}
```

---

### usePoolStats

Pool statistics aggregation.

**Location:** `hooks/use-pool-stats.ts`

```typescript
import { usePoolStats } from "@/hooks";

function PoolOverview() {
  const { data, isLoading } = usePoolStats();
  // ...
}
```

---

### usePortfolioAnalytics

User portfolio analytics.

**Location:** `hooks/use-portfolio-analytics.ts`

```typescript
import { usePortfolioAnalytics } from "@/hooks";

function Portfolio() {
  const { data, isLoading } = usePortfolioAnalytics();
  // ...
}
```

---

### useRoutePrefetch

Route prefetching for better UX.

**Location:** `hooks/use-route-prefetch.ts`

```typescript
import { useRoutePrefetch, usePrefetchLinkProps } from "@/hooks";

function Navigation() {
  // Auto-prefetch on hover
  const prefetchProps = usePrefetchLinkProps("/dashboard/individual-savings");

  return <Link {...prefetchProps}>Individual Savings</Link>;
}
```

---

## Web3 Common Hooks

### useApproveAndExecute

Generic hook for approve + execute workflows.

**Location:** `hooks/web3/common/use-approve-and-execute.ts`

```typescript
import { useApproveAndExecute } from "@/hooks/web3/common/use-approve-and-execute";

function CustomAction() {
  const { execute, isProcessing, step, error, reset } = useApproveAndExecute<[bigint]>();

  const handleAction = async () => {
    await execute({
      contractAddress: POOL_ADDRESS,
      abi: POOL_ABI,
      functionName: "deposit",
      args: [amountWei],
      requiredAllowance: amountWei,
      invalidateKeys: [["pool-key"]],
    });
  };

  return (
    <Button onClick={handleAction} disabled={isProcessing}>
      {step === "approving" && "Approving..."}
      {step === "executing" && "Depositing..."}
      {step === "idle" && "Deposit"}
    </Button>
  );
}
```

**Steps:** `idle` -> `switching-network` -> `checking` -> `approving` -> `awaiting-approval` -> `verifying-allowance` -> `executing`

---

### useMusdApproval

MUSD token approval management.

**Location:** `hooks/web3/common/use-musd-approval.ts`

```typescript
import { useMusdApproval } from "@/hooks/web3/common";

function ApprovalFlow() {
  const {
    musdBalance,
    balanceFormatted,
    allowance,
    isApprovalNeeded,
    approveUnlimited,
    approveAmount,
    isApproving,
    isApprovalConfirmed,
    error,
  } = useMusdApproval();

  // Check if approval needed for amount
  const needsApproval = isApprovalNeeded(parseEther("100"));

  // Approve unlimited (recommended)
  await approveUnlimited();

  // Or approve specific amount
  await approveAmount("100");
}
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `musdBalance` | `bigint \| undefined` | User's MUSD balance in wei |
| `balanceFormatted` | `string` | Formatted balance (e.g., "1,234.56") |
| `allowance` | `bigint \| undefined` | Current allowance in wei |
| `isApprovalNeeded` | `(amount: bigint) => boolean` | Check if amount needs approval |
| `approveUnlimited` | `() => Promise<void>` | Approve max uint256 |
| `approveAmount` | `(amount: string \| bigint) => Promise<void>` | Approve specific amount |
| `isApproving` | `boolean` | Approval transaction pending |
| `isApprovalConfirmed` | `boolean` | Approval confirmed |
| `error` | `string \| null` | Error message |

---

## Individual Pool Hooks

### useIndividualPoolV3

Combined hook for Individual Pool V3 interactions.

**Location:** `hooks/web3/use-individual-pool-v3.ts`

```typescript
import { useIndividualPoolV3 } from "@/hooks/web3/use-individual-pool-v3";

function IndividualSavings() {
  const {
    userInfo,      // UserInfoV3 | undefined
    poolStats,     // Pool statistics
    referralStats, // Referral info
    isLoading,
    error,
  } = useIndividualPoolV3();

  return (
    <div>
      <span>Deposit: {formatMUSD(userInfo?.deposit)}</span>
      <span>Yields: {formatMUSD(userInfo?.yields)}</span>
      <span>APR: {userInfo?.estimatedAPR}%</span>
    </div>
  );
}
```

---

### useDeposit / usePartialWithdraw / useFullWithdraw

Transaction hooks for Individual Pool.

**Location:** `hooks/web3/individual/use-deposit-hooks.ts`

```typescript
import { useDeposit, usePartialWithdraw, useFullWithdraw } from "@/hooks/web3/individual";

function DepositForm() {
  const { deposit, isDepositing, isConfirming, isSuccess, error, hash } = useDeposit();

  const handleDeposit = async () => {
    // With referrer
    await deposit(parseEther("100"), referrerAddress);

    // Without referrer
    await deposit(parseEther("100"));
  };
}

function WithdrawForm() {
  const { partialWithdraw, isWithdrawing } = usePartialWithdraw();
  const { fullWithdraw } = useFullWithdraw();

  // Partial withdrawal
  await partialWithdraw(parseEther("50"));

  // Full withdrawal
  await fullWithdraw();
}
```

---

### useDepositWithApprove

Deposit with automatic approval handling.

**Location:** `hooks/web3/use-deposit-with-approve.ts`

```typescript
import { useDepositWithApprove } from "@/hooks/web3/use-deposit-with-approve";

function DepositCard() {
  const {
    deposit,
    isApproving,
    isDepositing,
    isProcessing,
    isSuccess,
    approveHash,
    depositHash,
    step,
    error,
    reset,
  } = useDepositWithApprove();

  const handleDeposit = async () => {
    try {
      await deposit("100"); // Handles approval + deposit
    } catch (err) {
      // Error already handled via step/error
    }
  };
}
```

---

## Cooperative Pool Hooks

### useCooperativePool

Read cooperative pool data.

**Location:** `hooks/web3/cooperative/`

```typescript
import { useCooperativePoolV3 } from "@/hooks/web3/use-cooperative-pool";

function CooperativePoolDetails({ poolId }) {
  const { poolInfo, members, memberInfo, isLoading } = useCooperativePoolV3(poolId);
}
```

---

## Rotating Pool Hooks

### useRotatingPool

Combined hook for Rotating Pool (ROSCA) data.

**Location:** `hooks/web3/rotating/use-rotating-pool.ts`

```typescript
import {
  useRotatingPool,
  usePoolInfo,
  useMemberInfo,
  usePoolCounter,
  PoolStatus,
} from "@/hooks/web3/rotating";

function ROSCADetails({ poolId }) {
  const { poolInfo, memberInfo, periodInfo, isPending, error } = useRotatingPool(poolId);

  // Individual queries
  const { data: pool } = usePoolInfo(poolId);
  const { data: member } = useMemberInfo(poolId);
  const { data: counter } = usePoolCounter();
}
```

**PoolStatus Enum:**

```typescript
enum PoolStatus {
  FORMING = 0,
  ACTIVE = 1,
  COMPLETED = 2,
  CANCELLED = 3,
}
```

**Types:**

```typescript
interface PoolInfo {
  poolId: bigint;
  name: string;
  creator: Address;
  memberCount: bigint;
  contributionAmount: bigint;
  periodDuration: bigint;
  currentPeriod: bigint;
  totalPeriods: bigint;
  startTime: bigint;
  status: PoolStatus;
  // ...
}

interface MemberInfo {
  memberAddress: Address;
  memberIndex: bigint;
  contributionsMade: bigint;
  totalContributed: bigint;
  hasReceivedPayout: boolean;
  active: boolean;
  // ...
}
```

---

### useCreateRotatingPool / useJoinRotatingPool

Mutation hooks for ROSCA.

**Location:** `hooks/web3/rotating/`

```typescript
import { useCreateRotatingPool, useJoinRotatingPool } from "@/hooks/web3/rotating";

function CreateROSCA() {
  const { createPool, isPending, error } = useCreateRotatingPool();

  await createPool({
    name: "Family ROSCA",
    contributionAmount: parseEther("0.01"),
    periodDuration: 604800, // 1 week
    maxMembers: 5,
  });
}

function JoinROSCA({ poolId }) {
  const { joinPool, isPending } = useJoinRotatingPool();

  await joinPool(poolId);
}
```

---

## Lottery Pool Hooks

### useLotteryPool (Barrel Export)

All lottery hooks re-exported from single location.

**Location:** `hooks/web3/lottery/use-lottery-pool.ts`

```typescript
import {
  // Queries
  useCurrentRound,
  useAllRounds,
  useUserTickets,
  useUserInvestment,
  useUserProbability,
  useUserLotteryStats,
  // Mutations
  useBuyTickets,
  useClaimPrize,
  useWithdrawCapital,
  useDrawWinner,
  useCreateRound,
  // Helpers
  formatBTC,
  getLotteryTypeText,
  getStatusText,
  getStatusColor,
  getTimeRemaining,
  formatProbability,
} from "@/hooks/web3/lottery/use-lottery-pool";

function LotteryPage() {
  const { data: currentRound, isLoading } = useCurrentRound();
  const { data: tickets } = useUserTickets(currentRound?.id, address);
  const { buyTickets, isPending } = useBuyTickets();

  const handleBuy = async () => {
    await buyTickets({
      roundId: currentRound.id,
      quantity: 5,
    });
  };
}
```

---

### useLotteryCountdown

Countdown timer for lottery rounds.

**Location:** `hooks/web3/lottery/use-lottery-countdown.ts`

```typescript
import { useLotteryCountdown } from "@/hooks/web3/lottery";

function Countdown({ endTime }) {
  const { days, hours, minutes, seconds, isExpired } = useLotteryCountdown(endTime);

  return (
    <div>
      {isExpired ? "Round ended" : `${days}d ${hours}h ${minutes}m ${seconds}s`}
    </div>
  );
}
```

---

### useBuyTicketsWithApprove

Buy lottery tickets with automatic MUSD approval.

**Location:** `hooks/web3/lottery/use-buy-tickets-with-approve.ts`

```typescript
import { useBuyTicketsWithApprove } from "@/hooks/web3/lottery";

function BuyTickets() {
  const { buyTickets, isApproving, isBuying, isProcessing, step, error } =
    useBuyTicketsWithApprove();

  await buyTickets(roundId, ticketCount);
}
```

---

## Mezo Protocol Hooks

### useMezoTroveManager

Interact with Mezo's Liquity-based Trove Manager.

**Location:** `hooks/web3/mezo/use-mezo-trove-manager.ts`

```typescript
import { useMezoTroveManager } from "@/hooks/web3/mezo";

function TroveDetails() {
  const { troveStatus, troveDebt, troveColl, troveCR, isLoading } = useMezoTroveManager(address);
}
```

---

### useMezoPriceFeed

Get BTC price from Mezo's price feed.

**Location:** `hooks/web3/mezo/use-mezo-price-feed.ts`

```typescript
import { useMezoPriceFeed } from "@/hooks/web3/mezo";

function PriceDisplay() {
  const { price, lastUpdate, isLoading } = useMezoPriceFeed();
}
```

---

### useMezoStabilityPool

Mezo Stability Pool interactions.

**Location:** `hooks/web3/mezo/use-mezo-stability-pool.ts`

```typescript
import { useMezoStabilityPool } from "@/hooks/web3/mezo";

function StabilityPoolInfo() {
  const { totalDeposits, userDeposit, pendingGains, isLoading } = useMezoStabilityPool(address);
}
```

---

### useLiquidationMonitor

Monitor liquidation risk.

**Location:** `hooks/web3/mezo/use-liquidation-monitor.ts`

```typescript
import { useLiquidationMonitor } from "@/hooks/web3/mezo";

function LiquidationAlert({ address }) {
  const {
    isAtRisk,
    collateralRatio,
    liquidationPrice
  } = useLiquidationMonitor(address);

  if (isAtRisk) {
    return <Alert>Your position is at risk of liquidation!</Alert>;
  }
}
```

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [WEB3.md](./WEB3.md) - Blockchain integration guide
- [COMPONENTS.md](./COMPONENTS.md) - UI components
