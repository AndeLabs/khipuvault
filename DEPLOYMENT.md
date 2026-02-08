# KhipuVault Deployment Guide

> Professional testnet/mainnet deployment strategy with subdomain architecture

## Architecture Overview

```
khipuvault.com              → Mainnet (Production)
testnet.khipuvault.com      → Testnet (Testing & QA)
```

## Deployment Strategy

### Option 1: Branch-Based Deployment (Recommended for Development)

Single Vercel project with branch-specific deployments:

```
Repository Branches:
├── main              → khipuvault.com (mainnet)
└── testnet           → testnet.khipuvault.com (testnet)
```

**Pros:**

- Single codebase, easy to sync changes
- Shared components and utilities
- Cost-effective (one project)
- Easy to promote testnet → mainnet (merge PR)

**Cons:**

- Need to maintain two branches
- Risk of accidentally merging testnet code to main

### Option 2: Separate Projects (Recommended for Production)

Two independent Vercel projects:

```
khipuvault-mainnet   → khipuvault.com
khipuvault-testnet   → testnet.khipuvault.com
```

**Pros:**

- Complete isolation
- Independent deployments
- No risk of cross-contamination
- Different team access control

**Cons:**

- Code duplication (solved with git subtree/submodule)
- More complex CI/CD
- Higher cost (two projects)

## Current Setup (Development Phase)

Using **Option 1** during development, will migrate to **Option 2** before mainnet launch.

## Vercel Configuration

### 1. Environment Variables by Branch

#### Main Branch (khipuvault.com - Mainnet)

```env
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_APP_URL=https://khipuvault.com
NEXT_PUBLIC_API_URL=https://api.khipuvault.com
NEXT_PUBLIC_CHAIN_ID=60808
NEXT_PUBLIC_RPC_URL=https://rpc.mezo.org
```

#### Testnet Branch (testnet.khipuvault.com - Testnet)

```env
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_APP_URL=https://testnet.khipuvault.com
NEXT_PUBLIC_API_URL=https://api-testnet.khipuvault.com
NEXT_PUBLIC_CHAIN_ID=31611
NEXT_PUBLIC_RPC_URL=https://rpc.test.mezo.org
```

### 2. Custom Domains in Vercel

1. **Add domains to project:**
   - Go to Project Settings → Domains
   - Add `khipuvault.com` → assign to `main` branch
   - Add `testnet.khipuvault.com` → assign to `testnet` branch

2. **Configure DNS:**
   ```
   khipuvault.com          A      76.76.21.21
   www.khipuvault.com      CNAME  cname.vercel-dns.com
   testnet.khipuvault.com  CNAME  cname.vercel-dns.com
   ```

### 3. Branch Protection Rules

Configure in Vercel and GitHub:

```yaml
main branch:
  - Require PR approval (2 reviewers)
  - Require passing CI/CD
  - No direct pushes
  - Auto-deploy on merge

testnet branch:
  - Require PR approval (1 reviewer)
  - Require passing tests
  - Auto-deploy on push
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, testnet]
  pull_request:
    branches: [main, testnet]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm security:semgrep
      - run: pnpm security:audit

  deploy:
    needs: [test, security]
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: vercel/action@v33
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Smart Contract Deployment

### Testnet Deployment

```bash
cd packages/contracts
make deploy-testnet
# Updates addresses in packages/web3/src/addresses.ts
```

### Mainnet Deployment

```bash
cd packages/contracts
make deploy-mainnet
# IMPORTANT: Requires security audit approval
# IMPORTANT: Requires multi-sig wallet for deployer
```

## Database Strategy

### Development

```
Local PostgreSQL → Docker
```

### Testnet

```
Supabase/Neon Testnet Database
- Separate from mainnet
- Can be reset/wiped
- Contains test data
```

### Mainnet

```
Supabase/Neon Production Database
- Point-in-time recovery enabled
- Daily backups
- Read replicas for scaling
- Never mixed with testnet data
```

## Monitoring & Alerts

### Testnet

- Basic error logging (Sentry)
- Manual health checks
- No uptime SLA

### Mainnet

- Full error tracking (Sentry)
- Real-time performance monitoring (Vercel Analytics)
- Uptime monitoring (99.9% SLA)
- Blockchain event monitoring (Alchemy/Tenderly)
- Security alerts (OpenZeppelin Defender)

## Deployment Checklist

### Before Testnet Deployment

- [ ] All tests passing
- [ ] Smart contracts deployed to testnet
- [ ] Database seeded with test data
- [ ] Environment variables configured
- [ ] Custom domain configured

### Before Mainnet Deployment

- [ ] **Security audit completed and approved**
- [ ] All tests passing (100% critical path coverage)
- [ ] Smart contracts audited and deployed to mainnet
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Custom domain configured
- [ ] Monitoring and alerts configured
- [ ] Backup strategy in place
- [ ] Incident response plan documented
- [ ] Legal terms and privacy policy published
- [ ] Bug bounty program active
- [ ] Customer support ready

## Quick Switch: Testnet → Mainnet

When ready to go live, the transition should be seamless:

1. **Update environment variable:**

   ```bash
   # In Vercel project settings for main branch
   NEXT_PUBLIC_NETWORK=mainnet
   ```

2. **Deploy smart contracts to mainnet:**

   ```bash
   cd packages/contracts && make deploy-mainnet
   ```

3. **Update contract addresses:**

   ```typescript
   // packages/web3/src/addresses.ts
   export const ADDRESSES = {
     mainnet: {
       individualPool: "0x...",
       // ... mainnet addresses
     },
     testnet: {
       // ... existing testnet addresses
     },
   };
   ```

4. **Database migration:**

   ```bash
   pnpm db:migrate # Run migrations on production DB
   ```

5. **Verify deployment:**
   - Check all contract interactions
   - Test wallet connections
   - Verify API endpoints
   - Monitor error logs

## Best Practices

### Development Workflow

```
1. Develop feature → Local environment
2. Test feature → Deploy to testnet branch
3. QA approval → Merge testnet → main
4. Production → Auto-deploy to mainnet
```

### Security Practices

- Never commit private keys
- Use multi-sig for contract ownership
- Enable 2FA on all services
- Regular security audits
- Bug bounty program for mainnet

### Code Organization

```typescript
// ✅ Good: Environment-based configuration
const config = getNetworkConfig(); // Auto-detects from NEXT_PUBLIC_NETWORK

// ❌ Bad: Hardcoded values
const rpcUrl = "https://rpc.test.mezo.org";
```

### Testing Strategy

- Unit tests: All environments
- Integration tests: Testnet only
- E2E tests: Testnet before mainnet
- Load tests: Testnet only
- Security tests: Both (different contracts)

## Resources

Based on industry best practices:

- [Vercel Environments Documentation](https://vercel.com/docs/deployments/environments)
- [Blockchain DevOps Best Practices](https://www.hackquest.io/articles/blockchain-devops-best-practices-building-robust-web3-deployment-pipelines)
- [Testnet vs Mainnet Guide](https://shardeum.org/blog/testnet-vs-mainnet/)
- [Web3 Deployment Patterns](https://blog.tenderly.co/how-to-set-up-continuous-deployment-for-smart-contracts/)
- [Vercel Custom Domains](https://vercel.com/docs/domains/working-with-domains)

## Support

For deployment issues:

1. Check Vercel deployment logs
2. Check GitHub Actions logs
3. Contact team lead
4. Escalate to DevOps if critical

---

**Last Updated:** 2026-02-08
**Maintained By:** KhipuVault DevOps Team
