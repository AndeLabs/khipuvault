---
description: Run full test suite with coverage report
---

# Run All Tests

Execute the complete test suite for KhipuVault:

1. Run linting:

   ```bash
   pnpm lint
   ```

2. Run type checking:

   ```bash
   pnpm typecheck
   ```

3. Run tests with coverage:

   ```bash
   pnpm test
   ```

4. Run contract tests:
   ```bash
   pnpm contracts:test
   ```

Report:

- Total tests passed/failed
- Coverage percentage
- Any failing tests with their error messages
- Suggestions for fixing failures
