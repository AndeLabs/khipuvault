# KhipuVault Smart Contracts - Security Audit Documentation

**Version:** 3.1.0
**Date:** 2026-01-12
**Solidity Version:** 0.8.25
**Security Contact:** security@khipuvault.com

---

## Recent Security Fixes (January 2026)

### C-01: Referral Rewards Insolvency (FIXED)

**Location:** `IndividualPoolV3.sol`
**Issue:** Referral rewards were accrued without reserving actual funds.
**Fix:** Added `referralRewardsReserve` tracking. Bonus is now deducted from deposit and reserved. `claimReferralRewards()` verifies sufficient reserves.

### C-02: Lottery Ticket Index Bug (FIXED)

**Location:** `LotteryPoolV3.sol`
**Issue:** Non-contiguous ticket purchases caused orphaned tickets.
**Fix:** Added `ticketOwners` mapping for O(1) ownership lookup. Each ticket is now explicitly assigned to its owner.

---

## Executive Summary

KhipuVault is a decentralized savings platform built on Bitcoin that enables users to deposit BTC, mint MUSD stablecoin through the Mezo protocol, and generate yields through DeFi integrations. The platform offers four distinct pool types:

1. **Individual Pools** - Personal savings accounts with auto-compounding
2. **Cooperative Pools** - Group savings with shared yield distribution
3. **Lottery Pools** - No-loss lottery using Chainlink VRF
4. **Rotating Pools** - ROSCA (Rotating Savings and Credit Association) implementation

### Key Statistics

| Metric                | Value                                       |
| --------------------- | ------------------------------------------- |
| Total Contracts       | 7 core contracts                            |
| Upgradeable Contracts | 4 (UUPS pattern)                            |
| External Dependencies | OpenZeppelin, Chainlink, Mezo Protocol      |
| Supported Tokens      | BTC (native), WBTC, MUSD                    |
| Proxy Pattern         | UUPS (Universal Upgradeable Proxy Standard) |

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Pool Contracts                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Individual   │  │ Cooperative  │  │  Lottery     │     │
│  │   PoolV3     │  │   PoolV3     │  │    Pool      │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │           Rotating Pool (ROSCA)                     │    │
│  └─────────────────────┬───────────────────────────────┘    │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                Integration Layer                            │
│  ┌──────────────────────────┐  ┌────────────────────────┐  │
│  │   MezoIntegrationV3      │  │  YieldAggregatorV3     │  │
│  │  (BTC → MUSD Minting)    │  │  (Multi-Vault Yields)  │  │
│  └──────────┬───────────────┘  └────────┬───────────────┘  │
└─────────────┼──────────────────────────┼────────────────────┘
              │                          │
┌─────────────▼──────────────────────────▼────────────────────┐
│                External Protocols                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Mezo Protocol│  │   Chainlink  │  │  DeFi Vaults │     │
│  │ (BTC/MUSD)   │  │     VRF      │  │ (Aave, etc.) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Fund Flow Diagram

```
┌──────────┐                                    ┌──────────────┐
│   User   │───(1) Deposit BTC/WBTC ──────────▶│  Pool Layer  │
└──────────┘                                    └──────┬───────┘
                                                       │
                                                       │ (2) Forward BTC
                                                       ▼
                                               ┌───────────────┐
                                               │ Mezo Protocol │
                                               │ Integration   │
                                               └───────┬───────┘
                                                       │
                                                       │ (3) Mint MUSD
                                                       ▼
                                               ┌───────────────┐
                                               │     Yield     │
                                               │  Aggregator   │
                                               └───────┬───────┘
                                                       │
                                                       │ (4) Deposit MUSD
                                                       ▼
                                               ┌───────────────┐
                                               │  DeFi Vaults  │
                                               │ (Aave, etc.)  │
                                               └───────┬───────┘
                                                       │
                                                       │ (5) Yield Generation
                                                       ▼
┌──────────┐                                   ┌───────────────┐
│   User   │◀───(6) Claim Yields/Withdraw─────│  Pool Layer   │
└──────────┘                                   └───────────────┘
```

---

