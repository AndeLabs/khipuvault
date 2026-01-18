# KhipuVault - Mainnet Deployment Plan

**Project:** KhipuVault
**Target Network:** Mezo Mainnet (Chain ID: 31612)
**Status:** Pre-deployment
**Last Updated:** January 2026

---

## Pre-Deployment Checklist

### 1. Security Requirements

- [ ] **Smart Contract Audit** - External security firm
  - Scope: All V3 contracts
  - Expected duration: 2-3 weeks
  - Budget: $15,000-30,000

- [ ] **Internal Review** - Team code review
  - All critical fixes verified (C-01, C-02)
  - All tests passing (207/207)

- [ ] **Bug Bounty Program** (Optional)
  - Platform: Immunefi or HackerOne
  - Rewards: Up to $10,000 for critical

### 2. Infrastructure Requirements

- [ ] **Multi-sig Wallet**
  - Platform: Safe (Gnosis Safe)
  - Signers: 3 of 5 minimum
  - Purpose: Contract ownership, treasury

- [ ] **Monitoring & Alerting**
  - On-chain monitoring (Tenderly, OpenZeppelin Defender)
  - Price feed monitoring
  - TVL tracking

- [ ] **Backend Infrastructure**
  - API server (production grade)
  - Database backups
  - Load balancing

### 3. Contract Deployment Order

```
Phase 1: Core Dependencies
├── 1. Deploy UUPS Proxies infrastructure
├── 2. Deploy YieldAggregatorV3 (implementation + proxy)
└── 3. Deploy MezoIntegrationV3 (implementation + proxy)

Phase 2: Pool Contracts
├── 4. Deploy IndividualPoolV3 (implementation + proxy)
├── 5. Deploy CooperativePoolV3 (implementation + proxy)
└── 6. Deploy LotteryPoolV3 (non-upgradeable)

Phase 3: Configuration
├── 7. Configure yield vaults
├── 8. Set fee collectors
├── 9. Set operators (lottery)
└── 10. Transfer ownership to multi-sig
```

---

## Deployment Scripts

### Environment Variables Required

```bash
# .env.mainnet
DEPLOYER_PRIVATE_KEY=0x...
MAINNET_RPC_URL=https://rpc.mezo.org
MULTISIG_ADDRESS=0x...
FEE_COLLECTOR_ADDRESS=0x...
LOTTERY_OPERATOR_ADDRESS=0x...

# Mezo Protocol Addresses (mainnet)
MEZO_BORROWER_OPERATIONS=0x...
MEZO_PRICE_FEED=0x...
MEZO_TROVE_MANAGER=0x...
MUSD_TOKEN=0x...
```

### Deployment Commands

```bash
# 1. Compile contracts
forge build --optimize --optimizer-runs 200

# 2. Deploy to mainnet
forge script script/DeployMainnet.s.sol \
  --rpc-url $MAINNET_RPC_URL \
  --broadcast \
  --verify

# 3. Verify on block explorer
forge verify-contract <ADDRESS> ContractName \
  --chain-id 31612 \
  --watch
```

---

## Post-Deployment Verification

### Contract Verification

- [ ] All contracts verified on block explorer
- [ ] Correct initialization parameters
- [ ] Owner set to multi-sig
- [ ] Correct fee collector addresses
- [ ] Correct operator addresses

### Functional Tests

- [ ] Deposit flow works
- [ ] Withdraw flow works
- [ ] Yield claiming works
- [ ] Referral system works
- [ ] Lottery ticket purchase works
- [ ] Emergency pause works

### Integration Tests

- [ ] Frontend connected to mainnet contracts
- [ ] API configured for mainnet
- [ ] Indexer syncing events

---

## Rollout Strategy

### Phase 1: Soft Launch (Week 1)

- **Cap:** $100,000 TVL limit
- **Users:** Whitelisted early testers
- **Features:** Individual Pool only
- **Monitoring:** 24/7 team availability

### Phase 2: Limited Launch (Week 2-3)

- **Cap:** $500,000 TVL limit
- **Users:** Public with KYC
- **Features:** Individual + Cooperative Pools
- **Monitoring:** Active monitoring, daily reviews

