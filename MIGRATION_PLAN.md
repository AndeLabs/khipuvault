# KhipuVault Environment Migration Plan

> Migrating from branch-based to environment-variable-based deployment strategy

## Status: COMPLETED

Migration completed on 2025-02-09.

## Executive Summary

**Previous State:** Using separate Git branches (`main`, `testnet`) to manage environments
**Current State:** Single branch (`main`) with two Vercel projects for different environments

**Why Migrate?**

- Eliminates merge conflicts and branch drift
- Industry standard practice (see sources below)
- Easier CI/CD and feature rollout
- Your code is already architected for this approach

---

## Architecture Comparison

### Before (Branch-Based) - NOT RECOMMENDED

```
┌─────────────────────────────────────────────────────────────┐
│                    Git Repository                            │
│                                                              │
│   main branch ────●────●────●────●───── (mainnet)           │
│                          \                                   │
│   testnet branch ─────────●────●────●── (testnet)           │
│                              ↑                               │
│                    Branches diverge over time               │
│                    Manual sync required                      │
│                    Merge conflicts                           │
└─────────────────────────────────────────────────────────────┘
```

**Problems:**

- Branches diverge, causing merge conflicts
- Features can be out of sync
- Harder to track what's deployed where
- Not industry standard

### After (Environment-Based) - RECOMMENDED

```
┌─────────────────────────────────────────────────────────────┐
│                    Git Repository                            │
│                                                              │
│   main ────●────●────●────●────●────●────●────●────         │
│            │    │    │    │    │    │    │    │              │
│            └────┴────┴────┴────┴────┴────┴────┴────────►    │
│                     Single source of truth                   │
│                                                              │
│   feature/* ──●──●──┐                                       │
│                     │ PR + merge                             │
│                     ▼                                        │
│   main ────●────●────●                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Vercel                               │
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │ Production          │    │ Custom Environment  │        │
│  │ Branch: main        │    │ Branch: main        │        │
│  │                     │    │                     │        │
│  │ Domain:             │    │ Domain:             │        │
│  │ khipuvault.com      │    │ testnet.khipuvault  │        │
│  │                     │    │                     │        │
│  │ NEXT_PUBLIC_NETWORK │    │ NEXT_PUBLIC_NETWORK │        │
│  │ = mainnet           │    │ = testnet           │        │
│  │                     │    │                     │        │
│  │ Shows: Coming Soon  │    │ Shows: Full App     │        │
│  └─────────────────────┘    └─────────────────────┘        │
│                                                              │
│  ┌─────────────────────┐                                    │
│  │ Docs Project        │                                    │
│  │ Root: apps/docs     │                                    │
│  │ Domain:             │                                    │
│  │ docs.khipuvault.com │                                    │
│  └─────────────────────┘                                    │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**

- Single source of truth
- No merge conflicts
- Feature flags control what's visible
- Industry standard (Vercel, Turborepo recommended)
- Atomic deployments across environments

---

## Your Code is Already Ready

Your codebase already supports this architecture:

### 1. Network Configuration (`@khipu/shared`)

```typescript
// packages/shared/src/config/network.ts
function getCurrentNetwork(): Network {
  const envNetwork = process.env.NEXT_PUBLIC_NETWORK;
  if (envNetwork === "mainnet") return "mainnet";
  return "testnet"; // Safe default
}
```

### 2. Feature Flags (`@khipu/shared`)

```typescript
// packages/shared/src/config/feature-flags.ts
const FEATURE_FLAGS: Record<Network, FeatureFlags> = {
  testnet: {
    showIndividualSavings: true,
    showCommunityPools: true,
    showRotatingPool: true,
    showPrizePool: true,
    showTestnetBanner: true,
    enableDebugTools: true,
    // ... all features enabled for testing
  },
  mainnet: {
    showIndividualSavings: true,
    showCommunityPools: false, // Disabled until v1.1
    showRotatingPool: false, // Disabled until v1.2
    showPrizePool: false, // Disabled until v1.3
    showTestnetBanner: false,
    enableDebugTools: false,
    // ... gradual rollout
  },
};
```

### 3. Network Gate (`apps/web`)

```typescript
// apps/web/src/components/network-gate.tsx
export function NetworkGate({ children }) {
  const network = getCurrentNetwork();

  if (network === "mainnet") {
    return <ComingSoon />;  // Already showing Coming Soon on mainnet!
  }

  return <>{children}</>;
}
```

### 4. Dynamic Contract Addresses (`@khipu/web3`)

```typescript
// packages/web3/src/addresses/index.ts
export function getActiveContractAddress(contractName) {
  const network = getCurrentNetwork();
  const addresses = network === "mainnet" ? mainnetAddresses : testnetAddresses;
  return addresses[contractName];
}
```

**Conclusion:** Zero code changes needed. Only Vercel configuration.

---

## Migration Steps

### Phase 1: Vercel Configuration (30 minutes)

#### Step 1.1: Create Custom Environment for Testnet

1. Go to Vercel Dashboard → Project "khipuvault"
2. Settings → Environments
3. Click "Add Environment"
4. Configure:
   - Name: `Testnet`
   - Branch: `main` (same as production!)
   - Domain: `testnet.khipuvault.com`

#### Step 1.2: Configure Environment Variables

**Production Environment (khipuvault.com):**

```env
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_APP_URL=https://khipuvault.com
NEXT_PUBLIC_API_URL=https://api.khipuvault.com
NEXT_PUBLIC_CHAIN_ID=31612
```

**Testnet Environment (testnet.khipuvault.com):**

```env
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_APP_URL=https://testnet.khipuvault.com
NEXT_PUBLIC_API_URL=https://api-testnet.khipuvault.com
NEXT_PUBLIC_CHAIN_ID=31611
```

#### Step 1.3: Configure Domains

Go to Settings → Domains:

| Domain                   | Environment                 | Branch |
| ------------------------ | --------------------------- | ------ |
| `khipuvault.com`         | Production                  | `main` |
| `www.khipuvault.com`     | Redirect → `khipuvault.com` | -      |
| `testnet.khipuvault.com` | Testnet                     | `main` |

### Phase 2: Git Cleanup (15 minutes)

#### Step 2.1: Ensure main is up to date

```bash
# Make sure you have all changes from testnet
git checkout main
git merge testnet

