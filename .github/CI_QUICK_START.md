# CI Quick Start Guide

> Get started with KhipuVault CI/CD in under 5 minutes - **100% FREE**

## TL;DR

Just push your code. Everything works automatically without any setup.

```bash
git push origin feature-branch
```

✅ **Result**: Full CI/CD pipeline runs including:

- Linting, type checking, tests
- Security scans (5+ tools)
- License compliance
- Bundle size tracking
- Coverage reporting

**Total cost**: $0.00 (all free tools)

---

## What Runs When You Push

### On Every Push

1. **Code Quality** (~5 min)
   - ESLint + Prettier
   - TypeScript type checking
   - Strict mode verification

2. **Testing** (~5 min)
   - Unit tests
   - Coverage analysis (built-in)
   - Coverage summary in GitHub

3. **Build** (~5 min)
   - Production build
   - Smart contract compilation
   - Artifact storage

### On Pull Requests (Additional)

4. **Bundle Size** (~3 min)
   - Tracks size changes
   - Comments on PR
   - Warns on large increases

5. **Dependency Check** (~2 min)
   - Duplicate detection
   - License compliance
   - New dependency review

6. **Integration Tests** (~5 min)
   - Database migrations
   - API endpoint tests

### Daily (2 AM UTC)

7. **Security Scans** (~10 min)
   - Semgrep SAST
   - CodeQL analysis
   - Gitleaks secret scan
   - npm audit
   - OpenSSF Scorecard

---

## Before You Commit

Run these locally to catch issues early:

