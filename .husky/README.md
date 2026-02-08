# Git Hooks - Quality Automation

> Automated quality gates for KhipuVault development

## Overview

This directory contains Git hooks powered by [Husky](https://typicode.github.io/husky/) that automatically enforce code quality standards at key points in the Git workflow.

---

## Active Hooks

### 1. Pre-Commit Hook (`pre-commit`)

**Triggers:** Before every commit
**Duration:** ~3-10 seconds
**Purpose:** Format and lint staged files

**What it does:**

- Runs `lint-staged` on files in staging area
- Auto-formats with Prettier
- Runs ESLint with auto-fix
- Type-checks changed files (if configured)

**Configuration:** See `package.json` → `lint-staged` section

**Bypass:** `git commit --no-verify` (not recommended)

---

### 2. Commit Message Hook (`commit-msg`)

**Triggers:** After writing commit message
**Duration:** <1 second
**Purpose:** Enforce conventional commits

**What it does:**

- Validates commit message format
- Enforces: `<type>(<scope>): <subject>`
- Examples: `feat:`, `fix:`, `chore:`, `docs:`

**Valid types:**

- `feat` - New feature
- `fix` - Bug fix
- `chore` - Maintenance
- `docs` - Documentation
- `test` - Tests
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `ci` - CI/CD changes
- `build` - Build system changes
- `revert` - Revert previous commit

**Documentation:**

- Full guide: [`COMMIT_CONVENTION.md`](./COMMIT_CONVENTION.md)
- Quick ref: [`COMMIT_QUICKREF.md`](./COMMIT_QUICKREF.md)

**Bypass:** `git commit --no-verify` (not recommended)

**Helper:** `pnpm commit:help`

---

### 3. Pre-Push Hook (`pre-push`)

**Triggers:** Before pushing to remote
**Duration:** 10-40 seconds (context-dependent)
**Purpose:** Comprehensive quality gates

**What it does:**

1. **TypeScript Type Checking** (always)
   - Validates all types across monorepo
   - Catches type errors before they reach CI

2. **Test Suite** (smart filtering)
   - Protected branches: Full test suite
   - Feature branches: Changed packages only

3. **Focused Test Detection**
   - Prevents `.only()` and `.skip()` in tests
   - Ensures complete test coverage

4. **Console.log Detection**
   - Protected branches: Hard fail
   - Feature branches: Warning only
   - Enforces proper logging (Pino)

5. **TODO/FIXME Tracking**
   - Protected branches: Confirmation required
   - Feature branches: Info only
   - Reminds to track technical debt

6. **Bundle Size Check** (web app only)
   - Monitors build size
   - Prevents bundle bloat

**Branch behavior:**

- **Protected branches** (`main`, `develop`, `staging`, `production`): Full checks (~20-40s)
- **Feature branches** (`feature/`, `fix/`, `chore/`, etc.): Minimal checks (~10-20s)

**Documentation:**

- Full guide: [`PRE_PUSH_GUIDE.md`](./PRE_PUSH_GUIDE.md)
- Quick ref: [`PRE_PUSH_QUICKREF.md`](./PRE_PUSH_QUICKREF.md)

**Bypass:** `git push --no-verify` (emergency only!)

**Helpers:**

- `pnpm push:check` - Run checks manually
- `pnpm push:help` - View documentation

---

## Quick Commands

```bash
# View commit conventions
pnpm commit:help
cat .husky/COMMIT_CONVENTION.md

# Check if code is ready to push
pnpm push:check

# View pre-push guide
pnpm push:help
cat .husky/PRE_PUSH_GUIDE.md

# View quick references
cat .husky/COMMIT_QUICKREF.md
cat .husky/PRE_PUSH_QUICKREF.md
```

---

## Bypassing Hooks

All hooks can be bypassed with the `--no-verify` flag:

```bash
git commit --no-verify
git push --no-verify
```

⚠️ **WARNING:** Only bypass in true emergencies:

- Production hotfix
- Critical security patch
- Reverting a broken commit

**Never bypass for:**

- "I'm in a hurry"
- "I'll fix it later"
- "Tests are flaky"
- "Just a small change"

---

## Development Workflow

### Typical Workflow (Fast)

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# ... code ...

# 3. Stage changes
git add .

# 4. Commit (pre-commit + commit-msg hooks run)
git commit -m "feat: add new feature"
# → Auto-format + lint (3-10s)
# → Validate commit message (<1s)

# 5. Push (pre-push hook runs)
git push
# → Type check + minimal tests (10-20s)
```

**Total overhead:** ~15-30 seconds per push

---

### Protected Branch Workflow (Thorough)

```bash
# 1. Merge to main
git checkout main
git merge feature/new-feature

# 2. Push (full pre-push checks)
git push
# → Type check + full tests + all quality gates (20-40s)
```

**Total overhead:** ~20-40 seconds per push

---

## Troubleshooting

### Hooks don't run

```bash
# Reinstall Husky
pnpm prepare

# Verify hooks are executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push

# Check Husky configuration
ls -la .husky/
```

---

### Hook fails with syntax error

```bash
# Check for syntax errors
bash -n .husky/pre-commit
bash -n .husky/commit-msg
bash -n .husky/pre-push
```

---

### Commit message rejected

```bash
# View commit message rules
pnpm commit:help

# Valid format
git commit -m "feat: add new feature"
git commit -m "fix(api): resolve auth issue"
git commit -m "docs: update README"
```

---

### Pre-push takes too long

**Expected times:**

- Feature branch: 10-20s
- Protected branch: 20-40s

**If significantly slower:**

```bash
# Profile your tests
pnpm test -- --reporter=verbose

# Check package-specific tests
pnpm --filter @khipu/web test
pnpm --filter @khipu/api test

# Optimize test setup/teardown
# Mock external dependencies
# Use test isolation
```

---

## Configuration Files

```
.husky/
├── _/                          # Husky internal files
├── pre-commit                  # Runs lint-staged
├── commit-msg                  # Validates commit format
├── pre-push                    # Comprehensive quality gates
├── COMMIT_CONVENTION.md        # Full commit guide
├── COMMIT_QUICKREF.md          # Quick commit reference
├── PRE_PUSH_GUIDE.md           # Full pre-push guide
├── PRE_PUSH_QUICKREF.md        # Quick pre-push reference
└── README.md                   # This file
```

---

## Integration with CI/CD

Git hooks provide **local quality gates**. CI/CD provides **comprehensive verification**.

### Local (Git Hooks) ⚡

**Purpose:** Fast feedback during development

- Pre-commit: Formatting + linting
- Commit-msg: Message validation
- Pre-push: Type checking + tests

**Execution time:** 15-40 seconds total

---

### CI/CD (GitHub Actions) 🔒

**Purpose:** Comprehensive verification before merge

- Full test suite with coverage
- End-to-end tests
- Security scans (Snyk, Semgrep)
- Build verification
- Contract compilation and tests
- Deployment readiness

**Execution time:** 5-15 minutes

---

## Best Practices

### ✅ DO

- Let hooks run normally (they're fast!)
- Run `pnpm push:check` before pushing
- Keep tests fast and isolated
- Use conventional commit messages
- Fix hook failures immediately
- Review hook output carefully

### ❌ DON'T

- Don't use `--no-verify` unless emergency
- Don't commit `.only()` or `.skip()` tests
- Don't commit `console.log` in production code
- Don't ignore hook failures
- Don't bypass hooks to "save time"
- Don't push broken code

---

## Performance Optimization

### Make Hooks Faster

1. **Keep tests fast**
   - Use test isolation
   - Mock external dependencies
   - Avoid unnecessary setup

2. **Use feature branch workflow**
   - Develop in feature branches (minimal checks)
   - Merge to main when ready (full checks)

3. **Push frequently**
   - Smaller changesets = faster checks
   - Easier to debug failures

4. **Run checks locally**
   ```bash
   # Before pushing
   pnpm typecheck && pnpm test
   ```

---

## Documentation Index

| File                   | Purpose             | View Command                      |
| ---------------------- | ------------------- | --------------------------------- |
| `README.md`            | This overview       | `cat .husky/README.md`            |
| `COMMIT_CONVENTION.md` | Full commit guide   | `pnpm commit:help`                |
| `COMMIT_QUICKREF.md`   | Quick commit ref    | `cat .husky/COMMIT_QUICKREF.md`   |
| `PRE_PUSH_GUIDE.md`    | Full pre-push guide | `pnpm push:help`                  |
| `PRE_PUSH_QUICKREF.md` | Quick pre-push ref  | `cat .husky/PRE_PUSH_QUICKREF.md` |

---

## Maintenance

### Update Hooks

Hooks are managed in version control. To update:

1. Edit hook file in `.husky/`
2. Test locally
3. Commit and push changes
4. Team members get updates on pull

### Add New Hook

```bash
# Create new hook
npx husky add .husky/pre-rebase "pnpm test"
chmod +x .husky/pre-rebase

# Document in this README
```

### Disable Hook Temporarily (Dev Environment)

```bash
# Disable all hooks for this repo only
git config core.hooksPath /dev/null

# Re-enable
git config --unset core.hooksPath
pnpm prepare
```

⚠️ **WARNING:** Only disable hooks in local development, never commit this config!

---

## Additional Resources

- [Husky Documentation](https://typicode.github.io/husky/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Hooks Guide](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [KhipuVault CLAUDE.md](/CLAUDE.md) - Project conventions

---

**These hooks help us ship better code faster. Embrace them!**
