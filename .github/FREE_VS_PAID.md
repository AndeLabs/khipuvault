# Free vs Paid CI/CD Services

> Complete breakdown of what's FREE and what requires tokens

## 100% Free Services (No Setup Required)

These work immediately after pushing code - **no tokens, no configuration**.

### Code Quality (GitHub Actions)

| Service        | What It Does                  | Cost | Setup       |
| -------------- | ----------------------------- | ---- | ----------- |
| **ESLint**     | JavaScript/TypeScript linting | Free | ✅ Built-in |
| **Prettier**   | Code formatting check         | Free | ✅ Built-in |
| **TypeScript** | Type checking                 | Free | ✅ Built-in |
| **Vitest**     | Unit testing                  | Free | ✅ Built-in |

### Security Scanning (100% Free)

| Service               | What It Scans              | Database Size   | Cost | Token Required |
| --------------------- | -------------------------- | --------------- | ---- | -------------- |
| **Semgrep**           | SAST code patterns         | 2000+ rules     | Free | ❌ No          |
| **CodeQL**            | Advanced code analysis     | GitHub's DB     | Free | ❌ No          |
| **Gitleaks**          | Git history for secrets    | 500+ patterns   | Free | ❌ No          |
| **npm audit**         | Dependency vulnerabilities | npm advisory DB | Free | ❌ No          |
| **OpenSSF Scorecard** | Security best practices    | Multiple checks | Free | ❌ No          |

### Coverage Reporting (Built-in)

| Feature                   | Free Version        | Paid Alternative  | Cost         |
| ------------------------- | ------------------- | ----------------- | ------------ |
| **Coverage summary**      | GitHub step summary | Codecov dashboard | $0 vs $10/mo |
| **Per-package breakdown** | ✅ Yes              | ✅ Yes            | Free         |
| **Threshold warnings**    | ✅ Yes              | ✅ Yes            | Free         |
| **Artifact storage**      | ✅ Yes (7 days)     | ✅ Yes (30 days)  | Free         |
| **Historical trends**     | ❌ No               | ✅ Yes            | -            |
| **PR coverage diff**      | ❌ No               | ✅ Yes            | -            |
| **Coverage badges**       | Manual              | Auto-updated      | -            |

### License Compliance (Custom Script)

| Check                  | Implementation | Cost | Token |
| ---------------------- | -------------- | ---- | ----- |
| **Forbidden licenses** | Node.js script | Free | ❌ No |
| **Warning licenses**   | Node.js script | Free | ❌ No |
| **SPDX validation**    | Built-in       | Free | ❌ No |

### Bundle Analysis (Free)

| Feature           | Tool           | Cost | Token                     |
| ----------------- | -------------- | ---- | ------------------------- |
| **Size tracking** | GitHub Actions | Free | ❌ No                     |
| **PR comments**   | GitHub API     | Free | ❌ No (uses GITHUB_TOKEN) |
| **Contract size** | Foundry        | Free | ❌ No                     |
| **Web bundle**    | Next.js        | Free | ❌ No                     |

---

## Optional Paid Services

These provide **enhanced features** but are **not required** for CI to work.

### Codecov (Coverage Tracking)

**What it adds**:

- Historical coverage trends over time
- Pull request coverage comparison
- Coverage sunburst visualization
- Auto-updated coverage badges
- File-level coverage tracking

**Cost**:

- ✅ **Free** for open source
- 💰 **$10/month** for 5 private repos
- 💰 **$29/month** for unlimited private repos

**Setup**:

