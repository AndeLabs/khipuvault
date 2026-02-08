# Pre-Push Quality Gates Guide

> Comprehensive quality checks that run before pushing code to remote

## Overview

The pre-push hook ensures code quality and prevents broken code from reaching shared branches. It runs automatically before every `git push` operation.

**Execution Time:** Typically 10-30 seconds (depending on changes)

---

## What Checks Run

### 1. TypeScript Type Checking ⚡ CRITICAL

**What:** Validates all TypeScript types across the monorepo
**Why:** Catches type errors before they break production
**Always runs:** Yes (cannot be skipped)

```bash
# Equivalent command
pnpm typecheck
```

**Common failures:**

- Missing type definitions
- Incompatible type assignments
- Undefined properties or methods

**How to fix:**

```bash
# Run locally to see errors
pnpm typecheck

# Check specific package
pnpm --filter @khipu/web typecheck
```

---

### 2. Test Suite 🧪

**What:** Runs tests (full suite on protected branches, changed files only on feature branches)
**Why:** Prevents broken functionality from being pushed
**Protected branches:** Full test suite (`main`, `develop`, `staging`, `production`)
**Feature branches:** Tests for changed packages only

```bash
# Equivalent command (full)
pnpm test

# Run specific package tests
pnpm --filter @khipu/web test
pnpm --filter @khipu/api test
```

**Common failures:**

- Failing unit tests
- Breaking changes in integration tests
- Snapshot mismatches

**How to fix:**

```bash
# Run tests locally
pnpm test

# Run with coverage
pnpm test:coverage

# Update snapshots (if intended)
pnpm test -- -u
```

---

### 3. Focused Test Detection 🔍

**What:** Detects `.only()` or `.skip()` in test files
**Why:** Prevents accidentally committing focused tests that skip other tests

**Caught patterns:**

- `test.only()`
- `it.only()`
- `describe.only()`
- `test.skip()`
- `it.skip()`
- `describe.skip()`

**How to fix:**

```typescript
// ❌ BAD - Will be caught
test.only("should work", () => {
  /* ... */
});
describe.skip("feature tests", () => {
  /* ... */
});

// ✅ GOOD
test("should work", () => {
  /* ... */
});
describe("feature tests", () => {
  /* ... */
});
```

---

### 4. Console.log Detection 🚫

**What:** Detects `console.log`, `console.debug`, `console.info` in production code
**Why:** Production code should use proper logging (Pino)
**Exclusions:** Test files, config files, scripts

**Protected branches:** Hard fail
**Feature branches:** Warning only

**How to fix:**

```typescript
// ❌ BAD - Will be caught
console.log("User data:", user);
console.debug("Processing...");

// ✅ GOOD - Backend
import { logger } from "./logger";
logger.info({ user }, "User data");
logger.debug("Processing...");

// ✅ GOOD - Frontend
// Remove or use conditional dev logging
if (process.env.NODE_ENV === "development") {
  console.log("Debug info");
}
```

**Quick cleanup:**

```bash
# Find all console.log statements
grep -r "console\.log" apps/ packages/ --include="*.ts" --include="*.tsx"

# Use your editor's find/replace to remove them
```

---

### 5. TODO/FIXME Check 📝

**What:** Detects TODO, FIXME, XXX, HACK comments in changes
**Why:** Reminds you to track technical debt

**Protected branches:** Interactive confirmation required
**Feature branches:** Info only

**Caught patterns:**

```typescript
// TODO: Implement error handling
// FIXME: Memory leak in this function
// XXX: Temporary workaround
// HACK: Remove this after API update
```

**How to handle:**

- Create GitHub issues for important TODOs
- Remove completed TODOs
- Document WHY something is a TODO
- Consider if the code is ready to push

**Not blocked:** This is a reminder, not a blocker

---

### 6. Bundle Size Check 📦

**What:** Checks Next.js bundle size (web app changes only)
**Why:** Prevents accidentally shipping huge bundles
**When:** Only on protected branches when web app changes detected

