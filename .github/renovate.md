# Renovate Bot Configuration Guide

This document explains the Renovate Bot setup for KhipuVault's automated dependency management.

## Overview

Renovate Bot automatically updates dependencies across the monorepo with smart scheduling, grouping, and auto-merge capabilities based on dependency type and risk level.

## Configuration File

Location: `/renovate.json`

## Update Schedules

### Security Updates

- **Schedule**: Immediate (24/7)
- **Auto-merge**: Yes (patch updates only)
- **Stability days**: 0
- **Labels**: `dependencies`, `security`

Critical vulnerabilities are patched immediately regardless of schedule.

### Production Dependencies

- **Schedule**: Weekly (Monday before 3am UTC)
- **Auto-merge**: Yes (minor and patch only)
- **Stability days**: 3
- **Labels**: `dependencies`, `production`

Major updates require manual review.

### Dev Dependencies

- **Schedule**: Monthly (1st day of month before 3am UTC)
- **Auto-merge**: Yes (minor and patch only)
- **Stability days**: 3
- **Labels**: `dependencies`, `dev`

## Dependency Groups

Renovate groups related packages to reduce PR noise and ensure compatibility:

### Frontend Ecosystem

**React Ecosystem**

- `react`, `react-dom`, `@types/react*`, `react-*`
- Auto-merge: No (manual review)
- Label: `react`

**Next.js**

- `next`, `@next/*`, `next-*`
- Auto-merge: No (framework updates need testing)
- Label: `nextjs`

**Tailwind CSS**

- `tailwindcss`, `autoprefixer`, `postcss`, `@tailwindcss/*`
- Auto-merge: Yes (minor/patch)
- Label: `styling`

**Radix UI**

- `@radix-ui/*` packages
- Auto-merge: Yes (minor/patch)
- Label: `ui`

### Web3 Ecosystem

**Wagmi/Viem**

- `wagmi`, `viem`, `@wagmi/*`, `@viem/*`
- Auto-merge: No (breaking changes common)
- Label: `web3`

**Ethereum Libraries**

- `ethers`, `web3`, `@ethereumjs/*`
- Auto-merge: No (requires testing)
- Label: `web3`

**Authentication**

- `siwe`, `jsonwebtoken`, `@noble/*`
- Auto-merge: No (security critical)
- Labels: `security`, `auth`

### Backend Ecosystem

**Express**

- `express`, `@types/express`, `express-*`
- Auto-merge: Yes (minor/patch)
- Label: `api`

**Prisma**

- `prisma`, `@prisma/client`, `@prisma/*`
- Auto-merge: No (schema changes need testing)
- Label: `database`

**Logging**

- `pino`, `pino-pretty`, `pino-*`
- Auto-merge: Yes (minor/patch)
- Label: `logging`

### Smart Contract Ecosystem

**OpenZeppelin**

- `@openzeppelin/*` packages
- Auto-merge: No (security critical)
- Labels: `smart-contracts`, `security`

**Solidity Tooling**

- `forge-std`, `solhint`, `@nomicfoundation/*`
- Auto-merge: No (tooling changes need validation)
- Label: `smart-contracts`

**Foundry/Forge**

- `foundry`, `forge-std`
- Range strategy: Pin (exact versions)
- Auto-merge: No

### Tooling

**TypeScript**

- `typescript`, `@types/*`
- Auto-merge: Yes (minor/patch)
- Label: `typescript`

**Testing**

- `vitest`, `jest`, `@testing-library/*`
- Auto-merge: Yes (minor/patch)
- Label: `testing`

**Linting & Formatting**

- `eslint`, `prettier`, `eslint-*`, `@typescript-eslint/*`
- Auto-merge: Yes (minor/patch)
- Label: `tooling`

**Validation**

- `zod`, `zod-*`
- Auto-merge: Yes (minor/patch)
- Label: `validation`

**State Management**

- `zustand`, `@tanstack/react-query`
- Auto-merge: Partial (zustand yes, react-query manual)
- Label: `state-management`

## Auto-merge Rules

### Always Auto-merge

- Patch updates for stable packages (not 0.x.x)
- Minor updates for dev dependencies
- Lock file maintenance
- Security patches

