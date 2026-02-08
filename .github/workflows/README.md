# GitHub Actions Workflows

Comprehensive CI/CD automation for KhipuVault using GitHub Actions.

## Workflows Overview

### 1. Enhanced CI Pipeline (`ci-enhanced.yml`)

**Purpose**: Complete continuous integration pipeline for the monorepo.

**Triggers**:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs**:

1. **Setup & Cache** - Prepares dependencies and caches for faster builds
2. **Lint** - ESLint + Prettier formatting checks
3. **Type Check** - TypeScript type checking across all packages
4. **Unit Tests** - Runs all unit tests with coverage (Node.js 20)
5. **Build** - Builds all packages and applications
6. **Integration Tests** - Runs integration tests with PostgreSQL (PR only)
7. **Summary** - Aggregates results and generates report

**Features**:

- Parallel job execution for faster feedback
- pnpm store caching for faster dependency installation
- Turbo cache for faster builds
- Coverage upload to Codecov
- Build artifact uploads
- Comprehensive job summaries

**Estimated Duration**: 15-20 minutes

---

### 2. Security Scanning (`security.yml`)

**Purpose**: Comprehensive security scanning for dependencies, code, and secrets.

**Triggers**:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Daily schedule (2 AM UTC)
- Manual workflow dispatch

**Jobs**:

1. **Dependency Audit** - npm audit for known vulnerabilities
2. **Snyk Scan** - Snyk vulnerability scanning (dependencies + code)
3. **Semgrep SAST** - Static application security testing
4. **CodeQL Analysis** - GitHub's semantic code analysis
5. **Secret Scanning** - Gitleaks for exposed secrets
6. **Dependency Review** - Review dependency changes in PRs
7. **Security Scorecard** - OpenSSF security best practices (main only)
8. **Summary** - Aggregates security findings

**Features**:

- Multiple security tools for comprehensive coverage
- SARIF uploads to GitHub Security tab
- Automated monitoring on main branch
- License compliance checks
- Secret detection with Gitleaks
- Non-blocking scans with informative warnings

**Estimated Duration**: 15-20 minutes

---

### 3. Smart Contract Checks (`contracts.yml`)

**Purpose**: Specialized checks for Solidity smart contracts using Foundry.

**Triggers**:

- Push to `main` or `develop` (if contracts changed)
- Pull requests (if contracts changed)
- Manual workflow dispatch

**Jobs**:

1. **Compile** - Build contracts and check sizes
2. **Test** - Run Foundry test suite
3. **Gas Report** - Generate gas usage report
4. **Gas Snapshot** - Compare gas usage vs. base branch (PR only)
5. **Coverage** - Generate test coverage report
6. **Slither** - Static analysis for vulnerabilities
7. **Mythril** - Deep security analysis (PR only, optional)
8. **Summary** - Aggregates contract check results

**Features**:

- Contract size validation (24KB limit)
- Gas regression detection (5% threshold)
- Multiple security analyzers (Slither, Mythril)
- Coverage tracking with Codecov
- SARIF uploads for security findings
- Non-blocking security scans

**Estimated Duration**: 20-25 minutes

---

## Existing Workflows

### 4. CI Pipeline (`ci.yml`)

**Status**: ✅ Active (original comprehensive workflow)

**Purpose**: Main CI pipeline with all checks including gas regression.

**Key Features**:

- Comprehensive lint, typecheck, test, and build jobs
- Foundry contract tests with gas reporting
- Security scanning (npm audit + Slither)
- Gas regression checks with 10% tolerance
- Code coverage uploads

**Note**: This workflow is kept as the primary CI pipeline. The new enhanced workflows provide additional capabilities and can run in parallel.

### 5. Claude Review (`claude-review.yml`)

**Status**: ✅ Active

**Purpose**: AI-powered code review using Claude.

### 6. Deploy Preview (`deploy-preview.yml`)

**Status**: ✅ Active

**Purpose**: Deploy preview environments for pull requests.

### 7. Deploy Production (`deploy-production.yml`)

**Status**: ✅ Active

**Purpose**: Production deployment workflow.

---

## Workflow Strategy

### Run All Workflows

All workflows are designed to run in parallel for maximum efficiency:

```
PR Created
├── ci.yml (existing - comprehensive)
├── ci-enhanced.yml (new - enhanced with integration tests)
├── security.yml (new - dedicated security scans)
└── contracts.yml (new - specialized contract checks)
```

### Workflow Coordination

- **ci.yml**: Primary blocking workflow (must pass)
- **ci-enhanced.yml**: Enhanced workflow with additional checks
- **security.yml**: Non-blocking (informative warnings only)
- **contracts.yml**: Non-blocking for optional checks (Slither, Mythril)

### Caching Strategy

All workflows use optimized caching:

1. **pnpm Store Cache** - Cached by lock file hash
2. **Foundry Build Cache** - Cached by source file hash
3. **Turbo Cache** - Cached by task inputs

---

## Required Secrets

Configure these secrets in GitHub repository settings:

### Code Quality