**What's checked:**

- `.next` directory size
- First-load JavaScript size
- Route-specific bundle sizes

**How to investigate large bundles:**

```bash
# Build and analyze
pnpm --filter @khipu/web build

# Check bundle composition
ANALYZE=true pnpm --filter @khipu/web build

# Review output in .next/analyze/
```

**Common causes of bundle bloat:**

- Importing entire libraries instead of specific exports
- Including dev dependencies in production
- Large JSON/data files
- Unnecessary polyfills

---

## Branch Behavior

### Protected Branches (`main`, `develop`, `staging`, `production`)

**All checks enforced:**

- ✅ TypeScript type checking (fail fast)
- ✅ Full test suite
- ✅ No focused tests (.only/.skip)
- ⛔ No console.log (hard fail)
- ⚠️ TODO/FIXME (confirmation required)
- 📊 Bundle size check

**Expected time:** 20-40 seconds

---

### Feature Branches (`feature/`, `fix/`, `chore/`, etc.)

**Minimal checks:**

- ✅ TypeScript type checking (fail fast)
- ✅ Tests for changed packages only
- ✅ No focused tests (.only/.skip)
- ⚠️ console.log (warning only)
- ℹ️ TODO/FIXME (info only)
- ⏭️ Bundle size check skipped

**Expected time:** 10-20 seconds

---

## How to Bypass (Emergency Only!)

### Skip All Checks

```bash
git push --no-verify
```

⚠️ **WARNING:** Only use in true emergencies:

- Hotfix for production incident
- Critical security patch
- Reverting a broken commit

**NEVER bypass for:**

- "I'm in a hurry"
- "I'll fix it later"
- "It's just a small change"
- "Tests are flaky"

---

### Skip Specific Check

The hook doesn't support skipping individual checks. If you need to bypass, you must skip all checks with `--no-verify`.

**Alternative:** Fix the specific issue:

```bash
# Type errors
pnpm typecheck

# Test failures
pnpm test

# Console.log statements
# Remove them or move to proper logging

# Focused tests
# Remove .only() or .skip()
```

---

## Common Failures & Solutions

### "Type checking failed!"

**Cause:** TypeScript compilation errors

**Solution:**

```bash
# See detailed errors
pnpm typecheck

# Fix types in specific package
cd apps/web
pnpm typecheck

# Common fixes:
# - Add missing type imports
# - Fix type mismatches
# - Add proper type annotations
```

---

### "Some tests failed!"

**Cause:** Unit or integration test failures

**Solution:**

```bash
# Run tests locally
pnpm test

# Run specific test file
pnpm test path/to/test.ts

# Run with verbose output
pnpm test -- --reporter=verbose

# Update snapshots if intended
pnpm test -- -u
```

---

### "Focused or skipped tests detected!"

**Cause:** `.only()` or `.skip()` in test files

**Solution:**

```bash
# Find focused tests
grep -r "\.only\(" apps/ packages/ --include="*.test.ts"
grep -r "\.skip\(" apps/ packages/ --include="*.test.ts"

# Remove them:
# test.only() → test()
# describe.skip() → describe()
```

---

### "console.log statements detected!"

**Cause:** Console statements in production code

**Solution:**

```bash
# Find all console.log
grep -r "console\.log" apps/ packages/ --include="*.ts" --include="*.tsx"

# Backend: Use Pino
import { logger } from './logger'
logger.info('message')

# Frontend: Remove or use conditional logging
if (process.env.NODE_ENV === 'development') {
  console.log('debug info')
}
```

---

### "Bundle size increased dramatically!"

**Cause:** Large dependencies or inefficient imports

**Solution:**

```bash
# Analyze bundle
ANALYZE=true pnpm --filter @khipu/web build

# Check for:
# - Importing entire libraries: import _ from 'lodash' → import debounce from 'lodash/debounce'
# - Large dependencies in client code
# - Duplicate dependencies
```

