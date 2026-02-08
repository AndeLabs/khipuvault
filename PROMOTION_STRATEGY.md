# Testnet → Mainnet Promotion Strategy

> Professional, modular, and scalable deployment strategy for KhipuVault

## 🎯 Strategy Overview

We use **Trunk-Based GitOps** with **Feature Flags** for rapid, safe promotions from testnet to mainnet.

```
┌─────────────────────────────────────────────────────────────┐
│  SINGLE MAIN BRANCH (trunk-based development)               │
│                                                               │
│  ├── environments/                                           │
│  │   ├── testnet/      → testnet.khipuvault.com             │
│  │   └── mainnet/      → khipuvault.com                     │
│  │                                                           │
│  ├── packages/contracts/                                     │
│  │   ├── deployments/                                       │
│  │   │   ├── testnet.json                                   │
│  │   │   └── mainnet.json                                   │
│  │                                                           │
│  └── apps/web/                                              │
│      └── features/      → Controlled by feature flags       │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ Architecture Principles

Based on industry best practices:

1. **✅ Trunk-Based Development** - Single main branch, not environment branches
2. **✅ Environment Directories** - Config stored in `/environments/{network}/`
3. **✅ Feature Flags** - Toggle features without code changes
4. **✅ Automated CI/CD** - GitHub Actions for testing and deployment
5. **✅ GitOps** - Infrastructure as Code, declarative deployments
6. **✅ Immutable Deployments** - Never modify deployed contracts

## 📁 Directory Structure

```
KhipuVault/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Continuous Integration
│       ├── deploy-testnet.yml        # Auto-deploy to testnet
│       └── deploy-mainnet.yml        # Manual deploy to mainnet
│
├── environments/
│   ├── testnet/
│   │   ├── config.json               # Testnet configuration
│   │   ├── contracts.json            # Contract addresses
│   │   └── .env.testnet              # Environment variables
│   │
│   └── mainnet/
│       ├── config.json               # Mainnet configuration
│       ├── contracts.json            # Contract addresses
│       └── .env.mainnet              # Environment variables
│
├── packages/
│   ├── contracts/
│   │   ├── deployments/
│   │   │   ├── testnet/
│   │   │   │   ├── IndividualPoolV3.json
│   │   │   │   └── ...
│   │   │   └── mainnet/
│   │   │       ├── IndividualPoolV3.json
│   │   │       └── ...
│   │   └── scripts/
│   │       ├── deploy-testnet.sh
│   │       └── deploy-mainnet.sh
│   │
│   └── web3/
│       └── src/
│           ├── addresses/
│           │   ├── testnet.ts
│           │   └── mainnet.ts
│           └── config/
│               └── feature-flags.ts   # Feature flag config
│
└── apps/
    └── web/
        └── src/
            ├── config/
            │   └── features.ts        # Feature definitions
            └── lib/
                └── feature-flags.ts   # Feature flag client
```

## 🚩 Feature Flags System

### 1. Create Feature Flag Configuration

```typescript
// packages/shared/src/config/feature-flags.ts

export interface FeatureFlags {
  // UI Features
  showReferralSystem: boolean;
  showPrizePool: boolean;
  showRotatingPool: boolean;
  showCommunityPools: boolean;

  // Advanced Features
  enableAutoCompound: boolean;
  enableYieldClaiming: boolean;
  enablePartialWithdrawals: boolean;

  // Experimental
  enableAnalytics: boolean;
  enableNotifications: boolean;

  // Maintenance
  maintenanceMode: boolean;
}

export const FEATURE_FLAGS: Record<string, FeatureFlags> = {
  // Development - all features enabled
  development: {
    showReferralSystem: true,
    showPrizePool: true,
    showRotatingPool: true,
    showCommunityPools: true,
    enableAutoCompound: true,
    enableYieldClaiming: true,
    enablePartialWithdrawals: true,
    enableAnalytics: true,
    enableNotifications: true,
    maintenanceMode: false,
  },

  // Testnet - test new features safely
  testnet: {
    showReferralSystem: false, // Disabled as per user request
    showPrizePool: true,
    showRotatingPool: true,
    showCommunityPools: true,
    enableAutoCompound: true,
    enableYieldClaiming: true,
    enablePartialWithdrawals: true,
    enableAnalytics: true,
    enableNotifications: false, // Not ready yet
    maintenanceMode: false,
  },

  // Mainnet - only stable, audited features
  mainnet: {
    showReferralSystem: false,
    showPrizePool: false,        // Launch later
    showRotatingPool: false,     // Launch later
    showCommunityPools: false,   // Launch later
    enableAutoCompound: true,    // Core feature
    enableYieldClaiming: true,   // Core feature
    enablePartialWithdrawals: true, // Core feature
    enableAnalytics: true,
    enableNotifications: false,
    maintenanceMode: false,
  },
};

