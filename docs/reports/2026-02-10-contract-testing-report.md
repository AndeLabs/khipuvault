# KhipuVault Contract Testing Report

**Date:** 2026-02-10
**Network:** Mezo Testnet (Chain ID: 31611)
**Deployer Wallet:** `0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257`

---

## Executive Summary

Comprehensive testing of all deployed V3 contracts on Mezo testnet. All core contracts are functional with minor issues identified.

| Contract          | Status  | Owner    | Issues                 |
| ----------------- | ------- | -------- | ---------------------- |
| IndividualPoolV3  | Working | Deployer | None                   |
| CooperativePoolV3 | Working | Deployer | **FIXED** - Redeployed |
| YieldAggregatorV3 | Working | Deployer | None                   |
| LotteryPoolV3     | Working | Deployer | Round expired          |
| RotatingPool      | Working | Deployer | Active pool            |
| MezoIntegrationV3 | Working | Deployer | None                   |

---

## 1. Wallet Balances

```
Address: 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257
BTC Balance: 0.007 BTC
MUSD Balance: ~1794 MUSD
```

---

## 2. IndividualPoolV3 (0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393)

### Configuration

| Parameter             | Value                                      |
| --------------------- | ------------------------------------------ |
| Version               | 3.0.0                                      |
| Owner                 | 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257 |
| MIN_DEPOSIT           | 10 MUSD                                    |
| MAX_DEPOSIT           | 100,000 MUSD                               |
| MIN_WITHDRAWAL        | 1 MUSD                                     |
| Total Deposited       | 4,196 MUSD                                 |
| Total Yield Generated | ~56 MUSD                                   |
| YieldAggregator       | 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6 |

### Deployer Position

| Field         | Value     |
| ------------- | --------- |
| Deposit       | 90 MUSD   |
| Pending Yield | ~1.2 MUSD |
| Days Active   | 99        |
| Auto-Compound | Disabled  |

### Findings

- Contract fully functional
- Deposit/withdraw operations work correctly
- Yield accumulation working (6% APR)
- **Note:** MIN_DEPOSIT uses constant (10 MUSD), not configurable state variable

---

## 3. CooperativePoolV3 (0xA39EE76DfC5106E78ABcB31e7dF5bcd4EfD3Cd1F)

### Configuration

| Parameter     | Value                                      |
| ------------- | ------------------------------------------ |
| Version       | 3.1.0                                      |
| Owner         | 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257 |
| Pool Count    | 0 (fresh deployment)                       |
| Total Balance | 0 MUSD                                     |

### FIXED

**Contract redeployed with correct initialization.**

Previous issue: The old contract at `0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88` had owner = 0x0 due to incorrect parameter order in Deploy.s.sol.

**Root Cause:** Deploy.s.sol passed parameters in wrong order:

```solidity
// WRONG (old)
initialize(musdToken, yieldAggregator, feeCollector, PERFORMANCE_FEE)

// CORRECT (fixed)
initialize(mezoIntegration, yieldAggregator, musdToken, feeCollector)
```

**Resolution:** Created RedeployCooperativePool.s.sol and deployed new contract with correct params

---

## 4. YieldAggregatorV3 (0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6)

### Configuration

| Parameter          | Value                                      |
| ------------------ | ------------------------------------------ |
| Owner              | 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257 |
| MUSD Balance       | 4,206 MUSD                                 |
| Authorized Callers | IndividualPoolV3                           |

### Pending Yields

| Pool             | Pending Yield |
| ---------------- | ------------- |
| IndividualPoolV3 | 56 MUSD       |

### Findings

- Working correctly
- IndividualPool authorized as caller
- Yield calculation functional

---

## 5. LotteryPoolV3 (0x8c9cc22f5184bB4E485dbb51531959A8Cf0624b4)

### Configuration

| Parameter       | Value                                      |
| --------------- | ------------------------------------------ |
| Owner           | 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257 |
| Active Round    | None (0)                                   |
| YieldAggregator | 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6 |

### Round #1