```bash
# Fix all common issues
pnpm lint        # ESLint + Prettier
pnpm typecheck   # TypeScript errors
pnpm test        # Run tests
pnpm format      # Format code

# Verify everything passes
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

## CI Status Checks

Your PR needs these checks to pass:

| Check                    | What It Does          | Typical Time |
| ------------------------ | --------------------- | ------------ |
| ✅ **Lint Code**         | ESLint rules          | ~2 min       |
| ✅ **Type Check**        | TypeScript validation | ~2 min       |
| ✅ **TypeScript Strict** | Strict mode enabled   | ~1 min       |
| ✅ **Unit Tests**        | Test suite + coverage | ~5 min       |
| ✅ **Build**             | Production build      | ~5 min       |
| ✅ **Security**          | Vulnerability scan    | ~3 min       |

**Total time**: ~15-20 minutes (parallel execution)

---

## Common CI Failures & Fixes

### 1. Lint Failure

**Error**: `ESLint found problems in your code`

**Fix**:

```bash
pnpm lint        # See errors
pnpm lint --fix  # Auto-fix most issues
```

### 2. Type Error

**Error**: `TypeScript compilation failed`

**Fix**:

```bash
pnpm typecheck   # See type errors
# Fix errors in your code
```

### 3. Test Failure

**Error**: `Tests failed with X failing`

**Fix**:

```bash
pnpm test        # Run tests locally
pnpm test:watch  # Watch mode for debugging
```

### 4. Format Check Failed

**Error**: `Code is not formatted`

**Fix**:

```bash
pnpm format      # Auto-format all files
git add .        # Stage formatted files
git commit --amend --no-edit  # Update commit
git push --force-with-lease   # Update PR
```

### 5. Build Failed

**Error**: `Build process exited with code 1`

**Fix**:

```bash
pnpm build       # Try building locally
# Check error messages
# Fix compilation errors
```

### 6. Coverage Below Threshold

**Warning**: `Coverage is below 80%`

**Fix**:

- Add tests for uncovered code
- Check coverage report in artifacts
- Focus on critical paths first

---

## Optional Enhancements (Free Setup)

### Add Coverage Badge

1. Generate coverage in CI (already done)
2. Add to README:

```markdown
![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)
```

### Add Status Badge

```markdown
![CI](https://github.com/YOUR_ORG/khipu-vault/workflows/Enhanced%20CI%20Pipeline/badge.svg)
```

---

## Optional Paid Integrations

### Codecov (Enhanced Coverage)

**Why**: Historical trends, coverage graphs, PR diffs

**Setup**:

1. Sign up at https://codecov.io (free for open source)
2. Get token from Codecov dashboard
3. Add GitHub secret: `Settings` → `Secrets` → `New secret`
   - Name: `CODECOV_TOKEN`
   - Value: `<your-token>`
4. Next CI run uploads to Codecov

**Cost**: Free for open source, $10/month for private repos

**Benefit**: Professional coverage tracking and badges

---

### Snyk (Enhanced Security)

**Why**: More vulnerabilities detected, auto-fix PRs

**Setup**:

1. Sign up at https://snyk.io (free tier: 200 tests/month)
2. Get token from Snyk dashboard
3. Add GitHub secret: `SNYK_TOKEN`
4. Next security scan includes Snyk

**Cost**: Free tier available, $52/month for teams

**Benefit**: Automatic security fix PRs

---

## Workflow Files

| File              | Purpose           | Frequency     |
| ----------------- | ----------------- | ------------- |
| `ci-enhanced.yml` | Main CI pipeline  | Every push/PR |
| `security.yml`    | Security scanning | Daily + push  |
| `ci.yml`          | Streamlined CI    | Every push    |

---

## Debugging CI Issues

### View Logs

1. Go to **Actions** tab in GitHub
2. Click on failed workflow run
3. Click on failed job
4. Expand failed step to see logs

### Download Artifacts

1. Go to failed workflow run
2. Scroll to **Artifacts** section
3. Download relevant artifacts:
   - `coverage-reports` - Coverage data
   - `test-results` - Test outputs
   - `build-artifacts` - Build outputs

### Re-run Failed Jobs

1. Go to failed workflow run
2. Click **Re-run jobs** dropdown
3. Choose **Re-run failed jobs**

---

## Performance Tips

### Reduce CI Time

1. **Fix locally first** - Don't use CI as debugger
2. **Skip CI for docs** - Use `[skip ci]` in commit message (not recommended)
3. **Use caching** - Already configured, works automatically
4. **Run tests in parallel** - Already configured

### Skip Workflow Run

Only skip if absolutely necessary (e.g., README-only changes):

```bash
git commit -m "docs: update README [skip ci]"
```

**Note**: Path filters already skip workflows for docs-only changes.

---

## GitHub Actions Quotas

### Public Repos

- ✅ **Unlimited minutes** on Linux runners
- ✅ 500 MB artifact storage
- ✅ 20 concurrent jobs

### Private Repos

- ⚠️ 2,000 minutes/month on Linux runners
- ⚠️ 500 MB artifact storage
- ⚠️ 5 concurrent jobs

**Tip**: Keep repos public to get unlimited CI minutes.

---

## Security Best Practices

### What CI Checks For

1. **Secrets in Code**
   - Gitleaks scans all commits
   - Blocks common patterns (API keys, tokens)

2. **Vulnerable Dependencies**
   - npm audit for known CVEs
   - Semgrep for code patterns
   - CodeQL for advanced analysis

3. **License Compliance**
   - Blocks GPL-3.0, AGPL-3.0
   - Warns on GPL-2.0, LGPL-2.1

4. **Code Quality**
   - TypeScript strict mode
   - ESLint security rules
   - Circular dependency detection

### Never Commit

- ❌ `.env` files
- ❌ Private keys
- ❌ API tokens
- ❌ Passwords
- ❌ AWS credentials

---

## Getting Help

### Check Existing Runs

Browse successful runs for examples:

- Actions tab → Select workflow → Pick successful run

### Common Resources

- [GitHub Actions Docs](https://docs.github.com/actions)
- [Workflow Syntax](https://docs.github.com/actions/reference/workflow-syntax-for-github-actions)
- [Full Documentation](.github/WORKFLOWS.md)

### Ask Questions

Open an issue with:

- Workflow run URL
- Error message
- What you've tried

---

## Summary Checklist

Before pushing:

- [ ] Code is linted (`pnpm lint`)
- [ ] Types are valid (`pnpm typecheck`)
- [ ] Tests pass (`pnpm test`)
- [ ] Code is formatted (`pnpm format`)
- [ ] No secrets in code

Push with confidence:

```bash
git push origin feature-branch
```

✅ **All checks are FREE and automatic!**

---

**Questions?** Check [WORKFLOWS.md](.github/WORKFLOWS.md) for detailed documentation.