## Contract Roles and Permissions

### Role Matrix

| Role                  | Contract         | Permissions             | Critical Actions                   |
| --------------------- | ---------------- | ----------------------- | ---------------------------------- |
| **Owner**             | All Upgradeable  | Full admin control      | Upgrade contracts, pause, set fees |
| **User**              | Pool Contracts   | Deposit/Withdraw        | Manage their own positions         |
| **Fee Collector**     | All Pools        | Receive fees            | Collect performance fees           |
| **VRF Coordinator**   | Lottery Pool     | Provide randomness      | Select lottery winners             |
| **Authorized Caller** | Yield Aggregator | Bypass flash loan check | Enable pool contracts to interact  |

### Permission Hierarchy

```
Owner (Admin)
    ├── Upgrade contract implementations
    ├── Pause/Unpause operations
    ├── Set performance fees (max 10%)
    ├── Set referral bonuses (max 5%)
    ├── Change fee collector
    ├── Enable/Disable emergency mode
    ├── Add/Remove yield vaults
    └── Set authorized callers

Fee Collector
    └── Receive performance fees (no active permissions)

Users
    ├── Deposit funds
    ├── Withdraw funds
    ├── Claim yields
    ├── Toggle auto-compound (Individual Pool)
    └── Join/Leave pools
```

---

## Critical Invariants

The following invariants MUST hold at all times:

### 1. Balance Invariants

```solidity
// Individual Pool
totalMusdDeposited == sum(userDeposits[i].musdAmount) for all i

// Cooperative Pool
pool.totalBtcDeposited == sum(poolMembers[poolId][member].btcContributed) for all members

// Lottery Pool
lottery.totalBtcCollected == sum(participants[roundId][i].btcContributed) for all i

// Yield Aggregator
totalValueLocked == sum(vaults[i].totalDeposited) for all active vaults
```

### 2. Collateral Ratio Invariants

```solidity
// Mezo Integration
collateralRatio >= 110% (11000 basis points) for all positions
// If violated, position is unhealthy and may be liquidated

// Target LTV = 50% (5000 basis points)
musdMinted <= (btcCollateral * btcPrice * targetLtv) / 10000
```

### 3. Yield Distribution Invariants

```solidity
// User's proportional yield should match their share
userYield = (totalPoolYield * userShares) / totalShares

// Performance fee cap
performanceFee <= 1000 (10%)

// Referral bonus cap
referralBonus <= 500 (5%)
```

### 4. State Transition Invariants

```solidity
// Pool status transitions (Cooperative Pool)
ACCEPTING → ACTIVE → CLOSED (one-way, irreversible)

// Lottery status transitions
OPEN → DRAWING → COMPLETED (one-way, irreversible)
OPEN → CANCELLED (emergency only)

// User deposit status
!active → active (on first deposit)
active → !active (on full withdrawal only)
```

### 5. Access Control Invariants

```solidity
// Only owner can upgrade
_authorizeUpgrade() requires msg.sender == owner()

// Flash loan protection (when not in emergency mode)
tx.origin == msg.sender OR authorizedCaller[msg.sender] == true

// Reentrancy guard
nonReentrant modifier MUST be active on all state-changing external functions
```

---

## Attack Surfaces and Mitigations

### 1. Reentrancy Attacks

**Risk Level:** HIGH

**Vulnerable Functions:**

- All deposit/withdraw functions
- Yield claim functions
- Pool join/leave functions

**Mitigations Implemented:**

```solidity
// OpenZeppelin ReentrancyGuard on all state-changing functions
function withdraw() external nonReentrant { ... }

// Checks-Effects-Interactions pattern
function claimYield() external nonReentrant {
    // 1. Checks
    require(userDeposit.active, "No active deposit");

    // 2. Effects (state updates BEFORE external calls)
    userDeposit.yieldAccrued = 0;

    // 3. Interactions (external calls LAST)
    MUSD.safeTransfer(msg.sender, netYield);
}
```

### 2. Flash Loan Attacks

**Risk Level:** HIGH

**Attack Vector:**

- Manipulate pool ratios within a single transaction
- Sandwich attack on yield distribution

