# IndividualPoolV3 - Technical Documentation

**Contract:** `IndividualPoolV3.sol`
**Version:** 3.0.0
**Solidity:** 0.8.25
**Pattern:** UUPS Upgradeable

---

## Overview

IndividualPoolV3 is a personal savings contract that allows users to deposit MUSD (Mezo USD stablecoin), earn yields through DeFi integrations, and optionally auto-compound their returns. It features an integrated referral system and supports incremental deposits and partial withdrawals.

### Key Features

- **UUPS Upgradeable:** Owner-controlled upgrades without changing proxy address
- **Storage Optimization:** Packed structs save ~40k gas per transaction
- **Auto-compounding:** Optional automatic reinvestment of yields
- **Referral System:** Earn bonuses for bringing new users
- **Incremental Deposits:** Add to existing positions
- **Partial Withdrawals:** Withdraw without closing position
- **Emergency Mode:** Bypass restrictions in crisis scenarios

---

## Architecture

### Inheritance Chain

```
IndividualPoolV3
    ├── Initializable (OZ)
    ├── UUPSUpgradeable (OZ)
    ├── OwnableUpgradeable (OZ)
    ├── ReentrancyGuardUpgradeable (OZ)
    └── PausableUpgradeable (OZ)
```

### External Dependencies

```solidity
IYieldAggregator public YIELD_AGGREGATOR;
IERC20 public MUSD;
```

---

## State Variables

### Storage Layout (Optimized)

```solidity
struct UserDeposit {
    uint128 musdAmount;          // Slot 0 (16 bytes)
    uint128 yieldAccrued;        // Slot 0 (16 bytes)
    uint64 depositTimestamp;     // Slot 1 (8 bytes)
    uint64 lastYieldUpdate;      // Slot 1 (8 bytes)
    bool active;                 // Slot 1 (1 byte)
    bool autoCompound;           // Slot 1 (1 byte)
}
// Total: 2 slots (64 bytes) vs 5 slots unpacked (160 bytes)
```

### Mappings

| Variable          | Type                              | Purpose                    |
| ----------------- | --------------------------------- | -------------------------- |
| `userDeposits`    | `mapping(address => UserDeposit)` | User position tracking     |
| `referrers`       | `mapping(address => address)`     | User → Referrer mapping    |
| `referralRewards` | `mapping(address => uint256)`     | Unclaimed referral bonuses |
| `referralCount`   | `mapping(address => uint256)`     | Number of referrals        |

### Global State

| Variable               | Type      | Description                                |
| ---------------------- | --------- | ------------------------------------------ |
| `totalMusdDeposited`   | `uint256` | Sum of all active deposits                 |
| `totalYieldsGenerated` | `uint256` | Cumulative yields earned                   |
| `totalReferralRewards` | `uint256` | Total referral bonuses issued              |
| `performanceFee`       | `uint256` | Fee in basis points (default: 100 = 1%)    |
| `referralBonus`        | `uint256` | Bonus in basis points (default: 50 = 0.5%) |
| `feeCollector`         | `address` | Address receiving fees                     |
| `emergencyMode`        | `bool`    | Emergency bypass flag                      |

### Constants

```solidity
uint256 public constant MIN_DEPOSIT = 10 ether;           // 10 MUSD
uint256 public constant MAX_DEPOSIT = 100_000 ether;      // 100k MUSD
uint256 public constant MIN_WITHDRAWAL = 1 ether;         // 1 MUSD
uint256 public constant AUTO_COMPOUND_THRESHOLD = 1 ether; // 1 MUSD
```

---

## Functions

### Core User Functions

#### `deposit(uint256 musdAmount)`

Deposits MUSD to earn yields.

**Parameters:**

- `musdAmount`: Amount of MUSD to deposit

**Requirements:**

- `musdAmount >= MIN_DEPOSIT` (10 MUSD)
- `totalDeposit <= MAX_DEPOSIT` (100k MUSD)
- Contract not paused
- User has approved contract to spend MUSD

