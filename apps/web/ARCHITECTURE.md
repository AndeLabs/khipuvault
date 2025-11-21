# Frontend Architecture

## Feature-Based Organization

The frontend is organized by features, not technical layers. Each feature is a self-contained module with its own components, hooks, API clients, and types.

```
src/
├── app/                        # Next.js 15 App Router
│   ├── (marketing)/            # Public routes (landing page)
│   │   ├── page.tsx
│   │   └── layout.tsx
│   └── (app)/                  # Protected routes (dashboard)
│       ├── dashboard/
│       │   ├── page.tsx
│       │   └── layout.tsx
│       └── layout.tsx
│
├── features/                   # Feature modules (CORE)
│   ├── individual-pool/        # Individual Savings Pool feature
│   │   ├── components/         # Feature-specific components
│   │   ├── hooks/              # Feature-specific hooks
│   │   ├── api/                # API client functions
│   │   └── types.ts            # Feature-specific types
│   │
│   ├── cooperative-pool/       # Cooperative Savings Pool feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types.ts
│   │
│   ├── prize-pool/             # Prize Pool feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types.ts
│   │
│   ├── portfolio/              # User Portfolio & Dashboard
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types.ts
│   │
│   └── settings/               # User Settings
│       ├── components/
│       ├── hooks/
│       └── types.ts
│
├── components/                 # Shared UI components
│   ├── ui/                     # shadcn/ui components (from @khipu/ui)
│   └── layout/                 # Layout components (header, footer, etc.)
│
├── lib/                        # Utilities and configurations
│   ├── api-client.ts           # Centralized API client
│   ├── query-client.ts         # React Query configuration
│   └── utils.ts                # Utility functions
│
└── providers/                  # Context providers
    ├── web3-provider.tsx       # Wagmi/Web3 provider
    └── query-provider.tsx      # React Query provider
```

## Key Principles

### 1. Feature Isolation
Each feature is self-contained and can be developed, tested, and deployed independently. Features should not directly import from other features.

```typescript
// ✅ Good: Feature imports from shared packages
import { Button } from '@khipu/ui'
import { useIndividualPool } from '@khipu/web3'

// ❌ Bad: Feature imports from another feature
import { CooperativePoolCard } from '@/features/cooperative-pool/components/card'
```

### 2. Shared Code
Common UI components, utilities, and types are in workspace packages:
- `@khipu/ui` - Shared UI components
- `@khipu/web3` - Web3 hooks and contract interactions
- `@khipu/shared` - Types, constants, and utilities

### 3. Data Fetching Strategy

#### Contract Data (On-chain)
Use hooks from `@khipu/web3`:
```typescript
const { userInfo, deposit, withdraw } = useIndividualPool()
```

#### Backend Data (Off-chain)
Use React Query with feature-specific API clients:
```typescript
const { data: portfolio } = useQuery({
  queryKey: ['portfolio', address],
  queryFn: () => getUserPortfolio(address),
})
```

#### Hybrid Approach
Combine both for optimal UX:
```typescript
export function useIndividualPoolData() {
  const pool = useIndividualPool() // Contract data
  const { data: apiData } = useQuery({
    queryKey: ['individual-pool', 'data'],
    queryFn: getPoolData, // API data
  })

  return {
    // Merge contract + API data
    userInfo: pool.userInfo,
    poolAnalytics: apiData?.analytics,
  }
}
```

## Feature Structure Example

### Individual Pool Feature

```
features/individual-pool/
├── api/
│   └── client.ts              # API functions
├── hooks/
│   └── use-individual-pool.ts # Feature hook combining contract + API
└── components/
    ├── deposit-form.tsx       # Deposit component
    ├── withdraw-form.tsx      # Withdraw component
    └── position-card.tsx      # Position overview
```

#### API Client (`api/client.ts`)
```typescript
import { KhipuApiClient } from '@khipu/web3'

const apiClient = new KhipuApiClient(process.env.NEXT_PUBLIC_API_URL)

export async function getUserPosition(address: string) {
  return await apiClient.getUserPositions(address)
}
```

#### Feature Hook (`hooks/use-individual-pool.ts`)
```typescript
export function useIndividualPoolData() {
  const pool = useIndividualPool() // Contract
  const { data } = useQuery({
    queryKey: ['individual-pool', address],
    queryFn: () => getUserPosition(address),
  })

  return {
    // Contract data
    userInfo: pool.userInfo,
    deposit: pool.deposit,
    withdraw: pool.withdraw,

    // API data
    position: data,
  }
}
```

#### Component (`components/deposit-form.tsx`)
```typescript
export function DepositForm() {
  const { deposit, isDepositing } = useIndividualPoolData()

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      deposit(amount)
    }}>
      {/* Form UI */}
    </form>
  )
}
```

## State Management

### Server State (React Query)
For data from the blockchain or backend API:
- Automatic caching
- Background refetching
- Optimistic updates
- Mutation states

### Client State (Local)
For UI state, use React hooks:
- `useState` for local component state
- `useContext` for shared state across components

### No Global State Library Needed
React Query handles most "global" state needs. Only use Context for:
- Theme settings
- User preferences
- UI state (modals, sidebars)

## Best Practices

### 1. Colocate Code
Keep related code together. Components, hooks, and API functions for a feature should live in that feature's directory.

### 2. Use TypeScript
All code should be strongly typed. Import types from `@khipu/shared` when possible.

### 3. Error Handling
Handle errors at the component level:
```typescript
const { data, error, isLoading } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
})

if (error) return <ErrorMessage error={error} />
if (isLoading) return <LoadingSkeleton />
```

### 4. Loading States
Always show loading states for better UX:
```typescript
<Button disabled={isDepositing}>
  {isDepositing ? 'Depositing...' : 'Deposit'}
</Button>
```

### 5. Optimistic Updates
Update UI immediately, revert on error:
```typescript
const mutation = useMutation({
  mutationFn: deposit,
  onMutate: async (newData) => {
    // Optimistically update UI
    await queryClient.cancelQueries({ queryKey: ['balance'] })
    const previous = queryClient.getQueryData(['balance'])
    queryClient.setQueryData(['balance'], newData)
    return { previous }
  },
  onError: (err, newData, context) => {
    // Revert on error
    queryClient.setQueryData(['balance'], context.previous)
  },
})
```

## Migration Guide

### From Old Structure
```
components/dashboard/individual-savings/position.tsx
```

### To New Structure
```
features/individual-pool/components/position-card.tsx
```

### Steps
1. Move component to feature directory
2. Update imports to use `@khipu/*` packages
3. Create feature hook if needed
4. Update page to import from feature
