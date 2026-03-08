# Playwright Installation Guide

Quick guide to get Playwright E2E tests running.

## Step 1: Install Playwright

```bash
cd /Users/munay/dev/KhipuVault

# Install Playwright test package
pnpm add -D @playwright/test --filter @khipu/web
```

## Step 2: Install Browsers

```bash
cd apps/web

# Install all browsers
pnpm exec playwright install

# Or install specific browsers only
pnpm exec playwright install chromium
pnpm exec playwright install firefox
pnpm exec playwright install webkit
```

## Step 3: Verify Installation

```bash
# Run tests in UI mode (best for first time)
pnpm e2e:ui

# Or run all tests
pnpm e2e

# Or run specific test
pnpm exec playwright test e2e/dashboard.spec.ts
```

## Step 4: View Test Report

After running tests:

```bash
pnpm e2e:report
```

## Common Issues

### Issue: Browsers not found

```bash
# Solution: Install browsers
pnpm exec playwright install
```

### Issue: Port 9002 already in use

```bash
# Solution: Stop existing dev server
pkill -f "next dev"

# Or change port in playwright.config.ts
```

### Issue: Tests timeout

```bash
# Solution: Increase timeout in playwright.config.ts
# Or in specific test:
test.setTimeout(60000);
```

## Quick Test Run

```bash
# Start from project root
cd /Users/munay/dev/KhipuVault

# Run E2E tests
pnpm --filter @khipu/web e2e

# Run with UI (recommended)
pnpm --filter @khipu/web e2e:ui
```

## Dependencies Added

The following will be added to `apps/web/package.json`:

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

## System Requirements

- Node.js 18+
- macOS, Linux, or Windows
- 1GB free disk space (for browsers)
- 8GB RAM recommended

## Next Steps

1. Install Playwright: `pnpm add -D @playwright/test --filter @khipu/web`
2. Install browsers: `cd apps/web && pnpm exec playwright install`
3. Run tests: `pnpm e2e:ui`
4. Read documentation: `apps/web/e2e/README.md`
5. View summary: `apps/web/E2E_SETUP_SUMMARY.md`

## Useful Commands

```bash
# Install
pnpm add -D @playwright/test --filter @khipu/web
cd apps/web && pnpm exec playwright install

# Run tests
pnpm e2e                    # All tests
pnpm e2e:ui                 # UI mode
pnpm e2e:debug              # Debug mode
pnpm e2e:headed             # See browser
pnpm e2e:chromium           # Chrome only

# Reports
pnpm e2e:report             # View HTML report

# Specific tests
pnpm exec playwright test e2e/dashboard.spec.ts
pnpm exec playwright test --grep "deposit"
```

## VS Code Extension (Optional)

Install the Playwright extension for VS Code:

1. Open VS Code
2. Search for "Playwright Test for VSCode"
3. Install the extension
4. Restart VS Code
5. Run tests from sidebar

## Documentation

- Setup: `apps/web/E2E_SETUP_SUMMARY.md`
- Usage: `apps/web/e2e/README.md`
- Template: `apps/web/e2e/pages/TEMPLATE.page.ts`
- Config: `apps/web/playwright.config.ts`
