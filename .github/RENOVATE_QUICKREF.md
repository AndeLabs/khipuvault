# Renovate Bot Quick Reference

## What is Renovate?

Automated dependency update bot that creates PRs for package updates across the KhipuVault monorepo.

## Update Schedules

| Type             | Schedule              | Auto-merge        | Stability |
| ---------------- | --------------------- | ----------------- | --------- |
| Security patches | Immediate (24/7)      | Yes               | 0 days    |
| Production deps  | Weekly (Mon 3am)      | Yes (minor/patch) | 3 days    |
| Dev deps         | Monthly (1st day 3am) | Yes (minor/patch) | 3 days    |
| Major updates    | Same as above         | No (manual)       | 3 days    |

## Package Groups

### Auto-merge Enabled (minor/patch only)

- **Tooling**: TypeScript, ESLint, Prettier, testing libraries
- **Styling**: Tailwind CSS, PostCSS
- **UI**: Radix UI components
- **Backend**: Express ecosystem, Pino logging
- **Validation**: Zod
- **State**: Zustand

### Manual Review Required

- **Frameworks**: React, Next.js
- **Web3**: Wagmi, Viem, ethers
- **Smart Contracts**: OpenZeppelin, Foundry
- **Database**: Prisma
- **Auth**: SIWE, JWT
- **Major versions**: All packages

## Common PR Labels

- `dependencies` - All dependency updates
- `security` - Security vulnerability fixes
- `production` - Production dependencies
- `dev` - Dev dependencies
- `major-update` - Major version updates
- `react`, `nextjs`, `web3`, `smart-contracts`, etc. - Category-specific

## Renovate PR Commands

Comment on PRs to control behavior:

| Command                     | Action                       |
| --------------------------- | ---------------------------- |
| `@renovatebot rebase`       | Rebase the PR on latest main |
| `@renovatebot recreate`     | Close and recreate the PR    |
| `@renovatebot stop pinning` | Switch from pin to range     |

## Where to Find Information

| Resource             | Location                            |
| -------------------- | ----------------------------------- |
| Configuration        | `/renovate.json`                    |
| Full documentation   | `/.github/renovate.md`              |
| Setup guide          | `/.github/RENOVATE_SETUP.md`        |
| Dependency Dashboard | GitHub Issues (created by Renovate) |
| This quick ref       | `/.github/RENOVATE_QUICKREF.md`     |

## Auto-merge Requirements

All of these must be true:

1. CI checks pass (lint, typecheck, test, build)
2. Package rule allows auto-merge
3. Not a major version update
4. No merge conflicts
5. Stability period elapsed (3 days)

## Weekly Checklist

- [ ] Check Dependency Dashboard for pending updates
- [ ] Review any auto-merged PRs from past week
- [ ] Monitor application for issues after updates
- [ ] Approve/merge manual review PRs

## Quick Fixes

### Too many PRs?

```json
// In renovate.json, adjust:
"prConcurrentLimit": 5,
"stabilityDays": 7
```

### Need to pin a package?

```json
{
  "packageRules": [
    {
      "matchPackageNames": ["package-name"],
      "rangeStrategy": "pin"
    }
  ]
}
```

### Need to ignore a package?

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

### Rollback a bad update

```bash
git revert <commit-hash>
git push origin main
```

## Security Priority

1. Review security-labeled PRs immediately
2. Never auto-merge smart contracts
3. Never auto-merge authentication libraries
4. Test major updates locally first

## Need Help?

1. Check Dependency Dashboard issue
2. Review `/.github/renovate.md`
3. Read `/.github/RENOVATE_SETUP.md`
4. Visit https://docs.renovatebot.com/

## Activation

Install [Renovate GitHub App](https://github.com/apps/renovate) for the repository.

---

**Created**: 2026-02-08
**Config version**: 1.0
**Packages tracked**: All dependencies across monorepo
**Package rules**: 27 configured groups
