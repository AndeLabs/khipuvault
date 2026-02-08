# Pre-Push Hook Installation Summary

> Quality gates installed for KhipuVault

## What Was Installed

### Core Hook

**File:** `.husky/pre-push` (executable)

**Purpose:** Automated quality gates before pushing code

**Execution time:**

- Feature branches: 10-20 seconds
- Protected branches: 20-40 seconds

---

## Quality Checks

### 1. TypeScript Type Checking ⚡

**Always runs:** Yes
**Failure:** Blocks push
**Command:** `pnpm typecheck`

Validates all TypeScript types across the monorepo.

---

### 2. Test Suite 🧪

**Smart execution:**

- **Feature branches:** Tests for changed packages only
- **Protected branches:** Full test suite

**Failure:** Blocks push
**Command:** `pnpm test -- --run`

---

### 3. Focused Test Detection 🔍

**Always runs:** Yes
**Failure:** Blocks push

Prevents `.only()` and `.skip()` in test files:

- `test.only()` → ❌
- `describe.skip()` → ❌
- `it.only()` → ❌

---

### 4. Console.log Detection 🚫

**Branch-specific behavior:**

- **Protected branches:** Hard fail
- **Feature branches:** Warning only

Production code should use Pino logger, not console.log.

---

### 5. TODO/FIXME Tracking 📝

**Branch-specific behavior:**

- **Protected branches:** Interactive confirmation
- **Feature branches:** Info only

Reminds you to track technical debt in issues.

---

### 6. Bundle Size Check 📦

**When:** Protected branches + web app changes only
**Purpose:** Prevent bundle bloat

Checks Next.js bundle size after build.

---

## Branch Detection

### Protected Branches (Full Checks)

- `main`
- `develop`
- `staging`
- `production`

**Execution:** 20-40 seconds

---

### Feature Branches (Minimal Checks)

- `feature/*`
- `fix/*`
- `chore/*`
- `docs/*`
- `test/*`
- `wip/*`

**Execution:** 10-20 seconds

---

## New Commands

Added to `package.json`:

```bash
# Check if code is ready to push
pnpm push:check

# View pre-push documentation
pnpm push:help
```

Updated in CLAUDE.md Quick Reference section.

---

## Documentation

### Comprehensive Guides

1. **PRE_PUSH_GUIDE.md** (607 lines)
   - Complete documentation
   - Every check explained
   - Troubleshooting guide
   - Best practices

2. **PRE_PUSH_QUICKREF.md** (203 lines)
   - Fast reference card
   - Common failures
   - Quick commands
   - Performance tips

3. **WORKFLOW.md** (529 lines)
   - Visual workflow diagrams
   - Check matrix
   - Timing breakdowns
   - Common scenarios

4. **README.md** (430 lines)
   - Overview of all hooks
   - Integration guide
   - Maintenance docs
   - Complete reference

---

## Quick Access

```bash
# View guides
cat .husky/PRE_PUSH_GUIDE.md      # Full guide
cat .husky/PRE_PUSH_QUICKREF.md   # Quick reference
cat .husky/WORKFLOW.md            # Visual workflow
cat .husky/README.md              # All hooks overview

# Or use shortcuts
pnpm push:help                    # Opens PRE_PUSH_GUIDE.md
pnpm push:check                   # Test if ready to push
```

---

## How to Use

### Normal Workflow

```bash
# 1. Make changes
git add .

# 2. Commit (pre-commit + commit-msg hooks run)
git commit -m "feat: add feature"

# 3. Push (pre-push hook runs automatically)
git push
```

No extra steps needed! Hooks run automatically.

---

### Check Before Push

```bash
# Manually verify code is ready
pnpm push:check

# This runs:
# - pnpm typecheck
# - pnpm test -- --run
```

---

### Emergency Bypass

```bash
# Skip all pre-push checks
git push --no-verify
```

⚠️ **Only for emergencies:**

- Production hotfix
- Critical security patch
- Reverting broken commit

---

## Files Created/Modified

### Created

- `.husky/pre-push` - Main hook script (executable)
- `.husky/PRE_PUSH_GUIDE.md` - Complete documentation
- `.husky/PRE_PUSH_QUICKREF.md` - Quick reference
- `.husky/WORKFLOW.md` - Visual workflow guide
- `.husky/README.md` - Overview of all hooks
- `.husky/INSTALLATION.md` - This file

### Modified

- `package.json` - Added `push:check` and `push:help` scripts
- `CLAUDE.md` - Added Git Hooks section to Quick Reference

---

## Verification

