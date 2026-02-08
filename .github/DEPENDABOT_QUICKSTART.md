# Dependabot Quick Start

> 5-minute guide to understanding Dependabot for KhipuVault

## What is Dependabot?

GitHub's **FREE** built-in tool that automatically:

- 🔒 Detects security vulnerabilities
- 📦 Updates dependencies
- 🤖 Creates pull requests
- ⚡ Runs 100% on GitHub (no external service)

## Current Setup

### 📊 By the Numbers

- **12 ecosystems** monitored
- **11 workspaces** + GitHub Actions
- **50+ dependency groups** for smart bundling
- **Weekly/Monthly** automated updates

### 📅 Update Schedule

| When        | What Gets Updated                                              |
| ----------- | -------------------------------------------------------------- |
| **Daily**   | Security vulnerabilities (automatic alerts)                    |
| **Weekly**  | Production apps (web, api), critical packages (database, web3) |
| **Monthly** | Stable packages (UI, docs, contracts, tooling)                 |

### 📍 What's Monitored

```
/                          → Root (turbo, typescript, testing)
/apps/web                  → Next.js frontend
/apps/api                  → Express backend
/apps/docs                 → Documentation
/packages/database         → Prisma ORM
/packages/blockchain       → Event indexer
/packages/web3             → ABIs & hooks
/packages/ui               → Components
/packages/shared           → Utilities
/packages/contracts        → Solidity tooling
/tooling/eslint            → ESLint config
.github/workflows/         → GitHub Actions
```

## How It Works

### 1. Dependabot Scans

```
Monday 09:00 → Root workspace
Tuesday 09:00 → Web app
Tuesday 10:00 → API server
Wednesday 09:00 → Database (Prisma)
...and so on
```

### 2. Groups Related Updates

Instead of 20 PRs, you get:

- ✅ **1 PR**: "Update TypeScript ecosystem (3 packages)"
- ✅ **1 PR**: "Update testing framework (4 packages)"
- ✅ **1 PR**: "Update Next.js ecosystem (3 packages)"

### 3. Creates Pull Requests

Each PR includes:

- Clear title with package names
- Changelog links
- Labels for filtering
- Conventional commit message

### 4. You Review & Merge

- CI runs tests automatically
- Review changelogs
- Merge when ready

## Common Tasks

### ✅ Enable Dependabot (First Time)

1. Go to repository **Settings** → **Code security and analysis**
2. Enable **Dependabot alerts**
3. Enable **Dependabot security updates**
4. Done! (Config already exists in `.github/dependabot.yml`)

### 📋 Review Dependabot PRs

```bash
# Filter by labels on GitHub
label:dependencies
label:web-app
label:api-server
label:critical
```

### 🔒 Handle Security Updates

**Priority**: High/Critical → Review TODAY

1. Check Dependabot PR
2. Review security advisory link
3. Read changelog for breaking changes
4. Run tests locally if needed
5. Merge ASAP

### 📦 Review Weekly Updates

**Priority**: Normal → Review within 3 days

1. Check grouped PRs (e.g., "Update TypeScript ecosystem")
2. Verify CI passed
3. Review changelogs (linked in PR)
4. Merge if no breaking changes
5. Watch production after deploy

### 🔄 Update Foundry Dependencies (Manual)

Dependabot **cannot** update git submodules. Do this manually:

```bash
cd packages/contracts

# Update all
forge update

# Or update one
forge update openzeppelin-contracts

# Test
forge test

# Commit
git add lib/
git commit -m "chore(contracts): update forge dependencies"
```

### ❌ Close Stale PRs

If a Dependabot PR is outdated:

1. Close it
2. Dependabot will recreate automatically on next run
3. Or manually trigger: **Insights** → **Dependency graph** → **Dependabot** → **Check for updates**

## Protected Packages (No Auto Major Updates)

These require manual review for major versions:

### Web3 & Blockchain

- `wagmi` / `viem` / `@wagmi/*` - Breaking API changes
- `ethers` - Core Web3 library

