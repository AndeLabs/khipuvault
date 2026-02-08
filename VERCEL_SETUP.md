# Vercel Setup Guide for KhipuVault

> Step-by-step guide for configuring Vercel with testnet/mainnet subdomains

## Prerequisites

- Vercel account
- khipuvault.com domain registered
- GitHub repository connected to Vercel

## Step 1: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository `KhipuVault`
4. Configure project:
   - Framework Preset: **Next.js**
   - Root Directory: `./apps/web`
   - Build Command: `pnpm build`
   - Install Command: `pnpm install`

## Step 2: Configure Environment Variables

### Add Environment Variables in Vercel

Go to Project Settings → Environment Variables

#### For All Environments (Production, Preview, Development)

```env
# Database
DATABASE_URL=your_database_url

# Blockchain (will be overridden per environment)
NEXT_PUBLIC_NETWORK=testnet
```

#### For Production Environment (main branch)

```env
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_APP_URL=https://khipuvault.com
NEXT_PUBLIC_API_URL=https://api.khipuvault.com
NEXT_PUBLIC_CHAIN_ID=60808
NEXT_PUBLIC_RPC_URL=https://rpc.mezo.org
```

#### For Preview Environment (testnet branch)

```env
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_APP_URL=https://testnet.khipuvault.com
NEXT_PUBLIC_API_URL=https://api-testnet.khipuvault.com
NEXT_PUBLIC_CHAIN_ID=31611
NEXT_PUBLIC_RPC_URL=https://rpc.test.mezo.org
```

### Using Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_NETWORK production
# Enter: mainnet

vercel env add NEXT_PUBLIC_NETWORK preview
# Enter: testnet

# Pull environment variables to local
vercel env pull .env.local
```

## Step 3: Configure Custom Domains

### Add Domains in Vercel

1. Go to Project Settings → Domains
2. Click "Add Domain"

#### Main Domain (Production - main branch)
- Domain: `khipuvault.com`
- Git Branch: `main`
- Click "Add"

#### WWW Redirect
- Domain: `www.khipuvault.com`
- Redirect to: `khipuvault.com`
- Click "Add"

#### Testnet Subdomain (Preview - testnet branch)
- Domain: `testnet.khipuvault.com`
- Git Branch: `testnet`
- Click "Add"

### Configure DNS Records

Update your DNS settings (at your domain registrar or Cloudflare):

```dns
# A Record for root domain (IPv4)
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto

# CNAME for www subdomain
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto

# CNAME for testnet subdomain
Type: CNAME
Name: testnet
Value: cname.vercel-dns.com
TTL: Auto
```

**Note:** DNS propagation can take up to 48 hours, but usually completes within minutes.

## Step 4: Configure Branch Deployments

### Git Branch Settings

Go to Project Settings → Git

1. **Production Branch:** `main`
   - Auto-deploy on push: ✅ Enabled
   - Domain: khipuvault.com

2. **Preview Branches:**
   - `testnet` → Custom domain: testnet.khipuvault.com
   - All other branches → Auto-generated preview URLs

### Branch Protection (Recommended)

Configure in GitHub Settings → Branches:

#### Main Branch
```yaml
Branch protection rules for "main":
- Require pull request reviews (2 approvers)
- Require status checks to pass
- Require branches to be up to date
- Require conversation resolution
- Restrict who can push
- Do not allow force pushes
```

#### Testnet Branch
```yaml
Branch protection rules for "testnet":
- Require pull request reviews (1 approver)
- Require status checks to pass
- Allow force pushes (for testing)
```

## Step 5: Configure Build Settings

### Build & Development Settings

Go to Project Settings → General

```
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install
Development Command: pnpm dev

Root Directory: apps/web
Node.js Version: 20.x
```

### Environment Variables Override

For monorepo setup, ensure Vercel uses the correct package.json:

```json
{
  "scripts": {
    "vercel-build": "cd ../.. && pnpm build --filter=@khipu/web"
  }
}
```

## Step 6: Configure Deployment Settings

### Ignored Build Step

To save build minutes, you can configure Vercel to skip builds for certain file changes:

Project Settings → Git → Ignored Build Step

```bash
# Only build if relevant files changed
git diff --quiet HEAD^ HEAD -- apps/web packages/web3 packages/ui packages/shared
```

### Deployment Protection

For production (main branch):
- Enable Vercel Authentication: ❌ (Public app)
- Enable Password Protection: ❌ (Public app)

For preview (testnet branch):
- Enable Vercel Authentication: ✅ (Optional - for internal testing)
- Enable Password Protection: ✅ (Optional - for internal testing)

## Step 7: Verify Deployment

### Check Deployment Status

```bash
# Using Vercel CLI
vercel ls

# Check specific deployment
vercel inspect <deployment-url>

# View logs
vercel logs <deployment-url>
```

### Manual Verification

1. **Main Branch (Mainnet)**
   - URL: https://khipuvault.com
   - Should show: "Coming Soon" page (since NEXT_PUBLIC_NETWORK=mainnet)
   - Check console: Network should be "mainnet"

2. **Testnet Branch**
   - URL: https://testnet.khipuvault.com
   - Should show: Full KhipuVault app with testnet banner
   - Check console: Network should be "testnet"

## Step 8: Set Up Monitoring (Optional)

### Enable Vercel Analytics

Project Settings → Analytics
- Enable Web Analytics: ✅
- Enable Audience: ✅
- Enable Speed Insights: ✅

### Enable Vercel Web Vitals

```typescript
// apps/web/src/app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

## Troubleshooting

### Issue: Domain not resolving
**Solution:** Check DNS propagation with `dig khipuvault.com` or use https://dnschecker.org

### Issue: Wrong environment variables
**Solution:** Verify branch-specific env vars in Vercel dashboard, redeploy

### Issue: Build failing
**Solution:** Check build logs in Vercel, ensure monorepo build works locally

### Issue: 404 on custom domain
**Solution:** Ensure domain is verified in Vercel, check DNS CNAME records

### Issue: SSL certificate errors
**Solution:** Vercel auto-generates SSL certs, wait up to 24h or contact Vercel support

## Useful Commands

```bash
# Trigger production deployment
git push origin main

# Trigger testnet deployment
git push origin testnet

# Force redeploy latest commit
vercel --prod

# Rollback to previous deployment
vercel rollback

# Check deployment status
vercel ls --prod

# Open current deployment
vercel open
```

## CI/CD Integration

### GitHub Actions (Optional)

If you want more control over deployments:

```yaml
# .github/workflows/deploy-testnet.yml
name: Deploy to Testnet

on:
  push:
    branches: [testnet]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Security Checklist

Before going to production:

- [ ] Environment variables are not exposed in client bundle
- [ ] API keys are stored as Vercel secrets
- [ ] Production database has backups enabled
- [ ] SSL certificates are valid
- [ ] Security headers are configured (CSP, HSTS, etc.)
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled on API
- [ ] DDoS protection is active (Vercel Pro+)

## Next Steps

1. ✅ Complete this setup guide
2. Deploy to testnet branch for testing
3. Test all features on testnet.khipuvault.com
4. Get security audit approval
5. Deploy smart contracts to mainnet
6. Update NEXT_PUBLIC_NETWORK=mainnet for main branch
7. Deploy to production (khipuvault.com)
8. Monitor and celebrate 🎉

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Custom Domains](https://vercel.com/docs/domains/working-with-domains)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Need Help?** Contact the DevOps team or check Vercel support.