**Effects:**

- Transfers MUSD from user
- Deposits to YieldAggregator
- Updates user position
- Emits `Deposited` event

**Gas Estimate:** ~150k gas (first deposit), ~100k (incremental)

```solidity
// Example usage
MUSD.approve(address(pool), 100 ether);
pool.deposit(100 ether);
```

---

#### `depositWithReferral(uint256 musdAmount, address referrer)`

Deposits MUSD with a referral code.

**Parameters:**

- `musdAmount`: Amount to deposit
- `referrer`: Address of referrer (0x0 if none)

**Referral Logic:**

- Referrer set on first deposit only
- Cannot self-refer
- Referrer earns 0.5% bonus (default) from protocol, not user funds
- Bonus added to `referralRewards[referrer]`

**Effects:**

- Same as `deposit()` plus referral tracking
- Emits `ReferralRecorded` event

```solidity
// Example: Deposit 100 MUSD with referral
pool.depositWithReferral(100 ether, referrerAddress);
```

---

#### `withdrawPartial(uint256 musdAmount)`

Withdraws a portion of the principal.

**Parameters:**

- `musdAmount`: Amount to withdraw

**Requirements:**

- `musdAmount >= MIN_WITHDRAWAL` (1 MUSD)
- `musdAmount <= userDeposit.musdAmount`
- Remaining balance >= MIN_DEPOSIT or 0

**Effects:**

- Updates pending yields first
- Withdraws from YieldAggregator
- Transfers MUSD to user
- Auto-compounds if enabled
- Closes position if remaining < MIN_DEPOSIT

**Gas Estimate:** ~120k gas

```solidity
// Withdraw 50 MUSD
pool.withdrawPartial(50 ether);
```

---

#### `claimYield()`

Claims accrued yields without touching principal.

**Returns:** `netYield` - Amount received after fees

**Effects:**

- Calculates pending yields
- Deducts performance fee (1% default)
- Transfers net yield to user
- Transfers fee to collector
- Resets `yieldAccrued` to 0

**Gas Estimate:** ~90k gas

**Fee Calculation:**

```solidity
grossYield = userDeposit.yieldAccrued + pendingYield
feeAmount = (grossYield * performanceFee) / 10000
netYield = grossYield - feeAmount
```

```solidity
// Claim yields
uint256 netYield = pool.claimYield();
```

---

#### `withdraw()`

Full withdrawal of principal + yields.

**Returns:**

- `musdAmount` - Principal returned
- `netYield` - Yields after fees

**Effects:**

- Closes user position
- Withdraws from YieldAggregator
- Transfers principal + net yield
- Marks position as inactive

**Gas Estimate:** ~130k gas

```solidity
// Full withdrawal
(uint256 principal, uint256 yields) = pool.withdraw();
```

---

### Auto-Compound Functions

#### `setAutoCompound(bool enabled)`

Enables or disables automatic yield compounding.

**Parameters:**

- `enabled`: True to enable, false to disable

**Behavior When Enabled:**

- On each deposit/withdrawal, if `yieldAccrued >= AUTO_COMPOUND_THRESHOLD` (1 MUSD)
- Yields are added to principal automatically
- User earns compounding returns

```solidity
// Enable auto-compound
pool.setAutoCompound(true);
```

**Internal Logic:**

```solidity
function _maybeAutoCompound(address user) internal {
    UserDeposit storage userDeposit = userDeposits[user];

    if (userDeposit.autoCompound && userDeposit.yieldAccrued >= AUTO_COMPOUND_THRESHOLD) {
        uint256 yieldToCompound = userDeposit.yieldAccrued;
        userDeposit.musdAmount += yieldToCompound;
        userDeposit.yieldAccrued = 0;

        emit AutoCompounded(user, yieldToCompound, userDeposit.musdAmount, block.timestamp);
    }
}
```

---

### Referral Functions

