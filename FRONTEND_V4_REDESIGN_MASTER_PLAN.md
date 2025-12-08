# 🎨 KHIPUVAULT V4 - FRONTEND REDESIGN MASTER PLAN

**Status**: Complete Research & Analysis Done
**Version**: 4.0.0
**Date**: 2025-11-20
**Goal**: World-class DeFi frontend - Modern, Scalable, Production-ready

---

## 📋 EXECUTIVE SUMMARY

### The Problem

Current frontend (V3) has:

- ❌ Inconsistent architecture (30% migrated to features/)
- ❌ 10,000+ line components (unmaintainable)
- ❌ Duplicate/legacy code everywhere
- ❌ No tests, poor performance
- ❌ Placeholder settings, incomplete features
- ❌ Mixed design patterns, no cohesive UI

### The Solution

Complete rebuild with:

- ✅ **Clean Architecture** - Feature-based, modular, scalable
- ✅ **Modern DeFi Design** - Based on Aave, Uniswap, Compound best practices
- ✅ **Brand Identity** - Lavanda (#BFA4FF) + Orange (#FFC77D) as primary colors
- ✅ **World-class UX** - Skeleton loading, error recovery, accessibility
- ✅ **Production-ready** - Tests, monitoring, performance optimized

### Timeline

- **Phase 1** (Week 1-2): Core architecture + design system
- **Phase 2** (Week 3-4): Features implementation
- **Phase 3** (Week 5-6): Testing + optimization
- **Total**: 6 weeks to production

---

## 🎯 RESEARCH FINDINGS SUMMARY

### Top DeFi Platforms Analysis

**Aave (Material-UI + Emotion):**

- iOS app launch 2024 (mainstream adoption)
- Simplified fiat onboarding
- Multi-wallet real-time balance tracking
- Clean, professional, trustworthy design

**Uniswap v4:**

- Official Figma design kit
- Universal Router (simplified UX)
- 20x gas savings with flash accounting
- Open source interface

**Compound:**

- Clear information hierarchy
- Focus on APY/supply/borrow rates
- Minimalist design language

### Banking Best Practices

**Revolut:**

- 5-minute onboarding (benchmark)
- Biometric security with explanations
- Customizable accounts/wallets
- Built-in chat support

**N26:**

- Minimalist design philosophy
- Instant transfers (email/phone)
- Cross-platform real-time sync

**Wise:**

- Strong brand identity (bright green)
- Consistent visual language

### Key Takeaways

1. **Tech Stack Consensus (2024-2025)**:
   - Next.js 14+ (App Router)
   - shadcn/ui + Radix UI (66k stars)
   - Wagmi + Viem (type-safe)
   - RainbowKit (wallet UX standard)
   - React Query (server state)

2. **Design Patterns**:
   - Blue/Green for financial trust
   - Inter font (industry standard)
   - Sidebar navigation for complex dashboards
   - Skeleton loading (not spinners)
   - 7-step transaction feedback

3. **UX Principles**:
   - WCAG 2.2 compliance (4.5:1 contrast)
   - Trust indicators (contracts, audits, TVL)
   - Error recovery flows
   - Mobile-first responsive

---

## 🎨 DESIGN SYSTEM V4

### Brand Colors (Primary)

```css
/* Brand Identity */
--lavanda: #bfa4ff; /* Soft Lavanda - Energy, innovation, calm */
--orange: #ffc77d; /* Vivid Orange - Action, confidence, strength */

/* Semantic Colors (derived from brand) */
--primary: #bfa4ff; /* Lavanda - Primary actions, highlights */
--accent: #ffc77d; /* Orange - CTAs, important actions */
--success: #10b981; /* Green - Positive yields, success states */
--warning: #f59e0b; /* Amber - Warnings, pending states */
--error: #ef4444; /* Red - Errors, losses */

/* Neutral Palette (Dark mode optimized) */
--bg-primary: #0a0a0f; /* Deep dark - Main background */
--bg-secondary: #141419; /* Dark gray - Cards, surfaces */
--bg-tertiary: #1e1e24; /* Lighter gray - Elevated surfaces */

--text-primary: #ffffff; /* White - Main text */
--text-secondary: #a1a1aa; /* Gray - Secondary text */
--text-tertiary: #71717a; /* Darker gray - Disabled text */

--border-primary: #27272a; /* Subtle borders */
--border-secondary: #3f3f46; /* Stronger borders */
```

### Typography

```css
/* Fonts */
--font-sans: "Inter", system-ui, sans-serif;
--font-heading: "Satoshi", "Inter", sans-serif;
--font-mono: "IBM Plex Mono", monospace;

/* Scale (Type Scale 1.250 - Major Third) */
--text-xs: 0.75rem; /* 12px - Captions, labels */
--text-sm: 0.875rem; /* 14px - Body small */
--text-base: 1rem; /* 16px - Body text */
--text-lg: 1.125rem; /* 18px - Emphasized */
--text-xl: 1.25rem; /* 20px - Small headings */
--text-2xl: 1.563rem; /* 25px - Section headings */
--text-3xl: 1.953rem; /* 31px - Page headings */
--text-4xl: 2.441rem; /* 39px - Hero text */

/* Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing Scale

```css
/* Consistent 4px base unit */
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
--space-20: 5rem; /* 80px */
```

### Border Radius

```css
--radius-sm: 0.375rem; /* 6px - Small elements */
--radius-md: 0.5rem; /* 8px - Cards, inputs */
--radius-lg: 0.75rem; /* 12px - Large cards */
--radius-xl: 1rem; /* 16px - Modals */
--radius-full: 9999px; /* Pills, avatars */
```

### Shadows

```css
/* Subtle elevation (dark mode) */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.3);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.3);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.3);

