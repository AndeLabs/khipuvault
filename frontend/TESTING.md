# Testing Guide - KhipuVault Frontend

## Overview

This project uses **Vitest** as the test runner with **@testing-library/react** for component testing. Our goal is to maintain **70%+ code coverage** on critical paths.

---

## Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run with coverage report
npm run test:coverage

# Run with UI (interactive)
npm run test:ui

# Watch mode (recommended for development)
npm run test:watch
```

---

## Test Structure

```
frontend/
├── src/
│   ├── hooks/
│   │   └── web3/
│   │       ├── use-individual-pool.ts
│   │       └── use-individual-pool.test.ts  ← Hook tests
│   ├── components/
│   │   └── dashboard/
│   │       ├── deposit-form.tsx
│   │       └── deposit-form.test.tsx        ← Component tests
│   └── test/
│       ├── setup.ts                          ← Global test setup
│       ├── test-utils.tsx                    ← Custom render with providers
│       └── mocks/
│           ├── wagmi.ts                      ← Wagmi mocks
│           └── contracts.ts                  ← Contract data mocks
├── vitest.config.ts                          ← Vitest configuration
└── TESTING.md                                ← This file
```

---

## Writing Tests

### Testing Web3 Hooks

```typescript
// src/hooks/web3/use-individual-pool.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useIndividualPool } from './use-individual-pool'

describe('useIndividualPool', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should return pool statistics', () => {
    const { result } = renderHook(() => useIndividualPool(), { wrapper })

    expect(result.current.poolStats).toBeDefined()
    expect(result.current.poolStats.totalMusdDeposited).toBeDefined()
  })
})
```

### Testing React Components

```typescript
// src/components/dashboard/deposit-form.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/test-utils'
import { DepositForm } from './deposit-form'

describe('DepositForm', () => {
  it('should validate minimum deposit amount', async () => {
    render(<DepositForm />)

    const input = screen.getByLabelText(/amount/i)
    fireEvent.change(input, { target: { value: '0.5' } })

    await waitFor(() => {
      expect(screen.getByText(/minimum.*1 MUSD/i)).toBeInTheDocument()
    })
  })

  it('should call deposit function on submit', async () => {
    const mockDeposit = vi.fn()
    render(<DepositForm onDeposit={mockDeposit} />)

    const input = screen.getByLabelText(/amount/i)
    const submitBtn = screen.getByRole('button', { name: /deposit/i })

    fireEvent.change(input, { target: { value: '10' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockDeposit).toHaveBeenCalledWith('10')
    })
  })
})
```

---

## Using Custom Render

Always use the custom `render` from test-utils to include providers:

```typescript
import { render, screen } from '@/test/test-utils'

// This automatically wraps your component with:
// - WagmiProvider
// - QueryClientProvider
```

---

## Mocking Web3

### Mock Contract Reads

```typescript
import { vi } from 'vitest'

vi.mock('wagmi/actions', () => ({
  readContract: vi.fn().mockResolvedValue(BigInt('1000000000000000000')),
}))
```

### Mock User Account

```typescript
vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234...' as `0x${string}`,
    isConnected: true,
  }),
}))
```

### Using Test Fixtures

```typescript
import { MOCK_USER_INFO, MOCK_POOL_STATS } from '@/test/mocks/contracts'

// Use predefined mock data
const { readContract } = await import('wagmi/actions')
vi.mocked(readContract).mockResolvedValue(MOCK_USER_INFO)
```

---

## Coverage Requirements

### Targets

- **Critical Paths**: 90%+ (deposit, withdraw, wallet connection)
- **Hooks**: 80%+ (all Web3 hooks)
- **Components**: 70%+ (UI components)
- **Utilities**: 60%+ (helper functions)

### Checking Coverage

```bash
npm run test:coverage
```

View HTML report at: `coverage/index.html`

### Coverage Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70,
  },
}
```

CI will fail if coverage drops below these thresholds.

---

## Best Practices

### ✅ DO

- Test user behavior, not implementation details
- Use `screen.getByRole` for better accessibility
- Mock external dependencies (Wagmi, contracts)
- Test error states and edge cases
- Keep tests simple and focused

### ❌ DON'T

- Don't test internal component state
- Don't make assertions on implementation details
- Don't write tests that depend on each other
- Don't mock things you don't need to mock
- Don't skip error handling tests

---

## Testing Checklist

Before committing:

- [ ] All tests pass: `npm run test:run`
- [ ] Coverage meets threshold: `npm run test:coverage`
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Linter passes: `npm run lint`

---

## Common Patterns

### Testing Async Operations

```typescript
await waitFor(() => {
  expect(result.current.isLoading).toBe(false)
})
```

### Testing User Events

```typescript
import { fireEvent } from '@testing-library/react'

fireEvent.click(button)
fireEvent.change(input, { target: { value: '10' } })
```

### Testing Error States

```typescript
it('should handle errors gracefully', async () => {
  vi.mocked(readContract).mockRejectedValue(new Error('Network error'))

  const { result } = renderHook(() => useIndividualPool(), { wrapper })

  await waitFor(() => {
    expect(result.current.error).toBeDefined()
  })
})
```

---

## Troubleshooting

### Tests hanging?

- Check for missing `await` on async operations
- Ensure queries have `retry: false` in test setup

### Mock not working?

- Clear mocks in `beforeEach`: `vi.clearAllMocks()`
- Check mock is defined before component renders

### Coverage not updating?

- Delete `coverage/` directory
- Run `npm run test:coverage` again

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Next Steps

1. Write tests for all Web3 hooks
2. Add component tests for critical UI flows
3. Implement E2E tests with Playwright
4. Set up CI/CD with test runs

**Target**: 70%+ coverage before mainnet deployment
