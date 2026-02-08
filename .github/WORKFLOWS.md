# GitHub Actions Workflows Documentation

> Complete guide to KhipuVault's CI/CD pipelines - **100% FREE** without external tokens

## Overview

All workflows are designed to work immediately after pushing code - **no setup required**. Optional paid integrations are clearly marked and can be added later.

## Workflows

### 1. Enhanced CI Pipeline (`ci-enhanced.yml`)

**Status**: ✅ 100% Free | Runs on: Push to `main`/`develop`, Pull Requests

#### Core Checks (All Free)

| Check                 | Description                   | Required | Time   |
| --------------------- | ----------------------------- | -------- | ------ |
| **Lint**              | ESLint + Prettier             | ✅ Yes   | ~2 min |
| **Type Check**        | TypeScript validation         | ✅ Yes   | ~2 min |
| **TypeScript Strict** | Verifies strict mode enabled  | ✅ Yes   | ~1 min |
| **Tests**             | Unit tests with coverage      | ✅ Yes   | ~5 min |
| **Build**             | Production build verification | ✅ Yes   | ~5 min |

#### Additional Checks (All Free)

| Check                   | Description               | Runs On  | Time   |
| ----------------------- | ------------------------- | -------- | ------ |
| **Bundle Size**         | Tracks build size changes | PRs only | ~3 min |
| **Markdown Lint**       | Validates documentation   | Always   | ~1 min |
| **Dependency Analysis** | Detects duplicates        | PRs only | ~2 min |
| **Integration Tests**   | Database + API tests      | PRs only | ~5 min |

#### Smart Optimizations

- **Path Filters**: Skips workflow for docs-only changes
- **Change Detection**: Runs tests only for modified packages
- **Dependency Caching**: Reuses `node_modules` across jobs
- **Prisma Caching**: Caches generated client
- **Parallel Execution**: Runs independent jobs simultaneously

#### Coverage Reporting

**Built-in (Free)**:

- Coverage summary in GitHub step summary
- Per-package breakdown (API, Web, packages)
- Threshold warnings (below 80%)
- Artifact upload for analysis

**Optional (Codecov)**:

- Enhanced historical tracking
- Coverage graphs and trends
- **Setup**: Add `CODECOV_TOKEN` secret
- Automatically skips if not configured

#### Example Output

```
# 🚀 CI Pipeline Summary

## Core Checks (Required)

| Job | Status |
|-----|--------|
| Lint | ✅ Passed |
| Type Check | ✅ Passed |
| TypeScript Strict | ✅ Passed |
| Tests | ✅ Passed |
| Build | ✅ Passed |

---

💡 All checks run 100% FREE - No external tokens or paid services required!
```

---

### 2. Security Scanning (`security.yml`)

**Status**: ✅ 100% Free (with optional paid integrations) | Runs on: Push, PRs, Daily at 2 AM UTC

#### Free Security Checks (Always Run)

| Scanner                | What It Checks                        | Severity           | Time               |
| ---------------------- | ------------------------------------- | ------------------ | ------------------ |
| **npm audit**          | Known vulnerabilities in dependencies | High/Moderate/Low  | ~2 min             |
| **License Compliance** | GPL/AGPL violations                   | Blocker            | ~1 min             |
| **Semgrep**            | SAST for code patterns                | ERROR/WARNING/INFO | ~3 min             |
| **CodeQL**             | Advanced code analysis                | Security + Quality | ~5 min             |
| **Gitleaks**           | Secret scanning in git history        | Critical           | ~2 min             |
| **Dependency Review**  | PR dependency changes                 | High+              | ~1 min (PRs only)  |
| **OpenSSF Scorecard**  | Repository security best practices    | Info               | ~3 min (main only) |

#### Optional Paid Services

| Service  | Cost                | Setup Required   | Benefits                  |
| -------- | ------------------- | ---------------- | ------------------------- |
| **Snyk** | Free tier available | Add `SNYK_TOKEN` | Enhanced vuln DB, Fix PRs |

**Note**: Snyk automatically skips if token not configured - **no impact on CI**.

#### Forbidden Licenses (Auto-fail)

- GPL-3.0
- AGPL-3.0
- LGPL-3.0

#### Warning Licenses (Manual Review)

- GPL-2.0
- LGPL-2.1

#### Example Output

```
# 🔒 Security Scan Summary

## Free Security Checks (Always Run)

| Scan Type | Status | Free |
|-----------|--------|------|
| Dependency Audit (npm audit) | ✅ Passed | ✅ Free |
| License Compliance | ✅ Passed | ✅ Free |
| Semgrep SAST | ✅ Passed | ✅ Free |
| CodeQL Analysis | ✅ Passed | ✅ Free |
| Secret Scanning (Gitleaks) | ✅ Passed | ✅ Free |

## Optional Paid Services

| Service | Status | Setup Required |
|---------|--------|----------------|
| Snyk Scan | ⏭️ Skipped (no token) | Add SNYK_TOKEN secret |

---

💡 Note: All core security checks run for FREE without any token setup!
```