**Mitigations Implemented:**

```solidity
modifier noFlashLoan() {
    if (!emergencyMode && tx.origin != msg.sender) revert FlashLoanDetected();
    _;
}

// Applied to all deposit/withdraw functions
function deposit(uint256 amount) external nonReentrant noFlashLoan { ... }
```

**Note:** Emergency mode allows bypassing this check for recovery scenarios.

### 3. Integer Overflow/Underflow

**Risk Level:** LOW (Solidity 0.8.25 has built-in checks)

**Additional Protections:**

```solidity
// Packed storage with explicit uint128/uint64 sizes
struct UserDeposit {
    uint128 musdAmount;    // Max: 340T MUSD
    uint128 yieldAccrued;  // Max: 340T MUSD
    uint64 depositTimestamp; // Valid until year 2554
    // ...
}
```

### 4. Front-Running

**Risk Level:** MEDIUM

**Vulnerable Operations:**

- Lottery ticket purchases (winner determination)
- Yield vault deposits (APR changes)

**Mitigations:**

```solidity
// Chainlink VRF for unpredictable randomness
function requestDraw(uint256 roundId) external {
    uint256 requestId = VRF_COORDINATOR.requestRandomWords(...);
    // Winner selected in callback, cannot be front-run
}

// Commit-reveal pattern for time-sensitive operations
// (Could be enhanced in future versions)
```

### 5. Oracle Manipulation

**Risk Level:** HIGH

**Vulnerable Components:**

- BTC price feed (Mezo Integration)
- APR calculations (Yield Aggregator)

**Mitigations:**

```solidity
// Price staleness check
function _getCurrentPrice() internal returns (uint256 price) {
    try PRICE_FEED.fetchPrice() returns (uint256 _price) {
        if (_price == 0) revert PriceFeedFailure();
        price = _price;
    } catch {
        revert PriceFeedFailure();
    }
}

// Mezo protocol uses Chainlink price feeds
// Additional staleness threshold: 3600 seconds (1 hour)
```

### 6. Denial of Service

**Risk Level:** MEDIUM

**Attack Vectors:**

- Gas limit attacks on unbounded loops
- Block gas limit exhaustion

**Mitigations:**

```solidity
// Bounded iterations
uint256 public constant MAX_MEMBERS = 100;
uint256 public constant MAX_VAULTS = 10;

// Pausable pattern for emergency stops
function pause() external onlyOwner {
    _pause();
}
```

### 7. Centralization Risks

**Risk Level:** MEDIUM

**Concerns:**

- Owner can upgrade contracts
- Owner can pause operations
- Owner controls fee parameters

**Mitigations:**

- UUPS proxy pattern (owner-controlled upgrades)
- Fee caps enforced in code:
  ```solidity
  if (newFee > 1000) revert InvalidFee(); // Max 10%
  ```
- Transparent upgrade process
- Multi-sig recommended for production

---

## External Dependencies

### OpenZeppelin Contracts

**Version:** 5.x (upgradeable)

**Used Components:**

- `Initializable` - Initialization logic
- `UUPSUpgradeable` - Upgrade mechanism
- `OwnableUpgradeable` - Access control
- `ReentrancyGuardUpgradeable` - Reentrancy protection
- `PausableUpgradeable` - Circuit breaker
- `SafeERC20` - Safe token transfers

**Risk Assessment:** LOW (battle-tested, audited library)

### Chainlink VRF v2

**Version:** v0.8

**Used In:** LotteryPool

**Functions:**

- `requestRandomWords()` - Request verifiable randomness
- `fulfillRandomWords()` - Receive randomness callback

**Risk Assessment:** LOW (decentralized oracle network)

**Configuration:**

```solidity
uint32 constant CALLBACK_GAS_LIMIT = 200000;
uint16 constant REQUEST_CONFIRMATIONS = 3;
uint32 constant NUM_WORDS = 1;
```

### Mezo Protocol

**Used In:** MezoIntegrationV3

**Interfaces:**

