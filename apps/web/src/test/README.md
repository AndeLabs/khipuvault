# Testing Utilities

Comprehensive testing infrastructure for KhipuVault web application.

## Quick Start

```tsx
import { renderWithProviders, createMockPool, screen, expect, vi } from "@/test";

describe("PoolCard", () => {
  it("displays pool name", () => {
    const pool = createMockPool({ name: "My Pool" });
    renderWithProviders(<PoolCard pool={pool} />);
    expect(screen.getByText("My Pool")).toBeInTheDocument();
  });
});
```

## Directory Structure

```
test/
├── index.ts              # Main export (import from "@/test")
├── setup.tsx             # Global test setup (auto-loaded by vitest)
├── test-utils.tsx        # Render helpers and factory functions
├── test-providers.tsx    # React provider wrapper
├── mocks/
│   ├── handlers.ts       # MSW API mock handlers
│   └── contracts.ts      # Contract mock data and helpers
└── README.md             # This file
```

## Core Functions

### Render with Providers

Always use `renderWithProviders` instead of plain `render`:

```tsx
import { renderWithProviders, screen } from "@/test";

renderWithProviders(<MyComponent />);
expect(screen.getByText("Hello")).toBeInTheDocument();
```

### Factory Functions

Create mock data easily:

```tsx
import { createMockPool, createMockUser, createMockTransaction } from "@/test";

// Pool
const pool = createMockPool({
  name: "Individual Pool",
  tvl: "10000000000000000000", // 10 BTC
  apr: 5.5,
});

// User
const user = createMockUser({
  address: "0x123...",
  totalDeposited: "5000000000000000000", // 5 BTC
});

// Transaction
const tx = createMockTransaction({
  type: "deposit",
  amount: "1000000000000000000",
  status: "confirmed",
});
```

### Wait for Loading

```tsx
import { renderWithProviders, waitForLoadingToFinish, screen } from "@/test";

it("loads data", async () => {
  renderWithProviders(<MyComponent />);
  await waitForLoadingToFinish();
  expect(screen.getByText("Data loaded")).toBeInTheDocument();
});
```

## Mocking Web3 Hooks

### Mock useReadContract

```tsx
import { vi } from "vitest";
import { mockContractRead } from "@/test";

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useReadContract: vi.fn(() =>
      mockContractRead({
        data: BigInt("1000000000000000000"), // 1 BTC
        isSuccess: true,
      })
    ),
  };
});
```

### Mock useWriteContract

```tsx
import { vi } from "vitest";
import { mockContractWrite } from "@/test";

const mockWriteAsync = vi.fn();

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useWriteContract: vi.fn(() =>
      mockContractWrite({
        writeContractAsync: mockWriteAsync,
        isPending: false,
      })
    ),
  };
});

// In test
await act(async () => {
  fireEvent.click(screen.getByText("Deposit"));
});

expect(mockWriteAsync).toHaveBeenCalled();
```

### Mock Transaction Receipt

```tsx
import { mockWaitForReceipt } from "@/test";

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useWaitForTransactionReceipt: vi.fn(() =>
      mockWaitForReceipt({
        data: {
          status: "success",
          transactionHash: "0xabc...",
          blockNumber: BigInt(1000000),
          gasUsed: BigInt(21000),
        },
      })
    ),
  };
});
```

## MSW API Mocking

### Setup MSW Server

```tsx
import { setupServer } from "msw/node";
import { handlers } from "@/test";

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Override Specific Endpoints

```tsx
import { http, HttpResponse } from "msw";
import { server } from "./setup";

it("handles error state", async () => {
  server.use(
    http.get("/api/pools", () => {
      return HttpResponse.json({ message: "Server error" }, { status: 500 });
    })
  );

  // Test error handling...
});
```

### Modify Mock Data

```tsx
import { mockData } from "@/test";

it("shows custom pool", () => {
  mockData.pools.push(createMockPool({ id: "custom", name: "Custom Pool" }));

  // Test...
});

afterEach(() => {
  resetMockData(); // Reset to defaults
});
```

## Common Patterns

### Testing Loading States

```tsx
import { createDelayedHandler } from "@/test";

it("shows loading spinner", async () => {
  server.use(createDelayedHandler(1000));

  renderWithProviders(<MyComponent />);

  // Loading should be visible
  expect(screen.getByRole("status")).toBeInTheDocument();

  // Wait for data
  await waitForLoadingToFinish();

  // Loading should be gone
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
```

### Testing Error States

```tsx
import { errorHandlers } from "@/test";

it("shows error message", async () => {
  server.use(errorHandlers.serverError);

  renderWithProviders(<MyComponent />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```tsx
import { userEvent } from "@/test";

it("handles click", async () => {
  const user = userEvent.setup();
  renderWithProviders(<MyButton />);

  await user.click(screen.getByText("Click me"));

  expect(screen.getByText("Clicked!")).toBeInTheDocument();
});
```

### Testing Forms

```tsx
import { userEvent } from "@/test";

it("submits form", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  renderWithProviders(<MyForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText("Amount"), "1.5");
  await user.click(screen.getByText("Submit"));

  expect(onSubmit).toHaveBeenCalledWith({ amount: "1.5" });
});
```

## Helper Functions

### Address Helpers

```tsx
import { getMockAddress } from "@/test";

const address1 = getMockAddress(0); // First address
const address2 = getMockAddress(1); // Second address
```

### BTC Formatting

```tsx
import { formatBtcForTest, parseBtcForTest } from "@/test";

const formatted = formatBtcForTest(BigInt("1500000000000000000"));
// "1.5000"

const parsed = parseBtcForTest("1.5");
// BigInt("1500000000000000000")
```

## Best Practices

1. **Always use `renderWithProviders`** - Don't use plain `render()`
2. **Use factory functions** - Don't manually create mock objects
3. **Clean up after tests** - Use `beforeEach`/`afterEach` hooks
4. **Test user behavior** - Not implementation details
5. **Use meaningful assertions** - Test what users see/do
6. **Mock external dependencies** - Don't make real API/blockchain calls
7. **Test error states** - Use `errorHandlers` utilities

## Examples

See these files for complete examples:

- `apps/web/src/features/rotating-pool/components/__tests__/rosca-card.test.tsx`
- `apps/web/src/features/rotating-pool/components/__tests__/create-rosca-modal.test.tsx`
- `apps/web/src/components/common/__tests__/amount-display.test.tsx`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Wagmi Testing Guide](https://wagmi.sh/react/guides/testing)