---

### 3. Standard CI (`ci.yml`)

**Status**: ✅ 100% Free | Runs on: Push to `main`, Pull Requests

Streamlined version of `ci-enhanced.yml` without optional checks. Best for simple projects.

#### Jobs

1. **Lint** - ESLint validation
2. **Type Check** - TypeScript errors
3. **Test** - Unit tests + coverage
4. **Contract Tests** - Foundry smart contract tests
5. **Security** - npm audit
6. **Contract Security** - Slither static analysis (non-blocking)
7. **Gas Regression** - Foundry gas snapshots (PRs only)
8. **Build** - Production build

---

### 4. Contract Tests (`contracts.yml`)

Dedicated workflow for smart contract development (if exists).

---

### 5. Deployment Workflows

- `deploy-preview.yml` - Preview deployments (PRs)
- `deploy-production.yml` - Production deployments (main)

---

## Setup Guide

### Immediate Use (No Setup)

Just push your code - all core checks work out of the box:

```bash
git add .
git commit -m "feat: add new feature"
git push
```

✅ All free checks run automatically:

- Linting, type checking, tests
- Security scans (Semgrep, CodeQL, Gitleaks)
- License compliance
- Bundle size tracking

### Optional Integrations

#### 1. Codecov (Enhanced Coverage Tracking)

**Cost**: Free for open source, paid for private repos

**Setup**:

1. Sign up at [codecov.io](https://codecov.io)
2. Get repository token
3. Add GitHub secret: `CODECOV_TOKEN`
4. Next CI run will include Codecov upload

**Benefits**:

- Historical coverage trends
- Pull request coverage diff
- Coverage graphs and badges

**Without it**: Built-in coverage summary still works perfectly

---

#### 2. Snyk (Enhanced Vulnerability Scanning)

**Cost**: Free tier available (200 tests/month)

**Setup**:

1. Sign up at [snyk.io](https://snyk.io)
2. Get API token
3. Add GitHub secret: `SNYK_TOKEN`
4. Next security scan will include Snyk

**Benefits**:

- More comprehensive vulnerability database
- Automatic fix pull requests
- License scanning

**Without it**: npm audit + Semgrep + CodeQL still provide excellent coverage

---

## CI/CD Best Practices

### For Contributors

**Before Committing**:

```bash
pnpm lint        # Fix linting errors
pnpm typecheck   # Fix type errors
pnpm test        # Ensure tests pass
pnpm format      # Format code
```

**Verify CI Locally**:

```bash
# Run full validation
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

### For Maintainers

**Required Secrets** (None for free tier!):

- None required for core functionality

**Optional Secrets**:

- `CODECOV_TOKEN` - Enhanced coverage tracking
- `SNYK_TOKEN` - Enhanced security scanning
- `VERCEL_TOKEN` - Automated deployments (if using Vercel)

**Branch Protection Rules** (Recommended):

```yaml
main:
  required_checks:
    - Lint Code
    - Type Check
    - TypeScript Strict Mode Check
    - Unit Tests
    - Build All Packages
    - Dependency Audit
    - Secret Scanning
    - Semgrep SAST Scan
  require_approvals: 1
  dismiss_stale_reviews: true
  require_code_owner_reviews: false
```

---

## Workflow Triggers

### Push Events

```yaml
on:
  push:
    branches: [main, develop]
    paths-ignore:
      - "**.md"
      - "docs/**"
```

**Runs**: Enhanced CI, Security (if scheduled)

### Pull Request Events

```yaml
on:
  pull_request:
    branches: [main, develop]
```

**Runs**: All validation, bundle size, dependency review, gas regression

### Schedule Events

```yaml
on:
  schedule:
    - cron: "0 2 * * *" # Daily at 2 AM UTC
```

**Runs**: Security scanning (full suite)

### Manual Trigger

```yaml
on:
  workflow_dispatch:
```

**Trigger**: Actions tab → Select workflow → Run workflow

---

## Performance Optimizations

### 1. Caching Strategy

**pnpm Store Cache**:

```yaml
- uses: actions/cache@v4
  with:
    path: ${{ pnpm store path }}
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
```

**Prisma Client Cache**:

```yaml
- uses: actions/cache@v4
  with:
    path: packages/database/node_modules/.prisma
    key: ${{ runner.os }}-prisma-${{ hashFiles('schema.prisma') }}
```

**Build Artifact Cache**:

```yaml
- uses: actions/cache@v4
  with:
    path: |
      .turbo
      **/.turbo
    key: ${{ runner.os }}-turbo-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-turbo-
```

### 2. Parallel Execution

Jobs run in parallel when possible:

```
setup
  ├─ lint
  ├─ typecheck
  ├─ typescript-strict
  └─ test
       └─ build
            ├─ bundle-size
            └─ integration
```

### 3. Smart Path Filtering

Skip workflows on documentation-only changes:

```yaml
paths-ignore:
  - "**.md"
  - "docs/**"
  - ".vscode/**"
```

### 4. Conditional Job Execution

Run jobs only when relevant files change:

```yaml
needs: detect-changes
if: needs.detect-changes.outputs.frontend == 'true'
```

---

## Troubleshooting

### Common Issues

#### 1. "Codecov upload failed"

**Solution**: Expected if `CODECOV_TOKEN` not set. Built-in coverage still works.

```
::notice::Codecov upload skipped - CODECOV_TOKEN not configured (optional service)
```

#### 2. "Snyk scan skipped"

**Solution**: Expected if `SNYK_TOKEN` not set. Other security scans still run.

```
::notice::Snyk scan skipped - SNYK_TOKEN not configured (optional paid service)
```

#### 3. Build timeout

**Solution**: Increase timeout in workflow:

```yaml
timeout-minutes: 30 # Increase from 20
```

#### 4. Prisma client errors

**Solution**: Clear Prisma cache:

```yaml
- name: Clear Prisma cache
  run: rm -rf packages/database/node_modules/.prisma
```

#### 5. Dependency cache issues

**Solution**: Bust cache by updating key:

```yaml
key: ${{ runner.os }}-pnpm-v2-${{ hashFiles('**/pnpm-lock.yaml') }}
#                            ^^^ increment version
```

---

## GitHub Actions Quotas (Free Tier)

### Public Repositories

- **Minutes**: Unlimited ✅
- **Storage**: 500 MB artifacts
- **Concurrent jobs**: 20

### Private Repositories

- **Minutes**: 2,000/month (Linux)
- **Storage**: 500 MB artifacts
- **Concurrent jobs**: 5

### Usage Tips

1. **Use path filters** to skip unnecessary runs
2. **Cache aggressively** to reduce build time
3. **Parallelize jobs** to minimize total time
4. **Clean up artifacts** after 7 days

---

## Metrics & Monitoring

### Workflow Performance

Track workflow duration in GitHub Actions:

1. Go to **Actions** tab
2. Select workflow
3. View **Insights** for trends

### Coverage Trends

**Free (GitHub)**:

- View in step summary
- Download coverage artifacts

**Paid (Codecov)**:

- Historical graphs
- Coverage by file/package
- PR diff coverage

### Security Findings

**Free (GitHub Security)**:

- Security tab shows all findings
- CodeQL alerts
- Dependency alerts

**Paid (Snyk)**:

- Snyk dashboard
- Automated fix PRs

---

## Migration from Paid Services

If you currently use paid services, here's how to migrate:

### From CircleCI/Travis

1. Copy existing test commands to `ci-enhanced.yml`
2. Update caching strategy (shown above)
3. Remove old service configuration

### From Jenkins

1. Convert Jenkinsfile stages to GitHub Actions jobs
2. Use GitHub secrets instead of Jenkins credentials
3. Leverage built-in GitHub integrations

---

## Contributing

When adding new workflows:

1. ✅ **Make it free by default** - paid services optional
2. ✅ **Add path filters** - skip when not needed
3. ✅ **Cache dependencies** - optimize performance
4. ✅ **Include summaries** - use `$GITHUB_STEP_SUMMARY`
5. ✅ **Document setup** - update this file

---

## Summary

### What Works 100% Free

- ✅ Linting (ESLint + Prettier)
- ✅ Type checking (TypeScript)
- ✅ Unit & integration tests
- ✅ Code coverage (built-in)
- ✅ Security scanning (Semgrep, CodeQL, Gitleaks)
- ✅ License compliance
- ✅ Bundle size tracking
- ✅ Dependency audit
- ✅ Smart contract analysis (Slither, Foundry)
- ✅ Git secret scanning
- ✅ Markdown linting

### Optional Paid Add-ons

- 🔓 Codecov (enhanced coverage tracking)
- 🔓 Snyk (enhanced vulnerability scanning)

### No Setup Required

Just push to GitHub and all core checks run automatically:

```bash
git push origin feature-branch
```

✅ **Result**: Full CI/CD pipeline with security scanning - 100% free!

---

**Questions?** Open an issue or check existing workflow runs for examples.