- `IMezoBorrowerOperations` - Open/adjust/close troves
- `IMezoPriceFeed` - BTC price oracle
- `IMezoTroveManager` - Trove state queries
- `IMezoHintHelpers` - Position hint calculation

**Risk Assessment:** MEDIUM (external protocol dependency)

**Mitigation:**

- Health checks on all operations
- Emergency mode bypass
- Collateral ratio monitoring

---

## Design Decisions and Trade-offs

### 1. UUPS vs Transparent Proxy

**Choice:** UUPS (Universal Upgradeable Proxy Standard)

**Rationale:**

- Lower deployment costs (no admin slot in proxy)
- Upgrade logic in implementation (cheaper proxy)
- Better gas efficiency

**Trade-off:**

- Implementation can brick upgrades if `_authorizeUpgrade()` is broken
- Requires careful testing of upgrade paths

### 2. Storage Packing

**Implementation:**

```solidity
struct UserDeposit {
    uint128 musdAmount;      // Slot 0
    uint128 yieldAccrued;    // Slot 0
    uint64 depositTimestamp; // Slot 1
    uint64 lastYieldUpdate;  // Slot 1
    bool active;             // Slot 1
    bool autoCompound;       // Slot 1
}
```

**Benefits:**

- Saves ~40k gas per transaction
- 2 slots instead of 5

**Trade-off:**

- Reduced max values (uint128 max = 340T, sufficient for MUSD)
- More complex to read/debug

### 3. Flash Loan Protection

**Implementation:** `tx.origin != msg.sender` check

**Rationale:**

- Simple and effective against flash loan attacks
- Can be disabled in emergency mode

**Trade-off:**

- Blocks contract-to-contract interactions
- Requires authorized caller whitelist for pools
- May break wallet integrations (AA wallets, etc.)

**Alternative Considered:** Time-locked deposits (rejected due to poor UX)

### 4. Yield Calculation Method

**Choice:** Linear APR calculation with time-based accrual

```solidity
pendingYield = (principal * apr * timeElapsed) / (10000 * 365 days)
```

**Rationale:**

- Predictable and transparent
- Gas efficient
- Easy to audit

**Trade-off:**

- Not compound interest (simpler but less accurate)
- APR is manually set by admin (not auto-updated)

### 5. Emergency Mode

**Purpose:** Allow recovery in critical situations

**Effects:**

- Disables flash loan protection
- Waives performance fees
- Maintains core withdraw functionality

**Risk:** Owner can abuse to bypass security checks

**Mitigation:** Should only be used with governance/multi-sig approval

---

## Known Limitations

### 1. Price Oracle Dependency

**Issue:** Relies on Mezo's price feed for BTC valuation

**Impact:** If oracle is compromised, collateral ratios may be incorrect

**Recommendation:**

- Monitor oracle health
- Implement circuit breakers on large price movements
- Consider multi-oracle approach in future versions

### 2. Centralized Upgrade Control

**Issue:** Single owner can upgrade contracts

**Impact:** Owner could introduce malicious code

**Recommendation:**

- Use multi-sig wallet as owner
- Implement timelock on upgrades
- Publish upgrade proposals before execution

### 3. Gas Costs on Large Pools

**Issue:** Cooperative pools with many members require loops

**Impact:** High gas costs for operations affecting all members

**Current Limit:** MAX_MEMBERS = 100

**Recommendation:**

- Paginate large operations
- Consider off-chain computation with on-chain verification

### 4. No Native ETH Support

**Issue:** Lottery and Rotating pools use WBTC, not native BTC

**Impact:** Extra wrapping step for users

**Note:** Individual/Cooperative pools support native BTC through Mezo

### 5. Lack of Slippage Protection

**Issue:** No slippage parameters on yields

**Impact:** Users may receive less than expected during volatile periods

**Recommendation:**

- Add minimum output amounts to withdraw functions
- Display expected yields before transactions

---

## Testing Recommendations for Auditors

### Critical Test Cases

1. **Reentrancy Tests**
   - Attempt reentrant calls via malicious ERC20
   - Test all state-changing functions

2. **Overflow Tests**
   - Test edge cases with max uint128 values
   - Verify timestamp handling beyond 2^64

