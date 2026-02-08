# Dependabot Activation Checklist

Follow these steps to activate Dependabot for KhipuVault.

## Pre-Activation Verification

### ✅ Files Created

- [x] `.github/dependabot.yml` (798 lines, 12 ecosystems)
- [x] `.github/DEPENDABOT_GUIDE.md` (comprehensive documentation)
- [x] `.github/DEPENDABOT_QUICKSTART.md` (5-minute quick reference)
- [x] `.github/DEPENDABOT_CHECKLIST.md` (this file)

### ✅ Configuration Validated

- [x] YAML syntax is valid
- [x] All 12 package ecosystems configured
- [x] All directories exist in repository
- [x] Smart grouping rules in place
- [x] Major version protections set
- [x] Commit message conventions configured
- [x] PR labels defined

### ✅ Directories Verified

All configured directories exist:

- [x] `/` (root)
- [x] `/apps/web`
- [x] `/apps/api`
- [x] `/apps/docs`
- [x] `/packages/database`
- [x] `/packages/blockchain`
- [x] `/packages/web3`
- [x] `/packages/ui`
- [x] `/packages/shared`
- [x] `/packages/contracts`
- [x] `/tooling/eslint`

## Activation Steps

### Step 1: Enable Dependabot on GitHub

1. **Go to Repository Settings**
   - Navigate to your repository on GitHub
   - Click **Settings** (top navigation)

2. **Enable Security Features**
   - Click **Code security and analysis** (left sidebar)
   - Enable the following:
     - [ ] **Dependency graph** (prerequisite)
     - [ ] **Dependabot alerts** (security vulnerability detection)
     - [ ] **Dependabot security updates** (auto PR for security issues)

3. **Verify Dependabot Configuration**
   - Scroll to **Dependabot version updates**
   - Should show: "Configured via dependabot.yml"
   - Status: Active (green checkmark)

**Expected Result**: Dependabot is now active and will start scanning on the next scheduled run.

### Step 2: Configure Notifications

1. **Personal Notifications**
   - Go to **Profile** → **Settings** → **Notifications**
   - Under "Dependabot alerts":
     - [ ] Enable email notifications
     - [ ] Enable web notifications

2. **Team Notifications** (Optional)
   - In repository **Settings** → **Code security and analysis**
   - Click **Configure** next to Dependabot alerts
   - Add team members to notify

3. **Slack Integration** (Optional)
   - Install GitHub app for Slack
   - Subscribe to repository: `/github subscribe owner/repo dependabot`

### Step 3: Verify Initial Setup

1. **Manual Trigger** (Optional - for immediate testing)
   - Go to **Insights** → **Dependency graph**
   - Click **Dependabot** tab
   - Click **Check for updates** for any ecosystem
   - Dependabot will scan immediately

2. **Wait for First Run** (Recommended)
   - Next Monday 09:00 Lima time: Root workspace
   - Next Tuesday 09:00: Web app
   - Next Tuesday 10:00: API server
   - Check for PRs after scheduled times

3. **Review First PRs**
   - [ ] PRs created successfully
   - [ ] Labels applied correctly
   - [ ] Commit messages follow convention
   - [ ] Grouping works as expected
   - [ ] CI runs on PRs

**Expected Result**: First batch of PRs appear after scheduled run.

### Step 4: Configure Branch Protection (Recommended)

1. **Go to Repository Settings** → **Branches**

2. **Add Branch Protection Rule**
   - Branch name pattern: `main` (or your default branch)
   - Enable:
     - [ ] **Require status checks to pass before merging**
       - [ ] CI tests
       - [ ] Linting
       - [ ] Type checking
       - [ ] Build
     - [ ] **Require conversation resolution before merging**
     - [ ] **Do not allow bypassing the above settings**

3. **Allow Dependabot**
   - Ensure "Restrict who can push to matching branches" does NOT block `dependabot[bot]`

**Expected Result**: Dependabot PRs must pass CI before merge.

### Step 5: Set Up Auto-Merge (Optional)

For **low-risk** updates only (patch/minor dev dependencies):

1. **Create GitHub Action** `.github/workflows/dependabot-auto-merge.yml`:

```yaml
name: Dependabot Auto-Merge
on: pull_request

permissions:
  contents: write
  pull-requests: write

jobs:
  dependabot:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - name: Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v2
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"

      - name: Auto-merge dev dependencies (patch/minor)
        if: |
          steps.metadata.outputs.dependency-type == 'direct:development' && 
          steps.metadata.outputs.update-type != 'version-update:semver-major'
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{github.event.pull_request.html_url}}
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
```

2. **Risks**:
   - Even minor updates can break builds
   - Test coverage may not catch all issues
   - Recommendation: Start without auto-merge, enable after 1 month

**Decision**: [ ] Enable auto-merge / [x] Manual merge (recommended initially)

## Post-Activation Monitoring

### Week 1: Initial Monitoring

- [ ] **Day 1-2**: Check if PRs are created
- [ ] **Day 3**: Review grouping (too many/too few PRs?)
- [ ] **Day 4**: Verify labels and commit messages
- [ ] **Day 5**: Review CI performance on Dependabot PRs
- [ ] **Day 6-7**: Merge first batch of PRs and monitor production