### Require Manual Review

- Major version updates (all packages)
- Framework updates (Next.js, React)
- Web3 library updates (breaking changes common)
- Smart contract dependencies (security critical)
- Authentication libraries (security critical)
- Database migrations (Prisma)
- Unstable versions (0.x.x)

## Commit Message Format

Renovate follows conventional commits:

```
chore(deps): update {package} to {version}
```

Examples:

- `chore(deps): update react to 18.3.0`
- `chore(deps): update dev dependencies`

## PR Management

- **Concurrent PRs**: Max 10
- **Hourly limit**: Max 2 PRs per hour
- **Stability days**: 3 days (allows community to discover issues)
- **PR creation**: Immediate (no rate limiting by schedule)

## Dependency Dashboard

Renovate creates a "Dependency Dashboard" issue to track:

- Pending updates
- Rate-limited PRs
- Detected dependencies
- Configuration errors

Location: GitHub Issues → "Dependency Dashboard"

## Monorepo Support

Renovate is configured for pnpm workspaces:

- Automatically detects workspace packages
- Updates internal package versions together
- Runs `pnpm dedupe` after updates
- Respects workspace protocols

## Ignored Paths

The following paths are excluded from updates:

- `**/node_modules/**`
- `**/dist/**`
- `**/build/**`
- `**/.next/**`
- `**/coverage/**`
- `**/out/**`
- `**/cache/**`
- `**/lib/**` (Foundry dependencies)

## Vulnerability Alerts

- **Source**: GitHub Security Advisories + OSV Database
- **Schedule**: Immediate (24/7)
- **Auto-merge**: Yes (if tests pass)
- **Labels**: `security`

## Range Strategy

- **Default**: `bump` - Updates to latest version in range
- **Unstable (0.x.x)**: `pin` - Locks to exact version
- **Foundry**: `pin` - Exact versions for reproducibility

## Testing Before Merge

Auto-merge only occurs if:

1. All CI checks pass (lint, typecheck, test, build)
2. Stability period elapsed (3 days for most updates)
3. No merge conflicts
4. Package rules allow auto-merge

## Disabling Renovate

### Temporarily (single package)

Add to package.json:

```json
{
  "renovate": {
    "enabled": false
  }
}
```

### Permanently (dependency)

Add to `renovate.json`:

```json
{
  "packageRules": [
    {
      "matchPackageNames": ["package-name"],
      "enabled": false
    }
  ]
}
```

## Best Practices

1. **Review security updates quickly** - They have no stability delay
2. **Check Dependency Dashboard weekly** - Stay informed on pending updates
3. **Test major updates locally** - Use `pnpm update {package}@latest`
4. **Monitor auto-merged PRs** - Ensure CI passes and app works
5. **Pin critical packages** - If specific version required

## Troubleshooting

### Too many PRs

- Increase `stabilityDays` in relevant package rules
- Adjust `schedule` to less frequent intervals
- Reduce `prConcurrentLimit`

### Auto-merge not working

- Check CI status (must pass all checks)
- Verify package rule allows auto-merge
- Check for merge conflicts
- Ensure stability period elapsed

### Missing updates

- Check Dependency Dashboard for rate-limited PRs
- Verify package not in `ignorePaths`
- Check if package rule has `enabled: false`

### Conflicting updates

- Renovate groups related packages to avoid this
- If occurs, close one PR and let Renovate recreate

## Commands

Comment on Renovate PRs to control behavior:

- `@renovatebot rebase` - Rebase PR
- `@renovatebot recreate` - Close and recreate PR
- `@renovatebot stop pinning` - Switch from pin to range strategy

## Related Documentation

- [Renovate Docs](https://docs.renovatebot.com/)
- [pnpm Workspace Support](https://docs.renovatebot.com/modules/manager/npm/#pnpm)
- [Monorepo Guide](https://docs.renovatebot.com/guide/monorepo/)
- [Auto-merge Documentation](https://docs.renovatebot.com/key-concepts/automerge/)

## Maintenance

Review and update `renovate.json` when:

- Adding new major dependencies
- Changing workspace structure
- Adjusting security policies
- Optimizing update frequency