1. Sign up at [codecov.io](https://codecov.io)
2. Get repository token
3. Add `CODECOV_TOKEN` secret in GitHub
4. Done - next CI run uploads coverage

**Is it worth it?**

- ✅ Yes for open source (free)
- ✅ Yes for teams tracking trends
- ❌ No if you just need basic coverage

**Free alternative**:

- Download coverage artifacts from GitHub Actions
- View in local tools (VS Code extensions)
- Built-in GitHub summary is sufficient for most cases

---

### Snyk (Vulnerability Scanning)

**What it adds**:

- 10-20% more vulnerabilities detected vs npm audit
- Automatic fix pull requests
- License scanning with detailed reports
- Container security scanning
- Infrastructure as Code scanning

**Cost**:

- ✅ **Free** tier: 200 tests/month
- 💰 **$52/month** for teams (unlimited tests)
- 💰 **$195/month** for enterprise

**Setup**:

1. Sign up at [snyk.io](https://snyk.io)
2. Get API token
3. Add `SNYK_TOKEN` secret in GitHub
4. Done - next security scan includes Snyk

**Is it worth it?**

- ✅ Yes for production applications
- ✅ Yes if you need fix PRs
- ❌ No if Semgrep + CodeQL + npm audit is sufficient (usually is)

**Free alternatives**:

- **npm audit** - 80% of Snyk's vuln detection
- **Semgrep** - SAST code analysis
- **CodeQL** - Advanced pattern detection
- **Gitleaks** - Secret scanning
- Combined: ~90% of Snyk's value for $0

---

### Vercel (Deployment)

**What it adds**:

- Automatic preview deployments for PRs
- Global CDN hosting
- Serverless functions
- Analytics and monitoring

**Cost**:

- ✅ **Free** tier: Hobby projects
- 💰 **$20/month** per user for teams
- 💰 **$150/month** for pro features

**Setup**:

1. Sign up at [vercel.com](https://vercel.com)
2. Connect GitHub repository
3. Add `VERCEL_TOKEN` (optional for CLI)
4. Done - auto deploys on push

**Is it worth it?**

- ✅ Yes for Next.js apps (best DX)
- ✅ Yes for preview deployments
- ❌ No if self-hosting is acceptable

**Free alternatives**:

- **GitHub Pages** - Static sites only
- **Netlify** - Similar free tier
- **Railway** - Full-stack hosting
- **Self-host** - Docker + VPS ($5/month)

---

### Sentry (Error Tracking)

**What it adds**:

- Real-time error tracking
- Stack traces with source maps
- User context and breadcrumbs
- Performance monitoring
- Release tracking

**Cost**:

- ✅ **Free** tier: 5K errors/month
- 💰 **$26/month** for 50K errors
- 💰 **Custom** for enterprise

**Setup**:

1. Sign up at [sentry.io](https://sentry.io)
2. Get DSN key
3. Add `SENTRY_DSN` to environment
4. Install Sentry SDK

**Is it worth it?**

- ✅ Yes for production apps
- ✅ Yes for debugging user issues
- ❌ No during development

**Free alternatives**:

- **Pino** - Structured logging (already in project)
- **Console.log** - Basic debugging
- **GitHub Issues** - Manual error reporting

---

## Service Comparison Matrix

### Security Scanning

| Feature          | Semgrep (Free) | CodeQL (Free) | Snyk (Paid)  |
| ---------------- | -------------- | ------------- | ------------ |
| SAST Analysis    | ✅ Excellent   | ✅ Excellent  | ✅ Excellent |
| Dependency Check | ❌ No          | ❌ Limited    | ✅ Yes       |
| License Scanning | ❌ No          | ❌ No         | ✅ Yes       |
| Fix PRs          | ❌ No          | ❌ No         | ✅ Yes       |
| Container Scan   | ❌ No          | ❌ No         | ✅ Yes       |
| IaC Scan         | ❌ No          | ❌ No         | ✅ Yes       |
| Custom Rules     | ✅ Yes         | ✅ Yes        | ✅ Yes       |
| **Cost**         | **Free**       | **Free**      | **$0-52/mo** |

**Recommendation**: Use free tools unless you need fix PRs or container scanning.

---

### Coverage Tracking

| Feature            | Built-in (Free) | Codecov (Paid) |
| ------------------ | --------------- | -------------- |
| Coverage %         | ✅ Yes          | ✅ Yes         |
| Per-file breakdown | ⚠️ Manual       | ✅ Automatic   |
| Historical trends  | ❌ No           | ✅ Yes         |
| PR comparison      | ❌ No           | ✅ Yes         |
| Coverage badge     | ⚠️ Manual       | ✅ Automatic   |
| Sunburst viz       | ❌ No           | ✅ Yes         |
| Reports storage    | 7 days          | 30 days        |
| **Cost**           | **Free**        | **$0-10/mo**   |

**Recommendation**: Start with free, upgrade if you need trends/badges.

---

### Deployment

| Feature             | GitHub Actions (Free) | Vercel (Paid) |
| ------------------- | --------------------- | ------------- |
| Build & Deploy      | ✅ Yes                | ✅ Yes        |
| Preview deployments | ⚠️ Manual             | ✅ Automatic  |
| CDN                 | ❌ No                 | ✅ Yes        |
| Serverless          | ❌ No                 | ✅ Yes        |
| Analytics           | ❌ No                 | ✅ Yes        |
| Custom domains      | ⚠️ Manual             | ✅ Easy       |
| **Cost**            | **Free**              | **$0-20/mo**  |

**Recommendation**: Use Vercel for production, GitHub Actions for testing.

---

## Cost Breakdown by Project Type

### Open Source Project

**Required**: $0/month

- GitHub Actions (unlimited)
- All security scanning (free)
- Built-in coverage
- GitHub Pages hosting

**Optional**: $0/month

- Codecov (free for OSS)
- Snyk (free tier)
- Vercel (hobby tier)

**Total**: **$0/month**

---

### Solo Developer (Private Repo)

**Required**: $0/month

- GitHub Actions (2000 min/month)
- All security scanning
- Built-in coverage

**Optional**: $10-30/month

- Codecov: $10/month
- Snyk: Free tier (200 tests)
- Vercel: Free tier

**Total**: **$0-30/month**

---

### Small Team (3-5 developers)

**Required**: $0/month

- GitHub Actions (includes CI/CD)
- All security scanning
- Built-in coverage

**Recommended**: $72/month

- Codecov Pro: $29/month
- Snyk Team: $52/month (or stick with free tier)
- Vercel Pro: $20/user/month (or $0 with free tier)

**Total**: **$0-72/month** (can stay at $0 with free tiers)

---

### Enterprise Team

**Required**: $0/month

- GitHub Actions (included in Enterprise)
- Security scanning

**Recommended**: Custom pricing

- Codecov Enterprise
- Snyk Enterprise
- Vercel Enterprise
- Sentry Business

**Total**: Contact vendors (typically $500-2000/month)

---

## Migration Paths

### Currently Using Paid Services?

#### From CircleCI/Travis CI

**Before**: $50-100/month
**After**: $0/month
**Savings**: $50-100/month

**Migration**:

1. Copy test commands to GitHub Actions
2. Update environment variables
3. Use GitHub Secrets
4. Done - cancel paid service

---

#### From Coveralls

**Before**: $9-45/month
**After**: $0/month
**Savings**: $9-45/month

**Migration**:

1. Remove Coveralls upload step
2. Keep existing coverage generation
3. Built-in GitHub summary replaces dashboard
4. Done - cancel Coveralls

---

#### From paid Snyk

**Before**: $52-195/month
**After**: $0/month (or stay on free tier)
**Savings**: $52-195/month

**Migration**:

1. Keep Snyk if using free tier (200 tests)
2. Or remove and rely on free tools:
   - npm audit (vulnerabilities)
   - Semgrep (code patterns)
   - CodeQL (advanced analysis)
3. 90% of value at $0 cost

---

## Making the Decision

### Stay Free If:

- ✅ You're building open source
- ✅ You're a solo developer
- ✅ Coverage summaries are sufficient
- ✅ Manual fix PRs are acceptable
- ✅ Built-in tools meet your needs

### Upgrade If:

- 💰 You need historical coverage trends
- 💰 You want automatic fix PRs
- 💰 You need container/IaC scanning
- 💰 You want professional dashboards
- 💰 Your team needs centralized reporting

---

## Frequently Asked Questions

### Q: Is the free tier sufficient for production?

**A**: Yes, absolutely. Many successful open source projects use only free tools:

- Linux Kernel → Uses open source tools
- React → Uses Jest + GitHub Actions
- Vue.js → Uses free CI/CD

### Q: What if I exceed GitHub Actions limits?

**A**:

- **Public repos**: Unlimited minutes (no limit)
- **Private repos**: 2000 min/month, then $0.008/minute
- **Typical usage**: 500-1000 min/month per project

### Q: Can I mix free and paid services?

**A**: Yes! Common pattern:

- Use all free security scanning
- Add Codecov for nice dashboards ($10/month)
- Keep Snyk on free tier (200 tests/month)
- Total: $10/month

### Q: What if a free service shuts down?

**A**: All core functionality uses GitHub's built-in features:

- Semgrep → Can self-host
- CodeQL → GitHub native (won't disappear)
- npm audit → npm official tool
- Built-in coverage → No external dependency

### Q: How do free tools compare in quality?

**A**:

- **Semgrep**: Used by Google, Meta, Netflix
- **CodeQL**: GitHub's own tool, used for security research
- **npm audit**: Official npm security tool
- **Quality**: Enterprise-grade, used by Fortune 500

---

## Recommended Setup

### Tier 1: Completely Free (Start Here)

```yaml
✅ GitHub Actions (CI/CD)
✅ Semgrep (SAST)
✅ CodeQL (Advanced analysis)
✅ Gitleaks (Secret scanning)
✅ npm audit (Vulnerabilities)
✅ Built-in coverage
✅ License checking
✅ Bundle analysis

Total: $0/month
```

### Tier 2: Enhanced (Add When Needed)

```yaml
Tier 1 +
💰 Codecov ($10/month) - Better coverage UI
💰 Snyk free tier (200 tests) - More vulns

Total: $10/month
```

### Tier 3: Professional (Growing Team)

```yaml
Tier 2 +
💰 Snyk Team ($52/month) - Fix PRs
💰 Vercel Pro ($20/month) - Better deployments

Total: $82/month
```

---

## Summary

### What You Get for FREE:

- ✅ Complete CI/CD pipeline
- ✅ 5+ security scanning tools
- ✅ Code quality checks
- ✅ Test coverage reporting
- ✅ License compliance
- ✅ Bundle size tracking
- ✅ Automated deployments (with GitHub Pages)
- ✅ Professional-quality output

### What You Pay For:

- 💰 Nicer dashboards
- 💰 Historical trends
- 💰 Automatic fix PRs
- 💰 Advanced features
- 💰 Dedicated support

### Bottom Line:

**For 95% of projects, the free tier is sufficient.**

Start free, upgrade only when specific features justify the cost.

---

**Questions?** Check [WORKFLOWS.md](WORKFLOWS.md) or [CI_QUICK_START.md](CI_QUICK_START.md).
