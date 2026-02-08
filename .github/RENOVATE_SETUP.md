# Renovate Bot Setup Guide

## Installation

Renovate Bot has been configured for the KhipuVault monorepo. To activate it:

### Option 1: GitHub App (Recommended)

1. Go to [Renovate GitHub App](https://github.com/apps/renovate)
2. Click "Install" or "Configure"
3. Select the KhipuVault repository
4. Grant permissions (read/write to code, issues, and pull requests)
5. Renovate will automatically detect `renovate.json` and start creating PRs

### Option 2: Self-Hosted Runner

If using a self-hosted CI:

```yaml
# .github/workflows/renovate.yml
name: Renovate
on:
  schedule:
    - cron: "0 2 * * *" # Run at 2 AM daily
  workflow_dispatch:

jobs:
  renovate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Self-hosted Renovate
        uses: renovatebot/github-action@v40.3.12
        with:
          configurationFile: renovate.json
          token: ${{ secrets.RENOVATE_TOKEN }}
```

## First Run Behavior

When Renovate first runs, it will:

1. **Create a Dependency Dashboard issue** - Shows all detected dependencies and pending updates
2. **Scan all packages** - Detects dependencies in all workspace packages
3. **Create initial PRs** - Based on schedule and auto-merge rules

### Expected Initial PRs

You may see multiple PRs grouped by:

- Dev dependencies (monthly schedule)
- Production dependencies (weekly schedule)
- Security updates (immediate)
- Lock file maintenance

## Configuration Validation

Before activating Renovate, validate the configuration:

```bash
# Validate JSON syntax
cat renovate.json | jq . > /dev/null 2>&1 && echo "Valid JSON" || echo "Invalid JSON"

# Optional: Use Renovate CLI to validate config
npx renovate-config-validator
```

## Testing Configuration

You can test Renovate configuration locally:

```bash
# Install Renovate CLI
npm install -g renovate

# Dry run (won't create PRs)
renovate --dry-run=true --log-level=debug

# Or use Docker
docker run --rm -v $(pwd):/tmp/renovate renovate/renovate:latest \
  --dry-run=true \
  --platform=local \
  /tmp/renovate
```

## Integration with CI

Renovate is configured to respect CI checks defined in `.github/workflows/ci.yml`:

### Required Checks for Auto-merge

- Lint (ESLint)
- Type Check (TypeScript)
- Test (Vitest with coverage)
- Contract Tests (Foundry)
- Security Scan (pnpm audit)
- Contract Security (Slither)
- Build (all packages)

Auto-merge will only proceed if **all checks pass**.

### Branch Protection Rules

Recommended GitHub branch protection settings for `main`:

```yaml
Require pull request reviews before merging: true
  Required approvals: 0 (for Renovate auto-merge)

Require status checks to pass before merging: true
  Required status checks:
    - Lint
    - Type Check
    - Test
    - Contract Tests
    - Build

Allow auto-merge: true (enable auto-merge feature)
```

## Monitoring Renovate

### Dependency Dashboard

Check the Dependency Dashboard issue for:

- List of all detected dependencies
- Pending updates awaiting schedule
- Rate-limited PRs
- Configuration errors

### Renovate PRs

Renovate PRs include:

- Clear title: `chore(deps): update {package} to {version}`
- Grouped updates (e.g., "Update React ecosystem")
- Release notes and changelogs
- Merge confidence score
- Age of new version (stability indicator)

### Logs and Debugging

If Renovate isn't working:

1. **Check Dependency Dashboard** - Shows configuration errors
2. **Review Renovate logs** - Available in PR comments or job logs
3. **Validate configuration** - Use `renovate-config-validator`
4. **Check app permissions** - Ensure Renovate has write access

Common issues:

- **No PRs created**: Check schedules or rate limits
- **Auto-merge not working**: Verify CI checks pass and branch protection allows auto-merge
- **Too many PRs**: Adjust `prConcurrentLimit` or `prHourlyLimit`

## Customization

### Adjust Update Frequency

Edit `renovate.json` to change schedules:

```json
{
  "packageRules": [
    {
      "description": "More frequent production updates",
      "matchDepTypes": ["dependencies"],
      "schedule": ["before 3am on Monday and Thursday"]
    }
  ]
}
```

### Add Package-Specific Rules

Pin a specific package:

```json
{
  "packageRules": [
    {
      "matchPackageNames": ["react"],
      "rangeStrategy": "pin",
      "automerge": false
    }
  ]
}
```

Ignore a package:

```json
{
  "packageRules": [
    {
      "matchPackageNames": ["legacy-package"],
      "enabled": false
    }
  ]
}
```

### Change Auto-merge Behavior

Disable auto-merge for a group:

```json
{
  "packageRules": [
    {
      "groupName": "React ecosystem",
      "automerge": false
    }
  ]
}
```

## Security Considerations

### Vulnerability Management

Renovate automatically:

- Monitors GitHub Security Advisories
- Checks OSV vulnerability database
- Creates immediate PRs for security patches
- Labels security updates with `security` label

### Review Process

Even with auto-merge enabled:

1. **Security updates** - Review high/critical vulnerabilities manually
2. **Major updates** - Always require manual review
3. **Smart contracts** - Never auto-merge (security critical)
4. **Authentication** - Never auto-merge (security critical)

### Audit Trail

All Renovate updates:

- Follow conventional commits
- Include release notes
- Link to changelogs
- Show in Dependency Dashboard

## Maintenance

### Weekly Tasks

- Review Dependency Dashboard for pending updates
- Check auto-merged PRs passed CI successfully
- Monitor application for issues after updates

### Monthly Tasks

- Review major updates requiring manual intervention
- Adjust schedules if needed
- Update package rules for new dependencies

### Quarterly Tasks

- Review Renovate configuration effectiveness
- Adjust auto-merge rules based on experience
- Update stability days if needed

## Rollback Procedure

If an auto-merged update causes issues:

```bash
# 1. Identify the problematic commit
git log --oneline | grep "chore(deps)"

# 2. Revert the specific commit
git revert <commit-hash>

# 3. Push to main
git push origin main

# 4. Pin the package temporarily in renovate.json
{
  "packageRules": [
    {
      "matchPackageNames": ["problematic-package"],
      "allowedVersions": "<current-working-version"
    }
  ]
}
```

## Best Practices

1. **Start Conservative** - Begin with no auto-merge, enable gradually
2. **Monitor Initially** - Watch first few weeks closely
3. **Group Related Packages** - Reduces PR noise and ensures compatibility
4. **Use Stability Days** - Let community find issues first (default: 3 days)
5. **Respect Semver** - Trust package maintainers' version semantics
6. **Test Locally** - For major updates, test before merging
7. **Review Security** - Always review security-labeled PRs
8. **Document Exceptions** - If pinning packages, document why

## Support

- **Renovate Docs**: https://docs.renovatebot.com/
- **GitHub Discussions**: https://github.com/renovatebot/renovate/discussions
- **Configuration Reference**: https://docs.renovatebot.com/configuration-options/
- **Best Practices**: https://docs.renovatebot.com/key-concepts/best-practices/

## Troubleshooting FAQ

### Q: Why aren't PRs being created?

Check:

- Dependency Dashboard for rate limits
- Schedule configuration matches current time
- Package not in `ignorePaths`
- Repository permissions for Renovate app

### Q: Why isn't auto-merge working?

Verify:

- All CI checks pass
- Branch protection allows auto-merge
- Package rules permit auto-merge
- Stability period elapsed

### Q: How do I temporarily pause Renovate?

Add to `renovate.json`:

```json
{
  "enabled": false
}
```

Or close all Renovate PRs and pause the GitHub App.

### Q: Can I test updates locally before Renovate creates PRs?

Yes:

```bash
pnpm update {package}@latest
pnpm lint && pnpm typecheck && pnpm test
```

### Q: How do I handle breaking changes?

Major updates requiring manual review:

1. Review changelog in Renovate PR
2. Check migration guide
3. Test locally
4. Update code if needed
5. Approve and merge

## Configuration Files

- `/renovate.json` - Main configuration
- `/.github/renovate.md` - Detailed documentation
- `/.github/RENOVATE_SETUP.md` - This setup guide

## Next Steps

After activating Renovate:

1. Wait for Dependency Dashboard issue creation
2. Review initial PRs (may be many)
3. Monitor auto-merged PRs for issues
4. Adjust configuration based on team workflow
5. Document any exceptions or special cases