### Frontend

- `next` - Major updates need migration guides
- `react` - Affects entire UI
- `@tanstack/react-query` - Query patterns change

### Backend

- `express` - Breaking changes rare but important
- `prisma` / `@prisma/client` - Database compatibility

**Why?** Major versions often have breaking changes requiring code refactoring across multiple packages.

## PR Labels Explained

| Label            | Meaning                                           |
| ---------------- | ------------------------------------------------- |
| `dependencies`   | All dependency updates                            |
| `automated`      | Created by Dependabot                             |
| `critical`       | Database/infrastructure (merge ASAP after review) |
| `web-app`        | apps/web updates                                  |
| `api-server`     | apps/api updates                                  |
| `security`       | Security vulnerability fix                        |
| `github-actions` | CI/CD workflow updates                            |

## Commit Messages

All PRs follow Conventional Commits:

```
chore(deps): update typescript ecosystem
chore(web): update next to 15.5.13
chore(api): update express to 4.18.3
ci(deps): update actions/checkout to v4
```

## Troubleshooting

### "Too many PRs!"

**Solution**: PRs are limited per package. Max is 10 (root workspace). If still too many:

1. Merge related PRs first
2. Dependabot will create more on next run
3. Or adjust limits in `.github/dependabot.yml`

### "PR has merge conflicts"

**Solution**:

1. Close the PR
2. Dependabot recreates it automatically
3. Or manually resolve (it's just a regular PR)

### "No PRs being created"

**Check**:

1. Dependabot enabled in Settings?
2. Waiting for scheduled time? (weekly/monthly)
3. Dependencies already up-to-date?
4. Check GitHub Actions logs for errors

### "Security alert but no PR"

**Solutions**:

1. Enable "Dependabot security updates" in Settings
2. Check "Dependency graph" is enabled
3. For private repos, may need GitHub Advanced Security

## Best Practices

### ✅ DO

- Review security PRs same-day
- Merge grouped updates weekly
- Test critical packages (database, API) before merging
- Monitor production after merging
- Update Foundry submodules monthly

### ❌ DON'T

- Let PRs accumulate (causes conflicts)
- Merge without CI passing
- Skip changelog review for major updates
- Auto-merge database updates without testing
- Ignore security alerts

## When to Check

### Daily

- Security alerts (GitHub will email you)

### Weekly

- Monday morning: Check new PRs from weekend run
- Review and merge grouped updates

### Monthly

- First Monday: Check monthly update PRs
- Update Foundry submodules manually
- Close stale PRs

## Getting Help

### Documentation

- **Full Guide**: `.github/DEPENDABOT_GUIDE.md` (comprehensive)
- **This File**: `.github/DEPENDABOT_QUICKSTART.md` (quick reference)
- **Official Docs**: https://docs.github.com/en/code-security/dependabot

### Configuration File

- **Location**: `.github/dependabot.yml`
- **Syntax**: YAML
- **Validate**: `yamllint .github/dependabot.yml`

### Team Coordination

- Discuss major updates in team standup
- Coordinate database updates with deployments
- Document any manual steps needed

## Quick Commands

```bash
# Validate configuration
yamllint .github/dependabot.yml

# Update Foundry dependencies
cd packages/contracts && forge update

# Run tests after dependency update
pnpm test

# Check for security vulnerabilities manually
pnpm run security:audit

# Full security check (npm + Snyk)
pnpm run security:check
```

## Summary

1. **Dependabot is FREE** and built into GitHub
2. **Already configured** for KhipuVault monorepo
3. **Smart grouping** reduces PR noise
4. **Weekly/monthly** automated updates
5. **Security updates** handled automatically
6. **Review PRs** weekly, merge after CI passes
7. **Foundry deps** must be updated manually

---

**Questions?** Check `.github/DEPENDABOT_GUIDE.md` for detailed documentation.

**Configuration**: `.github/dependabot.yml` (798 lines, 12 ecosystems)

**Status**: Ready to use! Just enable in repository settings.