#### `claimReferralRewards()`

Claims accumulated referral bonuses.

**Returns:** Amount of rewards claimed

**Requirements:**

- `referralRewards[msg.sender] > 0`

**Effects:**

- Resets rewards to 0
- Transfers MUSD to referrer

**Gas Estimate:** ~50k gas

```solidity
// Claim referral rewards
uint256 rewards = pool.claimReferralRewards();
```

---

#### `getReferralStats(address user)` (view)

Gets referral statistics for a user.

**Returns:**

- `count` - Number of successful referrals
- `rewards` - Unclaimed rewards
- `referrer` - Who referred this user (0x0 if none)

```solidity
(uint256 count, uint256 rewards, address referrer) = pool.getReferralStats(userAddress);
```

---

### View Functions

#### `getUserInfo(address user)` (view)

Comprehensive user position information.

**Returns:**

- `deposit` - Current principal amount
- `yields` - Accrued + pending yields
- `netYields` - Yields after performance fee
- `daysActive` - Days since first deposit
- `estimatedAPR` - Calculated APR based on yields
- `autoCompoundEnabled` - Auto-compound status

```solidity
(
    uint256 deposit,
    uint256 yields,
    uint256 netYields,
    uint256 daysActive,
    uint256 estimatedAPR,
    bool autoCompound
) = pool.getUserInfo(userAddress);
```

**APR Calculation:**

```solidity
estimatedAPR = (yields * 365 * 100) / (deposit * daysActive)
// Example: 10 MUSD deposit, 0.5 MUSD yield in 30 days
// APR = (0.5 * 365 * 100) / (10 * 30) = 60.83%
```

---

#### `getUserTotalBalance(address user)` (view)

Total withdrawable balance.

**Returns:** `principal + netYields`

```solidity
uint256 totalBalance = pool.getUserTotalBalance(userAddress);
```

---

### Admin Functions

#### `setEmergencyMode(bool _enabled)`

**Access:** Owner only

Enables/disables emergency mode.

**Effects:**

- Bypasses flash loan protection
- Waives performance fees
- Allows contract interactions in crisis

---

#### `setPerformanceFee(uint256 newFee)`

**Access:** Owner only

**Requirements:**

- `newFee <= 1000` (max 10%)

**Effects:**

- Updates `performanceFee`
- Applies to future yield claims

---

#### `setReferralBonus(uint256 newBonus)`

**Access:** Owner only

**Requirements:**

- `newBonus <= 500` (max 5%)

---

#### `setFeeCollector(address newCollector)`

**Access:** Owner only

Updates the address receiving fees.

---

#### `pause() / unpause()`

**Access:** Owner only

Circuit breaker for emergency stops.

---

## State Diagram

```
┌─────────────┐
│   Inactive  │ (Initial state)
└──────┬──────┘
       │
       │ deposit()
       ▼
┌─────────────┐
│    Active   │ ◄──┐
│             │    │
│ Earning     │    │ deposit() (incremental)
│ Yields      │    │
└──────┬──────┘    │
       │           │
       ├───────────┘
       │
       │ claimYield() (yields only)
       ├────────────────────────────┐
       │                            │
       │                            ▼
       │                     ┌─────────────┐
       │                     │   Active    │
       │                     │ (yields = 0)│
       │                     └─────────────┘
       │
       │ withdraw() (full)
       ▼
┌─────────────┐
│   Inactive  │ (Position closed)
└─────────────┘
```

---

## Edge Cases and Error Handling

### 1. Dust Amounts After Partial Withdrawal

**Scenario:** User withdraws leaving < MIN_DEPOSIT

**Behavior:**

```solidity
if (userDeposit.musdAmount < MIN_DEPOSIT && userDeposit.musdAmount > 0) {
    // Force full withdrawal
    uint256 remaining = userDeposit.musdAmount;
    userDeposit.musdAmount = 0;
    userDeposit.active = false;
    totalMusdDeposited -= remaining;
    musdAmount += remaining; // Add to withdrawal
}
```

