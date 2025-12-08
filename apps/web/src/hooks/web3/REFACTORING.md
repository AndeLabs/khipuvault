# Web3 Hooks Refactoring

This document describes the refactoring of large hooks files into smaller, more maintainable modules.

## Overview

Two large hooks files were refactored:

- `use-cooperative-pool.ts` (712 lines → 36 lines)
- `use-pool-transactions.ts` (676 lines → 54 lines)

The refactored code is now organized in modular directories while maintaining full backward compatibility.

## Structure

### Cooperative Pool (`./cooperative/`)

**Files:**

- `constants.ts` (88 lines) - Types, enums, query keys, configuration
- `use-pool-helpers.ts` (156 lines) - Formatting and utility functions
- `use-pool-queries.ts` (344 lines) - All read-only queries
- `use-pool-mutations.ts` (323 lines) - All write operations
- `index.ts` (130 lines) - Main exports and combined hook

**Exported Hooks:**

```typescript
// Main hook (combines everything)
import { useCooperativePool } from "@/hooks/web3/use-cooperative-pool";

// Individual query hooks
import {
  usePoolCounter,
  usePerformanceFee,
  useEmergencyMode,
  usePoolInfo,
  useMemberInfo,
  usePoolMembers,
  useMemberYield,
} from "@/hooks/web3/cooperative/use-pool-queries";

// Individual mutation hooks
import {
  useCreatePool,
  useJoinPool,
  useLeavePool,
  useClaimYield,
  useClosePool,
} from "@/hooks/web3/cooperative/use-pool-mutations";

// Helper functions
import {
  formatBTC,
  formatBTCCompact,
  formatMUSD,
  formatDate,
  formatDateTime,
  calculateFeeAmount,
  calculateNetYield,
  formatPercentage,
  getPoolStatusBadge,
  parsePoolError,
} from "@/hooks/web3/cooperative/use-pool-helpers";

// Types and constants
import {
  PoolStatus,
  PoolInfo,
  MemberInfo,
  MemberWithAddress,
  ActionState,
  QUERY_KEYS,
  STALE_TIMES,
  REFETCH_INTERVALS,
} from "@/hooks/web3/cooperative/constants";
```

### Individual Pool (`./individual/`)

**Files:**

- `constants.ts` (28 lines) - Query keys and types
- `use-deposit-hooks.ts` (218 lines) - Deposit and withdrawal operations
- `use-yield-hooks.ts` (235 lines) - Yield claiming and auto-compound
- `use-aggregator-hooks.ts` (194 lines) - Yield aggregator operations
- `index.ts` (88 lines) - Main exports and combined hooks

**Exported Hooks:**

```typescript
// Individual pool operations
import {
  useDeposit,
  usePartialWithdraw,
  useFullWithdraw,
} from "@/hooks/web3/individual/use-deposit-hooks";

import {
  useClaimYield,
  useClaimReferralRewards,
  useToggleAutoCompound,
  useCompoundYields,
} from "@/hooks/web3/individual/use-yield-hooks";

// Yield aggregator operations
import {
  useYieldAggregatorDeposit,
  useYieldAggregatorWithdraw,
  useCompoundYields,
} from "@/hooks/web3/individual/use-aggregator-hooks";

// Combined hooks
import {
  useIndividualPoolTransactions,
  useYieldAggregatorTransactions,
} from "@/hooks/web3/individual";
```

## Backward Compatibility

Both main files (`use-cooperative-pool.ts` and `use-pool-transactions.ts`) re-export everything from their respective modules. **No code changes are required in components** that import these hooks.

### Before:

```typescript
import { useCooperativePool } from "@/hooks/web3/use-cooperative-pool";
```

### After (still works exactly the same):

```typescript
import { useCooperativePool } from "@/hooks/web3/use-cooperative-pool";
```

## Benefits

1. **Maintainability**: Each file has a single, clear responsibility
2. **Readability**: Files are now 88-344 lines instead of 600-700 lines
3. **Testability**: Easier to test individual modules
4. **Tree-shaking**: Better code splitting and smaller bundles
5. **Developer Experience**: Easier to navigate and understand code
6. **Zero Breaking Changes**: All existing imports continue to work

## File Size Comparison

### Before:

- `use-cooperative-pool.ts`: 712 lines
- `use-pool-transactions.ts`: 676 lines
- **Total: 1,388 lines** in 2 files

### After:

- **Cooperative Pool**: 1,041 lines across 5 files (avg: 208 lines/file)
- **Individual Pool**: 763 lines across 5 files (avg: 153 lines/file)
- **Main Files**: 90 lines across 2 files (just re-exports)
- **Total: 1,894 lines** across 12 files

Note: Total lines increased slightly due to added JSDoc comments, better organization, and separated concerns.

## Usage Examples

### Using the Main Combined Hook

```typescript
const {
  // Actions
  createPool,
  joinPool,
  leavePool,
  claimYield,
  closePool,

  // State
  state,
  error,
  txHash,
  isProcessing,

  // Pool Data
  poolCounter,
  performanceFee,
  emergencyMode,

  // Utils
  reset,
  refetchAll,
  invalidateAll,
} = useCooperativePool();
```

### Using Individual Hooks

```typescript
// More granular control for advanced use cases
import { useCreatePool } from "@/hooks/web3/cooperative/use-pool-mutations";

const { createPool, state, error, isProcessing } = useCreatePool();
```

## Migration Guide

**No migration needed!** All existing code will continue to work without changes.

If you want to benefit from the new modular structure:

1. Import specific hooks instead of the combined hook for better tree-shaking
2. Use helper functions directly for formatting and calculations
3. Access constants and types from the constants module

## Testing

Run TypeScript checks to verify everything compiles:

```bash
pnpm --filter web typecheck
```

All existing imports should work without errors related to the refactored hooks.
