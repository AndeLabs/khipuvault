# Workflows Quick Reference

## Status Badges

Add these to your README.md:

```markdown
[![CI](https://github.com/USERNAME/KhipuVault/actions/workflows/ci-enhanced.yml/badge.svg)](https://github.com/USERNAME/KhipuVault/actions/workflows/ci-enhanced.yml)
[![Security](https://github.com/USERNAME/KhipuVault/actions/workflows/security.yml/badge.svg)](https://github.com/USERNAME/KhipuVault/actions/workflows/security.yml)
[![Contracts](https://github.com/USERNAME/KhipuVault/actions/workflows/contracts.yml/badge.svg)](https://github.com/USERNAME/KhipuVault/actions/workflows/contracts.yml)
[![codecov](https://codecov.io/gh/USERNAME/KhipuVault/branch/main/graph/badge.svg)](https://codecov.io/gh/USERNAME/KhipuVault)
```

## Pre-Commit Checklist

Before pushing code:

```bash
# 1. Run all checks locally
pnpm lint && pnpm typecheck && pnpm test

# 2. If you changed contracts
cd packages/contracts && forge test --gas-report

# 3. Check for security issues
pnpm security:audit

# 4. Format code
pnpm format

# 5. Push to branch
git push
```

## Common Workflow Commands

### Trigger Manual Workflow

```bash
# Using GitHub CLI
gh workflow run security.yml
gh workflow run contracts.yml

# View workflow status
gh run list --workflow=security.yml
```

### View Workflow Logs

```bash
# List recent runs
gh run list

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

### Download Artifacts

```bash
# List artifacts from a run
gh run view <run-id> --log

# Download artifacts
gh run download <run-id>
```

## Workflow Triggers Cheat Sheet

| Event            | ci-enhanced | security | contracts |
| ---------------- | ----------- | -------- | --------- |
| Push to main     | ✅          | ✅       | ✅\*      |
| Push to develop  | ✅          | ✅       | ✅\*      |
| Pull request     | ✅          | ✅       | ✅\*      |
| Daily (2 AM UTC) | ❌          | ✅       | ❌        |
| Manual           | ❌          | ✅       | ✅        |

\*Only if contracts changed

## Job Duration Estimates

| Workflow    | Setup | Parallel Jobs | Build | Total   |
| ----------- | ----- | ------------- | ----- | ------- |
| ci-enhanced | 2 min | 8 min         | 5 min | ~15 min |
| security    | 2 min | 12 min        | N/A   | ~15 min |
| contracts   | 2 min | 15 min        | N/A   | ~20 min |

## Failure Quick Fixes

### Lint Failures

```bash
# Auto-fix most issues
pnpm lint --fix

# Format code
pnpm format
```

### TypeScript Errors

```bash
# Check types
pnpm typecheck

# Regenerate Prisma types
pnpm db:generate
```

### Test Failures

```bash
# Run tests locally
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test
pnpm test <test-name>
```

### Build Failures

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm db:generate
pnpm build
```

### Contract Test Failures

```bash
cd packages/contracts

# Clean and rebuild
forge clean
forge build

# Run tests
forge test -vvv

# Run specific test
forge test --match-test testFunctionName -vvv
```

### Gas Regression

```bash
cd packages/contracts

# View gas report
forge test --gas-report

# Compare with base
forge snapshot --diff .gas-snapshot

# Update snapshot if intentional
forge snapshot
git add .gas-snapshot
```

### Security Findings

```bash
# Run security checks
pnpm security:audit
pnpm security:snyk:test

# Update vulnerable dependencies
pnpm update <package>

# Check for breaking changes
pnpm test
```

## Debugging Workflows Locally

### Using act (nektos/act)

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# List workflows
act -l

# Run specific job
act -j lint

# Run specific workflow
act -W .github/workflows/ci-enhanced.yml

# Run with secrets
act --secret-file .secrets
```

### Using Docker

```bash
# Test in clean environment
docker run --rm -v $(pwd):/workspace -w /workspace node:20 bash -c "
  npm install -g pnpm
  pnpm install --frozen-lockfile
  pnpm lint
  pnpm typecheck
  pnpm test
"
```

## Security Scanning Schedule

### Automatic Scans

- **Daily**: Full security scan (2 AM UTC)
- **Every PR**: Dependency review
- **Every push**: Quick security audit
- **Weekly**: Review security findings

### Manual Scans

```bash
# Run all security checks
pnpm security:audit
pnpm security:snyk:test
pnpm security:snyk:code