export function getFeatureFlags(network?: string): FeatureFlags {
  const env = network || getCurrentNetwork();
  return FEATURE_FLAGS[env] || FEATURE_FLAGS.testnet;
}

export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature] ?? false;
}
```

### 2. Use Feature Flags in Components

```typescript
// apps/web/src/app/dashboard/page.tsx
import { isFeatureEnabled } from "@khipu/shared";

export default function DashboardPage() {
  return (
    <div>
      {/* Always visible */}
      <IndividualSavingsCard />

      {/* Controlled by feature flag */}
      {isFeatureEnabled("showCommunityPools") && <CommunityPoolsCard />}
      {isFeatureEnabled("showRotatingPool") && <RotatingPoolCard />}
      {isFeatureEnabled("showPrizePool") && <PrizePoolCard />}
    </div>
  );
}
```

## 🔄 Promotion Workflow

### Option 1: Directory-Based (Recommended)

**Advantages:**
- ✅ Single source of truth (main branch)
- ✅ Easy to compare testnet vs mainnet config
- ✅ No merge conflicts
- ✅ Fast deployments

**How it works:**

```bash
# 1. Develop feature on main branch
git checkout main
git pull origin main

# 2. Make changes, add feature flag
# Edit code + update environments/testnet/config.json

# 3. Deploy to testnet automatically
git add .
git commit -m "feat: add new feature (testnet only)"
git push origin main
# → GitHub Action deploys to testnet.khipuvault.com

# 4. Test on testnet
# QA team tests on testnet.khipuvault.com

# 5. When ready, enable for mainnet
# Edit environments/mainnet/config.json
# Update feature flags for mainnet

# 6. Deploy to mainnet (manual approval required)
git add environments/mainnet/
git commit -m "feat: promote feature to mainnet"
git push origin main
# → Manual approval in GitHub
# → GitHub Action deploys to khipuvault.com
```

### Option 2: Short-Lived Feature Branches (Alternative)

For larger features that need isolation:

```bash
# 1. Create feature branch
git checkout -b feature/prize-pool
git push -u origin feature/prize-pool

# 2. Develop feature
# Work on feature, commit regularly

# 3. Open PR to main
gh pr create --title "feat: add prize pool" --base main

# 4. After review, merge to main
# → Auto-deploys to testnet for testing

# 5. Test on testnet
# QA approval needed

# 6. Update mainnet config
# Update environments/mainnet/config.json
# Set showPrizePool: true

# 7. Deploy to mainnet
# Manual approval → Production deployment
```

## 🤖 GitHub Actions Workflows

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: Continuous Integration

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
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm build

      - name: Security scan
        run: pnpm security:semgrep

  contracts-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: foundry-rs/foundry-toolchain@v1

      - name: Run Forge tests
        run: cd packages/contracts && forge test --gas-report

      - name: Check contract sizes
        run: cd packages/contracts && forge build --sizes
```

### Testnet Auto-Deploy

```yaml
# .github/workflows/deploy-testnet.yml
name: Deploy to Testnet

on:
  push:
    branches: [main]
    paths:
      - 'apps/web/**'
      - 'packages/**'
      - 'environments/testnet/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: testnet

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel (Testnet)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod --env NEXT_PUBLIC_NETWORK=testnet'
          alias-domains: testnet.khipuvault.com
```

### Mainnet Manual Deploy

```yaml
# .github/workflows/deploy-mainnet.yml
name: Deploy to Mainnet

on:
  workflow_dispatch:  # Manual trigger only
    inputs:
      version:
        description: 'Version to deploy (e.g., v1.2.0)'
        required: true
      confirm:
        description: 'Type "DEPLOY" to confirm'
        required: true

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Validate confirmation
        if: github.event.inputs.confirm != 'DEPLOY'
        run: |
          echo "❌ Deployment cancelled - confirmation required"
          exit 1

      - name: Check security audit
        run: |
          # Verify security audit file exists
          if [ ! -f "audits/audit-${{ github.event.inputs.version }}.pdf" ]; then
            echo "❌ Security audit not found"
            exit 1
          fi

  deploy:
    needs: validate
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel (Mainnet)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod --env NEXT_PUBLIC_NETWORK=mainnet'
          alias-domains: khipuvault.com

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.event.inputs.version }}
          release_name: Release ${{ github.event.inputs.version }}
          body: |
            ## What's Changed
            Deployed to mainnet: https://khipuvault.com

            ## Contracts
            See contracts/deployments/mainnet/
```

