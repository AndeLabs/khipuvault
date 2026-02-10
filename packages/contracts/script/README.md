# KhipuVault Deployment Scripts

> Last verified: 2026-02-10 on Mezo Testnet - ALL CHECKS PASS

This folder contains production-ready deployment and maintenance scripts.

## Production Scripts (Mainnet Ready)

### 1. Deploy.s.sol - Main Deployment

Deploys all KhipuVault V3 contracts in the correct order with proper initialization.

**Features:**
- Network-aware configuration (testnet vs mainnet limits)
- Automatic pool authorization in YieldAggregator
- UUPS proxy deployment for all upgradeable contracts
- Comprehensive deployment summary

**Usage:**
```bash
# Dry run (no transaction)
forge script script/Deploy.s.sol --rpc-url $RPC_URL -vvvv

# Deploy to testnet
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.test.mezo.org \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast

# Deploy to mainnet
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.mezo.org \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify
```

**Deployment Order:**
1. YieldAggregatorV3
2. MezoIntegrationV3
3. IndividualPoolV3
4. CooperativePoolV3
5. LotteryPoolV3
6. RotatingPool
7. Authorization configuration

---

### 2. PostDeployVerify.s.sol - Verification

Verifies all contracts are correctly deployed and configured.

**Checks:**
- Contract owners (not 0x0)
- YieldAggregator authorizations
- Contract states (paused, versions)
- MUSD integration

**Usage:**
```bash
forge script script/PostDeployVerify.s.sol --rpc-url $RPC_URL -vvvv
```

**Run this after every deployment to verify setup!**

---

### 3. FixAuthorizations.s.sol - Fix Missing Authorizations

Fixes missing pool authorizations in YieldAggregator for existing deployments.

**When to use:**
- If PostDeployVerify shows unauthorized pools
- After upgrading contracts
- If buyTickets/deposit fails with revert

**Usage:**
```bash
forge script script/FixAuthorizations.s.sol \
  --rpc-url $RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast
```

---

## Test Scripts (script/tests/)

These are integration test scripts for testnet validation:

| Script | Purpose |
|--------|---------|
| MultiUserTest.s.sol | Multi-user deposit/withdraw testing |
| FullFlowTest.s.sol | Complete user flow testing |
| IndividualPoolFlowTest.s.sol | Individual pool operations |
| CooperativePoolFlowTest.s.sol | Cooperative pool operations |
| ProductionTestRotatingPool.s.sol | ROSCA pool testing |

**Usage:**
```bash
forge script script/tests/MultiUserTest.s.sol \
  --rpc-url https://rpc.test.mezo.org \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast
```

---

## Network Configuration

Scripts use `NetworkConfig.s.sol` for network-aware settings:

| Parameter | Testnet | Mainnet |
|-----------|---------|---------|
| Chain ID | 31611 | 31612 |
| Min Deposit | 10 MUSD | 1,800 MUSD |
| Max Deposit | 100,000 MUSD | 100,000 MUSD |

---

## Mainnet Deployment Checklist

### Pre-Deployment
- [ ] All tests pass: `forge test`
- [ ] Security audit complete
- [ ] Multi-sig wallet ready
- [ ] Sufficient deployer balance

### Deployment
1. [ ] Run `Deploy.s.sol` with `--broadcast`
2. [ ] Run `PostDeployVerify.s.sol` to verify
3. [ ] Verify contracts on block explorer
4. [ ] Update frontend addresses

### Post-Deployment
- [ ] Transfer ownership to multi-sig
- [ ] Update documentation
- [ ] Notify team of new addresses

---

## Environment Variables

Required in `.env`:
```
DEPLOYER_PRIVATE_KEY=0x...
```

Optional:
```
ETHERSCAN_API_KEY=...  # For verification
```

---

## Troubleshooting

### "Unauthorized" errors
Run `FixAuthorizations.s.sol` to authorize pools in YieldAggregator.

### "Owner is 0x0"
Contract was initialized with wrong parameters. Redeploy using `Deploy.s.sol`.

### Gas estimation fails
Check contract state and input parameters. Run `PostDeployVerify.s.sol` for diagnostics.
