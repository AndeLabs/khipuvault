# GitHub Dependabot Configuration Guide

## Overview

This document explains the comprehensive Dependabot configuration for the KhipuVault monorepo. Dependabot is GitHub's **100% FREE** native dependency update tool that automatically:

- 🔒 Scans for security vulnerabilities daily
- 📦 Creates pull requests for dependency updates
- 🤖 Groups related updates to reduce PR noise
- ⚡ Runs automatically without external services

## Configuration Summary

### Total Configuration

- **12 package ecosystems** monitored
- **11 npm workspaces** + 1 GitHub Actions
- **798 lines** of configuration
- **50+ dependency groups** for smart bundling

### Monitored Locations

| Directory              | Purpose                                     | Update Schedule | PRs Limit |
| ---------------------- | ------------------------------------------- | --------------- | --------- |
| `/`                    | Root workspace (turbo, typescript, tooling) | Weekly          | 10        |
| `/apps/web`            | Next.js frontend (wagmi, viem, React)       | Weekly          | 8         |
| `/apps/api`            | Express backend (SIWE, Prisma, JWT)         | Weekly          | 8         |
| `/apps/docs`           | Documentation site                          | Monthly         | 5         |
| `/packages/database`   | Prisma ORM                                  | Weekly          | 5         |
| `/packages/blockchain` | Event indexer (ethers.js)                   | Weekly          | 5         |
| `/packages/web3`       | ABIs and hooks (wagmi)                      | Weekly          | 5         |
| `/packages/ui`         | Component library (Radix UI)                | Monthly         | 5         |
| `/packages/shared`     | Shared types and utilities                  | Monthly         | 3         |
| `/packages/contracts`  | Solidity contracts tooling                  | Monthly         | 3         |
| `/tooling/eslint`      | ESLint configuration                        | Monthly         | 3         |
| `/` (GitHub Actions)   | CI/CD workflows                             | Weekly          | 5         |

## Update Schedules Explained

### Daily (via GitHub Security Alerts)

Security vulnerabilities are detected and alerted **automatically** by GitHub. Dependabot will create PRs for critical security issues as soon as they're discovered.

### Weekly Updates

- **Root workspace**: Monday 09:00 (tooling, typescript, testing)
- **Web app**: Tuesday 09:00 (Next.js, React, Web3)
- **API server**: Tuesday 10:00 (Express, auth, database)
- **Database**: Wednesday 09:00 (Prisma - critical for data integrity)
- **Blockchain**: Wednesday 10:00 (ethers.js indexer)
- **Web3 package**: Thursday 09:00 (wagmi, ABIs)
- **GitHub Actions**: Monday 09:00 (CI/CD workflows)

### Monthly Updates

- **Docs app**: 1st Monday (content tooling, markdown)
- **UI package**: 1st Monday (Radix UI, Tailwind - stable)
- **Shared package**: 1st Monday (utilities - infrequent changes)
- **Contracts**: 1st Monday (Solidity tooling)
- **ESLint tooling**: 1st Monday (linting config)

## Smart Grouping Strategy

### Root Workspace Groups

1. **TypeScript Ecosystem** - typescript, @typescript-eslint/_, @types/_
2. **Testing Framework** - vitest, @vitest/\*, playwright
3. **Build Tools** - turbo, tsup, tsx
4. **Code Quality** - prettier, eslint, lint-staged, husky
5. **Security Tools** - snyk, security eslint plugins
6. **Other Dev Dependencies** - everything else

### Web App Groups

1. **Next.js Ecosystem** - next, react, react-dom
2. **Web3 Core** - wagmi, viem, @wagmi/\* (separate for review)
3. **TanStack Query** - @tanstack/react-query, query-\*
4. **Radix UI** - @radix-ui/\* components
5. **Styling** - tailwindcss, clsx, class-variance-authority
6. **Other Production** - remaining dependencies

### API Server Groups

1. **Express Ecosystem** - express, cors, helmet, rate-limit
2. **Auth & Security** - siwe, jsonwebtoken, bcrypt, ethers
3. **Database** - @prisma/client
4. **Logging** - pino, pino-\*
5. **Validation** - zod, validator
6. **Other Production** - remaining dependencies

### Other Packages

Similar smart grouping applied to:

- Database (Prisma ecosystem)
- Blockchain (Web3 + database)
- Web3 package (wagmi core)
- UI package (Radix + Tailwind + React)
- Shared package (utilities)
- Contracts (Solidity tools)
- ESLint (linting ecosystem)

### GitHub Actions Groups

1. **GitHub Official** - actions/\* (checkout, setup-node, etc.)
2. **Third-party** - All other actions

## Protected Dependencies (No Auto Major Updates)

These packages require manual review for major version updates:

### Web3 & Blockchain

- `wagmi` - Breaking API changes in major versions
- `viem` - Core Web3 library, impacts entire stack
- `@wagmi/*` - All wagmi packages
- `ethers` - Used in blockchain indexer

### Frontend Framework

- `next` - Major Next.js updates need migration guide review
- `react` - React major updates affect entire UI
- `@tanstack/react-query` - Query patterns may change

### Backend Core