```bash
# Check hook is executable
ls -lh .husky/pre-push

# Expected output:
# -rwxr-xr-x ... pre-push

# Verify syntax
bash -n .husky/pre-push

# Should output nothing (no errors)
```

---

## Testing

### Test on Feature Branch

```bash
# Create test branch
git checkout -b test/pre-push-hook

# Make a trivial change
echo "# Test" >> test.md
git add test.md
git commit -m "test: verify pre-push hook"

# Try to push (hook will run)
git push -u origin test/pre-push-hook

# Expected: Minimal checks (10-20s)
```

---

### Test on Protected Branch (Simulation)

```bash
# You can't easily test on main without actually pushing
# Instead, manually run what the hook would run:

pnpm typecheck          # Type checking
pnpm test -- --run      # Full test suite

# This simulates protected branch checks
```

---

## Integration with CI/CD

The pre-push hook provides **fast local feedback**.

CI/CD still runs comprehensive checks:

- Full test suite with coverage
- E2E tests
- Security scans
- Build verification
- Deployment checks

**Pre-push is your first line of defense, not the only line.**

---

## Troubleshooting

### Hook doesn't run

```bash
# Reinstall Husky
pnpm prepare

# Verify hook exists and is executable
ls -lh .husky/pre-push
chmod +x .husky/pre-push
```

---

### Hook fails immediately

```bash
# Check for syntax errors
bash -n .husky/pre-push

# Run manually to debug
./.husky/pre-push
```

---

### Type checking fails

```bash
# See errors
pnpm typecheck

# Fix in specific package
pnpm --filter @khipu/web typecheck
```

---

### Tests fail

```bash
# Run locally
pnpm test

# Specific package
pnpm --filter @khipu/api test

# With verbose output
pnpm test -- --reporter=verbose
```

---

## Performance

### Expected Times

- **Feature branch:** 10-20 seconds
- **Protected branch:** 20-40 seconds

### If Slower

```bash
# Profile tests
pnpm test -- --reporter=verbose

# Check slow packages
pnpm --filter @khipu/web test
pnpm --filter @khipu/api test
```

---

## Next Steps

### For Developers

1. **Read the quick reference:**

   ```bash
   cat .husky/PRE_PUSH_QUICKREF.md
   ```

2. **Try the new commands:**

   ```bash
   pnpm push:check     # Test readiness
   pnpm push:help      # View guide
   ```

3. **Push as normal:**
   ```bash
   git push            # Hooks run automatically
   ```

---

### For Team Lead

1. **Announce to team:**
   - New pre-push hooks installed
   - Adds 10-40s to push time
   - Catches issues before CI/CD
   - Can bypass with `--no-verify` (emergencies only)

2. **Share documentation:**
   - `.husky/PRE_PUSH_QUICKREF.md` - Start here
   - `.husky/WORKFLOW.md` - Visual guide
   - `.husky/PRE_PUSH_GUIDE.md` - Complete reference

3. **Monitor adoption:**
   - Watch for bypasses in git logs
   - Collect feedback on timing
   - Adjust checks if needed

---

## Customization

### Modify Checks

Edit `.husky/pre-push` to:

- Add new checks
- Remove unwanted checks
- Adjust timing thresholds
- Change branch detection patterns

### Adjust Branch Patterns

In `.husky/pre-push`, modify:

```bash
# Skip branches (minimal checks)
SKIP_BRANCHES="^(feature/|fix/|chore/|docs/|test/|wip/)"

# Enforce branches (full checks)
ENFORCE_BRANCHES="^(main|develop|staging|production)$"
```

---

## Maintenance

### Update Hook

```bash
# Edit hook
vi .husky/pre-push

# Test changes
bash -n .husky/pre-push
./.husky/pre-push

# Commit and push
git add .husky/pre-push
git commit -m "chore: update pre-push hook"
git push
```

### Update Documentation

```bash
# Edit docs
vi .husky/PRE_PUSH_GUIDE.md

# Commit
git add .husky/
git commit -m "docs: update pre-push guide"
git push
```

---

## Summary

✅ **Installed:**

- Pre-push quality gates
- Smart branch detection
- Comprehensive documentation
- Helper commands

⚡ **Fast:**

- 10-20s for feature branches
- 20-40s for protected branches

📚 **Well-Documented:**

- 4 comprehensive guides
- 1,769 lines of documentation
- Quick reference cards
- Visual workflow diagrams

🎯 **Professional:**

- Clear error messages
- Actionable feedback
- Emergency bypass option
- Team-ready

---

**The hook is installed and ready to use! Just push as normal.**

For questions, see `.husky/PRE_PUSH_GUIDE.md` or run `pnpm push:help`.
