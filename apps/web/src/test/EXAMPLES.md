# Testing Examples

Complete examples showing how to use the testing infrastructure.

## Example 1: Simple Component Test

Testing a component that displays pool information.

```tsx
// src/features/pools/__tests__/pool-card.test.tsx
import { renderWithProviders, createMockPool, screen, expect } from "@/test";
import { PoolCard } from "../pool-card";

describe("PoolCard", () => {
  it("displays pool name and TVL", () => {
    const pool = createMockPool({
      name: "Individual Savings",
      tvl: "10000000000000000000", // 10 BTC
    });

    renderWithProviders(<PoolCard pool={pool} />);

    expect(screen.getByText("Individual Savings")).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument(); // TVL display
  });

  it("shows active status badge", () => {
    const pool = createMockPool({ status: "active" });

    renderWithProviders(<PoolCard pool={pool} />);

    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
```

## Example 2: Testing with API Calls (MSW)

Testing a component that fetches data from the API.

```tsx
// src/features/portfolio/__tests__/portfolio-view.test.tsx
import { setupServer } from "msw/node";
import {
  renderWithProviders,
  handlers,
  mockData,
  createMockUser,
  screen,
  waitForLoadingToFinish,
  expect,
  beforeAll,
  afterEach,
  afterAll,
} from "@/test";
import { PortfolioView } from "../portfolio-view";

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("PortfolioView", () => {
  it("loads and displays user portfolio", async () => {
    const userAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
    const mockUser = createMockUser({
      address: userAddress,
      totalDeposited: "5000000000000000000",
    });

    mockData.users.set(userAddress, mockUser);

    renderWithProviders(<PortfolioView address={userAddress} />);

    await waitForLoadingToFinish();

    expect(screen.getByText(/5\.00/)).toBeInTheDocument(); // Total deposited
  });

  it("shows error message on API failure", async () => {
    const { errorHandlers } = await import("@/test");

    server.use(errorHandlers.serverError);

    renderWithProviders(<PortfolioView address="0x123" />);

    await waitForLoadingToFinish();

    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

## Example 3: Testing Contract Interactions

Testing a component that interacts with blockchain contracts.

```tsx
// src/features/deposits/__tests__/deposit-form.test.tsx
import { vi } from "vitest";
import {
  renderWithProviders,
  mockContractRead,
  mockContractWrite,
  mockWaitForReceipt,
  MOCK_ADDRESSES,
  screen,
  userEvent,
  expect,
  waitFor,
} from "@/test";
import { DepositForm } from "../deposit-form";

// Mock wagmi hooks
const mockWriteAsync = vi.fn();

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useAccount: vi.fn(() => ({
      address: MOCK_ADDRESSES.USER_WALLET,
      isConnected: true,
    })),
    useReadContract: vi.fn(() =>
      mockContractRead({
        data: BigInt("1000000000"), // MUSD balance
      })
    ),
    useWriteContract: vi.fn(() =>
      mockContractWrite({
        writeContractAsync: mockWriteAsync,
      })
    ),
    useWaitForTransactionReceipt: vi.fn(() => mockWaitForReceipt()),
  };
});

describe("DepositForm", () => {
  it("submits deposit transaction", async () => {
    const user = userEvent.setup();

    mockWriteAsync.mockResolvedValue("0xabc123...");

    renderWithProviders(<DepositForm />);

    // Fill in amount
    const input = screen.getByLabelText(/amount/i);
    await user.type(input, "1.5");

    // Submit
    const button = screen.getByText(/deposit/i);
    await user.click(button);

    await waitFor(() => {
      expect(mockWriteAsync).toHaveBeenCalled();
    });
  });

  it("shows error for insufficient balance", async () => {
    const user = userEvent.setup();

    renderWithProviders(<DepositForm />);

    const input = screen.getByLabelText(/amount/i);
    await user.type(input, "999999");

    const button = screen.getByText(/deposit/i);
    await user.click(button);

    expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument();
  });
});
```

## Example 4: Testing Loading States

```tsx
// src/features/pools/__tests__/pool-list.test.tsx
import {
  renderWithProviders,
  createDelayedHandler,
  screen,
  waitForLoadingToFinish,
  expect,
} from "@/test";
import { setupServer } from "msw/node";
import { handlers } from "@/test";
import { PoolList } from "../pool-list";

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("PoolList", () => {
  it("shows loading skeleton while fetching", async () => {
    // Delay response by 500ms
    server.use(createDelayedHandler(500));

    renderWithProviders(<PoolList />);

    // Should show loading skeleton
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Wait for data to load
    await waitForLoadingToFinish();

    // Loading should be gone
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
```

## Example 5: Testing Forms with Validation

```tsx
// src/features/rosca/__tests__/create-rosca-form.test.tsx
import { renderWithProviders, screen, userEvent, expect, waitFor } from "@/test";
import { CreateRoscaForm } from "../create-rosca-form";

describe("CreateRoscaForm", () => {
  it("validates required fields", async () => {
    const user = userEvent.setup();

    renderWithProviders(<CreateRoscaForm />);

    // Try to submit without filling fields
    const submitButton = screen.getByText(/create pool/i);
    await user.click(submitButton);

    // Should show validation errors
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
  });

  it("submits valid form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(<CreateRoscaForm onSubmit={onSubmit} />);

    // Fill in form
    await user.type(screen.getByLabelText(/pool name/i), "Test ROSCA");
    await user.type(screen.getByLabelText(/contribution/i), "0.1");
    await user.type(screen.getByLabelText(/members/i), "12");

    // Submit
    await user.click(screen.getByText(/create pool/i));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Test ROSCA",
        contribution: "0.1",
        members: "12",
      });
    });
  });
});
```

## Example 6: Testing Custom Hooks

```tsx
// src/hooks/__tests__/use-pool-stats.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper, mockData, createMockPool } from "@/test";
import { usePoolStats } from "../use-pool-stats";