- `express` - Express major updates rare but breaking
- `@prisma/client` - Database schema compatibility
- `prisma` - Migration tool changes

**Why?** These packages have breaking changes in major versions that require:

- Migration guide review
- Code refactoring across multiple packages
- Extensive testing before deployment
- Potential downtime planning

## Labels Applied to PRs

All Dependabot PRs are automatically labeled for easy filtering:

### Common Labels

- `dependencies` - All dependency update PRs
- `automated` - Automated by Dependabot
- `ci-cd` - GitHub Actions updates

### Package-Specific Labels

- `root-workspace` - Root package.json updates
- `web-app` - apps/web updates
- `api-server` - apps/api updates
- `documentation` - apps/docs updates
- `database` - packages/database updates (+ `critical`)
- `blockchain` - packages/blockchain updates
- `web3` - packages/web3 updates
- `ui-components` - packages/ui updates
- `shared-utilities` - packages/shared updates
- `smart-contracts` - packages/contracts updates
- `tooling` - tooling/eslint updates
- `github-actions` - CI/CD workflow updates

### Priority Labels

- `critical` - Database package (Prisma) updates

## Commit Message Convention

All Dependabot commits follow Conventional Commits:

| Package Type   | Prefix  | Example                                   |
| -------------- | ------- | ----------------------------------------- |
| Root workspace | `chore` | `chore(deps): update typescript to 5.3.4` |
| Web app        | `chore` | `chore(web): update next to 15.5.13`      |
| API server     | `chore` | `chore(api): update express to 4.18.3`    |
| Documentation  | `docs`  | `docs(deps): update contentlayer`         |
| GitHub Actions | `ci`    | `ci(deps): update actions/checkout to v4` |

This ensures:

- Clean git history
- Semantic versioning compatibility
- Easy changelog generation
- Automated release notes

## PR Management

### Open PR Limits

Prevents "PR spam" by limiting concurrent open PRs per package:

- **10 PRs max**: Root workspace (many dependencies)
- **8 PRs max**: Web app, API server (critical apps)
- **5 PRs max**: Database, blockchain, web3, docs, GitHub Actions
- **3 PRs max**: UI, shared, contracts, tooling (stable packages)

### Rebase Strategy

All PRs use `rebase-strategy: "auto"`:

- Automatically rebases PRs when base branch changes
- Keeps PRs up-to-date without manual intervention
- Resolves merge conflicts when possible

## Foundry/Solidity Dependencies (Not Managed by Dependabot)

### Git Submodules in `packages/contracts/lib/`

The following are managed via Foundry's git submodules:

- `forge-std` - Foundry standard library
- `openzeppelin-contracts` - OpenZeppelin base contracts
- `openzeppelin-contracts-upgradeable` - OpenZeppelin upgradeable
- `chainlink-brownie-contracts` - Chainlink price feeds

### How to Update Manually

```bash
cd packages/contracts

# Update all submodules
forge update

# Or update specific library
forge update openzeppelin-contracts

# Always test after updating
forge test

# Commit the submodule reference change
git add lib/
git commit -m "chore(contracts): update forge dependencies"
```

### Security Scanning for Solidity

```bash
# Static analysis with Slither
cd packages/contracts && make slither

# Security audit
make audit

# Gas optimization report
forge test --gas-report
```

## Complementing Renovate (If Used)

This Dependabot config can work alongside Renovate:

### Use Dependabot For:

- Native GitHub integration (no external service)
- Critical packages (Prisma, Express, security)
- Security alerts (built into GitHub)
- Simple, maintainable config

### Use Renovate For:

- More complex grouping rules
- Custom automerge strategies
- Advanced scheduling (time ranges, specific dates)
- Multi-repo management

### To Avoid Conflicts:

Configure Renovate to ignore packages Dependabot handles:

```json
{
  "ignoreDeps": ["prisma", "@prisma/client", "express", "next", "wagmi", "viem"]
}
```

## Validation Checklist

Before enabling, verify:

- [ ] GitHub Actions are enabled in repository settings
- [ ] Dependabot security alerts are enabled
- [ ] All directories in config exist in repository
- [ ] pnpm version matches `packageManager` in root package.json
- [ ] CI pipeline will handle Dependabot PRs correctly
- [ ] Team has reviewed major version ignore list

## Testing the Configuration

### 1. Validate YAML Syntax

```bash
# Install yamllint
brew install yamllint  # macOS
apt-get install yamllint  # Linux

# Validate file
yamllint .github/dependabot.yml
```

### 2. Check Dependabot UI

1. Go to repository settings on GitHub
2. Navigate to "Code security and analysis"
3. Ensure "Dependabot alerts" is enabled
4. Ensure "Dependabot security updates" is enabled
5. Check "Dependabot version updates" status

### 3. Manual Trigger (Testing)

Dependabot runs automatically, but you can manually trigger:

1. Go to repository "Insights" → "Dependency graph"
2. Click "Dependabot" tab
3. Click "Check for updates" for any package ecosystem

### 4. Monitor First Week

After enabling, monitor for:

