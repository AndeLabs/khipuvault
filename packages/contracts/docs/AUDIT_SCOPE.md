# KhipuVault - Audit Scope Document

**Project:** KhipuVault - Decentralized Bitcoin Savings Platform
**Version:** 3.1.0
**Date:** January 2026
**Network:** Mezo Testnet (Chain ID: 31611) → Mainnet (Chain ID: 31612)

---

## Scope Summary

| Metric                    | Value                          |
| ------------------------- | ------------------------------ |
| **Contracts in Scope**    | 7 core contracts               |
| **Lines of Code**         | ~3,500 LOC (excluding tests)   |
| **Complexity**            | Medium-High                    |
| **External Dependencies** | OpenZeppelin v5, Chainlink VRF |

---

## Contracts in Scope

### Core Pool Contracts

| Contract                | Path            | LOC | Upgradeable |
| ----------------------- | --------------- | --- | ----------- |
| `IndividualPoolV3.sol`  | `src/pools/v3/` | 615 | Yes (UUPS)  |
| `CooperativePoolV3.sol` | `src/pools/v3/` | 850 | Yes (UUPS)  |
| `LotteryPoolV3.sol`     | `src/pools/v3/` | 745 | No          |
| `RotatingPool.sol`      | `src/pools/v3/` | 900 | No          |
| `BasePoolV3.sol`        | `src/pools/v3/` | 210 | Abstract    |

### Integration Contracts

| Contract                | Path                | LOC | Upgradeable |
| ----------------------- | ------------------- | --- | ----------- |
| `MezoIntegrationV3.sol` | `src/integrations/` | 580 | Yes (UUPS)  |
| `YieldAggregatorV3.sol` | `src/aggregators/`  | 650 | Yes (UUPS)  |

---

## Out of Scope

- Test contracts (`test/`, `mocks/`)
- Deployment scripts (`script/`)
- OpenZeppelin library code
- Chainlink VRF contracts
- External Mezo Protocol contracts

---

## Key Functionality

### 1. Individual Savings Pool

- MUSD deposits with auto-compounding
- Referral system with reserved rewards
- Performance fee on yields
- Flash loan protection

### 2. Cooperative Savings Pool

- Group savings with proportional yield distribution
- Member join/leave mechanics
- Pool lifecycle management (ACCEPTING → ACTIVE → CLOSED)

### 3. Lottery Pool

- No-loss lottery using commit-reveal randomness
- Ticket purchase and winner selection
- Prize distribution (90% to winner, 10% to treasury)

### 4. Yield Aggregator

- Multi-vault yield optimization
- TVL tracking and APR calculation
- Vault health monitoring

### 5. Mezo Integration

- BTC collateralization
- MUSD minting/burning
- Collateral ratio management

---

## Security Mechanisms

| Mechanism             | Implementation                            |
| --------------------- | ----------------------------------------- |
| Reentrancy Guard      | OpenZeppelin `ReentrancyGuardUpgradeable` |
| Access Control        | `OwnableUpgradeable`                      |
| Flash Loan Protection | `tx.origin == msg.sender` check           |
| Pausable              | OpenZeppelin `PausableUpgradeable`        |
| Safe Token Transfers  | OpenZeppelin `SafeERC20`                  |
| Upgrade Pattern       | UUPS with storage gaps                    |

---

## Known Fixed Issues

### C-01: Referral Rewards Insolvency ✅

**File:** `IndividualPoolV3.sol`
**Fix:** `referralRewardsReserve` variable tracks actual reserved funds.

### C-02: Lottery Ticket Index Bug ✅

**File:** `LotteryPoolV3.sol`
**Fix:** `ticketOwners` mapping ensures O(1) ticket ownership lookup.

---

## Testing Coverage

```
Total Tests: 207
Passed: 207
Failed: 0
Skipped: 5

Coverage by Contract:
- IndividualPoolV3: 42 tests
- CooperativePoolV3: 11 tests
- LotteryPoolV3: 28 tests
- YieldAggregatorV3: 54 tests
- MezoIntegrationV3: 37 tests
```

---

## Build & Test Commands

```bash
# Install dependencies
forge install

# Build contracts
forge build

# Run tests
forge test

# Run tests with gas report
forge test --gas-report

# Generate coverage
forge coverage --report lcov
```

---

## Focus Areas for Audit

### High Priority

1. **Reentrancy vulnerabilities** in deposit/withdraw flows
2. **Access control** on admin functions
3. **Upgrade mechanism** safety (UUPS)
4. **Flash loan attack vectors**
5. **Integer overflow/underflow** in yield calculations

### Medium Priority

1. **Oracle price manipulation** in Mezo integration
2. **Gas optimization** opportunities
3. **Event emission** completeness
4. **Storage layout** compatibility for upgrades

### Low Priority

1. **Code quality** and best practices
2. **Documentation** accuracy
3. **Gas efficiency** improvements

---

## Contact

**Security Contact:** security@khipuvault.com
**Technical Contact:** dev@khipuvault.com
**Repository:** [Private - access provided upon engagement]

---

## Appendix: Contract Addresses (Testnet)

| Contract          | Address                                      |
| ----------------- | -------------------------------------------- |
| IndividualPoolV3  | `0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393` |
| CooperativePoolV3 | `0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88` |
| MezoIntegration   | `0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6` |
| YieldAggregator   | `0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6` |
| MUSD              | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` |

**RPC:** `https://rpc.test.mezo.org`
**Chain ID:** 31611
