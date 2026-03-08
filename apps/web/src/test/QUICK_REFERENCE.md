# Testing Quick Reference

## Import Everything from `@/test`

```tsx
import {
  // Render
  renderWithProviders,

  // Factories
  createMockPool,
  createMockUser,
  createMockTransaction,
  createMockPoolData,

  // Mocks
  mockContractRead,
  mockContractWrite,
  mockWaitForReceipt,
  MOCK_ADDRESSES,
  handlers,

  // Utilities
  screen,
  waitFor,
  userEvent,
  vi,
  expect,
  describe,
  it,
  beforeEach,
  afterEach,
} from "@/test";
```

## Component Test Template

```tsx
import { renderWithProviders, screen, expect } from "@/test";
import { MyComponent } from "../my-component";

describe("MyComponent", () => {
  it("renders correctly", () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

## API Test Template

```tsx
import { setupServer } from "msw/node";
import { handlers, renderWithProviders, waitForLoadingToFinish } from "@/test";

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it("fetches data", async () => {
  renderWithProviders(<MyComponent />);
  await waitForLoadingToFinish();
  expect(screen.getByText("Data")).toBeInTheDocument();
});
```

## Web3 Test Template

```tsx
import { vi } from "vitest";
import { mockContractRead, mockContractWrite, renderWithProviders } from "@/test";

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useReadContract: vi.fn(() => mockContractRead({ data: BigInt(1000) })),
    useWriteContract: vi.fn(() => mockContractWrite()),
  };
});

it("interacts with contract", () => {
  renderWithProviders(<MyComponent />);
  // Test...
});
```

## Common Assertions

```tsx
// Element exists
expect(screen.getByText("Hello")).toBeInTheDocument();

// Element doesn't exist
expect(screen.queryByText("Goodbye")).not.toBeInTheDocument();

// Element is visible
expect(screen.getByRole("button")).toBeVisible();

// Element is disabled
expect(screen.getByRole("button")).toBeDisabled();

// Element has class
expect(screen.getByText("Hello")).toHaveClass("text-primary");

// Element has attribute
expect(screen.getByRole("link")).toHaveAttribute("href", "/home");

// Input has value
expect(screen.getByLabelText("Name")).toHaveValue("John");
```

## User Interactions

```tsx
const user = userEvent.setup();

// Click
await user.click(screen.getByText("Submit"));

// Type
await user.type(screen.getByLabelText("Name"), "John Doe");

// Clear and type
await user.clear(screen.getByLabelText("Name"));
await user.type(screen.getByLabelText("Name"), "Jane");

// Select
await user.selectOptions(screen.getByRole("combobox"), "option1");

// Upload file
const file = new File(["content"], "test.png", { type: "image/png" });
await user.upload(screen.getByLabelText("Upload"), file);
```

## Async Testing

```tsx
// Wait for element
await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});

// Wait for element to disappear
await waitFor(() => {
  expect(screen.queryByText("Loading")).not.toBeInTheDocument();
});

// Wait for loading to finish
await waitForLoadingToFinish();

// findBy queries (built-in async)
const element = await screen.findByText("Loaded");
```

## Factory Quick Reference

```tsx
// Pool
const pool = createMockPool({
  name: "My Pool",
  tvl: "10000000000000000000", // 10 BTC
  apr: 5.5,
  status: "active",
});

// User
const user = createMockUser({
  address: "0x123...",
  totalDeposited: "5000000000000000000", // 5 BTC
});

// Transaction
const tx = createMockTransaction({
  type: "deposit", // "withdraw", "claim_yield", etc.
  amount: "1000000000000000000", // 1 BTC
  status: "confirmed", // "pending", "failed"
});

// Pool data (for blockchain hooks)
const poolData = createMockPoolData({
  1: "Custom Name",
  3: BigInt(24), // memberCount
});
```

## Mock Hooks

```tsx
// Read contract
vi.mocked(useReadContract).mockReturnValue(
  mockContractRead({
    data: BigInt("1000000000000000000"),
    isSuccess: true,
  })
);

// Write contract
const mockWrite = vi.fn();
vi.mocked(useWriteContract).mockReturnValue(
  mockContractWrite({
    writeContractAsync: mockWrite,
    isPending: false,
  })
);

// Transaction receipt
vi.mocked(useWaitForTransactionReceipt).mockReturnValue(
  mockWaitForReceipt({
    data: { status: "success", ... },
  })
);

// Account
vi.mocked(useAccount).mockReturnValue({
  address: MOCK_ADDRESSES.USER_WALLET,
  isConnected: true,
});
```

## Error Testing

```tsx
// API error
import { errorHandlers } from "@/test";
server.use(errorHandlers.serverError);

// Contract error
import { createMockContractError } from "@/test";
const error = createMockContractError("Insufficient balance");
vi.mocked(useWriteContract).mockReturnValue(mockContractWrite({ isError: true, error }));
```

## Custom Mock Data

```tsx
import { mockData, resetMockData } from "@/test";

// Add custom data
mockData.pools.push(createMockPool({ id: "custom" }));
mockData.users.set("0x123", createMockUser());

// Reset after test
afterEach(() => {
  resetMockData();
});
```

## Delayed Responses (Loading States)

```tsx
import { createDelayedHandler } from "@/test";

server.use(createDelayedHandler(1000)); // 1 second delay
```

## Common Patterns

### Test Connected/Disconnected

```tsx
describe("when connected", () => {
  beforeEach(() => {
    vi.mocked(useAccount).mockReturnValue({
      address: MOCK_ADDRESSES.USER_WALLET,
      isConnected: true,
    });
  });

  it("shows wallet info", () => {
    // Test...
  });
});

describe("when disconnected", () => {
  beforeEach(() => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
    });
  });

  it("shows connect button", () => {
    // Test...
  });
});
```

### Test Form Validation

```tsx
it("validates required fields", async () => {
  const user = userEvent.setup();
  renderWithProviders(<MyForm />);

  // Submit without filling
  await user.click(screen.getByText("Submit"));

  // Check errors
  expect(screen.getByText("Name is required")).toBeInTheDocument();
});
```

### Test Loading States

```tsx
it("shows loading spinner", async () => {
  server.use(createDelayedHandler(500));

  renderWithProviders(<MyComponent />);

  expect(screen.getByRole("status")).toBeInTheDocument();

  await waitForLoadingToFinish();

  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
```

## Debugging Tests

```tsx
// Log DOM
screen.debug();

// Log specific element
screen.debug(screen.getByText("Hello"));

// Get all available queries
screen.logTestingPlaygroundURL();

// Check what's rendered
console.log(container.innerHTML);
```

## Run Tests

```bash
# All tests
pnpm test:run

# Watch mode
pnpm test

# Specific file
pnpm test:run src/features/pools/__tests__/pool-card.test.tsx

# Coverage
pnpm test:coverage

# UI mode
pnpm test:ui
```

## Tips

1. Use `getBy*` when element should exist
2. Use `queryBy*` when element might not exist
3. Use `findBy*` for async elements
4. Always await user interactions
5. Use `waitFor` for async assertions
6. Clean up mocks in `afterEach`
7. Test behavior, not implementation
8. One assertion focus per test
