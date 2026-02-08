# Git Workflow with Hooks

> Visual guide to automated quality gates in KhipuVault

## Complete Development Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     KHIPUVAULT GIT WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────┘

1. CREATE FEATURE BRANCH
   ▼
   git checkout -b feature/my-feature


2. MAKE CHANGES
   ▼
   [Code changes in your editor]


3. STAGE CHANGES
   ▼
   git add .


4. COMMIT
   ▼
   git commit -m "feat: add feature"
   │
   ├─► PRE-COMMIT HOOK (3-10s)
   │   ├─ Prettier (auto-format)
   │   ├─ ESLint (auto-fix)
   │   └─ Type-check staged files
   │
   └─► COMMIT-MSG HOOK (<1s)
       └─ Validate commit message format
           ✓ feat: add feature
           ✗ added feature (invalid)


5. PUSH TO REMOTE
   ▼
   git push origin feature/my-feature
   │
   └─► PRE-PUSH HOOK (10-20s for feature branches)
       │
       ├─ 1. TypeScript Type Check (5s) [ALWAYS]
       │   └─ pnpm typecheck
       │
       ├─ 2. Test Suite (10s) [SMART]
       │   └─ Tests for changed packages only
       │
       ├─ 3. Focused Tests (<1s) [ALWAYS]
       │   └─ No .only() or .skip() allowed
       │
       ├─ 4. Console.log Check (<1s) [WARNING]
       │   └─ Warn about console.log usage
       │
       └─ 5. TODO/FIXME Check (<1s) [INFO]
           └─ List TODO comments

       ✓ All checks passed! (10-20s total)


6. CREATE PULL REQUEST
   ▼
   [GitHub UI or gh cli]


7. CI/CD PIPELINE (5-15 min)
   ▼
   ├─ Lint & Format Check
   ├─ TypeScript Type Check
   ├─ Full Test Suite + Coverage
   ├─ Security Scans (Snyk, Semgrep)
   ├─ Smart Contract Tests (Foundry)
   ├─ Build Verification
   └─ E2E Tests


8. MERGE TO MAIN
   ▼
   git checkout main
   git merge feature/my-feature


9. PUSH TO MAIN
   ▼
   git push origin main
   │
   └─► PRE-PUSH HOOK (20-40s for protected branches)
       │
       ├─ 1. TypeScript Type Check (5s) [ALWAYS]
       │   └─ pnpm typecheck
       │
       ├─ 2. Full Test Suite (15s) [FULL]
       │   └─ All tests across monorepo
       │
       ├─ 3. Focused Tests (<1s) [ALWAYS]
       │   └─ No .only() or .skip() allowed
       │
       ├─ 4. Console.log Check (<1s) [FAIL]
       │   └─ Hard fail on console.log
       │
       ├─ 5. TODO/FIXME Check (<1s) [CONFIRM]
       │   └─ Interactive confirmation required
       │
       └─ 6. Bundle Size Check (5-10s) [OPTIONAL]
           └─ Check web app bundle size

       ✓ All checks passed! (20-40s total)


10. DEPLOY (CI/CD)
    ▼
    [Automated deployment pipeline]
