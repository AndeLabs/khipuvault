# Testnet/Mainnet Setup - Quick Start

> 🚀 Everything you need to configure subdomain architecture for KhipuVault

## What We Built

```
✅ TestnetBanner component - Warning banner for testnet users
✅ ComingSoon component - Landing page for mainnet
✅ NetworkGate component - Smart routing based on NEXT_PUBLIC_NETWORK
✅ Network switch script - Quick local environment switching
✅ Deployment guides - Complete Vercel configuration docs
```

## Architecture

```
┌─────────────────────────────────────────┐
│  khipuvault.com (Mainnet - Production)  │
│  - Shows "Coming Soon" page             │
│  - NEXT_PUBLIC_NETWORK=mainnet          │
│  - Launch announcement & social links   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  testnet.khipuvault.com (Testnet - QA)  │
│  - Shows full KhipuVault app            │
│  - NEXT_PUBLIC_NETWORK=testnet          │
│  - Testnet warning banner at top        │
│  - Free test mUSD tokens                │
└─────────────────────────────────────────┘
```

## Quick Setup (3 Steps)

### Step 1: Create Testnet Branch

```bash
cd /Users/munay/dev/KhipuVault
git checkout -b testnet
git push -u origin testnet
```

### Step 2: Configure Vercel Environment Variables

