# KhipuVault Smart Contracts - Documentation

**Project:** KhipuVault
**Version:** 3.0.0
**Solidity:** 0.8.25
**Status:** Pre-Audit
**Last Updated:** 2025-11-27

---

## Documentation Overview

This directory contains comprehensive technical and security documentation for the KhipuVault smart contract suite, prepared for external security auditing.

### Documents

| Document                                     | Purpose                           | Audience                       |
| -------------------------------------------- | --------------------------------- | ------------------------------ |
| [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)     | Main audit documentation          | Auditors, Security Researchers |
| [INDIVIDUAL_POOL.md](./INDIVIDUAL_POOL.md)   | IndividualPoolV3 technical specs  | Auditors, Developers           |
| [COOPERATIVE_POOL.md](./COOPERATIVE_POOL.md) | CooperativePoolV3 technical specs | Auditors, Developers           |
| [THREAT_MODEL.md](./THREAT_MODEL.md)         | Security threats and mitigations  | Auditors, Security Team        |

---

## Quick Start for Auditors

### 1. Begin with the Main Audit Document

Start here: **[SECURITY_AUDIT.md](./SECURITY_AUDIT.md)**

This document provides:

- Executive summary
- System architecture
- Contract roles and permissions
- Critical invariants
- Attack surfaces
- External dependencies
- Design decisions
- Known limitations
- Audit checklist

**Estimated Reading Time:** 45-60 minutes

---

### 2. Review Individual Contracts

After understanding the system, dive into specific contracts:

#### Individual Pool

**Document:** [INDIVIDUAL_POOL.md](./INDIVIDUAL_POOL.md)

- Personal savings accounts
- Auto-compounding feature
- Referral system
- Storage optimization techniques
- Edge cases and error handling

**Key Areas to Audit:**

- Yield calculation logic
- Partial withdrawal mechanics
- Auto-compound trigger conditions
- Referral bonus accounting

---

#### Cooperative Pool

**Document:** [COOPERATIVE_POOL.md](./COOPERATIVE_POOL.md)

- Multi-member pools
- Share-based yield distribution
- Pool lifecycle (ACCEPTING → ACTIVE → CLOSED)
- Proportional withdrawal logic

**Key Areas to Audit:**

- Share calculation fairness
- Yield distribution accuracy
- Member join/leave mechanics
- BTC-MUSD conversion flows

---

### 3. Analyze Security Threats

**Document:** [THREAT_MODEL.md](./THREAT_MODEL.md)

Comprehensive threat analysis including:

- Malicious actor profiles
- Attack vectors with code examples
- Threat scenarios
- Residual risks
- Recommended tests

**Critical Focus Areas:**

- Reentrancy attack vectors
- Flash loan protection effectiveness
- Oracle manipulation risks
- Upgrade security

---

## Contract Summary

### Core Contracts

| Contract              | Type             | Features                                   | Risk Level  |
| --------------------- | ---------------- | ------------------------------------------ | ----------- |
| **IndividualPoolV3**  | UUPS Upgradeable | Personal savings, auto-compound, referrals | MEDIUM      |
| **CooperativePoolV3** | UUPS Upgradeable | Multi-member, share-based yields           | MEDIUM      |
| **LotteryPool**       | Non-upgradeable  | Chainlink VRF lottery, no-loss             | MEDIUM-HIGH |
| **RotatingPool**      | Non-upgradeable  | ROSCA implementation                       | MEDIUM      |
| **MezoIntegrationV3** | UUPS Upgradeable | BTC→MUSD minting                           | HIGH        |
| **YieldAggregatorV3** | UUPS Upgradeable | Multi-vault yield farming                  | MEDIUM      |

---

## Key Security Features

### Implemented Protections

✅ **Reentrancy Protection**

- `nonReentrant` modifier on all state-changing functions
- Checks-Effects-Interactions pattern

✅ **Flash Loan Defense**

- `tx.origin != msg.sender` check
- Authorized caller whitelist for pool interactions

✅ **Access Control**

- OpenZeppelin `Ownable` on admin functions
- Fee caps enforced in code (max 10%)

✅ **Circuit Breaker**

- `Pausable` pattern for emergency stops
- Emergency mode for crisis scenarios

✅ **Cryptographic Randomness**

- Chainlink VRF for lottery draws
- Verifiable and tamper-proof

✅ **Safe Arithmetic**

- Solidity 0.8.25 automatic overflow checks
- No SafeMath library needed

✅ **Safe Token Transfers**

- OpenZeppelin `SafeERC20`
- Handles non-standard tokens

---

## Critical Invariants

Auditors should verify these invariants hold:

### Balance Invariants

```solidity
// Individual Pool
totalMusdDeposited == Σ userDeposits[i].musdAmount

// Cooperative Pool
pool.totalBtcDeposited == Σ member.btcContributed

// Yield Aggregator
totalValueLocked == Σ vault.totalDeposited
```

### Collateral Invariants

```solidity
// Mezo Integration
collateralRatio >= 110% for all positions

// MUSD backing
totalMusdMinted <= btcCollateral * btcPrice * targetLTV
```

### Share Invariants

```solidity
// Cooperative Pool
Σ member.shares == totalShares

// Yield distribution
memberYield = (totalYield * memberShares) / totalShares
```

---

## Audit Focus Areas

### High Priority

1. **Upgrade Mechanism (UUPS)**
   - Storage layout compatibility
   - `_authorizeUpgrade()` access control
   - Initialization protection

2. **Yield Distribution**
   - Share calculation accuracy
   - Proportional distribution fairness
   - Fee deduction correctness

3. **External Integrations**
   - Mezo protocol failure handling
   - Chainlink VRF security
   - Yield vault error handling