/* Glow effects (brand colors) */
--glow-lavanda: 0 0 20px rgb(191 164 255 / 0.3);
--glow-orange: 0 0 20px rgb(255 199 125 / 0.3);
```

### Component Tokens

```css
/* Buttons */
--btn-primary-bg: var(--lavanda);
--btn-primary-hover: #a984e6;
--btn-primary-text: var(--bg-primary);

--btn-accent-bg: var(--orange);
--btn-accent-hover: #ffb564;
--btn-accent-text: var(--bg-primary);

--btn-ghost-hover: var(--bg-tertiary);

/* Cards */
--card-bg: var(--bg-secondary);
--card-border: var(--border-primary);
--card-hover-border: var(--lavanda);

/* Inputs */
--input-bg: var(--bg-tertiary);
--input-border: var(--border-secondary);
--input-focus-border: var(--lavanda);
```

---

## 🏗️ NEW ARCHITECTURE

### Directory Structure (Clean Architecture)

```
apps/web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (landing)/                # Landing pages group
│   │   │   ├── page.tsx              # Home page
│   │   │   ├── about/
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/              # Dashboard group
│   │   │   ├── layout.tsx            # Dashboard layout
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Dashboard home
│   │   │   ├── savings/
│   │   │   │   ├── individual/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── cooperative/
│   │   │   │       └── page.tsx
│   │   │   ├── portfolio/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   │
│   │   └── layout.tsx                # Root layout
│   │
│   ├── features/                     # Feature modules
│   │   ├── individual-savings/
│   │   │   ├── components/
│   │   │   │   ├── DepositCard/
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── DepositCard.tsx
│   │   │   │   │   ├── DepositCard.test.tsx
│   │   │   │   │   └── useDepositCard.ts
│   │   │   │   ├── PositionCard/
│   │   │   │   ├── WithdrawDialog/
│   │   │   │   ├── YieldChart/
│   │   │   │   └── TransactionHistory/
│   │   │   ├── hooks/
│   │   │   │   ├── useIndividualPool.ts
│   │   │   │   ├── useDeposit.ts
│   │   │   │   ├── useWithdraw.ts
│   │   │   │   └── useYieldData.ts
│   │   │   ├── api/
│   │   │   │   ├── queries.ts        # React Query queries
│   │   │   │   ├── mutations.ts      # React Query mutations
│   │   │   │   └── client.ts         # API calls
│   │   │   ├── types.ts
│   │   │   ├── constants.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── cooperative-savings/
│   │   │   ├── components/
│   │   │   │   ├── PoolCard/
│   │   │   │   ├── CreatePoolDialog/
│   │   │   │   ├── JoinPoolDialog/
│   │   │   │   ├── MembersList/
│   │   │   │   └── PoolDetails/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   ├── types.ts
│   │   │   ├── constants.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── portfolio/
│   │   │   ├── components/
│   │   │   │   ├── OverviewCard/
│   │   │   │   ├── BalanceChart/
│   │   │   │   ├── AssetsList/
│   │   │   │   └── PerformanceMetrics/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   └── types.ts
│   │   │
│   │   ├── transactions/
│   │   │   ├── components/
│   │   │   │   ├── TransactionManager/
│   │   │   │   ├── TransactionFeedback/
│   │   │   │   └── TransactionHistory/
│   │   │   ├── hooks/
│   │   │   │   ├── useTransaction.ts
│   │   │   │   └── useTransactionHistory.ts
│   │   │   ├── context/
│   │   │   │   └── TransactionContext.tsx
│   │   │   └── types.ts
│   │   │
│   │   └── settings/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── types.ts
│   │
│   ├── components/                   # Shared components
│   │   ├── ui/                       # shadcn/ui primitives
│   │   ├── layout/
│   │   │   ├── AppShell/
│   │   │   ├── Sidebar/
│   │   │   ├── Header/
│   │   │   └── Footer/
│   │   ├── wallet/
│   │   │   ├── WalletButton/
│   │   │   ├── NetworkSwitcher/
│   │   │   └── WalletInfo/
│   │   ├── feedback/
│   │   │   ├── LoadingSkeleton/
│   │   │   ├── ErrorBoundary/
│   │   │   └── EmptyState/
│   │   └── common/
│   │       ├── Card/
│   │       ├── DataTable/
│   │       └── StatCard/
│   │
│   ├── lib/                          # Utilities
│   │   ├── web3/
│   │   │   ├── chains.ts
│   │   │   ├── config.ts
│   │   │   ├── contracts/
│   │   │   │   ├── individual-pool.ts
│   │   │   │   ├── cooperative-pool.ts
│   │   │   │   └── index.ts
│   │   │   └── utils.ts
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── endpoints.ts
│   │   │   └── types.ts
│   │   ├── errors/
│   │   │   ├── AppError.ts
│   │   │   ├── handlers.ts
│   │   │   └── recovery.ts
│   │   ├── formatters/
│   │   │   ├── numbers.ts
│   │   │   ├── dates.ts
│   │   │   └── addresses.ts
│   │   ├── validators/
│   │   │   └── schemas.ts
│   │   └── utils/
│   │       ├── cn.ts
│   │       └── helpers.ts
│   │
│   ├── providers/                    # Context providers
│   │   ├── Web3Provider.tsx
│   │   ├── QueryProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── Providers.tsx             # Combined
│   │
│   ├── hooks/                        # Global hooks
│   │   ├── useMediaQuery.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   └── useIntersectionObserver.ts
│   │
│   ├── styles/
│   │   ├── globals.css               # Tailwind + global styles
│   │   ├── design-tokens.css         # CSS variables
│   │   └── animations.css            # Custom animations
│   │
│   └── types/
│       ├── contracts.ts              # Contract types
│       ├── api.ts                    # API types
│       └── global.d.ts               # Global declarations
│
├── public/
│   ├── fonts/
│   │   ├── inter/
│   │   └── satoshi/
│   ├── images/
│   └── icons/
│
├── __tests__/                        # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── docs/                             # Documentation
    ├── architecture.md
    ├── components.md
    └── deployment.md
