# KhipuVault Web Architecture

> Bitcoin savings platform for Latin America built on Mezo Testnet

## Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Data Flow](#data-flow)
- [Design Patterns](#design-patterns)
- [Dependency Diagram](#dependency-diagram)
- [Key Technologies](#key-technologies)

---

## Overview

KhipuVault Web (`apps/web`) is a Next.js 14+ application providing a frontend for decentralized savings pools on the Mezo blockchain. It supports four pool types:

1. **Individual Pool** - Personal savings with auto-compound yields
2. **Cooperative Pool** - Group savings with shared yields
3. **Rotating Pool (ROSCA)** - Rotating savings and credit association
4. **Lottery Pool** - Prize-linked savings

The app uses **Wagmi v2** for Web3 interactions, **React Query (TanStack Query v5)** for server state, and **Viem** for Ethereum utilities.

---

## Directory Structure

```
apps/web/src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Protected dashboard routes
│   │   ├── individual-savings/
│   │   ├── cooperative-savings/
│   │   ├── rotating-pool/
│   │   ├── prize-pool/
│   │   └── mezo/           # Mezo protocol integration
│   └── layout.tsx          # Root layout
│
├── components/             # React components
│   ├── ui/                 # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── wallet/             # Wallet connection components
│   ├── forms/              # Form components (TokenAmountInput, FormField)
│   ├── sections/           # Landing page sections
│   ├── layout/             # Layout components (Header, Sidebar, Footer)
│   ├── error/              # Error boundary components
│   ├── mezo/               # Mezo-specific components
│   └── common/             # Shared components (AmountDisplay, EmptyState)
│
├── contracts/              # Contract ABIs
│   ├── abis/               # KhipuVault contract ABIs (V3)
│   └── mezo-abis/          # Mezo protocol ABIs (Liquity-based)
│
├── features/               # Feature-based organization
│   ├── individual-savings/ # Individual pool feature
│   ├── cooperative-savings/
│   ├── rotating-pool/
│   ├── prize-pool/
│   ├── portfolio/
│   └── transactions/
│
├── hooks/                  # Custom React hooks
│   ├── web3/               # Blockchain hooks (see HOOKS.md)
│   │   ├── common/         # Shared Web3 utilities
│   │   ├── individual/     # Individual pool hooks
│   │   ├── cooperative/    # Cooperative pool hooks
│   │   ├── rotating/       # ROSCA hooks
│   │   ├── lottery/        # Lottery pool hooks
│   │   └── mezo/           # Mezo protocol hooks
│   └── *.ts                # UI/state hooks (toast, error, modal)
│
├── lib/                    # Utilities and configurations
│   ├── web3/               # Wagmi config, chains, contracts
│   ├── api/                # API client and endpoints
│   ├── errors/             # Error handling utilities
│   ├── config/             # App configuration (timing, URLs)
│   ├── format/             # Formatters (balance, token)
│   ├── validation/         # Zod schemas
│   ├── monitoring/         # Logging and analytics
│   ├── accessibility/      # A11y utilities
│   ├── query-keys.ts       # React Query key factory
│   ├── query-config.ts     # Query presets
│   └── utils.ts            # General utilities (cn, etc.)
│
├── providers/              # React context providers
│   ├── web3-provider.tsx   # Wagmi + React Query provider
│   └── client-providers.tsx
│
├── test/                   # Test utilities and setup
│
└── types/                  # TypeScript type definitions
```

---

## Data Flow

### React Query + Wagmi Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                         Component                                │
│  ┌──────────────────┐    ┌──────────────────────────────────┐   │
│  │   useAccount()   │    │    useReadContract() / hooks     │   │
│  │   useBalance()   │    │    useIndividualPoolV3()         │   │
│  │   useChainId()   │    │    useRotatingPool()             │   │
│  └────────┬─────────┘    └────────────────┬─────────────────┘   │
│           │                               │                      │
│           v                               v                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  WagmiProvider                           │    │
│  │   ┌─────────────┐  ┌────────────────────────────────┐   │    │
│  │   │   Config    │  │    QueryClientProvider          │   │    │
│  │   │  (chains,   │  │  (staleTime, gcTime, retry)    │   │    │
│  │   │ connectors) │  │                                 │   │    │
│  │   └──────┬──────┘  └────────────────┬───────────────┘   │    │
│  │          │                          │                    │    │
│  └──────────┼──────────────────────────┼────────────────────┘    │
│             │                          │                         │
└─────────────┼──────────────────────────┼─────────────────────────┘
              │                          │
              v                          v
      ┌───────────────┐         ┌─────────────────┐
      │  MetaMask     │         │   Mezo RPC      │
      │  (Wallet)     │         │   (Blockchain)  │
      └───────────────┘         └─────────────────┘
```

### Transaction Flow (Approve + Execute Pattern)

```
User Action
    │
    v
┌─────────────────────────────────────────────┐
│  useApproveAndExecute()                      │
│  ┌─────────────────────────────────────┐    │
│  │ 1. Check network (switch if needed) │    │
│  │ 2. Check allowance                  │    │
│  │ 3. Approve if needed (unlimited)    │    │
│  │ 4. Wait for approval confirmation   │    │
│  │ 5. Execute main transaction         │    │
│  │ 6. Wait for execution confirmation  │    │
│  │ 7. Invalidate React Query cache     │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
                    │
                    v
        ┌──────────────────────┐
        │  useModalFlow()      │
        │  (UI state machine)  │
        │  idle -> confirming  │
        │  -> processing       │
        │  -> success/error    │
        └──────────────────────┘
```

### Query Keys Factory Pattern

All queries use centralized keys from `lib/query-keys.ts`:

```typescript
queryKeys.individualPool.userInfo(address); // ["individual-pool", "user-info", "0x..."]
queryKeys.cooperativePool.pool(poolId); // ["cooperative-pool", "pool", 1]
queryKeys.tokens.musdBalance(address); // ["tokens", "musd-balance", "0x..."]
```

This enables precise cache invalidation after transactions.

---

## Design Patterns

### 1. Factory Pattern - Query Keys

```typescript
// lib/query-keys.ts
export const queryKeys = {
  individualPool: {
    all: ["individual-pool"] as const,
    userInfo: (address: string) => [...queryKeys.individualPool.all, "user-info", address] as const,
  },
  // ...
};
```

### 2. Observer Pattern - Toast Notifications

```typescript
// hooks/use-toast.ts
const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}
```

### 3. State Machine Pattern - Modal Flow

```typescript
// hooks/use-modal-flow.ts
type ModalStep = "idle" | "input" | "confirming" | "processing" | "success" | "error";
```

### 4. Hook Composition - Approve and Execute

```typescript
// Base hook
useApproveAndExecute<TArgs>();

// Composed hooks
useDepositWithApprove(); // uses useApproveAndExecute
useBuyTicketsWithApprove(); // uses useApproveAndExecute
```

### 5. Barrel Exports - Feature Organization

Each feature and hook directory has an `index.ts` that re-exports public APIs:

```typescript
// hooks/web3/lottery/index.ts
export { useCurrentRound, useUserTickets } from "./use-lottery-queries";
export { useBuyTickets, useClaimPrize } from "./use-lottery-mutations";
```

### 6. Error Boundary Pattern

```typescript
// providers/web3-provider.tsx
<QueryErrorResetBoundary>
  {({ reset }) => (
    <Web3ErrorBoundary onReset={reset}>
      {children}
    </Web3ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

---

## Dependency Diagram

```
                    ┌────────────────────┐
                    │    app/layout.tsx  │
                    └─────────┬──────────┘
                              │
                              v
                    ┌────────────────────┐
                    │  Web3Provider      │
                    │  (Wagmi + Query)   │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          v                   v                   v
    ┌───────────┐      ┌───────────┐      ┌───────────┐
    │  Pages    │      │  Pages    │      │  Pages    │
    │ /dashboard│      │ /indiv... │      │ /lottery  │
    └─────┬─────┘      └─────┬─────┘      └─────┬─────┘
          │                  │                  │
          v                  v                  v
    ┌───────────────────────────────────────────────┐
    │              features/**/components/           │
    │    (DepositCard, PoolDetails, BuyTickets)     │
    └───────────────────────┬───────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          v                 v                 v
    ┌───────────┐    ┌───────────┐    ┌───────────┐
    │ hooks/    │    │ hooks/    │    │ hooks/    │
    │ web3/     │    │ use-toast │    │ use-modal │
    │ individual│    │           │    │ -flow     │
    └─────┬─────┘    └───────────┘    └───────────┘
          │
          v
    ┌───────────────────────────────────────────────┐
    │              lib/web3/                         │
    │  (config, contracts-v3, chains)               │
    └───────────────────────┬───────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          v                 v                 v
    ┌───────────┐    ┌───────────┐    ┌───────────┐
    │ contracts/│    │@khipu/   │    │ wagmi     │
    │ abis/     │    │ shared   │    │ viem      │
    └───────────┘    └───────────┘    └───────────┘
```

---

## Key Technologies

| Technology     | Version | Purpose                         |
| -------------- | ------- | ------------------------------- |
| Next.js        | 14+     | React framework with App Router |
| React          | 18+     | UI library                      |
| TypeScript     | 5+      | Type safety                     |
| Wagmi          | 2.x     | React hooks for Ethereum        |
| Viem           | 2.x     | TypeScript Ethereum library     |
| TanStack Query | 5.x     | Server state management         |
| Tailwind CSS   | 3.x     | Utility-first CSS               |
| shadcn/ui      | latest  | UI component primitives         |
| Zod            | 3.x     | Schema validation               |

---

## Related Documentation

- [HOOKS.md](./HOOKS.md) - Custom hooks documentation
- [COMPONENTS.md](./COMPONENTS.md) - UI components guide
- [WEB3.md](./WEB3.md) - Blockchain integration guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
