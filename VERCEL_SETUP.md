# Vercel Setup Guide for KhipuVault

> Single-branch deployment strategy with multiple Vercel projects

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub                                   │
│                                                                  │
│   rama main ────●────●────●────●────●──── (single source)       │
│                 │                                                │
└─────────────────┼────────────────────────────────────────────────┘
                  │
                  ▼ (triggers both)
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel                                   │
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │ khipuvault-web      │    │ khipuvault-testnet  │            │
│  │ (Production)        │    │ (Testnet)           │            │
│  │                     │    │                     │            │
│  │ Branch: main        │    │ Branch: main        │            │
│  │ Root: apps/web      │    │ Root: apps/web      │            │
│  │                     │    │                     │            │
│  │ khipuvault.com      │    │ testnet.khipuvault  │            │
│  │ NETWORK=mainnet     │    │ NETWORK=testnet     │            │
│  └─────────────────────┘    └─────────────────────┘            │
│                                                                  │
│  ┌─────────────────────┐                                        │
│  │ khipuvault-docs     │                                        │
│  │ Root: apps/docs     │                                        │
│  │ docs.khipuvault.com │                                        │
│  └─────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Projects Configuration

### 1. khipuvault-web (Mainnet/Production)

| Setting        | Value          |
| -------------- | -------------- |
| Name           | khipuvault-web |
| Framework      | Next.js        |
| Root Directory | apps/web       |
| Branch         | main           |
| Domain         | khipuvault.com |

**Environment Variables:**

```env
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_CHAIN_ID=31612
NEXT_PUBLIC_APP_URL=https://khipuvault.com
```

### 2. khipuvault-testnet (Testnet)

| Setting        | Value                  |
| -------------- | ---------------------- |
| Name           | khipuvault-testnet     |
| Framework      | Next.js                |
| Root Directory | apps/web               |
| Branch         | main                   |
| Domain         | testnet.khipuvault.com |

**Environment Variables:**

```env
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_CHAIN_ID=31611
NEXT_PUBLIC_APP_URL=https://testnet.khipuvault.com
```

### 3. khipuvault-docs (Documentation)

| Setting        | Value               |
| -------------- | ------------------- |
| Name           | khipuvault-docs     |
| Framework      | Next.js             |
| Root Directory | apps/docs           |
| Branch         | main                |
| Domain         | docs.khipuvault.com |

## Deployment Workflow

### Automatic Deployments

When you push to `main`:

1. GitHub triggers Vercel webhook
2. **Both** khipuvault-web AND khipuvault-testnet build simultaneously
3. Each uses its own environment variables
4. Deploys to respective domains

```bash
# Single push deploys to both environments
git push origin main

# Result:
# - khipuvault.com       → Shows Coming Soon (mainnet)
# - testnet.khipuvault   → Shows Full App (testnet)
```

### Manual Deployment

```bash
# Deploy specific project
vercel --prod --scope=andelabs-projects

# Or via Vercel Dashboard
# Project → Deployments → Redeploy
```

## Adding New Environment Variables

### Via Vercel Dashboard

1. Go to Project → Settings → Environment Variables
2. Add variable with appropriate targets (Production/Preview/Development)
3. Redeploy to apply

### Via CLI

```bash
# For testnet project
vercel env add NEXT_PUBLIC_NEW_VAR --scope=andelabs-projects
# Select: khipuvault-testnet
# Enter value

# For mainnet project
vercel env add NEXT_PUBLIC_NEW_VAR --scope=andelabs-projects
# Select: khipuvault-web
# Enter value
```

### Via API

```bash
curl -X POST "https://api.vercel.com/v10/projects/PROJECT_NAME/env?teamId=TEAM_ID" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "NEXT_PUBLIC_NEW_VAR",
    "value": "value",
    "type": "plain",
    "target": ["production", "preview", "development"]
  }'
```

## DNS Configuration

### Required DNS Records

```dns
# A Record for root domain
Type: A
Name: @
Value: 76.76.21.21

# CNAME for www
Type: CNAME
Name: www
Value: cname.vercel-dns.com

# CNAME for testnet
Type: CNAME
Name: testnet
Value: cname.vercel-dns.com

# CNAME for docs
Type: CNAME
Name: docs
Value: cname.vercel-dns.com
```

## Feature Rollout

### Enabling Features on Mainnet

The app uses feature flags in `packages/shared/src/config/feature-flags.ts`:

```typescript
// To enable Community Pools on mainnet:
mainnet: {
  showCommunityPools: true,  // Change from false
}
```

Then push to main - both environments update, but only mainnet behavior changes.

### Gradual Rollout

```typescript
// 10% rollout
mainnet: {
  showCommunityPools: Math.random() < 0.1,
}

// 50% rollout
mainnet: {
  showCommunityPools: Math.random() < 0.5,
}

// Full rollout
mainnet: {
  showCommunityPools: true,
}
```

## Monitoring

### Vercel Dashboard

- Real-time build logs
- Deployment history
- Analytics (if enabled)
- Error tracking

### Useful Commands

```bash
# List recent deployments
vercel ls --scope=andelabs-projects

# View deployment logs
vercel logs DEPLOYMENT_URL --scope=andelabs-projects

# Check project info
vercel project ls --scope=andelabs-projects
```

## Rollback

### Via Dashboard

1. Go to Project → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Via CLI

```bash
vercel rollback --scope=andelabs-projects
```

## Troubleshooting

### Build Fails

1. Check build logs in Vercel Dashboard
2. Verify environment variables are set
3. Test build locally: `pnpm build`

### Domain Not Working

1. Verify DNS records with `dig domain.com`
2. Check domain status in Vercel Dashboard
3. Wait for DNS propagation (up to 48h)

### Wrong Environment

1. Verify `NEXT_PUBLIC_NETWORK` is set correctly
2. Check which project the domain is assigned to
3. Redeploy after fixing

## Security Checklist

- [ ] Environment variables don't contain secrets in NEXT*PUBLIC* prefix
- [ ] API keys stored as encrypted Vercel secrets
- [ ] Different keys per environment
- [ ] SSL certificates valid (auto-managed by Vercel)

## Team Access

| Role   | Permissions                       |
| ------ | --------------------------------- |
| Owner  | Full access, billing, delete      |
| Member | Deploy, view logs, manage domains |
| Viewer | View deployments only             |

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
