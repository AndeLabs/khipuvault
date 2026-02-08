# Environment Configuration

> Configuration files for testnet and mainnet deployments

## Overview

This directory contains environment-specific configuration files that control:
- Contract addresses
- Feature flags
- API endpoints
- Monitoring settings
- Transaction limits

## Structure

```
environments/
├── schema.json           # JSON Schema for validation
├── testnet/
│   └── config.json      # Testnet configuration
└── mainnet/
    └── config.json      # Mainnet configuration
```

## Configuration Files

### testnet/config.json

Configuration for testnet.khipuvault.com:
- All features enabled for testing
- Testnet contract addresses
- Debug tools enabled
- Lower monitoring sample rate

### mainnet/config.json

Configuration for khipuvault.com:
- Only stable, audited features enabled
- Mainnet contract addresses (update before launch)
- Debug tools disabled
- Full monitoring enabled

## Usage

### Reading Configuration

The configuration is loaded automatically based on `NEXT_PUBLIC_NETWORK`:

```typescript
import { isFeatureEnabled } from "@khipu/shared";

export function MyComponent() {
  // Automatically reads from correct environment
  if (isFeatureEnabled("showPrizePool")) {
    return <PrizePoolCard />;
  }
  return null;
}
```

### Enabling a Feature on Testnet

```bash
# 1. Edit testnet config
vim environments/testnet/config.json

# 2. Change feature flag
"showNewFeature": true

# 3. Commit and push
git add environments/testnet/config.json
git commit -m "feat: enable new feature on testnet"
git push origin main

# → Auto-deploys to testnet.khipuvault.com
```

### Promoting to Mainnet

```bash
# 1. After testing on testnet for 7+ days
# 2. Edit mainnet config
vim environments/mainnet/config.json

# 3. Enable the feature
"showNewFeature": true

# 4. Commit and deploy
git add environments/mainnet/config.json
git commit -m "feat: enable new feature on mainnet"
git push origin main

# 5. Trigger manual deployment
gh workflow run deploy-mainnet.yml \
  -f version=v1.2.0 \
  -f confirm=DEPLOY
```

## Feature Flags Reference

### Product Features

| Flag | Description | Testnet | Mainnet |
|------|-------------|---------|---------|
| `showIndividualSavings` | Individual Savings Pool | ✅ | ✅ |
| `showCommunityPools` | Cooperative Pools | ✅ | ❌ |
| `showRotatingPool` | ROSCA/Pasanaku | ✅ | ❌ |
| `showPrizePool` | No-loss lottery | ✅ | ❌ |
| `showReferralSystem` | Referral rewards | ❌ | ❌ |

### Core Functionality

| Flag | Description | Testnet | Mainnet |
|------|-------------|---------|---------|
| `enableAutoCompound` | Auto-compound yields | ✅ | ✅ |
| `enableYieldClaiming` | Manual claiming | ✅ | ✅ |
| `enablePartialWithdrawals` | Partial withdrawals | ✅ | ✅ |
| `enableMultiToken` | Multi-token support | ❌ | ❌ |

### Advanced Features

| Flag | Description | Testnet | Mainnet |
|------|-------------|---------|---------|
| `enableAnalytics` | Analytics dashboard | ✅ | ✅ |
| `enableNotifications` | Push notifications | ❌ | ❌ |
| `enablePortfolio` | Portfolio tracking | ✅ | ❌ |
| `enableSocial` | Social features | ❌ | ❌ |

### System Controls

| Flag | Description | Testnet | Mainnet |
|------|-------------|---------|---------|
| `maintenanceMode` | Show maintenance page | ❌ | ❌ |
| `readOnlyMode` | Disable all writes | ❌ | ❌ |
| `showTestnetBanner` | Testnet warning | ✅ | ❌ |
| `enableDebugTools` | Debug tools | ✅ | ❌ |

## Contract Addresses

### Testnet (Mezo Testnet - Chain ID: 31611)

```json
{
  "individualPoolV3": "0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393",
  "cooperativePool": "0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88",
  "yieldAggregator": "0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6",
  "mezoIntegration": "0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6",
  "musd": "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503"
}
```

### Mainnet (Mezo Mainnet - Chain ID: 60808)

```json
{
  "individualPoolV3": "0x0000000000000000000000000000000000000000",
  "cooperativePool": "0x0000000000000000000000000000000000000000",
  "yieldAggregator": "0x0000000000000000000000000000000000000000",
  "mezoIntegration": "0x0000000000000000000000000000000000000000",
  "musd": "0x0000000000000000000000000000000000000000"
}
```

⚠️ **Important:** Update mainnet addresses before deploying to production!

## Emergency Controls

### Enable Maintenance Mode

```bash
# 1. Edit config
vim environments/mainnet/config.json

# 2. Enable maintenance
"maintenanceMode": true

# 3. Deploy immediately
git add . && git commit -m "chore: enable maintenance mode" && git push

# Users will see maintenance page
```

### Enable Read-Only Mode

```bash
# Same as maintenance, but set:
"readOnlyMode": true

# Users can view but not transact
```

## Validation

Validate configuration files against schema:

```bash
# Install validator
npm install -g ajv-cli

# Validate testnet config
ajv validate -s environments/schema.json -d environments/testnet/config.json

# Validate mainnet config
ajv validate -s environments/schema.json -d environments/mainnet/config.json
```

## Best Practices

1. **Never commit directly to mainnet config**
   - Always test on testnet first
   - Require PR review for mainnet changes

2. **Use feature flags for gradual rollout**
   - Enable on testnet → test → enable on mainnet
   - Can disable instantly if issues occur

3. **Keep configs in sync**
   - Mainnet should eventually match testnet
   - Document why features are disabled on mainnet

4. **Update timestamps**
   - Change `updatedAt` when modifying config
   - Helps track when changes were made

5. **Validate before committing**
   - Use JSON Schema validator
   - Check for typos in contract addresses

## Monitoring

After enabling a feature:

1. **Check Sentry** - No new errors
2. **Check Analytics** - Usage metrics
3. **Check Contract Events** - Transactions working
4. **User Feedback** - Discord/Twitter

## Rollback

If a feature causes issues:

```bash
# Quick fix - disable feature flag
vim environments/mainnet/config.json
"problematicFeature": false
git add . && git commit -m "fix: disable feature" && git push

# Or use Vercel rollback
vercel rollback --prod
```

## Questions?

See parent directory documentation:
- [PROMOTION_STRATEGY.md](../PROMOTION_STRATEGY.md) - Full promotion workflow
- [ENVIRONMENT_SWITCH.md](../ENVIRONMENT_SWITCH.md) - Environment switching guide