- Number of PRs created (should respect limits)
- Grouping working correctly (related updates bundled)
- Labels applied properly
- Commit messages follow convention
- Major versions NOT auto-updated for protected packages

## Troubleshooting

### Too Many PRs Created

**Problem**: Dependabot creates more PRs than expected.

**Solution**:

1. Check `open-pull-requests-limit` values
2. Review grouping rules (may need more grouping)
3. Consider changing schedule from "weekly" to "monthly" for non-critical packages

### PRs Not Being Created

**Problem**: Dependabot not creating any PRs.

**Solutions**:

1. Verify Dependabot is enabled in repository settings
2. Check `.github/dependabot.yml` syntax (use yamllint)
3. Ensure directories exist and contain `package.json`
4. Check GitHub Actions logs for errors
5. Wait - Dependabot runs on schedule (weekly/monthly)

### Security Alerts Not Triggering

**Problem**: Not receiving security update PRs.

**Solutions**:

1. Enable "Dependabot security updates" in repository settings
2. Check "Dependency graph" is enabled
3. Verify GitHub has access to repository (not private without GitHub Advanced Security)
4. Review notification settings

### Merge Conflicts in PRs

**Problem**: Dependabot PRs have merge conflicts.

**Solutions**:

1. Use `rebase-strategy: "auto"` (already configured)
2. If conflicts persist, close PR and Dependabot will recreate
3. Or manually resolve and push to PR branch

### Wrong Package Manager Used

**Problem**: Dependabot using npm instead of pnpm.

**Note**: Dependabot always uses npm for `package-ecosystem: "npm"`. This is fine because:

- It only updates `package.json` and `package-lock.json` (or similar)
- Your local environment still uses pnpm
- CI runs `pnpm install` which respects `pnpm-lock.yaml`

**If issues occur**:

1. Ensure `pnpm-lock.yaml` is committed
2. CI should run `pnpm install`, not `npm install`
3. Add `.npmrc` if needed for pnpm settings

## Best Practices

### 1. Review PRs Promptly

- Review grouped PRs weekly
- Security PRs should be reviewed same-day
- Don't let PRs accumulate (creates merge conflicts)

### 2. Test Before Merging

- CI must pass (lint, typecheck, test, build)
- For critical packages (database, API), test staging environment
- Review changelogs for breaking changes

### 3. Monitor After Merging

- Watch production for issues
- Check error tracking (Sentry, etc.)
- Monitor performance metrics
- Be ready to rollback if needed

### 4. Keep Configuration Updated

- Review quarterly
- Adjust schedules based on team capacity
- Update protected packages list as architecture changes
- Add new packages/workspaces as monorepo grows

### 5. Coordinate with Team

- Communicate when merging major updates
- Schedule database-related updates during low-traffic times
- Document any manual steps needed after updates

## Security Considerations

### Automatic Security Updates

Dependabot creates PRs for security vulnerabilities automatically:

- **High/Critical**: Review and merge ASAP
- **Medium**: Review within 1 week
- **Low**: Review with regular updates

### Supply Chain Security

- All updates come from official npm registry
- GitHub scans for malicious packages
- Dependabot shows source code changes in PR
- Review large/unexpected changes carefully

### Private Packages

If using private npm packages:

- Configure npm token in repository secrets
- Add to Dependabot secrets in settings
- Ensure token has read-only access

## Cost & Limitations

### Cost: FREE

- Dependabot is completely free for all GitHub repositories
- No external service registration needed
- No credit card required
- No usage limits

### Limitations

- npm ecosystem only (no pnpm-specific features)
- Less flexible than Renovate for complex scenarios
- No built-in auto-merge (use GitHub Actions if needed)
- Submodules (Foundry) not supported

### When to Upgrade to Renovate

Consider Renovate if you need:

- Automerge with custom rules
- More granular scheduling (specific hours)
- Custom PR descriptions/templates
- Monorepo-wide version alignment
- Integration with project management tools

## Maintenance Schedule

### Weekly (Automated)

- Dependabot runs on schedule
- PRs created automatically
- Team reviews and merges

### Monthly (Manual)

- Review open PRs and close stale ones
- Check for major version updates needed
- Update Foundry submodules
- Review security advisories

### Quarterly (Manual)

- Review and optimize grouping rules
- Adjust schedules based on team feedback
- Update protected packages list
- Review and update this guide

## Additional Resources

### Official Documentation

- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Configuration Options](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [Keeping Dependencies Updated](https://docs.github.com/en/code-security/dependabot/working-with-dependabot)

### Related Tools

- [Renovate](https://docs.renovatebot.com/) - Alternative dependency update tool
- [npm-check-updates](https://www.npmjs.com/package/npm-check-updates) - Manual update checker
- [Snyk](https://snyk.io/) - Security vulnerability scanning (already configured)

### Monitoring

- GitHub Security Advisories: `https://github.com/<org>/<repo>/security/advisories`
- Dependency Graph: `https://github.com/<org>/<repo>/network/dependencies`
- Dependabot Insights: `https://github.com/<org>/<repo>/network/updates`

---

**Last Updated**: 2026-02-08  
**Configuration Version**: 1.0.0  
**Maintainer**: KhipuVault Team