Go to [Vercel Dashboard](https://vercel.com/andelabs/khipuvault) → Settings → Environment Variables

#### For Production (main branch)

| Variable            | Value                        | Environment |
| ------------------- | ---------------------------- | ----------- |
| NEXT_PUBLIC_NETWORK | `mainnet`                    | Production  |
| NEXT_PUBLIC_APP_URL | `https://khipuvault.com`     | Production  |
| NEXT_PUBLIC_API_URL | `https://api.khipuvault.com` | Production  |

#### For Preview (testnet branch)

| Variable            | Value                                | Environment |
| ------------------- | ------------------------------------ | ----------- |
| NEXT_PUBLIC_NETWORK | `testnet`                            | Preview     |
| NEXT_PUBLIC_APP_URL | `https://testnet.khipuvault.com`     | Preview     |
| NEXT_PUBLIC_API_URL | `https://api-testnet.khipuvault.com` | Preview     |

### Step 3: Add Custom Domains

Go to Vercel → Domains

1. **Add testnet.khipuvault.com**
   - Domain: `testnet.khipuvault.com`
   - Git Branch: `testnet`

2. **Update DNS (Cloudflare)**
   ```
   Type: CNAME
   Name: testnet
   Target: cname.vercel-dns.com
   Proxy: No (DNS only)
   TTL: Auto
   ```

## Using Your Cloudflare Credentials

Since you already have Cloudflare configured:

```
Account ID: 58f90adc571d31c4b7a860b6edef3406
```

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select `khipuvault.com` domain
3. Go to DNS → Records
4. Add CNAME record:
   - Type: **CNAME**
   - Name: **testnet**
   - Target: **cname.vercel-dns.com**
   - Proxy status: **DNS only** (gray cloud)
   - TTL: **Auto**

## Vercel CLI Quick Commands

Using your Vercel token:

```bash
# Login with your token
export VERCEL_TOKEN="M9z1htYjtOfNla5piepMsP9d"
vercel login --token $VERCEL_TOKEN

# Link project
cd /Users/munay/dev/KhipuVault/apps/web
vercel link

# Add environment variables via CLI
vercel env add NEXT_PUBLIC_NETWORK production
# When prompted, enter: mainnet

vercel env add NEXT_PUBLIC_NETWORK preview
# When prompted, enter: testnet

# Deploy to preview (testnet)
git checkout testnet
vercel

# Deploy to production (mainnet)
git checkout main
vercel --prod
```

## Local Development

### Switch to Testnet (Default)

```bash
./scripts/switch-network.sh testnet
pnpm dev
```

Visit http://localhost:9002 - You'll see:

- ✅ Full app
- ✅ Testnet warning banner at top

### Switch to Mainnet (Testing)

```bash
./scripts/switch-network.sh mainnet
pnpm dev
```

Visit http://localhost:9002 - You'll see:

- 🚀 "Coming Soon" landing page
- 📢 Link to testnet
- 🔗 Social media links

## How It Works

### NetworkGate Component

Located: `/Users/munay/dev/KhipuVault/apps/web/src/components/network-gate.tsx`

```typescript
export function NetworkGate({ children }) {
  const network = getCurrentNetwork(); // Reads NEXT_PUBLIC_NETWORK

  if (network === "mainnet") {
    return <ComingSoon />; // Show landing page
  }

  return <>{children}</>; // Show full app
}
```

### TestnetBanner Component

Located: `/Users/munay/dev/KhipuVault/apps/web/src/components/testnet-banner.tsx`

- Only shows when `NEXT_PUBLIC_NETWORK=testnet`
- Dismissible (but reappears on refresh)
- Sticky at top of page
- Bright warning colors

### ComingSoon Component

Located: `/Users/munay/dev/KhipuVault/apps/web/src/components/coming-soon.tsx`

- Shows when `NEXT_PUBLIC_NETWORK=mainnet`
- Launch announcement
- Link to testnet for testing
- Social media links
- Feature highlights

## Deployment Workflow

### Current Setup (Development)

```
main branch      → khipuvault.vercel.app (mainnet)
testnet branch   → testnet.khipuvault.com (when configured)
feature branches → auto-generated preview URLs
```

### Development Workflow

```bash
# 1. Develop feature locally
git checkout -b feature/new-thing
# Make changes
pnpm dev  # Test locally with testnet

# 2. Test on testnet deployment
git checkout testnet
git merge feature/new-thing
git push origin testnet
# Auto-deploys to testnet.khipuvault.com

# 3. After QA approval, promote to production
git checkout main
git merge testnet
git push origin main
# Auto-deploys to khipuvault.com
```

## Pre-Launch Checklist

Before switching main to mainnet:

- [ ] All features tested on testnet
- [ ] Security audit completed
- [ ] Smart contracts deployed to mainnet
- [ ] Contract addresses updated in code
- [ ] Database migrations tested
- [ ] API endpoints verified on mainnet
- [ ] SSL certificates verified
- [ ] Monitoring configured
- [ ] Legal docs published
- [ ] Support team ready

## Going Live (The Switch)

When ready to launch on mainnet:

```bash
# 1. Update environment variable in Vercel
# Go to Project Settings → Environment Variables
# Edit NEXT_PUBLIC_NETWORK for Production
# Change from: testnet
# Change to: mainnet

# 2. Redeploy main branch
git checkout main
git commit --allow-empty -m "chore: trigger mainnet deployment"
git push origin main

# 3. Verify
# Visit https://khipuvault.com
# Should now show: Coming Soon page (because mainnet)

# 4. When contracts are ready
# Just change NEXT_PUBLIC_NETWORK back to testnet
# And the full app will appear!
```

## Troubleshooting

### "Still showing testnet after switch"

```bash
# Clear Vercel build cache
vercel env pull .env.local
vercel --force
```

### "Domain not resolving"

```bash
# Check DNS propagation
dig testnet.khipuvault.com
# Should show CNAME to cname.vercel-dns.com

# Or use online tool
open https://dnschecker.org/#CNAME/testnet.khipuvault.com
```

### "Environment variable not updating"

1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Delete old variable
4. Add new one with correct environment selection
5. Redeploy

## Files Created

| File                                         | Purpose                     |
| -------------------------------------------- | --------------------------- |
| `apps/web/src/components/network-gate.tsx`   | Routes to ComingSoon or App |
| `apps/web/src/components/coming-soon.tsx`    | Mainnet landing page        |
| `apps/web/src/components/testnet-banner.tsx` | Testnet warning banner      |
| `scripts/switch-network.sh`                  | Local env switcher          |
| `DEPLOYMENT.md`                              | Complete deployment guide   |
| `VERCEL_SETUP.md`                            | Vercel configuration guide  |
| `ENVIRONMENT_SWITCH.md`                      | Environment switching guide |
| `vercel.json`                                | Vercel project config       |

## Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment strategy
- [VERCEL_SETUP.md](./VERCEL_SETUP.md) - Step-by-step Vercel setup
- [ENVIRONMENT_SWITCH.md](./ENVIRONMENT_SWITCH.md) - Environment switching
- [Vercel Dashboard](https://vercel.com/andelabs/khipuvault)
- [Cloudflare Dashboard](https://dash.cloudflare.com)

## Next Steps

1. ✅ Create testnet branch
2. ✅ Configure Vercel environment variables
3. ✅ Add testnet.khipuvault.com domain
4. ✅ Configure DNS CNAME record
5. ⏳ Test deployment to testnet
6. ⏳ QA testing on testnet subdomain
7. ⏳ Security audit
8. ⏳ Deploy contracts to mainnet
9. ⏳ Switch main branch to mainnet
10. ⏳ Launch! 🎉

---

**Questions?** Check the detailed guides above or contact the team.

**Ready to deploy?** Follow VERCEL_SETUP.md step by step.