**Effect:** Position automatically closed, all funds returned.

---

### 2. Zero Yield Claim

**Scenario:** User calls `claimYield()` with no accrued yields

**Error:** `InvalidAmount()`

**Prevention:**

```solidity
if (totalYield == 0) revert InvalidAmount();
```

---

### 3. Yield Aggregator Failure

**Scenario:** `YIELD_AGGREGATOR.claimYield()` reverts

**Handling:**

```solidity
uint256 poolYield = YIELD_AGGREGATOR.getPendingYield(address(this));
if (poolYield > 0) {
    YIELD_AGGREGATOR.claimYield(); // May fail
}
// Continue with available balance
```

**Result:** Claims from contract's existing MUSD balance only.

---

### 4. Flash Loan Attempt

**Scenario:** Malicious contract calls via delegatecall

**Protection:**

```solidity
modifier noFlashLoan() {
    if (!emergencyMode && tx.origin != msg.sender) revert FlashLoanDetected();
    _;
}
```

**Limitation:** Blocks all contract interactions unless:

- Emergency mode enabled, OR
- Call is from EOA (tx.origin == msg.sender)

---

### 5. Precision Loss in Yield Calculation

**Scenario:** Small deposits, short time periods

**Example:**

```solidity
// 1 MUSD deposit for 1 second at 10% APR
pendingYield = (1e18 * poolYield * 1e18) / totalMusdDeposited / 1e18
// May round to 0 if poolYield is small
```

**Impact:** Minimal, yields accrue over time.

---

## Gas Optimization Techniques

### 1. Storage Packing

**Before:**

```solidity
struct UserDeposit {
    uint256 musdAmount;          // 32 bytes
    uint256 yieldAccrued;        // 32 bytes
    uint256 depositTimestamp;    // 32 bytes
    uint256 lastYieldUpdate;     // 32 bytes
    bool active;                 // 32 bytes (padded)
}
// Total: 5 slots = 160 bytes
```

**After:**

```solidity
struct UserDeposit {
    uint128 musdAmount;          // 16 bytes
    uint128 yieldAccrued;        // 16 bytes
    uint64 depositTimestamp;     // 8 bytes
    uint64 lastYieldUpdate;      // 8 bytes
    bool active;                 // 1 byte
    bool autoCompound;           // 1 byte
}
// Total: 2 slots = 64 bytes
// Savings: 96 bytes = ~60% reduction
```

**Gas Savings:** ~20k gas per SSTORE (cold), ~3k gas (warm)

---

### 2. Caching Storage Reads

```solidity
// Bad: Multiple SLOAD operations
if (userDeposits[msg.sender].active) {
    userDeposits[msg.sender].musdAmount += amount;
    userDeposits[msg.sender].lastYieldUpdate = block.timestamp;
}

// Good: Single SLOAD, multiple writes
UserDeposit storage userDeposit = userDeposits[msg.sender];
if (userDeposit.active) {
    userDeposit.musdAmount += amount;
    userDeposit.lastYieldUpdate = block.timestamp;
}
```

---

### 3. Safe Arithmetic (Solidity 0.8+)

**Built-in overflow checks:**

```solidity
// No need for SafeMath library
userDeposit.musdAmount += amount; // Reverts on overflow
```

**Gas Savings:** ~200 gas per operation vs SafeMath

---

## Security Considerations

### Critical Checks

1. **Reentrancy Protection:** All state-changing functions use `nonReentrant`
2. **Access Control:** Admin functions restricted to `onlyOwner`
3. **Input Validation:** Min/max checks on all user inputs
4. **Flash Loan Defense:** `noFlashLoan` modifier on deposits/withdrawals
5. **Pausability:** Owner can pause in emergencies

### Potential Vulnerabilities