| Field        | Value                  |
| ------------ | ---------------------- |
| Ticket Price | 10 MUSD                |
| Max Tickets  | 1,000                  |
| Tickets Sold | 0                      |
| Total MUSD   | 0                      |
| Status       | OPEN                   |
| Start Time   | Dec 28, 2025           |
| End Time     | Jan 20, 2026 (EXPIRED) |

### Issue

- Round 1 is past its end time but still marked OPEN
- No tickets were purchased
- Round needs to be cancelled or force-completed

**Recommendation:** Admin should call `cancelRound(1)` or `forceComplete(1)`

---

## 6. RotatingPool (0x1b7AB2aF7d58Fb8a137c237d93068A24808a7B04)

### Configuration

| Parameter      | Value                                      |
| -------------- | ------------------------------------------ |
| Owner          | 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257 |
| Implementation | 0x2dD9dF3324f5eE1A88f70023d59db1BE30B7C8E1 |

### Pool #1 "Flow Test ROSCA"

| Field                 | Value     |
| --------------------- | --------- |
| Organizer             | Deployer  |
| Total Members         | 3         |
| Contribution          | 0.001 BTC |
| Period Duration       | 7 days    |
| Current Period        | 1         |
| Total Periods         | 3         |
| Collected This Period | 0.003 BTC |
| Status                | ACTIVE    |
| Use Native BTC        | Yes       |

### Findings

- ROSCA pool working correctly
- 3 members contributing 0.001 BTC each
- First period fully funded (0.003 BTC)
- Native BTC support enabled

---

## 7. MezoIntegrationV3 (0xab91e387F8faF1FEBF7FF7E019e2968F19c177fD)

### Configuration

| Parameter  | Value                                      |
| ---------- | ------------------------------------------ |
| Version    | 3.1.0                                      |
| Owner      | 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257 |
| Paused     | No                                         |
| Target LTV | 50% (5000 bps)                             |

### Mezo Protocol Integration

| Contract            | Address                                    |
| ------------------- | ------------------------------------------ |
| MUSD_TOKEN          | 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503 |
| BORROWER_OPERATIONS | 0xCdF7028ceAB81fA0C6971208e83fa7872994beE5 |
| TROVE_MANAGER       | 0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0 |
| PRICE_FEED          | 0x86bCF0841622a5dAC14A313a15f96A95421b9366 |

### Findings

- Properly initialized with all Mezo protocol addresses
- Flash loan protection enabled
- Native BTC deposit support working

---

## Action Items

### Critical (P0) - RESOLVED

1. ~~**CooperativePoolV3 zero owner**~~ - **FIXED**: Redeployed at `0xA39EE76DfC5106E78ABcB31e7dF5bcd4EfD3Cd1F`

### High Priority (P1)

2. **LotteryPool expired round** - Cancel or force-complete round 1

### Medium Priority (P2)

3. **IndividualPool constants** - Current deployment uses hardcoded limits, not configurable. Future deployments should use state variables.

### Low Priority (P3)

4. **Documentation** - Update deployed.json with findings
5. **Monitoring** - Set up alerts for contract events

---

## Recommendations

### Short-term

1. Redeploy CooperativePoolV3 with correct owner initialization
2. Admin: Cancel expired LotteryPool round 1
3. Update frontend to handle expired rounds gracefully

### Medium-term

1. Add admin dashboard for monitoring
2. Implement round auto-cleanup in LotteryPool
3. Add multi-sig support for admin functions

### Long-term

1. Consider Chainlink VRF for LotteryPool randomness
2. Add cross-pool yield optimization
3. Implement governance token for decentralization

---

## Test Commands Reference

```bash
# Check contract version
cast call <address> "version()" --rpc-url https://rpc.test.mezo.org

# Check owner
cast call <address> "owner()" --rpc-url https://rpc.test.mezo.org

# Check implementation (for proxies)
cast storage <proxy> 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc --rpc-url https://rpc.test.mezo.org

# Get user info (IndividualPool)
cast call 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393 "getUserInfo(address)" <user> --rpc-url https://rpc.test.mezo.org
```

---

_Report generated: 2026-02-10_