```

### Principles

1. **Feature-First Organization**
   - Each feature is self-contained
   - Components, hooks, API, types together
   - Easy to find and maintain

2. **Separation of Concerns**
   - UI components (presentational)
   - Business logic (hooks)
   - Data fetching (API)
   - Type safety (types.ts)

3. **Reusability**
   - Shared components in `/components`
   - Utilities in `/lib`
   - Global hooks in `/hooks`

4. **Testability**
   - Each component has .test.tsx
   - Hooks are pure and testable
   - E2E tests for critical flows

---

## 🎯 COMPONENT DESIGN PATTERNS

### 1. Card-Based Layout (Primary Pattern)

**Desktop:**

```
┌─────────────────────────────────────────────────────┐
│  Header (Wallet, Network, Profile)                  │
├──────────┬──────────────────────────────────────────┤
│          │  Dashboard                                │
│          │  ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  Sidebar │  │  Card   │ │  Card   │ │  Card   │    │
│          │  │         │ │         │ │         │    │
│  • Home  │  └─────────┘ └─────────┘ └─────────┘    │
│  • Pool  │                                           │
│  • Earn  │  ┌───────────────────────────────────┐  │
│  • Swap  │  │  Large Card (Position/Balance)    │  │
│          │  │                                   │  │
│          │  └───────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────┘
```

**Mobile:**

```
┌────────────────────┐
│  Header (compact)  │
├────────────────────┤
│  ┌──────────────┐  │
│  │  Card (full) │  │
│  │              │  │
│  └──────────────┘  │
│  ┌──────────────┐  │
│  │  Card (full) │  │
│  └──────────────┘  │
│                    │
│  Bottom Nav        │
└────────────────────┘
```

### 2. Transaction Flow (7-Step Pattern)

```tsx
// Transaction states
type TransactionStatus =
  | 'idle'
  | 'preparing'     // Building transaction
  | 'signing'       // Waiting for wallet signature
  | 'submitted'     // Tx sent to blockchain
  | 'confirming'    // Waiting for confirmations
  | 'success'       // Confirmed
  | 'error'         // Failed

