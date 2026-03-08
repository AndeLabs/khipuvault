# End-to-End Tests

This directory contains end-to-end tests for KhipuVault using Playwright.

## Setup

Install Playwright browsers:

```bash
pnpm exec playwright install
```

## Running Tests

```bash
# Run all tests
pnpm e2e

# Run tests in UI mode (recommended for development)
pnpm e2e:ui

# Run tests in debug mode
pnpm e2e:debug

# Run tests with browser visible
pnpm e2e:headed

# Run tests in specific browser
pnpm e2e:chromium
pnpm e2e:firefox
pnpm e2e:webkit

# View test report
pnpm e2e:report
```

## Project Structure

```
e2e/
├── fixtures.ts                      # Custom test fixtures and helpers
├── pages/                           # Page objects
│   ├── base.page.ts                # Base page with common methods
│   ├── dashboard.page.ts           # Dashboard page object
│   └── individual-savings.page.ts  # Individual savings page object
├── dashboard.spec.ts               # Dashboard tests
└── individual-savings.spec.ts      # Individual savings tests
```

## Writing Tests

### Using Page Objects

```typescript
import { test, expect } from "./fixtures";

test("example test", async ({ dashboardPage }) => {
  await dashboardPage.navigate();
  await dashboardPage.verifyDashboardLoaded();

  await expect(dashboardPage.dashboardHeader).toBeVisible();
});
```

### Using Mock Wallet

```typescript
test("test with wallet", async ({ individualSavingsPage, mockWallet }) => {
  await individualSavingsPage.navigate();

  // Wallet is automatically connected
  expect(mockWallet.isConnected).toBe(true);

  // Mock a transaction
  await mockWallet.mockTransaction("0xcustomhash");
});
```

### Testing Forms

```typescript
test("deposit form validation", async ({ individualSavingsPage }) => {
  await individualSavingsPage.navigate();

  // Fill form
  await individualSavingsPage.fillDepositAmount("10");

  // Submit
  await individualSavingsPage.submitDeposit();

  // Wait for success
  await individualSavingsPage.waitForDepositComplete();
});
```

## Best Practices

1. **Use Page Objects**: Encapsulate page interactions in page objects
2. **Use Fixtures**: Leverage custom fixtures for common setup
3. **Mock Web3**: Use MockWallet for Web3 interactions
4. **Descriptive Tests**: Write clear, descriptive test names
5. **Accessibility**: Include accessibility tests
6. **Responsive**: Test multiple viewport sizes
7. **Error Handling**: Test both success and error states
8. **Performance**: Include performance tests

## CI/CD

Tests run automatically on:

- Pull requests
- Main branch pushes

CI configuration:

- Retries: 2
- Workers: 1 (for consistent results)
- Reporters: HTML + GitHub Actions

## Debugging

### Debug Mode

```bash
pnpm e2e:debug
```

This opens the Playwright Inspector with:

- Step-through debugging
- DOM snapshots
- Network logs
- Console logs

### UI Mode

```bash
pnpm e2e:ui
```

UI mode provides:

- Visual test execution
- Time travel debugging
- Watch mode
- Test filtering

### Screenshots and Videos

On failure, tests automatically capture:

- Screenshots
- Videos (on first retry)
- Traces (on first retry)

View in the HTML report:

```bash
pnpm e2e:report
```

## Configuration

See `playwright.config.ts` for:

- Browser configurations
- Timeouts
- Retry settings
- Screenshot/video settings
- Web server configuration

## Troubleshooting

### Port Already in Use

If port 9002 is in use:

1. Stop the dev server: `pkill -f "next dev"`
2. Or change port in `playwright.config.ts`

### Tests Timing Out

Increase timeout in test:

```typescript
test.setTimeout(60000); // 60 seconds
```

### Flaky Tests

1. Add explicit waits
2. Use `waitForLoadState('networkidle')`
3. Increase retry count in config
4. Check for race conditions

### Mock Wallet Not Working

Ensure `addInitScript` runs before page load:

```typescript
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Mock code here
  });
});
```