```

---

## Hook Comparison

### Feature Branch (Fast & Flexible)

```
┌──────────────────────────────────────────────────────┐
│ FEATURE BRANCH: feature/*, fix/*, chore/*            │
├──────────────────────────────────────────────────────┤
│ Goal: Fast feedback without blocking development     │
└──────────────────────────────────────────────────────┘

Pre-Commit (3-10s)
├─ ✅ Prettier format
├─ ✅ ESLint auto-fix
└─ ✅ Type-check staged files

Commit-Msg (<1s)
└─ ✅ Validate format

Pre-Push (10-20s)
├─ ✅ Full typecheck        [FAIL]
├─ ⚡ Changed tests only    [FAIL]
├─ ✅ No .only/.skip        [FAIL]
├─ ⚠️  console.log          [WARN]
├─ ℹ️  TODO/FIXME           [INFO]
└─ ⏭️  Bundle size check    [SKIP]

Total: ~15-30 seconds
```

---

### Protected Branch (Comprehensive)

```
┌──────────────────────────────────────────────────────┐
│ PROTECTED: main, develop, staging, production        │
├──────────────────────────────────────────────────────┤
│ Goal: Maximum quality before shared branch           │
└──────────────────────────────────────────────────────┘

Pre-Commit (3-10s)
├─ ✅ Prettier format
├─ ✅ ESLint auto-fix
└─ ✅ Type-check staged files

Commit-Msg (<1s)
└─ ✅ Validate format

Pre-Push (20-40s)
├─ ✅ Full typecheck        [FAIL]
├─ ✅ Full test suite       [FAIL]
├─ ✅ No .only/.skip        [FAIL]
├─ ⛔ console.log           [FAIL]
├─ ⚠️  TODO/FIXME           [CONFIRM]
└─ 📊 Bundle size check    [CHECK]

Total: ~25-50 seconds
```

---

## Check Matrix

| Check                 | Feature Branch | Protected Branch | Time  | Bypass |
| --------------------- | -------------- | ---------------- | ----- | ------ |
| **Pre-Commit**        |                |                  |       |        |
| Prettier format       | ✅ Auto        | ✅ Auto          | ~2s   | ❌     |
| ESLint auto-fix       | ✅ Auto        | ✅ Auto          | ~3s   | ❌     |
| Type-check staged     | ✅ Auto        | ✅ Auto          | ~2s   | ❌     |
| **Commit-Msg**        |                |                  |       |        |
| Format validation     | ✅ Fail        | ✅ Fail          | <1s   | ❌     |
| **Pre-Push**          |                |                  |       |        |
| TypeScript typecheck  | ✅ Fail        | ✅ Fail          | ~5s   | ✅     |
| Test suite            | ⚡ Changed     | ✅ Full          | 5-15s | ✅     |
| Focused tests (.only) | ✅ Fail        | ✅ Fail          | ~1s   | ✅     |
| console.log           | ⚠️ Warn        | ⛔ Fail          | ~1s   | ✅     |
| TODO/FIXME            | ℹ️ Info        | ⚠️ Confirm       | ~1s   | ✅     |
| Bundle size           | ⏭️ Skip        | 📊 Check         | 5-10s | ✅     |

**Legend:**

- ✅ Auto - Automatically fixes
- ✅ Fail - Blocks commit/push on failure
- ⚡ Changed - Only checks changed files/packages
- ⚠️ Warn - Shows warning but continues
- ⚠️ Confirm - Requires interactive confirmation
- ℹ️ Info - Shows info message
- ⏭️ Skip - Skipped for this branch type
- 📊 Check - Informational check
- ⛔ Fail - Hard failure
- ❌ - Cannot bypass
- ✅ - Can bypass with `--no-verify`

---

## Typical Timings

### Fast Path (Feature Branch)

```
git add .                     # Instant
git commit                    # 3-10s (pre-commit + commit-msg)
git push                      # 10-20s (pre-push)
───────────────────────────────────────────────────
Total:                        # 15-30s
```

---

### Quality Path (Protected Branch)

```
git add .                     # Instant
git commit                    # 3-10s (pre-commit + commit-msg)
git push                      # 20-40s (pre-push)
───────────────────────────────────────────────────
Total:                        # 25-50s
```

---

### Bypass (Emergency Only!)

```bash
git commit --no-verify        # Skips pre-commit + commit-msg
git push --no-verify          # Skips pre-push

⚠️  Use only for emergencies:
- Production hotfix
- Critical security patch
- Reverting broken commit
```

---

## Decision Tree

```
                    Starting to commit?
                           │
                           ▼
                   git commit -m "..."
                           │
                           ▼
                   ┌───────────────┐
                   │  PRE-COMMIT   │ (3-10s)
                   │  Format + Lint │
                   └───────┬───────┘
                           │
                    ┌──────┴──────┐
                    │             │
                  FAIL          PASS
                    │             │
                    │             ▼
                    │    ┌──────────────┐
                    │    │ COMMIT-MSG   │ (<1s)
                    │    │ Validate fmt │
                    │    └──────┬───────┘
                    │           │
                    │    ┌──────┴──────┐
                    │    │             │
                    │  FAIL          PASS
                    │    │             │
                    ▼    ▼             ▼
                Fix issues         Committed!
                                       │
                              Ready to push?
                                       │
                                   git push
                                       │
                                       ▼
                              ┌────────────────┐
                              │   PRE-PUSH     │
                              │  Type + Tests  │
                              └────────┬───────┘
                                       │
                                ┌──────┴──────┐
                                │             │
                              FAIL          PASS
                                │             │
                                ▼             ▼
                           Fix issues    Pushed! 🚀
```

---

## Performance Optimization Tips

### Make Pre-Push Faster

1. **Keep Tests Fast**

   ```typescript
   // ✅ GOOD - Fast, isolated test
   test("calculates total", () => {
     expect(calculateTotal(100, 20)).toBe(120);
   });

   // ❌ BAD - Slow, external dependency
   test("fetches user data", async () => {
     const data = await fetch("https://api.example.com/user");
     expect(data).toBeDefined();
   });
   ```

2. **Push Feature Branches Often**

   ```bash
   # ✅ GOOD - Small, frequent pushes
   git add feature.ts
   git commit -m "feat: add validation"
   git push  # Fast! Only changed files tested

   # ❌ BAD - Large, infrequent pushes
   # ... 50 files changed ...
   git add .
   git commit -m "feat: everything"
   git push  # Slow! Many tests to run
   ```

3. **Use Smart Workflow**

   ```bash
   # Develop in feature branch (fast checks)
   git checkout -b feature/my-feature
   # ... multiple fast pushes ...

   # Merge to main (full checks run once)
   git checkout main
   git merge feature/my-feature
   git push  # Comprehensive checks
   ```

---

## Common Scenarios

### Scenario 1: Quick Bug Fix

```bash
# 1. Create fix branch
git checkout -b fix/quick-bug

# 2. Fix the bug
# ... edit files ...

# 3. Commit and push (fast checks)
git add .
git commit -m "fix: resolve null pointer"  # 3-10s
git push                                    # 10-20s

# Total: ~15-30s
```

---

### Scenario 2: New Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/user-profile

# 2. Develop incrementally
git add profile.ts
git commit -m "feat: add profile model"
git push  # Fast!

git add profile.test.ts
git commit -m "test: add profile tests"
git push  # Fast!

git add profile-api.ts
git commit -m "feat: add profile API"
git push  # Fast!

# 3. Each push takes 15-30s (fast checks)
```

---

### Scenario 3: Merge to Main

```bash
# 1. Ensure feature branch is up to date
git checkout feature/user-profile
git pull origin main

# 2. Switch to main and merge
git checkout main
git merge feature/user-profile

# 3. Push with full checks
git push  # 25-50s (comprehensive checks)
```

---

### Scenario 4: Emergency Hotfix

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-security

# 2. Fix the issue
# ... critical fix ...

# 3. Fast commit
git add .
git commit -m "fix: patch security vulnerability"

# 4. If CI will verify, can bypass pre-push
git push --no-verify  # Instant!

# ⚠️  Only for true emergencies!
# CI/CD will still verify everything
```

---

## Integration Points

```
┌─────────────────────────────────────────────────────────┐
│                    QUALITY LAYERS                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. IDE/Editor                                          │
│     └─ Real-time linting, type checking                │
│                                                          │
│  2. Pre-Commit Hook (3-10s)                            │
│     └─ Format, lint, basic type check                  │
│                                                          │
│  3. Commit-Msg Hook (<1s)                              │
│     └─ Validate commit message                         │
│                                                          │
│  4. Pre-Push Hook (10-40s)                             │
│     └─ Types, tests, console.log, TODOs                │
│                                                          │
│  5. CI/CD Pipeline (5-15 min)                          │
│     └─ Full verification, security, E2E                │
│                                                          │
│  6. Code Review                                         │
│     └─ Human review, architecture, logic               │
│                                                          │
│  7. Staging Environment                                 │
│     └─ Integration testing, QA                         │
│                                                          │
│  8. Production                                          │
│     └─ Monitoring, alerts, rollback capability         │
│                                                          │
└─────────────────────────────────────────────────────────┘

Each layer catches different types of issues.
Git hooks are your FAST, LOCAL quality gate (layer 4).
```

---

## Quick Commands

```bash
# Check if ready to push
pnpm push:check

# View full pre-push guide
pnpm push:help

# View this workflow guide
cat .husky/WORKFLOW.md

# View commit conventions
pnpm commit:help

# Bypass all hooks (emergency!)
git push --no-verify
```

---

## Summary

### What Happens When

| Git Command  | Hooks Triggered        | Duration | Can Bypass |
| ------------ | ---------------------- | -------- | ---------- |
| `git commit` | pre-commit, commit-msg | 3-10s    | ✅ Yes     |
| `git push`   | pre-push               | 10-40s   | ✅ Yes     |
| `git rebase` | (none currently)       | -        | -          |
| `git merge`  | (none currently)       | -        | -          |

### Branch-Specific Behavior

- **Feature branches:** Fast, flexible checks (15-30s total)
- **Protected branches:** Thorough, comprehensive checks (25-50s total)

### When to Bypass

- ✅ Production hotfix
- ✅ Critical security patch
- ✅ Reverting broken commit
- ❌ "I'm in a hurry"
- ❌ "I'll fix it later"
- ❌ "Just a small change"

---

**The hooks are designed to help you ship quality code faster. Work with them, not against them!**