## 📊 Environment Configuration Management

### Environment Config Files

```json
// environments/testnet/config.json
{
  "network": "testnet",
  "chainId": 31611,
  "rpcUrl": "https://rpc.test.mezo.org",
  "blockExplorer": "https://explorer.test.mezo.org",
  "features": {
    "showReferralSystem": false,
    "showPrizePool": true,
    "showRotatingPool": true,
    "showCommunityPools": true,
    "enableAutoCompound": true,
    "enableYieldClaiming": true,
    "enablePartialWithdrawals": true,
    "enableAnalytics": true,
    "enableNotifications": false,
    "maintenanceMode": false
  },
  "contracts": {
    "individualPoolV3": "0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393",
    "cooperativePool": "0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88",
    "yieldAggregator": "0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6",
    "mezoIntegration": "0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6",
    "musd": "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503"
  },
  "api": {
    "url": "https://api-testnet.khipuvault.com",
    "timeout": 30000
  }
}
```

```json
// environments/mainnet/config.json
{
  "network": "mainnet",
  "chainId": 60808,
  "rpcUrl": "https://rpc.mezo.org",
  "blockExplorer": "https://explorer.mezo.org",
  "features": {
    "showReferralSystem": false,
    "showPrizePool": false,
    "showRotatingPool": false,
    "showCommunityPools": false,
    "enableAutoCompound": true,
    "enableYieldClaiming": true,
    "enablePartialWithdrawals": true,
    "enableAnalytics": true,
    "enableNotifications": false,
    "maintenanceMode": false
  },
  "contracts": {
    "individualPoolV3": "0x...",
    "cooperativePool": "0x...",
    "yieldAggregator": "0x...",
    "mezoIntegration": "0x...",
    "musd": "0x..."
  },
  "api": {
    "url": "https://api.khipuvault.com",
    "timeout": 30000
  }
}
```

## 🗄️ Database Migration Strategy

### Separate Databases

```
Development → PostgreSQL (Docker)
Testnet     → Supabase Testnet DB
Mainnet     → Supabase Production DB
```

### Migration Workflow

```bash
# 1. Develop migration locally
pnpm db:migration create add_new_feature

# 2. Test migration on testnet DB
DATABASE_URL=$TESTNET_DB_URL pnpm db:migrate

# 3. Verify data integrity
pnpm db:test

# 4. When ready, run on mainnet DB (with backup)
# Manual step with approval
DATABASE_URL=$MAINNET_DB_URL pnpm db:migrate
```

## 🚀 Promotion Checklist

### Before Testnet Deployment

- [ ] All tests passing (unit + integration)
- [ ] TypeScript type check passes
- [ ] Linting passes
- [ ] Security scan passes (Semgrep)
- [ ] Feature flag configured for testnet
- [ ] Contract deployed to testnet (if needed)
- [ ] Database migration tested locally

### Before Mainnet Promotion

- [ ] **Feature tested on testnet for 7+ days**
- [ ] **Security audit completed and approved**
- [ ] All tests passing (100% critical path coverage)
- [ ] Performance testing completed
- [ ] Load testing completed
- [ ] Smart contracts audited (if new)
- [ ] Smart contracts deployed to mainnet
- [ ] Database migration tested on testnet
- [ ] Rollback plan documented
- [ ] Monitoring dashboards configured
- [ ] Team notified of deployment
- [ ] User documentation updated
- [ ] Feature flag enabled for mainnet

## 🔄 Rapid Promotion Process

### Scenario 1: Small UI Update (No Contracts)

```bash
# Time: ~10 minutes

# 1. Make change
vim apps/web/src/components/button.tsx

# 2. Test locally
pnpm dev

# 3. Commit & push
git add .
git commit -m "fix: update button styles"
git push origin main
# → Auto-deploys to testnet

# 4. Verify on testnet
open https://testnet.khipuvault.com

# 5. Promote to mainnet (if urgent)
gh workflow run deploy-mainnet.yml \
  -f version=v1.2.1 \
  -f confirm=DEPLOY
```

