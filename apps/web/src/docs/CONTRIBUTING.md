# Contributing to KhipuVault Web

> Guidelines for contributing to `apps/web`

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [File Organization](#file-organization)
- [Creating Components](#creating-components)
- [Creating Hooks](#creating-hooks)
- [Testing](#testing)
- [Git Workflow](#git-workflow)
- [Pull Request Guidelines](#pull-request-guidelines)

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- MetaMask browser extension
- Git

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/khipuvault/khipuvault.git
cd khipuvault

# Install dependencies
pnpm install

# Start development server
pnpm dev --filter=web
```

### Environment Setup

Create `.env.local` in `apps/web/`:

```env
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Development Setup

### Running the App

```bash
# Development with hot reload
pnpm dev --filter=web

# Build for production
pnpm build --filter=web

# Run production build locally
pnpm start --filter=web

# Run tests
pnpm test --filter=web

# Run linting
pnpm lint --filter=web

# Type check
pnpm typecheck --filter=web
```

### IDE Setup

**VS Code Extensions (recommended):**

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript + JavaScript

**Settings (`.vscode/settings.json`):**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Code Style

### TypeScript

- Use strict TypeScript (no `any` unless absolutely necessary)
- Define interfaces for component props
- Use `type` for unions/primitives, `interface` for objects
- Export types alongside their implementations

```typescript
// Good
interface ButtonProps {
  variant?: "primary" | "secondary";
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ variant = "primary", onClick, children }: ButtonProps) {
  // ...
}

// Bad
export function Button(props: any) {
  // ...
}
```

### React

- Use functional components with hooks
- Prefer composition over inheritance
- Use `"use client"` directive only when needed
- Keep components focused (single responsibility)

```tsx
// Good - Focused component
function DepositAmount({ value, onChange }: DepositAmountProps) {
  return <TokenAmountInput value={value} onChange={onChange} symbol="MUSD" />;
}

// Bad - Too many responsibilities
function DepositCard() {
  // Handles form, validation, submission, display, etc.
}
```

### Imports

Order imports as follows:

1. React/Next.js
2. External libraries
3. Internal absolute imports (`@/`)
4. Relative imports

```typescript
// React/Next
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// External
import { useQueryClient } from "@tanstack/react-query";
import { parseEther } from "viem";
import { useAccount } from "wagmi";

// Internal absolute
import { Button } from "@/components/ui/button";
import { useDeposit } from "@/hooks/web3/individual";
import { formatMUSD } from "@/lib/format";

// Relative
import { DepositForm } from "./deposit-form";
import type { DepositFormData } from "./types";
```

### Naming Conventions

| Type               | Convention                | Example                        |
| ------------------ | ------------------------- | ------------------------------ |
| Components         | PascalCase                | `DepositCard`, `UserProfile`   |
| Hooks              | camelCase, `use` prefix   | `useDeposit`, `useModalFlow`   |
| Functions          | camelCase                 | `handleSubmit`, `formatAmount` |
| Constants          | SCREAMING_SNAKE_CASE      | `MAX_DEPOSIT`, `API_URL`       |
| Files (components) | kebab-case                | `deposit-card.tsx`             |
| Files (hooks)      | kebab-case, `use-` prefix | `use-deposit.ts`               |
| Types/Interfaces   | PascalCase                | `DepositFormData`, `PoolInfo`  |

---

## File Organization

### Feature-Based Structure

Organize code by feature, not by type:

```
features/
  individual-savings/
    components/
      deposit-card.tsx
      withdraw-card.tsx
      position-card.tsx
      index.ts
    hooks/
      use-deposit-form.ts
      index.ts
    types.ts
    index.ts
```

### Component Structure

```tsx
// deposit-card.tsx

/**
 * @fileoverview Deposit card component
 * @module features/individual-savings/components/deposit-card
 */

"use client";

import { useState } from "react";
// ... other imports

// Types
interface DepositCardProps {
  onSuccess?: () => void;
}

// Constants
const MIN_DEPOSIT = "10";

// Component
export function DepositCard({ onSuccess }: DepositCardProps) {
  // State
  const [amount, setAmount] = useState("");

  // Hooks
  const { deposit, isProcessing } = useDeposit();

  // Handlers
  const handleSubmit = async () => {
    // ...
  };

  // Render
  return <Card>{/* ... */}</Card>;
}
```

### Barrel Exports

Create `index.ts` files for clean imports:

```typescript
// components/index.ts
export { DepositCard } from "./deposit-card";
export { WithdrawCard } from "./withdraw-card";
export { PositionCard } from "./position-card";

// Usage
import { DepositCard, WithdrawCard } from "@/features/individual-savings/components";
```

---

## Creating Components

### Component Template

````tsx
/**
 * @fileoverview [Description]
 * @module [path/to/component]
 */

"use client";

import { type ComponentProps } from "react";
// ... imports

// ============================================================================
// TYPES
// ============================================================================

interface MyComponentProps {
  /** Description of prop */
  title: string;
  /** Optional prop with default */
  variant?: "default" | "compact";
  /** Event handler */
  onAction?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * MyComponent description
 *
 * @example
 * ```tsx
 * <MyComponent title="Hello" onAction={() => console.log("clicked")} />
 * ```
 */
export function MyComponent({ title, variant = "default", onAction }: MyComponentProps) {
  // Implementation
  return (
    <div className="...">
      <h2>{title}</h2>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS (if needed)
// ============================================================================

function MyComponentItem() {
  // ...
}
````

### UI Component Guidelines

1. **Use shadcn/ui primitives** when possible
2. **Extend with Tailwind** for custom styling
3. **Use `cn()` utility** for conditional classes
4. **Support dark mode** (already configured)
5. **Include loading states**
6. **Handle errors gracefully**

```tsx
import { cn } from "@/lib/utils";

function Card({ className, isLoading, error, children }: CardProps) {
  if (isLoading) {
    return <CardSkeleton />;
  }

  if (error) {
    return <CardError error={error} />;
  }

  return <div className={cn("bg-card rounded-lg border p-4", className)}>{children}</div>;
}
```

---

## Creating Hooks

### Hook Template

````typescript
/**
 * @fileoverview [Description]
 * @module hooks/[path]
 *
 * @example
 * ```tsx
 * const { data, execute, isLoading } = useMyHook();
 * ```
 */

"use client";

import { useCallback, useState } from "react";
// ... imports

// ============================================================================
// TYPES
// ============================================================================

export interface UseMyHookOptions {
  /** Option description */
  enabled?: boolean;
}

export interface UseMyHookResult {
  /** Data from hook */
  data: DataType | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
  /** Execute action */
  execute: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook description
 *
 * @param options - Configuration options
 * @returns Hook result with data and actions
 */
export function useMyHook(options: UseMyHookOptions = {}): UseMyHookResult {
  const { enabled = true } = options;

  // State
  const [data, setData] = useState<DataType | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Actions
  const execute = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // ... logic
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, execute };
}
````

### Web3 Hook Guidelines

1. **Use Wagmi hooks** as building blocks
2. **Handle wallet disconnection**
3. **Use query keys factory** for React Query
4. **Invalidate cache** after mutations
5. **Parse errors** with web3-errors utility

```typescript
import { useReadContract, useWriteContract } from "wagmi";
import { queryKeys } from "@/lib/query-keys";
import { parseWeb3Error } from "@/lib/errors/web3-errors";

export function usePoolData(poolId: bigint) {
  const { address } = useAccount();

  return useReadContract({
    address: POOL_ADDRESS,
    abi: POOL_ABI,
    functionName: "getPool",
    args: [poolId],
    query: {
      enabled: !!address,
      queryKey: queryKeys.cooperativePool.pool(Number(poolId)),
    },
  });
}
```

---

## Testing

### Test File Location

Place tests next to the files they test:

```
components/
  deposit-card.tsx
  deposit-card.test.tsx
hooks/
  use-deposit.ts
  __tests__/
    use-deposit.test.ts
```

### Component Tests

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { DepositCard } from "./deposit-card";

describe("DepositCard", () => {
  it("renders deposit form", () => {
    render(<DepositCard />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /deposit/i })).toBeInTheDocument();
  });

  it("validates minimum amount", async () => {
    render(<DepositCard />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "1" } });
    expect(screen.getByText(/minimum/i)).toBeInTheDocument();
  });

  it("calls onSuccess after deposit", async () => {
    const onSuccess = vi.fn();
    render(<DepositCard onSuccess={onSuccess} />);
    // ... test deposit flow
    expect(onSuccess).toHaveBeenCalled();
  });
});
```

### Hook Tests

```typescript
import { renderHook, act, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useDeposit } from "./use-deposit";
import { TestProviders } from "@/test/setup";

describe("useDeposit", () => {
  it("returns initial state", () => {
    const { result } = renderHook(() => useDeposit(), {
      wrapper: TestProviders,
    });

    expect(result.current.isDepositing).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it("handles deposit", async () => {
    const { result } = renderHook(() => useDeposit(), {
      wrapper: TestProviders,
    });

    await act(async () => {
      await result.current.deposit(parseEther("100"));
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test deposit-card.test.tsx
```

---

## Git Workflow

### Branch Naming

```
feature/add-deposit-form
fix/wallet-connection-error
refactor/simplify-hooks
docs/update-readme
chore/update-dependencies
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(deposit): add auto-compound toggle
fix(wallet): handle disconnection during transaction
refactor(hooks): extract shared logic to useApproveAndExecute
docs(web3): add transaction flow documentation
test(deposit): add integration tests
chore(deps): update wagmi to 2.x
```

### Commit Workflow

```bash
# Stage changes
git add .

# Commit with conventional message
git commit -m "feat(deposit): add validation for minimum amount"

# Push to feature branch
git push origin feature/deposit-validation
```

---

## Pull Request Guidelines

### Before Submitting

1. **Run all checks locally:**

   ```bash
   pnpm lint --filter=web
   pnpm typecheck --filter=web
   pnpm test --filter=web
   pnpm build --filter=web
   ```

2. **Update documentation** if needed

3. **Add/update tests** for new functionality

4. **Keep PRs focused** - one feature or fix per PR

### PR Template

```markdown
## Summary

Brief description of changes

## Changes

- Added X
- Fixed Y
- Refactored Z

## Testing

- [ ] Unit tests added/updated
- [ ] Manual testing done
- [ ] All existing tests pass

## Screenshots (if UI changes)

[Screenshots here]

## Related Issues

Fixes #123
```

### Review Checklist

- [ ] Code follows style guidelines
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Loading states are handled
- [ ] Tests are included
- [ ] Documentation is updated
- [ ] No console.log statements
- [ ] No hardcoded values

---

## Need Help?

- Check existing documentation in `src/docs/`
- Look at similar implementations in the codebase
- Ask in the team chat

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [HOOKS.md](./HOOKS.md) - Custom hooks documentation
- [COMPONENTS.md](./COMPONENTS.md) - UI components guide
- [WEB3.md](./WEB3.md) - Blockchain integration guide