---

## Performance Tips

### Speed Up Pre-Push Checks

1. **Keep tests fast**
   - Use test isolation
   - Mock external dependencies
   - Avoid unnecessary setup

2. **Run checks locally before pushing**

   ```bash
   # Quick check before push
   pnpm typecheck && pnpm test
   ```

3. **Push feature branches frequently**
   - Smaller changesets = faster checks
   - Easier to debug failures

4. **Use feature branch workflow**
   - Develop in feature branches (minimal checks)
   - Only merge to main when ready (full checks)

---

## Integration with CI/CD

The pre-push hook provides **fast local feedback**. CI/CD provides additional checks:

### Local (Pre-Push)

- ⚡ TypeScript type checking
- ⚡ Tests (changed packages)
- ⚡ Linting quick checks

### CI/CD (GitHub Actions)

- 🔒 Full test suite with coverage
- 🔒 E2E tests
- 🔒 Security scans
- 🔒 Build verification
- 🔒 Deployment checks

**The pre-push hook is your first line of defense, not the only line.**

---

## Troubleshooting

### Hook doesn't run

```bash
# Reinstall Husky
pnpm prepare

# Check hook is executable
chmod +x .husky/pre-push

# Verify hook exists
ls -la .husky/pre-push
```

---

### Hook runs but fails immediately

```bash
# Check for syntax errors
sh -n .husky/pre-push

# Run hook manually
./.husky/pre-push

# Check Husky configuration
cat .husky/_/husky.sh
```

---

### Tests pass locally but fail in hook

**Possible causes:**

- Environment variable differences
- File system case sensitivity
- Uncommitted test files
- Cache issues

**Solution:**

```bash
# Clear test cache
pnpm test -- --clearCache

# Check for uncommitted files
git status

# Run tests in CI mode
CI=true pnpm test
```

---

### Hook takes too long

**Typical times:**

- Feature branch: 10-20s
- Protected branch: 20-40s

**If slower:**

```bash
# Profile your tests
pnpm test -- --reporter=verbose

# Check which package is slow
pnpm --filter @khipu/web test
pnpm --filter @khipu/api test

# Consider splitting large test suites
```

---

## Best Practices

### ✅ DO

- Run `pnpm typecheck && pnpm test` before pushing
- Keep tests fast and focused
- Use proper logging (Pino) instead of console.log
- Track TODOs in issue tracker
- Push feature branches frequently
- Review check output carefully

### ❌ DON'T

- Don't use `--no-verify` unless emergency
- Don't commit `.only()` or `.skip()` tests
- Don't commit console.log in production code
- Don't ignore warnings on feature branches
- Don't push broken code with intention to "fix later"

---

## Getting Help

### Hook issues

```bash
# Check hook configuration
cat .husky/pre-push

# Run hook manually for debugging
./.husky/pre-push

# View this guide
cat .husky/PRE_PUSH_GUIDE.md
```

### Test failures

```bash
# Run tests with verbose output
pnpm test -- --reporter=verbose

# Run specific test
pnpm test path/to/test.ts

# Check test coverage
pnpm test:coverage
```

### Type errors

```bash
# Full type check
pnpm typecheck

# Package-specific
pnpm --filter @khipu/web typecheck
```

---

## Version History

- **v1.0** (2024-02-08): Initial implementation
  - TypeScript type checking
  - Test suite (smart filtering)
  - Focused test detection
  - console.log detection
  - TODO/FIXME warnings
  - Bundle size check
  - Branch-specific behavior

---

## Additional Resources

- [Husky Documentation](https://typicode.github.io/husky/)
- [Git Hooks Guide](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [KhipuVault CLAUDE.md](/CLAUDE.md) - Project conventions
- [Commit Convention Guide](.husky/COMMIT_CONVENTION.md)

---

**Remember:** These checks exist to help you ship better code faster. They catch issues before they reach code review or production. Embrace them!