### Scenario 2: New Feature (With Feature Flag)

```bash
# Time: ~30 minutes

# 1. Develop feature
# Feature is controlled by flag, already in code

# 2. Enable for testnet
vim environments/testnet/config.json
# Set "showNewFeature": true

# 3. Commit & deploy
git add .
git commit -m "feat: enable new feature on testnet"
git push origin main
# → Auto-deploys to testnet

# 4. Test on testnet for 7 days
# QA team validates

# 5. When ready, enable for mainnet
vim environments/mainnet/config.json
# Set "showNewFeature": true

# 6. Deploy to mainnet
git add environments/mainnet/
git commit -m "feat: enable new feature on mainnet"
git push origin main

gh workflow run deploy-mainnet.yml \
  -f version=v1.3.0 \
  -f confirm=DEPLOY
```

### Scenario 3: Contract Update (High Risk)

```bash
# Time: ~2-4 weeks (includes audit)

# 1. Develop & test contract locally
cd packages/contracts
forge test

# 2. Deploy to testnet
make deploy-testnet
# Update environments/testnet/contracts.json

# 3. Test on testnet for 2+ weeks
# Monitor all transactions

# 4. Get security audit
# Send to audit firm
# Wait for approval

# 5. Deploy to mainnet
make deploy-mainnet
# Update environments/mainnet/contracts.json

# 6. Update frontend config
git add environments/mainnet/
git commit -m "feat: update contract addresses for mainnet"
git push origin main

# 7. Deploy frontend
gh workflow run deploy-mainnet.yml \
  -f version=v2.0.0 \
  -f confirm=DEPLOY
```

## 📈 Monitoring & Rollback

### Monitoring Setup

```typescript
// apps/web/src/lib/monitoring.ts
import * as Sentry from "@sentry/nextjs";

export function initMonitoring() {
  const network = getCurrentNetwork();

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: network,
    tracesSampleRate: network === "mainnet" ? 1.0 : 0.1,

    beforeSend(event) {
      // Add network context
      event.contexts = {
        ...event.contexts,
        network: {
          type: network,
          chainId: getChainId(),
        },
      };
      return event;
    },
  });
}
```

### Rollback Process

```bash
# Option 1: Disable feature flag (instant)
vim environments/mainnet/config.json
# Set "problematicFeature": false
git add . && git commit -m "fix: disable feature" && git push

# Option 2: Revert commit
git revert <commit-hash>
git push origin main

# Option 3: Vercel rollback (instant)
vercel rollback --prod

# Option 4: Emergency maintenance mode
vim environments/mainnet/config.json
# Set "maintenanceMode": true
git add . && git commit -m "chore: enable maintenance mode" && git push
```

## 🎯 Best Practices Summary

1. **✅ Single Main Branch** - No environment branches
2. **✅ Feature Flags** - Control features without deployments
3. **✅ Automated Testnet** - Every push to main → testnet
4. **✅ Manual Mainnet** - Requires approval and confirmation
5. **✅ Immutable Contracts** - Never modify deployed contracts
6. **✅ Separate Databases** - Testnet and mainnet data isolated
7. **✅ Fast Rollbacks** - Feature flags or Vercel rollback
8. **✅ Comprehensive Testing** - Unit, integration, E2E before mainnet
9. **✅ Security First** - Audits required for all contract changes
10. **✅ Monitoring** - Sentry, Vercel Analytics, blockchain events

## 📚 Resources

Based on industry best practices from:

- [Trunk-Based GitOps](https://www.liatrio.com/resources/blog/trunk-based-gitops)
- [Git Workflows for GitOps](https://developers.redhat.com/articles/2022/07/20/git-workflows-best-practices-gitops-deployments)
- [Stop Using Branches for Environments](https://codefresh.io/blog/stop-using-branches-deploying-different-gitops-environments/)
- [Blockchain DevOps Best Practices](https://www.hackquest.io/articles/blockchain-devops-best-practices-building-robust-web3-deployment-pipelines)
- [Web3 Multichain CD](https://blog.tenderly.co/how-to-set-up-continuous-deployment-for-smart-contracts/)
- [Testnet vs Mainnet](https://shardeum.org/blog/testnet-vs-mainnet/)

---

**Next Step:** Implement feature flags system and update GitHub Actions workflows.
