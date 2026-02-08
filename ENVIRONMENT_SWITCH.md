# Environment Switch Guide

> Quick reference for switching between testnet and mainnet

## Current Configuration

```
Testnet: testnet.khipuvault.com (NEXT_PUBLIC_NETWORK=testnet)
Mainnet: khipuvault.com (NEXT_PUBLIC_NETWORK=mainnet)
```

## Local Development

### Switch to Testnet (Default)

```bash
# Edit apps/web/.env.local
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_CHAIN_ID=31611
NEXT_PUBLIC_RPC_URL=https://rpc.test.mezo.org

# Restart dev server
pnpm dev
```

### Switch to Mainnet

```bash
# Edit apps/web/.env.local
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_CHAIN_ID=60808
NEXT_PUBLIC_RPC_URL=https://rpc.mezo.org

# Restart dev server
pnpm dev
```

## Vercel Deployment

### Current Setup

#### Project: khipuvault

**Main Branch** (Production)
- Domain: `khipuvault.com`
- Vercel URL: `khipuvault.vercel.app`
- Environment: `NEXT_PUBLIC_NETWORK=mainnet`
- Shows: "Coming Soon" page

**Testnet Branch** (Preview)
- Domain: `testnet.khipuvault.com`
- Environment: `NEXT_PUBLIC_NETWORK=testnet`
- Shows: Full app with testnet banner

### Configure Testnet Subdomain

1. **Create testnet branch:**
   ```bash
   git checkout -b testnet
   git push origin testnet
   ```

2. **Add environment variables in Vercel:**
   - Go to khipuvault project settings
   - Environment Variables → Add New
   - Add for **Preview** environment:
     ```
     NEXT_PUBLIC_NETWORK=testnet
     NEXT_PUBLIC_APP_URL=https://testnet.khipuvault.com
     NEXT_PUBLIC_API_URL=https://api-testnet.khipuvault.com
     ```

3. **Add custom domain:**
   - Go to Domains
   - Add `testnet.khipuvault.com`
   - Assign to `testnet` branch
   - Configure DNS CNAME:
     ```
     testnet.khipuvault.com → cname.vercel-dns.com
     ```

4. **Test deployment:**
   ```bash
   git checkout testnet
   git push origin testnet
   # Check https://testnet.khipuvault.com
   ```

### Configure Mainnet

1. **Update main branch environment:**
   - Go to khipuvault project settings
   - Environment Variables
   - Edit for **Production** environment:
     ```
     NEXT_PUBLIC_NETWORK=mainnet
     NEXT_PUBLIC_APP_URL=https://khipuvault.com
     NEXT_PUBLIC_API_URL=https://api.khipuvault.com
     ```

2. **Deploy contracts to mainnet:**
   ```bash
   cd packages/contracts
   # First, get security audit approval
   # Then deploy
   make deploy-mainnet
   ```

3. **Update contract addresses:**
   ```typescript
   // packages/web3/src/addresses.ts
   export const MEZO_MAINNET_ADDRESSES = {
     individualPoolV3: "0x...", // Add mainnet addresses
     // ...
   };
   ```

4. **Deploy to production:**
   ```bash
   git checkout main
   git merge testnet  # After thorough testing
   git push origin main
   ```

## What Users See

### Testnet (testnet.khipuvault.com)
```
✅ Full KhipuVault app
✅ Testnet warning banner (dismissible)
✅ All features enabled
✅ Test mUSD tokens
✅ Mezo testnet (Chain ID: 31611)
```

### Mainnet (khipuvault.com)
```
🚀 "Coming Soon" landing page
📢 Link to testnet for testing
🔗 Social media links
⏳ Launch announcement
```

## Quick Commands

### Check Current Environment

```bash
# Local
cat apps/web/.env.local | grep NEXT_PUBLIC_NETWORK

# Deployed (check in browser console)
console.log(process.env.NEXT_PUBLIC_NETWORK)
```

### Deploy to Testnet

```bash
git checkout testnet
git pull origin testnet
# Make your changes
git add .
git commit -m "feat: new feature for testing"
git push origin testnet
# Auto-deploys to testnet.khipuvault.com
```

### Promote to Mainnet

```bash
# After thorough testing on testnet
git checkout main
git merge testnet
git push origin main
# Auto-deploys to khipuvault.com
```

## Environment Variables Reference

### Testnet

| Variable | Value |
|----------|-------|
| NEXT_PUBLIC_NETWORK | testnet |
| NEXT_PUBLIC_CHAIN_ID | 31611 |
| NEXT_PUBLIC_RPC_URL | https://rpc.test.mezo.org |
| NEXT_PUBLIC_APP_URL | https://testnet.khipuvault.com |
| NEXT_PUBLIC_API_URL | https://api-testnet.khipuvault.com |

### Mainnet

| Variable | Value |
|----------|-------|
| NEXT_PUBLIC_NETWORK | mainnet |
| NEXT_PUBLIC_CHAIN_ID | 60808 |
| NEXT_PUBLIC_RPC_URL | https://rpc.mezo.org |
| NEXT_PUBLIC_APP_URL | https://khipuvault.com |
| NEXT_PUBLIC_API_URL | https://api.khipuvault.com |

## Pre-Launch Checklist

Before switching to mainnet:

- [ ] All features tested on testnet
- [ ] Smart contracts audited
- [ ] Smart contracts deployed to mainnet
- [ ] Database migrations tested
- [ ] API endpoints verified
- [ ] Environment variables configured
- [ ] Custom domain SSL verified
- [ ] Monitoring and alerts active
- [ ] Legal docs published
- [ ] Support team ready

## Rollback Plan

If issues occur on mainnet:

1. **Immediate rollback:**
   ```bash
   vercel rollback --prod
   ```

2. **Fix and redeploy:**
   ```bash
   git checkout main
   git revert <bad-commit>
   git push origin main
   ```

3. **Emergency mode:**
   - Update NEXT_PUBLIC_NETWORK to testnet temporarily
   - Show maintenance page
   - Fix issues
   - Redeploy

## Troubleshooting

### Issue: Still showing testnet after switch
**Solution:** Clear browser cache, check environment variables in Vercel

### Issue: Contract not found
**Solution:** Verify contract addresses in packages/web3/src/addresses.ts

### Issue: Wrong network detected
**Solution:** Check NEXT_PUBLIC_NETWORK value, restart dev server

---

**Quick Links:**
- [Vercel Dashboard](https://vercel.com/andeLabs/khipuvault)
- [GitHub Repo](https://github.com/AndeLabs/khipuvault)
- [Testnet App](https://testnet.khipuvault.com)
- [Mainnet App](https://khipuvault.com)