4. **Withdrawal Logic**
   - Partial vs full withdrawal
   - BTC-MUSD conversion
   - Insufficient balance scenarios

---

### Medium Priority

5. **Access Control**
   - Owner privilege boundaries
   - Emergency mode limitations
   - Authorized caller management

6. **Economic Attacks**
   - Share manipulation resistance
   - Flash loan bypass attempts
   - Front-running vulnerabilities

7. **Input Validation**
   - Min/max enforcement
   - Zero-address checks
   - Overflow protection

---

### Low Priority

8. **Gas Optimization**
   - Storage packing effectiveness
   - Loop gas costs
   - External call optimization

9. **Event Emissions**
   - Complete audit trail
   - Accurate parameters

---

## Known Limitations

### Acknowledged Risks

1. **Centralized Upgrades**
   - Owner has full upgrade authority
   - **Mitigation:** Multi-sig recommended

2. **Mezo Protocol Dependency**
   - Cannot withdraw if Mezo fails
   - **Mitigation:** Emergency BTC reserve (not implemented)

3. **Oracle Dependency**
   - Relies on Chainlink price feeds
   - **Mitigation:** Delegated to Chainlink security

4. **No Slippage Protection**
   - Withdrawals lack minimum output amounts
   - **Mitigation:** Users should monitor yields before transactions

5. **Gas Costs on Large Pools**
   - 100-member pools may have high gas costs
   - **Mitigation:** MAX_MEMBERS cap, pagination recommended

---

## External Dependencies

| Dependency               | Version           | Security Status | Risk Level |
| ------------------------ | ----------------- | --------------- | ---------- |
| OpenZeppelin Contracts   | 5.x (upgradeable) | Audited         | LOW        |
| Chainlink VRF            | v2                | Audited         | LOW        |
| Mezo Protocol            | Latest            | Assumed Secure  | MEDIUM     |
| DeFi Vaults (Aave, etc.) | Various           | Varies          | MEDIUM     |

---

## Testing Coverage

### Test Types

- **Unit Tests:** Individual function behavior
- **Integration Tests:** Cross-contract interactions
- **Fuzz Tests:** Random input validation
- **Invariant Tests:** Property-based testing
- **Scenario Tests:** Real-world attack simulations

### Recommended Test Commands

```bash
# Run all tests
forge test

# Run with coverage
forge coverage

# Run specific test suite
forge test --match-contract IndividualPoolTest

# Fuzz testing
forge test --fuzz-runs 10000

# Invariant testing
forge test --invariant-runs 1000
```

---

## Deployment Information

### Deployment Order

1. Deploy implementation contracts
2. Deploy UUPS proxies
3. Initialize proxies with parameters
4. Set up authorized callers
5. Transfer ownership to multi-sig
6. Verify on block explorer

### Mainnet Addresses (TBD)

| Contract          | Address | Proxy Type |
| ----------------- | ------- | ---------- |
| IndividualPoolV3  | TBD     | UUPS       |
| CooperativePoolV3 | TBD     | UUPS       |
| LotteryPool       | TBD     | -          |
| RotatingPool      | TBD     | -          |
| MezoIntegrationV3 | TBD     | UUPS       |
| YieldAggregatorV3 | TBD     | UUPS       |

---

## Audit Checklist

Use this checklist during the audit:

### Smart Contract Security

- [ ] No reentrancy vulnerabilities
- [ ] No integer overflow/underflow
- [ ] No unchecked external calls
- [ ] No unprotected selfdestruct
- [ ] No delegatecall to untrusted code
- [ ] No uninitialized storage pointers
- [ ] No floating pragma
- [ ] Safe compiler version (0.8.25)

### Access Control

- [ ] All admin functions protected
- [ ] No privilege escalation paths
- [ ] Emergency functions properly restricted
- [ ] Ownership transfer safe
- [ ] Multi-sig recommended for owner

### Upgradeability

- [ ] Storage layout documented
- [ ] No storage collisions
- [ ] Upgrade authorization secure
- [ ] Initialization protected
- [ ] Gap slots for future storage

### Economic Security

- [ ] Fee calculations correct
- [ ] No precision loss in critical math
- [ ] Share distribution fair
- [ ] No yield manipulation
- [ ] Collateral ratios enforced

### External Integrations

- [ ] Oracle failures handled
- [ ] Third-party reverts caught
- [ ] Chainlink VRF secure
- [ ] Mezo integration safe
- [ ] SafeERC20 used

---

## Contact Information

**Project Team:** KhipuVault
**Security Contact:** security@khipuvault.com
**Website:** https://khipuvault.com
**Documentation:** https://docs.khipuvault.com
**GitHub:** https://github.com/khipuvault

---

## Audit Timeline

**Phase 1: Pre-Audit** (Current)

- ✅ Documentation complete
- ✅ Test coverage > 80%
- ✅ Internal security review

**Phase 2: External Audit** (Pending)

- Engage professional auditor
- 2-4 week audit period
- Address findings

**Phase 3: Post-Audit**

- Implement fixes
- Retest thoroughly
- Publish audit report
- Launch bug bounty

**Phase 4: Mainnet Launch**

- Deploy to mainnet
- Monitor closely
- Gradual TVL ramp

---

## License

MIT License - See individual contracts for details

---

## Changelog

### Version 3.0.0 (2025-11-27)

- Initial audit documentation
- SECURITY_AUDIT.md created
- INDIVIDUAL_POOL.md created
- COOPERATIVE_POOL.md created
- THREAT_MODEL.md created

---

**Document Version:** 1.0
**Status:** Ready for Audit
**Last Updated:** 2025-11-27