// Visual feedback
<TransactionFeedback status={status}>
  {status === 'signing' && (
    <WalletIcon className="animate-pulse" />
    <p>Please confirm in your wallet...</p>
  )}
  {status === 'confirming' && (
    <Spinner />
    <p>Confirming on blockchain...</p>
    <p>Confirmations: {confirmations}/3</p>
  )}
  {status === 'success' && (
    <CheckCircle className="text-success" />
    <p>Transaction successful!</p>
    <Link to={explorerUrl}>View on Explorer</Link>
  )}
</TransactionFeedback>
```

### 3. Loading States (Skeleton Pattern)

```tsx
// BAD (old way)
{
  isLoading ? <Spinner /> : <PositionCard data={data} />;
}

// GOOD (new way)
{
  isLoading ? <PositionCardSkeleton /> : <PositionCard data={data} />;
}

// Skeleton matches actual component structure
function PositionCardSkeleton() {
  return (
    <Card>
      <Skeleton className="h-8 w-32" /> {/* Title */}
      <Skeleton className="h-16 w-full" /> {/* Balance */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" /> {/* Button */}
        <Skeleton className="h-10 flex-1" /> {/* Button */}
      </div>
    </Card>
  );
}
```

### 4. Error Handling (Recovery Pattern)

```tsx
<ErrorBoundary
  fallback={({ error, reset }) => (
    <ErrorCard
      title="Something went wrong"
      message={error.message}
      actions={[
        { label: "Try Again", onClick: reset },
        { label: "Go Home", onClick: () => router.push("/") },
      ]}
    />
  )}
>
  <FeatureComponent />
</ErrorBoundary>
```

### 5. Responsive Tables → Cards

```tsx
// Desktop: Table
<Table className="hidden md:table">
  <TableHeader>...</TableHeader>
  <TableBody>...</TableBody>
</Table>

// Mobile: Cards
<div className="md:hidden space-y-4">
  {data.map(item => (
    <Card key={item.id}>
      <CardHeader>
        <Badge>{item.type}</Badge>
      </CardHeader>
      <CardContent>
        <dl>
          <dt>Amount</dt>
          <dd>{item.amount}</dd>
          <dt>Date</dt>
          <dd>{item.date}</dd>
        </dl>
      </CardContent>
    </Card>
  ))}
</div>
```

---

## 🔗 SMART CONTRACT INTEGRATION MAP

### Individual Pool (Full Integration)

```typescript
// hooks/useIndividualPool.ts
export function useIndividualPool() {
  // Read Functions
  const { data: userInfo } = useReadContract({
    abi: IndividualPoolV3ABI,
    functionName: "getUserInfo",
    args: [address],
  });

  const { data: totalBalance } = useReadContract({
    abi: IndividualPoolV3ABI,
    functionName: "getUserTotalBalance",
    args: [address],
  });

  const { data: referralStats } = useReadContract({
    abi: IndividualPoolV3ABI,
    functionName: "getReferralStats",
    args: [address],
  });

  // Write Functions
  const { writeContractAsync: deposit } = useWriteContract();
  const { writeContractAsync: withdraw } = useWriteContract();
  const { writeContractAsync: claimYields } = useWriteContract();
  const { writeContractAsync: toggleAutoCompound } = useWriteContract();

  return {
    // Data
    deposit: userInfo?.deposit || 0n,
    yields: userInfo?.yields || 0n,
    apr: userInfo?.apr || 0,
    autoCompoundEnabled: userInfo?.autoCompoundEnabled || false,
    totalBalance,
    referrals: referralStats?.referralCount || 0,
    referralRewards: referralStats?.referralRewards || 0n,

    // Actions
    deposit: (amount: bigint, referrer?: Address) => {
      return deposit({
        abi: IndividualPoolV3ABI,
        functionName: "deposit",
        args: [amount, referrer || zeroAddress],
      });
    },
    withdraw: (amount: bigint) => {
      return withdraw({
        abi: IndividualPoolV3ABI,
        functionName: "withdraw",
        args: [amount],
      });
    },
    claimYields: () => {
      return claimYields({
        abi: IndividualPoolV3ABI,
        functionName: "claimYields",
      });
    },
    toggleAutoCompound: () => {
      return toggleAutoCompound({
        abi: IndividualPoolV3ABI,
        functionName: "toggleAutoCompound",
      });
    },
  };
}
```

### Cooperative Pool (Full Integration)

```typescript
// hooks/useCooperativePool.ts
export function useCooperativePool(poolId?: bigint) {
  // Read Pool Info
  const { data: poolInfo } = useReadContract({
    abi: CooperativePoolV3ABI,
    functionName: "getPoolInfo",
    args: [poolId],
    enabled: !!poolId,
  });

  // Read Member Info
  const { data: memberInfo } = useReadContract({
    abi: CooperativePoolV3ABI,
    functionName: "getMemberInfo",
    args: [poolId, address],
    enabled: !!poolId && !!address,
  });

  // List all pools
  const { data: poolCounter } = useReadContract({
    abi: CooperativePoolV3ABI,
    functionName: "poolCounter",
  });

  return {
    // Pool Data
    name: poolInfo?.name,
    creator: poolInfo?.creator,
    totalContributions: poolInfo?.totalContributions || 0n,
    yieldGenerated: poolInfo?.yieldGenerated || 0n,
    memberCount: poolInfo?.members?.length || 0,
    isActive: poolInfo?.isActive || false,

    // Member Data
    contribution: memberInfo?.contribution || 0n,
    yieldShare: memberInfo?.yieldShare || 0n,
    lastClaimTime: memberInfo?.lastClaimTime,

    // Actions
    createPool: (params) => {
      /* ... */
    },
    joinPool: (value: bigint) => {
      /* ... */
    },
    leavePool: () => {
      /* ... */
    },
    claimYield: () => {
      /* ... */
    },

    // Metadata
    totalPools: Number(poolCounter || 0n),
  };
}
```

### Unified Transaction Manager

```typescript
// features/transactions/hooks/useTransaction.ts
export function useTransaction() {
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [txHash, setTxHash] = useState<Hash>();
  const [error, setError] = useState<Error>();

  const execute = async (
    contractWrite: () => Promise<Hash>,
    options?: TransactionOptions,
  ) => {
    try {
      setStatus("preparing");

      // Step 1: Prepare transaction
      // ...

      setStatus("signing");

      // Step 2: Request signature
      const hash = await contractWrite();
      setTxHash(hash);
      setStatus("submitted");

      setStatus("confirming");

      // Step 3: Wait for confirmation
      const receipt = await waitForTransactionReceipt({
        hash,
        confirmations: options?.confirmations || 3,
      });

      setStatus("success");

      // Step 4: Callbacks
      options?.onSuccess?.(receipt);

      return receipt;
    } catch (err) {
      setStatus("error");
      setError(err as Error);
      options?.onError?.(err);
      throw err;
    }
  };

  const reset = () => {
    setStatus("idle");
    setTxHash(undefined);
    setError(undefined);
  };

  return {
    status,
    txHash,
    error,
    execute,
    reset,
    isLoading: ["preparing", "signing", "submitted", "confirming"].includes(
      status,
    ),
    isSuccess: status === "success",
    isError: status === "error",
  };
}
```

---

## 📱 KEY PAGES REDESIGN

### 1. Dashboard Home

**Layout:**

```
┌────────────────────────────────────────────────────┐
│  Header                                             │
├────────┬───────────────────────────────────────────┤
│        │  Portfolio Overview                        │
│        │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ Side   │  │ Balance  │ │  Yields  │ │   APY    │  │
│ bar    │  │ $1,234   │ │  $56.78  │ │  6.5%    │  │
│        │  └──────────┘ └──────────┘ └──────────┘  │
│ • Home │                                            │
│ • Save │  Your Positions                            │
│ • Earn │  ┌─────────────────────────────────────┐  │
│ • Pool │  │ Individual Savings                  │  │
│        │  │ $1,000 • +$45.23 yield • 6.2% APR  │  │
│        │  │ [Deposit] [Withdraw]                │  │
│        │  └─────────────────────────────────────┘  │
│        │  ┌─────────────────────────────────────┐  │
│        │  │ Cooperative Pool #3                 │  │
│        │  │ $500 • 12 members • Active          │  │
│        │  │ [View Details]                      │  │
│        │  └─────────────────────────────────────┘  │
└────────┴───────────────────────────────────────────┘
```

**Components:**

- `PortfolioOverview` - Summary cards with animated numbers
- `PositionsList` - All active positions with quick actions
- `RecentActivity` - Transaction history (last 10)
- `QuickActions` - Deposit, Create Pool buttons

**Colors:**

- Cards: `bg-secondary` with `border-primary`
- Positive numbers: `text-success` (green)
- Yields: `text-accent` (orange #FFC77D)
- CTAs: `bg-primary` (lavanda #BFA4FF)

### 2. Individual Savings Page

**Layout:**

```
┌────────────────────────────────────────────────────┐
│  Individual Savings                                 │
├────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐  │
│  │  Your Position                               │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │  Balance: $1,234.56                          │  │
│  │  Yields: +$56.78 (4.6%)                      │  │
│  │  APR: 6.5% ↗                                 │  │
│  │  Auto-compound: ✓ Enabled                    │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │  [Deposit] [Withdraw] [Claim Yields]         │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  ┌───────────────┐  ┌───────────────┐            │
│  │  Deposit      │  │  Withdraw     │            │
│  │  ┌─────────┐  │  │  ┌─────────┐  │            │
│  │  │ Amount  │  │  │  │ Amount  │  │            │
│  │  └─────────┘  │  │  └─────────┘  │            │
│  │  [Submit]     │  │  [Submit]     │            │
│  └───────────────┘  └───────────────┘            │
│                                                    │
│  Yield History (Chart)                            │
│  ┌─────────────────────────────────────────────┐  │
│  │        ╱─╲                                   │  │
│  │      ╱     ╲      ╱─╲                        │  │
│  │    ╱         ╲  ╱     ╲                      │  │
│  │  ╱             ╲         ╲                   │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  Transaction History                              │
│  ┌─────────────────────────────────────────────┐  │
│  │ Deposit  +$100  2 hours ago  [View]         │  │
│  │ Yield    +$2.34  1 day ago  [View]          │  │
│  └─────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**Components:**

- `PositionCard` - Main position with stats
- `DepositCard` - Deposit form with MUSD approval
- `WithdrawDialog` - Withdrawal modal
- `YieldChart` - Recharts line chart
- `TransactionHistory` - Table/cards with filters

### 3. Cooperative Savings Page

**Browse Pools Layout:**

```
┌────────────────────────────────────────────────────┐
│  Cooperative Pools                                  │
│  ┌────────────────┐                                │
│  │ [Create Pool]  │  ← Primary CTA (Lavanda)       │
│  └────────────────┘                                │
├────────────────────────────────────────────────────┤
│  Filters: [All] [Active] [Joinable] [Mine]        │
├────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐  │
│  │  Pool #1 - "Savings Circle"                 │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │  TVL: $5,000 • Members: 8/10 • APR: 6.2%   │  │
│  │  Min: $100 • Max: $1,000                    │  │
│  │  [Join Pool] [View Details]                 │  │
│  └─────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────┐  │
│  │  Pool #2 - "Bitcoin Builders"               │  │
│  │  TVL: $12,500 • Members: 15/20 • APR: 6.5% │  │
│  │  Min: $500 • Max: $2,000                    │  │
│  │  [Join Pool] [View Details]                 │  │
│  └─────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**Components:**

- `PoolCard` - Pool preview with key stats
- `CreatePoolDialog` - Wizard modal (3 steps)
- `JoinPoolDialog` - Join flow with amount input
- `PoolDetailsPage` - Full pool view with members

### 4. Settings Page

**Real Implementation (not placeholder):**

```
┌────────────────────────────────────────────────────┐
│  Settings                                           │
├────────────────────────────────────────────────────┤
│  Preferences                                        │
│  ┌─────────────────────────────────────────────┐  │
│  │ Language:  [English ▼]                      │  │
│  │ Currency:  [USD ▼]                          │  │
│  │ Notifications: ✓ Enabled                    │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  Connected Wallets                                 │
│  ┌─────────────────────────────────────────────┐  │
│  │ MetaMask                                     │  │
│  │ 0x1234...5678                                │  │
│  │ [Disconnect]                                 │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  Security                                          │
│  ┌─────────────────────────────────────────────┐  │
│  │ Auto-lock after: [15 minutes ▼]             │  │
│  │ Require confirmation for: ✓ All transactions│  │
│  └─────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**Features:**

- Save preferences to localStorage
- Manage connected wallets
- Security settings
- Activity log
- Export transaction history

---

## ⚡ IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1-2)

**Week 1: Design System + Architecture**

Day 1-2: **Setup**

- [ ] Create new branch `v4-redesign`
- [ ] Install additional dependencies:
  - `@rainbow-me/rainbowkit` (wallet UX)
  - `framer-motion` (animations)
  - `recharts` (already installed)
  - `@tanstack/react-table` (data tables)
- [ ] Setup design tokens CSS file
- [ ] Configure Tailwind with brand colors
- [ ] Add Inter & Satoshi fonts

Day 3-4: **Core Components**

- [ ] Create design system components:
  - `Card` variants (with glow effects)
  - `Button` variants (primary lavanda, accent orange)
  - `Input` with focus states
  - `Badge` for status indicators
  - `Skeleton` loaders
- [ ] Create layout components:
  - `AppShell` (main layout wrapper)
  - `Sidebar` (collapsible, mobile drawer)
  - `Header` (with wallet button)
- [ ] Setup error boundaries
- [ ] Create loading states library

Day 5-6: **Web3 Foundation**

- [ ] Integrate RainbowKit
- [ ] Configure multi-wallet support
- [ ] Create `WalletButton` component
- [ ] Create `NetworkSwitcher` component
- [ ] Setup transaction manager
- [ ] Create `TransactionFeedback` component

Day 7: **Testing & Documentation**

- [ ] Write Storybook stories for components
- [ ] Document design system
- [ ] Setup testing infrastructure (Vitest + Testing Library)

**Week 2: Feature Structure**

Day 8-9: **Unified Transaction System**

- [ ] Create `TransactionContext`
- [ ] Build `useTransaction` hook
- [ ] Implement 7-step feedback flow
- [ ] Add retry/recovery logic
- [ ] Add transaction history persistence

Day 10-11: **Individual Savings Feature**

- [ ] Refactor `useIndividualPool` hook
- [ ] Build `PositionCard` component
- [ ] Build `DepositCard` component
- [ ] Build `WithdrawDialog` component
- [ ] Build `YieldChart` component
- [ ] Migrate to features/ structure

Day 12-13: **Cooperative Savings Feature**

- [ ] Split large cooperative components
- [ ] Build `PoolCard` component
- [ ] Build `CreatePoolDialog` (wizard)
- [ ] Build `JoinPoolDialog`
- [ ] Build `PoolDetailsPage`

Day 14: **Testing & Refinement**

- [ ] Unit tests for hooks
- [ ] Component tests
- [ ] Integration tests for deposit/withdraw flow

### Phase 2: Features (Week 3-4)

**Week 3: Pages & Features**

Day 15-16: **Dashboard Home**

- [ ] Build `PortfolioOverview`
- [ ] Build `PositionsList`
- [ ] Build `QuickActions`
- [ ] Build `RecentActivity`
- [ ] Implement real-time updates

Day 17-18: **Individual Savings Page**

- [ ] Complete page layout
- [ ] Integrate all components
- [ ] Add responsive design
- [ ] Test deposit flow end-to-end

Day 19-20: **Cooperative Savings Page**

- [ ] Complete browse pools view
- [ ] Complete pool details view
- [ ] Complete my pools view
- [ ] Test pool creation/joining

Day 21: **Settings (Real Implementation)**

- [ ] Build preferences form
- [ ] Build wallet management
- [ ] Build security settings
- [ ] Add localStorage persistence

**Week 4: Polish & Optimization**

Day 22-23: **Mobile Optimization**

- [ ] Table → Card transformations
- [ ] Bottom navigation
- [ ] Touch-friendly targets
- [ ] Test on real devices

Day 24-25: **Performance**

- [ ] Code splitting
- [ ] Lazy loading
- [ ] Image optimization
- [ ] Bundle size optimization
- [ ] RPC call batching

Day 26-27: **Accessibility**

- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Screen reader testing
- [ ] Color contrast validation

Day 28: **Documentation**

- [ ] Component documentation
- [ ] API documentation
- [ ] User guide
- [ ] Deployment guide

### Phase 3: Testing & Launch (Week 5-6)

**Week 5: Testing**

Day 29-31: **Comprehensive Testing**

- [ ] Unit tests (80% coverage target)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Load testing
- [ ] Security audit

Day 32-33: **Bug Fixes**

- [ ] Fix critical bugs
- [ ] Fix high-priority bugs
- [ ] Polish UI issues

Day 34-35: **User Testing**

- [ ] Internal testing
- [ ] Beta user testing
- [ ] Gather feedback
- [ ] Iterate

**Week 6: Launch Prep**

Day 36-37: **Pre-Launch**

- [ ] Final performance audit
- [ ] Final security audit
- [ ] Analytics setup
- [ ] Monitoring setup
- [ ] Backup/rollback plan

Day 38-39: **Deployment**

- [ ] Deploy to staging
- [ ] Smoke tests
- [ ] Deploy to production
- [ ] Monitor metrics

Day 40-42: **Post-Launch**

- [ ] Monitor for issues
- [ ] Gather user feedback
- [ ] Quick fixes if needed
- [ ] Plan v4.1 improvements

---

## 🎯 SUCCESS METRICS

### Performance

- [ ] Lighthouse score: 90+ (all categories)
- [ ] First Contentful Paint: <1.5s
- [ ] Time to Interactive: <3s
- [ ] Bundle size: <300KB (gzipped)

### User Experience

- [ ] WCAG 2.2 AA compliance
- [ ] Mobile usability score: 90+
- [ ] Transaction success rate: >95%
- [ ] Error recovery rate: >80%

### Code Quality

- [ ] Test coverage: >80%
- [ ] TypeScript strict mode
- [ ] Zero console errors
- [ ] ESLint warnings: 0

### Business

- [ ] User onboarding time: <5 minutes
- [ ] Deposit flow completion: >70%
- [ ] Active user retention: >60%
- [ ] User satisfaction: >4.5/5

---

## 📚 RESOURCES

### Design

- Figma: https://figma.com/khipuvault-v4
- Storybook: http://localhost:6006
- Design tokens: `/styles/design-tokens.css`

### Development

- Component docs: `/docs/components.md`
- API docs: `/docs/api.md`
- Architecture: `/docs/architecture.md`

### Tools

- Lighthouse: https://developers.google.com/web/tools/lighthouse
- axe DevTools: https://www.deque.com/axe/devtools/
- Playwright: https://playwright.dev

---

## 🚀 NEXT STEPS

1. **Review & Approve This Plan**
   - Gather stakeholder feedback
   - Adjust timeline if needed
   - Get final sign-off

2. **Create Project Board**
   - GitHub Projects or Jira
   - Break down tasks
   - Assign to team

3. **Start Phase 1**
   - Create v4-redesign branch
   - Install dependencies
   - Begin design system

---

## ✅ CHECKLIST

### Pre-Development

- [ ] Plan approved by team
- [ ] Design system tokens defined
- [ ] Brand colors confirmed (#BFA4FF, #FFC77D)
- [ ] Fonts licensed/downloaded (Inter, Satoshi)
- [ ] Development environment ready

### Development

- [ ] Phase 1 complete (Foundation)
- [ ] Phase 2 complete (Features)
- [ ] Phase 3 complete (Testing)

### Launch

- [ ] All tests passing
- [ ] Performance metrics met
- [ ] Accessibility audit passed
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Deployed to production

---

**Ready to build a world-class DeFi frontend!** 🎨🚀