describe("usePoolStats", () => {
  it("fetches pool statistics", async () => {
    const pool = createMockPool({ id: "pool-1" });
    mockData.pools.push(pool);

    const { result } = renderHook(() => usePoolStats("pool-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });

  it("handles errors gracefully", async () => {
    const { result } = renderHook(() => usePoolStats("invalid-pool"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
```

## Example 7: Testing with Multiple Providers

```tsx
// src/features/lottery/__tests__/lottery-dashboard.test.tsx
import { renderWithProviders, createMockUser, screen } from "@/test";
import { vi } from "vitest";
import { LotteryDashboard } from "../lottery-dashboard";

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useAccount: vi.fn(() => ({
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      isConnected: true,
    })),
  };
});

describe("LotteryDashboard", () => {
  it("renders for connected user", () => {
    renderWithProviders(<LotteryDashboard />);

    expect(screen.getByText(/lottery pool/i)).toBeInTheDocument();
  });
});
```

## Example 8: Snapshot Testing

```tsx
// src/components/__tests__/stat-card.test.tsx
import { renderWithProviders } from "@/test";
import { StatCard } from "../stat-card";

describe("StatCard", () => {
  it("matches snapshot", () => {
    const { container } = renderWithProviders(
      <StatCard title="Total Value" value="10.5 BTC" change="+5.2%" />
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## Example 9: Testing Error Boundaries

```tsx
// src/components/__tests__/error-boundary.test.tsx
import { renderWithProviders, screen } from "@/test";
import { ErrorBoundary } from "../error-boundary";

const ThrowError = () => {
  throw new Error("Test error");
};

describe("ErrorBoundary", () => {
  it("catches and displays errors", () => {
    // Suppress console.error for this test
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithProviders(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
```

## Example 10: Integration Test

```tsx
// src/features/deposits/__tests__/deposit-flow.integration.test.tsx
import { setupServer } from "msw/node";
import {
  renderWithProviders,
  handlers,
  mockContractWrite,
  screen,
  userEvent,
  waitFor,
  expect,
} from "@/test";
import { vi } from "vitest";
import { DepositFlow } from "../deposit-flow";

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("DepositFlow Integration", () => {
  it("completes full deposit flow", async () => {
    const user = userEvent.setup();
    const mockWrite = vi.fn().mockResolvedValue("0xabc123");

    vi.mock("wagmi", async () => {
      const actual = await vi.importActual("wagmi");
      return {
        ...actual,
        useWriteContract: vi.fn(() =>
          mockContractWrite({
            writeContractAsync: mockWrite,
          })
        ),
      };
    });

    renderWithProviders(<DepositFlow />);

    // Step 1: Enter amount
    await user.type(screen.getByLabelText(/amount/i), "1.5");
    await user.click(screen.getByText(/next/i));

    // Step 2: Review
    expect(screen.getByText(/1\.5 BTC/i)).toBeInTheDocument();
    await user.click(screen.getByText(/confirm/i));

    // Step 3: Wait for transaction
    await waitFor(() => {
      expect(mockWrite).toHaveBeenCalled();
    });

    // Success message
    expect(screen.getByText(/deposit successful/i)).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Use factory functions** - Always use `createMockPool`, `createMockUser`, etc.
2. **Clean up** - Reset mock data between tests with `resetMockData()`
3. **Wait for async** - Use `waitForLoadingToFinish()` or `waitFor()`
4. **Test user behavior** - Click buttons, type in inputs, check what users see
5. **Mock external deps** - Use MSW for API, mock wagmi for Web3
6. **Descriptive names** - Test names should describe behavior
7. **One assertion focus** - Each test should verify one specific behavior
8. **Arrange-Act-Assert** - Structure tests clearly

## Common Patterns

### Testing Authentication States

```tsx
const mockConnectedUser = () => {
  vi.mocked(useAccount).mockReturnValue({
    address: MOCK_ADDRESSES.USER_WALLET,
    isConnected: true,
  });
};

const mockDisconnectedUser = () => {
  vi.mocked(useAccount).mockReturnValue({
    address: undefined,
    isConnected: false,
  });
};
```

### Testing Transaction States

```tsx
const mockPendingTx = () => {
  vi.mocked(useWriteContract).mockReturnValue(
    mockContractWrite({ isPending: true })
  );
};

const mockSuccessTx = () => {
  vi.mocked(useWaitForTransactionReceipt).mockReturnValue(
    mockWaitForReceipt({
      data: { status: "success", ... },
    })
  );
};
```

### Testing Error Scenarios

```tsx
it("handles contract revert", async () => {
  const error = createMockContractError("Insufficient balance");

  vi.mocked(useWriteContract).mockReturnValue(mockContractWrite({ isError: true, error }));

  renderWithProviders(<MyComponent />);
  expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument();
});
```
