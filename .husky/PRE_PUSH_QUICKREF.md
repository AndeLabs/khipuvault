# Pre-Push Quick Reference

> Fast reference for pre-push quality gates

## Quick Commands

```bash
# Check if your code is ready to push
pnpm push:check

# View full guide
pnpm push:help

# Bypass all checks (emergency only!)
git push --no-verify
```

---

## What Runs

| Check                 | Protected Branches | Feature Branches | Time   |
| --------------------- | ------------------ | ---------------- | ------ |
| TypeScript typecheck  | ✅ Fail            | ✅ Fail          | ~5s    |
| Test suite            | ✅ Full suite      | ⚡ Changed only  | ~10s   |
| Focused tests (.only) | ✅ Fail            | ✅ Fail          | ~1s    |
| console.log check     | ⛔ Fail            | ⚠️ Warn          | ~1s    |
| TODO/FIXME comments   | ⚠️ Confirm         | ℹ️ Info          | ~1s    |
| Bundle size           | 📊 Check           | ⏭️ Skip          | ~5-10s |

**Protected branches:** `main`, `develop`, `staging`, `production`
**Feature branches:** `feature/`, `fix/`, `chore/`, `docs/`, `test/`, `wip/`

---

## Common Failures

### Type checking failed

```bash
pnpm typecheck                    # See errors
pnpm --filter @khipu/web typecheck   # Check specific package
```

### Tests failed

```bash
pnpm test                         # Run all tests
pnpm test path/to/test.ts         # Run specific test
pnpm test -- -u                   # Update snapshots
```

### Focused tests detected

```bash
# Find them
grep -r "\.only\(" apps/ packages/ --include="*.test.ts"

# Fix them
# test.only() → test()
# describe.skip() → describe()
```

### console.log detected

```bash
# Find them
grep -r "console\.log" apps/ packages/ --include="*.ts"

# Backend: Use Pino logger
import { logger } from './logger'
logger.info('message')

# Frontend: Remove or use conditional dev logging
```

---

## Branch Workflow

### Feature Branch (Fast)

```bash
# Development loop
git checkout -b feature/my-feature
# ... make changes ...
git add .
git commit -m "feat: add feature"
git push                          # 10-20s checks (minimal)
```

**Checks:** Types + Changed tests + No .only + console.log warning

---

### Protected Branch (Thorough)

```bash
# Before merging to main
git checkout main
git merge feature/my-feature
git push                          # 20-40s checks (full)
```

**Checks:** Types + Full tests + No .only + No console.log + Bundle size

---

## Pre-Push Checklist

Before pushing to **protected branches**, ensure:

- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] No `.only()` or `.skip()` in tests
- [ ] No `console.log` in production code
- [ ] Important TODOs tracked in issues
- [ ] Bundle size is reasonable (if web app changed)

**Run this before pushing:**

```bash
pnpm push:check
```

---

## Emergency Bypass

**Only use in true emergencies:**

```bash
git push --no-verify
```

**Valid reasons:**

- Hotfix for production incident
- Critical security patch
- Reverting a broken commit

**Invalid reasons:**

- "I'm in a hurry"
- "I'll fix it later"
- "It's just a small change"

---

## Performance

**Typical execution times:**

- Feature branch: **10-20 seconds**
- Protected branch: **20-40 seconds**

**If slower than this:**

```bash
# Profile tests
pnpm test -- --reporter=verbose

# Check package-specific tests
pnpm --filter @khipu/web test
pnpm --filter @khipu/api test
```

---

## Getting Help

```bash
# Full documentation
cat .husky/PRE_PUSH_GUIDE.md

# This quick reference
cat .husky/PRE_PUSH_QUICKREF.md

# Commit conventions
cat .husky/COMMIT_CONVENTION.md
```

---

## Best Practices

✅ **DO:**

- Run `pnpm push:check` before pushing
- Keep tests fast and focused
- Use Pino logger instead of console.log
- Push feature branches frequently

❌ **DON'T:**

- Don't use `--no-verify` unless emergency
- Don't commit `.only()` or `.skip()` tests
- Don't commit `console.log` in production code
- Don't ignore warnings

---

**For detailed information, see:** `.husky/PRE_PUSH_GUIDE.md`