### Phase 3: Full Launch (Week 4+)

- **Cap:** No limit (or high cap)
- **Users:** Fully public
- **Features:** All pools including Lottery
- **Monitoring:** Standard operations

---

## Risk Mitigation

### Emergency Procedures

| Scenario                | Action                             | Owner     |
| ----------------------- | ---------------------------------- | --------- |
| Critical bug discovered | Pause all contracts                | Multi-sig |
| Oracle failure          | Enable emergency mode              | Multi-sig |
| Exploit in progress     | Pause + emergency withdraw         | Multi-sig |
| Upgrade needed          | Deploy new impl, upgrade via proxy | Multi-sig |

### Circuit Breakers

```solidity
// Pause all operations
pool.pause();

// Enable emergency mode (waives fees, allows withdrawals)
pool.setEmergencyMode(true);

// Emergency withdrawal (owner only, emergency mode only)
pool.emergencyWithdraw();
```

### Rollback Plan

1. **Pause contracts** - Stop all user interactions
2. **Assess damage** - Determine scope of issue
3. **Deploy fix** - If upgrade possible
4. **Compensate users** - If funds lost (treasury reserve)
5. **Resume operations** - After thorough testing

---

## Cost Estimates

### Deployment Costs (Gas)

| Contract          | Estimated Gas | Cost (at 20 gwei) |
| ----------------- | ------------- | ----------------- |
| YieldAggregatorV3 | 3,000,000     | ~0.06 ETH         |
| MezoIntegrationV3 | 2,500,000     | ~0.05 ETH         |
| IndividualPoolV3  | 2,800,000     | ~0.056 ETH        |
| CooperativePoolV3 | 3,200,000     | ~0.064 ETH        |
| LotteryPoolV3     | 2,600,000     | ~0.052 ETH        |
| Proxies (5x)      | 500,000 each  | ~0.05 ETH         |
| **Total**         | ~17,000,000   | **~0.35 ETH**     |

### Operational Costs (Monthly)

| Service               | Cost                  |
| --------------------- | --------------------- |
| RPC Provider          | $100-500              |
| Monitoring (Tenderly) | $200                  |
| Server Infrastructure | $500                  |
| **Total**             | **~$800-1,200/month** |

---

## Timeline

```
Week -4: Complete audit preparations
Week -3: Submit to auditor
Week -2 to 0: Audit in progress
Week 0: Receive audit report
Week 1: Fix any audit findings
Week 2: Mainnet deployment
Week 3: Soft launch (limited)
Week 4+: Full public launch
```

---

## Team Responsibilities

| Role           | Responsibility                | Contact                  |
| -------------- | ----------------------------- | ------------------------ |
| Lead Developer | Deployment, verification      | dev@khipuvault.com       |
| Security Lead  | Audit coordination, fixes     | security@khipuvault.com  |
| Operations     | Monitoring, support           | ops@khipuvault.com       |
| Community      | Communications, announcements | community@khipuvault.com |

---

## Success Metrics

### Week 1 (Soft Launch)

- [ ] No critical bugs
- [ ] TVL > $50,000
- [ ] 50+ active users

### Month 1

- [ ] TVL > $500,000
- [ ] 500+ active users
- [ ] No security incidents

### Month 3

- [ ] TVL > $2,000,000
- [ ] 2,000+ active users
- [ ] Yield generation verified
- [ ] Referral system active

---

## Appendix: Contract Addresses

### Testnet (Current)

| Contract          | Address                                      |
| ----------------- | -------------------------------------------- |
| IndividualPoolV3  | `0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393` |
| CooperativePoolV3 | `0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88` |
| MezoIntegration   | `0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6` |
| YieldAggregator   | `0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6` |
| MUSD              | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` |

### Mainnet (TBD)

| Contract          | Address |
| ----------------- | ------- |
| IndividualPoolV3  | TBD     |
| CooperativePoolV3 | TBD     |
| LotteryPoolV3     | TBD     |
| MezoIntegration   | TBD     |
| YieldAggregator   | TBD     |
| Multi-sig         | TBD     |
