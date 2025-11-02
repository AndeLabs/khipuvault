# 📈 Yields Setup - Mezo Testnet

## 🔍 Current Status

### ✅ What's Working:
- Individual Pool V3 deployed: `0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393`
- Yield Aggregator V3 deployed: `0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6`
- Deposits and withdrawals working perfectly
- Smart yield calculation logic in place

### ⚠️ What's Missing:
- **StabilityPoolStrategy NOT deployed yet**
- YieldAggregator has placeholder vaults (`0x1111...`, `0x2222...`)
- APR currently set to 5% (500 basis points) but not generating real yields

## 🎯 How Yields Should Work

```
User Deposits MUSD
    ↓
IndividualPoolV3
    ↓
YieldAggregatorV3
    ↓
StabilityPoolStrategy  ← NOT DEPLOYED YET
    ↓
Mezo Stability Pool (Real yields from BTC collateral)
```

## 🚀 To Enable Real Yields

### Step 1: Deploy StabilityPoolStrategy

```bash
cd contracts

# Deploy the strategy
forge script script/DeployStabilityPoolStrategy.s.sol \
  --rpc-url https://rpc.test.mezo.org \
  --broadcast \
  --verify

# Save the deployed address
export STRATEGY_ADDRESS=<deployed_address>
```

### Step 2: Add Strategy as Vault

```bash
# Add to YieldAggregator
cast send 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6 \
  "addVault(address,uint8,uint256)" \
  $STRATEGY_ADDRESS \
  0 \
  600 \
  --rpc-url https://rpc.test.mezo.org \
  --private-key $PRIVATE_KEY

# 0 = YieldStrategy.STABILITY_POOL
# 600 = 6% APR (600 basis points)
```

### Step 3: Remove Placeholder Vaults

```bash
# Remove fake vaults
cast send 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6 \
  "removeVault(address)" \
  0x1111111111111111111111111111111111111111 \
  --rpc-url https://rpc.test.mezo.org \
  --private-key $PRIVATE_KEY

cast send 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6 \
  "removeVault(address)" \
  0x2222222222222222222222222222222222222222 \
  --rpc-url https://rpc.test.mezo.org \
  --private-key $PRIVATE_KEY
```

## 📊 Expected APR

Once connected to Mezo Stability Pool:
- **Base APR:** ~5-7% (from Mezo protocol)
- **Variable:** Depends on BTC collateral and MUSD supply
- **Auto-updates:** YieldAggregator tracks real yields from Mezo

## 🔗 Mezo Resources

- **Stability Pool Contract:** `0x1CCA7E410eE41739792eA0A24e00349Dd247680e`
- **Docs:** https://docs.mezo.org
- **Explorer:** https://explorer.mezo.org

## 🧪 Testing Yields (Local)

For testing purposes, the current setup uses:
- **Time-based calculation:** `yield = principal * apr * time / (10000 * 365 days)`
- **5% APR:** Simulated yields accrue over time
- **Works for:** Testing UI, calculations, and user flows

## 📝 Notes

1. **Why yields are 0 now:**
   - No real vault deployed yet
   - Placeholder vaults don't generate yields
   - Time-based calculation needs time to accrue

2. **Why this is okay for testing:**
   - All infrastructure is ready
   - Just needs StabilityPoolStrategy deployment
   - Can test deposits/withdrawals without real yields

3. **Production timeline:**
   - Deploy StabilityPoolStrategy: ~5 minutes
   - Configure YieldAggregator: ~2 minutes
   - Real yields start flowing: Immediately

## ✅ Quick Deploy Checklist

- [ ] Deploy StabilityPoolStrategy
- [ ] Add as vault to YieldAggregator
- [ ] Remove placeholder vaults
- [ ] Verify yields are flowing
- [ ] Update frontend APR display
- [ ] Test deposit → wait → see yields → withdraw