# Trigger GitHub workflow
gh workflow run security.yml
```

## Monitoring Dashboard URLs

After setting up secrets, access these dashboards:

- **GitHub Actions**: https://github.com/USERNAME/KhipuVault/actions
- **GitHub Security**: https://github.com/USERNAME/KhipuVault/security
- **Codecov**: https://codecov.io/gh/USERNAME/KhipuVault
- **Snyk**: https://app.snyk.io/org/YOUR_ORG

## Cache Management

### Clear Workflow Caches

```bash
# List caches
gh cache list

# Delete specific cache
gh cache delete <cache-key>

# Delete all caches
gh cache delete --all
```

### When to Clear Caches

- After major dependency updates
- After changing build configuration
- If builds are failing unexpectedly
- After Foundry version upgrade

## Branch Protection Setup

Recommended settings for main branch:

```yaml
Required status checks:
  - Lint
  - Type Check
  - Unit Tests
  - Build All Packages
  - Compile Contracts
  - Run Tests (contracts)

Additional settings:
  - Require branches to be up to date: true
  - Require linear history: false
  - Include administrators: true
  - Allow force pushes: false
  - Allow deletions: false
```

## Environment Variables

### For Workflows

These are automatically available in GitHub Actions:

```yaml
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # Auto-provided
NODE_VERSION: "20" # Defined in workflow
PNPM_VERSION: "9.0.0" # Defined in workflow
FOUNDRY_PROFILE: "ci" # For contracts workflow
```

### For Local Development

Create `.env` files:

```bash
# Root .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/khipu_dev"
RPC_URL="https://rpc.test.mezo.org"

# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3001"

# apps/api/.env
JWT_SECRET="your-secret-here"
CORS_ORIGIN="http://localhost:9002"
```

## Workflow Optimization Tips

### Speed Up Builds

1. **Use Turbo cache**: Already configured
2. **Enable remote caching**: Configure Turbo Remote Cache
3. **Parallelize jobs**: Already implemented
4. **Use matrix strategy**: For multiple Node versions

### Reduce Costs

1. **Use concurrency control**: Already configured
2. **Path filters**: Already on contracts workflow
3. **Conditional jobs**: Already on integration tests
4. **Self-hosted runners**: Consider for heavy usage

## Troubleshooting Guide

### "Resource not accessible by integration"

**Cause**: Missing permissions in workflow

**Fix**: Add permissions to workflow:

```yaml
permissions:
  contents: read
  security-events: write
```

### "CODECOV_TOKEN not set"

**Cause**: Secret not configured

**Fix**:

```bash
# Get token from https://codecov.io
# Add to GitHub Settings > Secrets > Actions
```

### "Snyk authentication failed"

**Cause**: SNYK_TOKEN not configured or expired

**Fix**:

```bash
# Get token from https://app.snyk.io/account
# Add to GitHub Settings > Secrets > Actions
```

### "Forge not found"

**Cause**: Foundry not installed in workflow

**Fix**: Already handled by `foundry-rs/foundry-toolchain@v1`

### "Prisma Client not generated"

**Cause**: Missing `pnpm db:generate` step

**Fix**: Already included in all workflows

## Performance Benchmarks

Expected performance (based on similar projects):

| Metric            | Target  | Current |
| ----------------- | ------- | ------- |
| Workflow duration | <30 min | ~25 min |
| Cache hit rate    | >80%    | TBD     |
| Success rate      | >95%    | TBD     |
| Time to feedback  | <5 min  | ~3 min  |

## Support & Resources

### Documentation

- [Workflow README](.github/workflows/README.md)
- [Architecture Guide](.github/workflows/ARCHITECTURE.md)
- [Development Guide](../DEVELOPMENT.md)

### External Resources

- [GitHub Actions Docs](https://docs.github.com/actions)
- [Foundry Book](https://book.getfoundry.sh/)
- [Slither Wiki](https://github.com/crytic/slither/wiki)
- [Semgrep Rules](https://semgrep.dev/explore)

### Getting Help

1. Check workflow logs in GitHub Actions tab
2. Review error messages in job summaries
3. Search GitHub Issues
4. Ask in team chat
5. Create detailed issue with run URL

## Updates & Maintenance

### Check for Updates

```bash
# Check for workflow updates
gh workflow list

# Check action versions
# Review .github/workflows/*.yml for updates
```

### Update Foundry

```bash
cd packages/contracts
foundryup
forge --version
```

### Update pnpm

```bash
# Update globally
npm install -g pnpm@latest

# Update in workflows
# Edit .github/workflows/*.yml
# Change PNPM_VERSION to new version
```

### Update Node.js

```bash
# Update workflows
# Edit .github/workflows/*.yml
# Change NODE_VERSION to new version
```

---

**Last Updated**: 2024-02-08
**Workflow Version**: 1.0.0
