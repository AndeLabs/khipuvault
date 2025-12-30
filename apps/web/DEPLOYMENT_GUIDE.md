# 🚀 Frontend V3 Deployment Guide

## ✅ Pre-Deployment Checklist

### Smart Contracts Status

- [x] IndividualPoolV3 deployed (0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393)
- [x] CooperativePoolV3 deployed (0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88)
- [x] YieldAggregatorV3 deployed (0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6)
- [x] MezoIntegrationV3 deployed (0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6)
- [x] StabilityPoolStrategy deployed (0xe6e0608abEf8f31847C1c9367465DbF68A040Edc)
- [x] Vault configured in YieldAggregator

### Frontend Features Ready

- [x] useIndividualPoolV3 (unified V3 hook with all features)
- [x] useDeposit (deposit flow with approval handling)
- [x] usePartialWithdraw / useFullWithdraw (withdrawal flows)
- [x] useToggleAutoCompound (V3 auto-compound feature)
- [x] useClaimReferralRewards (V3 referral system)
- [x] useClaimYield (V3 yield claiming)
- [x] Individual Savings page (complete V3 UI)

## 📦 Deployment Steps

### 1. Install Dependencies

```bash
cd /Users/munay/dev/KhipuVault/frontend
npm install
```

### 2. Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables

Copy all variables from `.env.vercel` file:

**Critical Variables:**

```bash
NEXT_PUBLIC_INDIVIDUAL_POOL_ADDRESS=0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393
NEXT_PUBLIC_YIELD_AGGREGATOR_ADDRESS=0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6
NEXT_PUBLIC_MEZO_INTEGRATION_ADDRESS=0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6
NEXT_PUBLIC_STABILITY_POOL_STRATEGY_ADDRESS=0xe6e0608abEf8f31847C1c9367465DbF68A040Edc
NEXT_PUBLIC_MUSD_ADDRESS=0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
NEXT_PUBLIC_CHAIN_ID=31611
NEXT_PUBLIC_RPC_URL=https://rpc.test.mezo.org
```

### 3. Update Component Imports

Replace old components with V3 versions:

```tsx
// In app/dashboard/individual-savings/page.tsx
- import { PositionSimple } from '@/components/dashboard/individual-savings/position-simple'
+ import { PositionV3 } from '@/components/dashboard/individual-savings/position-v3'

// In component:
- <PositionSimple />
+ <PositionV3 />
```

### 4. Build & Test Locally

```bash
npm run build
npm run start
```

Test all features:

- [ ] Connect wallet (MetaMask/Coinbase)
- [ ] View position (principal, yields, APR)
- [ ] Toggle auto-compound
- [ ] View referral stats
- [ ] Make deposit (if have MUSD)
- [ ] Check yields appearing

### 5. Deploy to Vercel

```bash
vercel --prod
```

Or via Git push:

```bash
git add .
git commit -m "feat: V3 frontend with auto-compound & referrals"
git push origin main
```

## 🧪 Post-Deployment Testing

### Test Checklist

1. **Connection**
   - [ ] Wallet connects successfully
   - [ ] Network switches to Mezo Testnet
   - [ ] Balance displays correctly

2. **Position Display**
   - [ ] Principal shows correctly
   - [ ] Yields update every 10s
   - [ ] APR calculates properly
   - [ ] Auto-compound badge shows when enabled

3. **Deposits**
   - [ ] Approval flow works (2 transactions)
   - [ ] Deposit succeeds
   - [ ] UI updates after deposit
   - [ ] Explorer links work

4. **Withdrawals**
   - [ ] Full withdrawal works
   - [ ] Partial withdrawal works
   - [ ] Balance updates correctly

5. **V3 Features**
   - [ ] Auto-compound toggle works
   - [ ] Referral link generates
   - [ ] Referral stats display
   - [ ] Claim yields button appears when yields > 0

## 🎯 Key User Flows

### New User Flow

1. Connect wallet
2. Get MUSD from faucet (https://faucet.test.mezo.org)
3. Approve MUSD
4. Deposit 10+ MUSD
5. Enable auto-compound
6. Wait for yields to accumulate
7. Claim yields or withdraw

### Existing User Flow (from V1)

1. Users with V1 deposits continue to work
2. New deposits go to V3 contracts
3. No migration needed (no users yet in production)

## 📊 Monitoring

### Key Metrics to Watch

- Deposit transactions per day
- Total Value Locked (TVL)
- Average deposit size
- Auto-compound adoption rate
- Referral conversion rate
- Yields claimed vs auto-compounded

### Analytics Events (if implemented)

```typescript
// Track key actions
analytics.track("deposit", { amount, hasReferral });
analytics.track("auto_compound_enabled", { userId });
analytics.track("yields_claimed", { amount });
analytics.track("referral_used", { referrer });
```

## 🐛 Troubleshooting

### Common Issues

**"Transaction failed"**

- Check user has enough BTC for gas
- Verify MUSD balance > deposit amount
- Check minimum deposit (10 MUSD)

**"Yields not showing"**

- Yields accrue after ~1 minute
- Check StabilityPoolStrategy has deposits
- Verify vault is active in YieldAggregator

**"Auto-compound not working"**

- Requires active deposit
- Threshold is 1 MUSD of yields
- Check transaction confirmed

**"Referral link not working"**

- Ensure user has active deposit
- Check address is valid
- Verify not using own address

## 📝 Environment Variables Reference

See `.env.vercel` for complete list.

## 🔐 Security Notes

- All private keys stored securely (never in frontend)
- HTTPS only in production
- RPC endpoint is public Mezo testnet
- No API keys exposed in frontend code

## 🎉 Success Criteria

✅ Frontend deployed successfully
✅ All V3 features working
✅ Yields generating from StabilityPoolStrategy  
✅ Auto-compound functional
✅ Referral system operational
✅ Gas-optimized (40-60k gas saved)
✅ No migration needed (fresh start)

---

**Deployment Date:** 2025-11-02
**Version:** v3.0.0-production
**Network:** Mezo Testnet (Chain ID: 31611)