# Push to trigger both deployments
git push origin main
```

#### Step 2.2: Archive testnet branch (optional)

```bash
# Create archive tag
git tag archive/testnet-branch testnet

# Delete remote branch (after verifying Vercel works)
git push origin --delete testnet

# Delete local branch
git branch -d testnet
```

### Phase 3: Verification (15 minutes)

#### Step 3.1: Verify Deployments

After push to main, Vercel should create TWO deployments:

1. **Production** → khipuvault.com
   - Shows "Coming Soon" page
   - Network: mainnet

2. **Testnet** → testnet.khipuvault.com
   - Shows full app
   - Network: testnet
   - Testnet banner visible

#### Step 3.2: Verification Checklist

- [ ] khipuvault.com shows Coming Soon page
- [ ] testnet.khipuvault.com shows full app
- [ ] Testnet banner appears on testnet
- [ ] Wallet connects to correct chain (31611 on testnet, 31612 on mainnet)
- [ ] Contract interactions work on testnet
- [ ] Feature flags respected per environment

### Phase 4: Docs Project (if separate)

If docs is a separate Vercel project:

1. Keep it pointing to `main` branch
2. Root Directory: `apps/docs`
3. Domain: `docs.khipuvault.com`

---

## Vercel Project Configuration

### Single Project Setup (Recommended)

**Project: khipuvault**

- Root Directory: `apps/web`
- Framework: Next.js
- Build Command: `pnpm build`
- Install Command: `pnpm install`
- Node.js Version: 20.x

**Environments:**

| Environment | Type       | Branch | Domain                 | NEXT_PUBLIC_NETWORK |
| ----------- | ---------- | ------ | ---------------------- | ------------------- |
| Production  | Production | main   | khipuvault.com         | mainnet             |
| Testnet     | Custom     | main   | testnet.khipuvault.com | testnet             |
| Preview     | Preview    | \*     | auto-generated         | testnet             |

### Alternative: Multiple Projects

If you prefer separate projects:

| Project            | Root      | Branch | Domain                 |
| ------------------ | --------- | ------ | ---------------------- |
| khipuvault-web     | apps/web  | main   | khipuvault.com         |
| khipuvault-testnet | apps/web  | main   | testnet.khipuvault.com |
| khipuvault-docs    | apps/docs | main   | docs.khipuvault.com    |

Note: This requires more maintenance but provides isolation.

---

## Feature Rollout Strategy

With this setup, launching features to mainnet is simple:

### Example: Launch Community Pools to Mainnet

1. **Update feature flag:**

```typescript
// packages/shared/src/config/feature-flags.ts
mainnet: {
  showCommunityPools: true,  // Changed from false
}
```

2. **Commit and push:**

```bash
git add packages/shared/src/config/feature-flags.ts
git commit -m "feat: enable community pools on mainnet"
git push origin main
```

3. **Vercel auto-deploys both environments**
   - testnet.khipuvault.com → No change (already enabled)
   - khipuvault.com → Now shows Community Pools

### Gradual Rollout Pattern

```typescript
// Week 1: Enable for 10% of mainnet users
mainnet: {
  showCommunityPools: Math.random() < 0.1,
}