3. **Access Control Tests**
   - Verify only owner can upgrade
   - Test unauthorized fee changes
   - Attempt to bypass flash loan protection

4. **State Transition Tests**
   - Invalid pool status transitions
   - Deposit after withdrawal
   - Claim after position closed

5. **Economic Tests**
   - Verify yield calculations match expected
   - Test fee distribution accuracy
   - Validate collateral ratio maintenance

6. **Integration Tests**
   - Mock Mezo protocol failures
   - Test Chainlink VRF callback handling
   - Simulate yield vault failures

### Fuzzing Targets

```solidity
// Target these functions with random inputs
- deposit(uint256 amount)
- withdraw(uint256 amount)
- claimYield()
- depositAndMintNative() payable
- burnAndWithdraw(uint256 musdAmount)
```

### Invariant Testing

```javascript
// Example invariant tests (Foundry)
function invariant_totalDepositsMatchesSum() public {
    uint256 sum = 0;
    for (uint i = 0; i < users.length; i++) {
        (uint256 deposit,,,,,) = pool.userDeposits(users[i]);
        sum += deposit;
    }
    assertEq(pool.totalMusdDeposited(), sum);
}
```

---

## Deployment and Upgrade Process

### Initial Deployment

1. Deploy implementation contracts
2. Deploy UUPS proxies pointing to implementations
3. Initialize proxies with correct parameters
4. Transfer ownership to multi-sig
5. Verify contracts on block explorer

### Upgrade Process

1. Deploy new implementation contract
2. Test upgrade on testnet
3. Propose upgrade to governance/multi-sig
4. Execute `upgradeTo(newImplementation)` via proxy
5. Verify storage layout compatibility
6. Monitor for issues post-upgrade

### Storage Layout Verification

```bash
# Generate storage layout before upgrade
forge inspect ContractName storage-layout > before.json

# Generate storage layout of new implementation
forge inspect NewContract storage-layout > after.json

# Verify compatibility (no conflicts)
diff before.json after.json
```

---

## Emergency Procedures

### Circuit Breaker Activation

```solidity
// Owner can pause in emergency
pool.pause();

// Users can still withdraw (emergency mode)
pool.setEmergencyMode(true);
```

### Recovery Scenarios

**Scenario 1: Oracle Failure**

- Enable emergency mode
- Allow withdrawals at last known price
- Pause new deposits

**Scenario 2: Yield Vault Exploit**

- Pause affected vault
- Emergency withdraw from vault
- Distribute losses proportionally

**Scenario 3: Upgrade Failure**

- Revert to previous implementation
- Restore from storage snapshot
- Investigate root cause

---

## Audit Checklist

- [ ] Verify all functions have proper access control
- [ ] Check for reentrancy vulnerabilities
- [ ] Validate input sanitization
- [ ] Test upgrade mechanism thoroughly
- [ ] Review external call handling
- [ ] Verify fee calculations
- [ ] Check for integer overflow/underflow
- [ ] Test emergency mode scenarios
- [ ] Validate storage layout for upgrades
- [ ] Review oracle integration
- [ ] Test Chainlink VRF integration
- [ ] Verify yield distribution logic
- [ ] Check for denial of service vectors
- [ ] Validate collateral ratio calculations
- [ ] Test edge cases for all pool types

---

## Contact Information

**Project Team:** KhipuVault
**Security Contact:** security@khipuvault.com
**Repository:** https://github.com/khipuvault
**Documentation:** https://docs.khipuvault.com

---

## Appendix: Contract Addresses (Mainnet TBD)

| Contract          | Address | Proxy Type      |
| ----------------- | ------- | --------------- |
| IndividualPoolV3  | TBD     | UUPS            |
| CooperativePoolV3 | TBD     | UUPS            |
| LotteryPool       | TBD     | Non-upgradeable |
| RotatingPool      | TBD     | Non-upgradeable |
| MezoIntegrationV3 | TBD     | UUPS            |
| YieldAggregatorV3 | TBD     | UUPS            |

---

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**Next Review:** Before mainnet deployment