| Risk                | Mitigation                   | Severity      |
| ------------------- | ---------------------------- | ------------- |
| Reentrancy          | `nonReentrant` modifier      | HIGH → LOW    |
| Flash loans         | `tx.origin` check            | HIGH → MEDIUM |
| Integer overflow    | Solidity 0.8.25              | HIGH → LOW    |
| Centralization      | Owner controls upgrades      | MEDIUM        |
| Oracle manipulation | Delegated to YieldAggregator | MEDIUM        |

---

## Testing Scenarios

### Unit Tests

```solidity
// Test deposit flow
function testDeposit() public {
    uint256 amount = 100 ether;
    musd.approve(address(pool), amount);
    pool.deposit(amount);

    (uint256 deposit,,,,,) = pool.userDeposits(user);
    assertEq(deposit, amount);
}

// Test partial withdrawal
function testPartialWithdraw() public {
    // Setup: deposit 100 MUSD
    pool.deposit(100 ether);

    // Withdraw 50 MUSD
    pool.withdrawPartial(50 ether);

    (uint256 remaining,,,,,) = pool.userDeposits(user);
    assertEq(remaining, 50 ether);
}

// Test auto-compound
function testAutoCompound() public {
    pool.deposit(100 ether);
    pool.setAutoCompound(true);

    // Simulate yield accrual
    vm.warp(block.timestamp + 30 days);

    // Trigger auto-compound via new deposit
    pool.deposit(10 ether);

    // Check principal increased
    (uint256 principal,,,,,) = pool.userDeposits(user);
    assertGt(principal, 110 ether); // > 110 due to compounding
}
```

### Integration Tests

```solidity
// Test with real YieldAggregator
function testIntegrationWithYieldAggregator() public {
    // Deploy full system
    YieldAggregatorV3 aggregator = new YieldAggregatorV3();
    IndividualPoolV3 pool = new IndividualPoolV3();

    // Initialize
    pool.initialize(address(aggregator), address(musd), feeCollector);

    // User deposits
    pool.deposit(100 ether);

    // Verify funds in aggregator
    (uint256 principal,) = aggregator.getUserPosition(address(pool));
    assertEq(principal, 100 ether);
}
```

### Fuzz Tests

```solidity
function testFuzzDeposit(uint256 amount) public {
    amount = bound(amount, MIN_DEPOSIT, MAX_DEPOSIT);

    musd.approve(address(pool), amount);
    pool.deposit(amount);

    assertEq(pool.totalMusdDeposited(), amount);
}
```

---

## Upgrade Procedures

### Storage Layout Compatibility

**CRITICAL:** New versions MUST NOT:

- Change order of existing state variables
- Remove state variables
- Change types of existing variables

**Safe Additions:**

- Append new variables at the end
- Add new mappings
- Introduce new constants

### Example Upgrade

```solidity
// V3 Storage
contract IndividualPoolV3 {
    IYieldAggregator public YIELD_AGGREGATOR;
    IERC20 public MUSD;
    mapping(address => UserDeposit) public userDeposits;
    // ... existing variables
}

// V4 Storage (SAFE)
contract IndividualPoolV4 {
    IYieldAggregator public YIELD_AGGREGATOR;
    IERC20 public MUSD;
    mapping(address => UserDeposit) public userDeposits;
    // ... existing variables (unchanged)

    // NEW: Safe to add at end
    mapping(address => uint256) public newFeature;
}
```

---

## Deployment Checklist

- [ ] Deploy implementation contract
- [ ] Deploy UUPS proxy
- [ ] Initialize proxy with correct parameters
- [ ] Verify YIELD_AGGREGATOR address
- [ ] Verify MUSD token address
- [ ] Set correct feeCollector
- [ ] Transfer ownership to multi-sig
- [ ] Verify contract on block explorer
- [ ] Test deposit on testnet
- [ ] Test withdrawal on testnet
- [ ] Monitor gas costs
- [ ] Document addresses

---

**Version:** 3.0.0
**Last Updated:** 2025-11-27
**Audit Status:** Pending