- `CODECOV_TOKEN` - Codecov integration token

### Security Scanning

- `SNYK_TOKEN` - Snyk authentication token

### Deployment

- See deployment workflow documentation

---

## Best Practices

### For Contributors

1. **Before Pushing**:

   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   ```

2. **For Contract Changes**:

   ```bash
   cd packages/contracts && forge test --gas-report
   ```

3. **Check Security**:
   ```bash
   pnpm security:audit
   ```

### For Maintainers

1. **Review Security Findings**: Check the Security tab regularly
2. **Monitor Gas Usage**: Review gas reports in PRs
3. **Update Dependencies**: Address dependency audit findings
4. **Review Slither Findings**: Investigate high-severity issues

---

## Troubleshooting

### Common Issues

#### 1. Workflow Fails on Prisma Generation

**Solution**: Ensure database schema is valid:

```bash
pnpm db:generate
```

#### 2. Gas Regression Failures

**Solution**: Review gas changes and adjust tolerance if intentional:

```yaml
forge snapshot --diff .gas-snapshot-base --check --tolerance 10
```

#### 3. Slither False Positives

**Solution**: Exclude specific detectors:

```yaml
--exclude naming-convention,unused-state
```

#### 4. Coverage Upload Failures

**Solution**: Ensure `CODECOV_TOKEN` is configured correctly.

#### 5. Secret Scanning False Positives

**Solution**: Add to `.gitleaksignore`:

```
# Test fixture
test/fixtures/sample.json:generic-api-key
```

---

## Performance Optimization

### Current Optimizations

1. **Parallel Execution**: Independent jobs run in parallel
2. **Smart Caching**: Multi-level caching (pnpm, Foundry, Turbo)
3. **Conditional Execution**: Path filters and conditional jobs
4. **Fail Fast**: Critical failures stop dependent jobs early

### Typical Run Times

| Workflow    | Duration    | Billable Minutes |
| ----------- | ----------- | ---------------- |
| CI Enhanced | 15-20 min   | ~20 min          |
| Security    | 15-20 min   | ~25 min          |
| Contracts   | 20-25 min   | ~30 min          |
| **Total**   | **~25 min** | **~75 min**      |

_Note: Jobs run in parallel, so total wall time is ~25 minutes_

---

## GitHub Actions Best Practices Applied

✅ **Concurrency Control**: Cancel in-progress runs for same branch
✅ **Timeouts**: All jobs have reasonable timeouts
✅ **Caching**: Multi-level dependency caching
✅ **Fail Fast**: Stop on critical errors
✅ **Job Summaries**: Clear, actionable summaries
✅ **SARIF Uploads**: Security findings in GitHub Security tab
✅ **Artifact Management**: Retention policies for reports
✅ **Matrix Strategy**: Test multiple Node versions (when needed)
✅ **Conditional Jobs**: Run expensive jobs only when necessary
✅ **Continue on Error**: Non-blocking security scans

---

## Migration Guide

### From Old CI to New Workflows

1. **Phase 1**: Run both in parallel (current state)
2. **Phase 2**: Monitor for 2 weeks, ensure stability
3. **Phase 3**: Consolidate or remove redundant checks
4. **Phase 4**: Update branch protection rules

### Recommended Branch Protection Rules

```yaml
Required checks:
  - Lint
  - Type Check
  - Unit Tests
  - Build All Packages
  - Compile Contracts
  - Run Tests (contracts)

Optional checks (informative):
  - Security Summary
  - Slither Static Analysis
  - Gas Regression Check
```

---

## Monitoring and Alerts

### What to Monitor

1. **Workflow Success Rate**: Should be >95%
2. **Average Duration**: Should stay under 30 minutes
3. **Security Findings**: Review weekly
4. **Coverage Trends**: Monitor for decreases

### Setting Up Alerts

Configure GitHub notifications for:

- Failed workflow runs on main branch
- High/critical security findings
- Coverage drops below threshold

---

## Future Enhancements

### Planned Improvements

- [ ] E2E testing with Playwright
- [ ] Performance regression testing
- [ ] Automated dependency updates (Renovate/Dependabot)
- [ ] Docker image builds and scanning
- [ ] Multi-chain deployment verification
- [ ] Automated changelog generation

### Under Consideration

- [ ] Self-hosted runners for faster builds
- [ ] Workflow visualization dashboard
- [ ] Custom action for common setup steps
- [ ] Integration with project management tools

---

## Support

For workflow issues:

1. Check job logs in GitHub Actions tab
2. Review this documentation
3. Check [GitHub Actions Documentation](https://docs.github.com/actions)
4. Open an issue with workflow run URL

---

## Changelog

### 2024-02-08

- ✨ Added `ci-enhanced.yml` with integration tests
- ✨ Added `security.yml` with comprehensive security scanning
- ✨ Added `contracts.yml` with specialized contract checks
- 📝 Created comprehensive workflow documentation

### Previous

- ✅ Established `ci.yml` as primary CI pipeline
- ✅ Configured Slither and gas regression checks
- ✅ Set up coverage reporting