**Expected**: 10-30 PRs in first week (backlog of outdated dependencies)

### Week 2-4: Fine-Tuning

- [ ] Adjust grouping rules if too many PRs
- [ ] Change schedules if needed (weekly → monthly)
- [ ] Update protected packages list based on merge experience
- [ ] Document any manual steps needed for specific updates

### Month 2+: Steady State

- [ ] Review security PRs within 24 hours
- [ ] Merge weekly update batches on Fridays
- [ ] Update Foundry submodules monthly (1st of month)
- [ ] Quarterly review of configuration

## Rollback Plan

If Dependabot causes issues:

### Temporary Disable

1. **Pause All Updates**:
   - Edit `.github/dependabot.yml`
   - Change all `open-pull-requests-limit` to `0`
   - Commit and push

2. **Disable Specific Package**:
   ```yaml
   ignore:
     - dependency-name: "problematic-package"
   ```

### Full Disable

1. **Remove Configuration**:

   ```bash
   git mv .github/dependabot.yml .github/dependabot.yml.disabled
   git commit -m "chore: temporarily disable dependabot"
   ```

2. **In GitHub Settings**:
   - Settings → Code security → Dependabot version updates
   - Will show as "Not configured"

### Re-enable

1. **Restore Configuration**:

   ```bash
   git mv .github/dependabot.yml.disabled .github/dependabot.yml
   git commit -m "chore: re-enable dependabot"
   ```

2. **Or Update Limits**: Change `open-pull-requests-limit` back to original values

## Success Metrics

Track these to measure Dependabot effectiveness:

### Security Metrics

- [ ] Time to merge security updates (target: <24 hours)
- [ ] Number of security vulnerabilities detected
- [ ] Percentage of security alerts addressed

### Efficiency Metrics

- [ ] Number of outdated dependencies (trending down)
- [ ] Time spent manually updating dependencies (trending down)
- [ ] Number of dependency-related production issues (should be low)

### Process Metrics

- [ ] Average PR review time (target: <3 days)
- [ ] CI success rate on Dependabot PRs (target: >95%)
- [ ] Number of stale/closed PRs (should be low)

## Team Training

Before activating, ensure team knows:

- [ ] **How to review Dependabot PRs**
  - Read `.github/DEPENDABOT_QUICKSTART.md`
  - Understand priority (security > critical > normal)
  - Know how to check changelogs

- [ ] **How to handle security alerts**
  - Review immediately (same day)
  - Check security advisory
  - Test before merging if breaking changes

- [ ] **How to merge updates**
  - Verify CI passed
  - Review changelog
  - Merge after tests pass
  - Monitor production

- [ ] **How to update Foundry manually**
  - `cd packages/contracts && forge update`
  - Run `forge test`
  - Commit submodule changes

## Common Issues & Solutions

### Issue: Too Many PRs

**Solution 1**: Increase grouping

```yaml
# Group ALL dev dependencies together
dev-dependencies:
  patterns: ["*"]
  dependency-type: "development"
  update-types: ["minor", "patch"]
```

**Solution 2**: Change schedule

```yaml
# Weekly → Monthly for non-critical packages
schedule:
  interval: "monthly"
```

### Issue: PRs Not Created

**Check**:

1. Dependabot enabled in Settings?
2. Correct schedule (weekly runs once per week)?
3. Dependencies already up-to-date?
4. Check Actions tab for errors

### Issue: Merge Conflicts

**Solution**:

1. Close PR (Dependabot recreates automatically)
2. Or manually rebase:
   ```bash
   gh pr checkout <PR-NUMBER>
   git rebase main
   git push --force
   ```

### Issue: CI Fails on Dependabot PRs

**Investigate**:

1. Is it a real breaking change?
2. Is CI configuration correct?
3. Does CI work for regular PRs?
4. Check logs in Actions tab

**Solution**:

- Fix CI configuration
- Or close PR and add to ignore list:
  ```yaml
  ignore:
    - dependency-name: "problematic-package"
  ```

## Final Verification

Before marking as complete:

- [ ] Dependabot enabled in repository settings
- [ ] Security alerts enabled
- [ ] Team trained on process
- [ ] Documentation available (guides created)
- [ ] Branch protection configured
- [ ] Notification preferences set
- [ ] First PRs reviewed successfully
- [ ] No critical issues found

## Completion

- **Activated By**: **\*\***\_\_\_\_**\*\***
- **Date**: **\*\***\_\_\_\_**\*\***
- **First PRs Expected**: Next scheduled run (see schedule)
- **Team Notified**: [ ] Yes / [ ] No
- **Monitoring Plan**: [ ] Daily Week 1 / [ ] Weekly thereafter

## Resources

- **Configuration**: `.github/dependabot.yml`
- **Full Guide**: `.github/DEPENDABOT_GUIDE.md`
- **Quick Reference**: `.github/DEPENDABOT_QUICKSTART.md`
- **Official Docs**: https://docs.github.com/en/code-security/dependabot

---

**Status**: Ready for activation!

**Next Step**: Go to repository Settings → Code security and analysis → Enable Dependabot