// Week 2: Enable for 50%
mainnet: {
  showCommunityPools: Math.random() < 0.5,
}

// Week 3: Full rollout
mainnet: {
  showCommunityPools: true,
}
```

---

## CI/CD Pipeline Enhancement

### Recommended GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

      # Security checks
      - run: pnpm security:semgrep
      - run: pnpm security:audit

  # Vercel handles actual deployment via Git integration
```

### Branch Protection Rules

```yaml
# For main branch
Branch protection for "main":
  - Require pull request reviews: 1 approver
  - Require status checks: test job must pass
  - Require conversation resolution
  - No force pushes
```

---

## Monitoring & Observability

### Recommended Setup

1. **Vercel Analytics** (Built-in)
   - Enable in Project Settings → Analytics

2. **Error Tracking**
   - Sentry is already configured (`@sentry/nextjs`)
   - Set different DSN per environment

3. **Uptime Monitoring**
   - Use Vercel's built-in monitoring or
   - External: UptimeRobot, Better Uptime

### Environment-Specific Sentry

```typescript
// apps/web/sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_NETWORK, // "testnet" or "mainnet"
  tracesSampleRate: process.env.NEXT_PUBLIC_NETWORK === "mainnet" ? 0.1 : 1.0,
});
```

---

## Rollback Strategy

### If something goes wrong:

1. **Quick rollback via Vercel:**
   - Go to Deployments tab
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **Git revert:**

   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Emergency: Maintenance mode:**
   ```typescript
   // Update feature flag
   mainnet: {
     maintenanceMode: true,  // Shows maintenance page
   }
   ```

---

## Security Considerations

### Environment Variable Security

- [ ] Never commit `.env` files
- [ ] Use Vercel's secret storage for sensitive values
- [ ] Different API keys per environment
- [ ] Rotate secrets regularly

### Pre-Mainnet Checklist

- [ ] All contracts audited
- [ ] Security scanning passes (`pnpm security:semgrep`)
- [ ] No console.logs in production code
- [ ] Rate limiting enabled on API
- [ ] CORS properly configured
- [ ] CSP headers set

---

## Timeline

| Phase     | Task                 | Duration       |
| --------- | -------------------- | -------------- |
| 1         | Vercel configuration | 30 min         |
| 2         | Git cleanup          | 15 min         |
| 3         | Verification         | 15 min         |
| 4         | Documentation update | 15 min         |
| **Total** |                      | **~1.5 hours** |

---

## Sources & References

- [Vercel Monorepos Documentation](https://vercel.com/docs/monorepos)
- [Vercel Environments](https://vercel.com/docs/deployments/environments)
- [Setting Up Staging on Vercel](https://vercel.com/kb/guide/set-up-a-staging-environment-on-vercel)
- [Turborepo Environment Variables](https://turborepo.dev/docs/crafting-your-repository/using-environment-variables)
- [Monorepo Architecture Guide 2025](https://feature-sliced.design/blog/frontend-monorepo-explained)
- [Production Monorepo with Turborepo](https://mavro.dev/blog/building-production-monorepo-turborepo)
- [Multi-Environment Vercel Deployments](https://robearlam.com/blog/multi-environment-deployments-to-vercel)

---

## Next Steps

1. **Review this plan** - Any questions or concerns?
2. **Backup current state** - Tag current branches before migration
3. **Execute Phase 1** - Configure Vercel environments
4. **Execute Phase 2** - Merge and clean up branches
5. **Verify everything works**
6. **Delete testnet branch** (optional, after verification)

---

**Questions?** This migration is low-risk because:

- Your code already supports environment-based configuration
- Branches are nearly identical (just merge commits)
- Easy rollback via Vercel's deployment history
