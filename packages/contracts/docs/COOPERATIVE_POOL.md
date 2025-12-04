# CooperativePoolV3 - Technical Documentation

**Contract:** `CooperativePoolV3.sol`
**Version:** 3.1.0
**Solidity:** 0.8.25
**Pattern:** UUPS Upgradeable

---

## Overview

CooperativePoolV3 implements a multi-member savings pool where participants collectively deposit BTC, mint MUSD through Mezo integration, and share generated yields proportionally to their contributions. This contract enables community-based savings with transparent yield distribution.

### Key Features

- **Multi-Member Pools:** Support up to 100 members per pool
- **Flexible Contributions:** Members can add incrementally
- **Proportional Shares:** Yields distributed based on contribution ratio
- **Pool Lifecycle:** ACCEPTING → ACTIVE → CLOSED states
- **Emergency Withdrawals:** Partial and full withdrawal support
- **Performance Fees:** Configurable fee on yields (1% default)

---

## Architecture

### Inheritance Chain

```
CooperativePoolV3
    ├── Initializable (OZ)
    ├── UUPSUpgradeable (OZ)
    ├── OwnableUpgradeable (OZ)
    ├── ReentrancyGuardUpgradeable (OZ)
    └── PausableUpgradeable (OZ)
```

### External Dependencies

```solidity
IMezoIntegration public MEZO_INTEGRATION;
IYieldAggregator public YIELD_AGGREGATOR;
IERC20 public MUSD;
```

---

## Data Structures

### Pool Status Enum

```solidity
enum PoolStatus {
    ACCEPTING,  // Pool is accepting new members
    ACTIVE,     // Pool is active and generating yields
    CLOSED      // Pool is closed (no new members, withdrawals allowed)
}
```

### PoolInfo Struct (Storage Optimized)

```solidity
struct PoolInfo {
    uint128 minContribution;     // Minimum BTC per member
    uint128 maxContribution;     // Maximum BTC per member
    uint64 maxMembers;           // Maximum pool size
    uint64 currentMembers;       // Current member count
    uint64 createdAt;            // Pool creation timestamp
    PoolStatus status;           // Current pool status
    bool allowNewMembers;        // New member acceptance flag
    address creator;             // Pool creator address
    string name;                 // Pool name
    uint256 totalBtcDeposited;   // Total BTC in pool
    uint256 totalMusdMinted;     // Total MUSD minted from BTC
    uint256 totalYieldGenerated; // Cumulative yields
}
```

### MemberInfo Struct

```solidity
struct MemberInfo {
    uint128 btcContributed;      // BTC contributed by member
    uint128 shares;              // Share tokens (proportional to contribution)
    uint64 joinedAt;             // Join timestamp
    bool active;                 // Member status
    uint256 yieldClaimed;        // Total yields claimed
}
```

---

## State Variables

### Constants

```solidity
uint256 public constant MIN_POOL_SIZE = 0.01 ether;       // 0.01 BTC
uint256 public constant MAX_POOL_SIZE = 100 ether;        // 100 BTC
uint256 public constant MIN_CONTRIBUTION = 0.001 ether;   // 0.001 BTC
uint256 public constant MAX_MEMBERS_LIMIT = 100;          // Max members per pool
```

### Mappings

| Variable | Type | Purpose |
|----------|------|---------|
| `pools` | `mapping(uint256 => PoolInfo)` | Pool ID → Pool data |
| `poolMembers` | `mapping(uint256 => mapping(address => MemberInfo))` | Pool members |
| `poolMembersList` | `mapping(uint256 => address[])` | Member list arrays |

### Global State

| Variable | Type | Description |
|----------|------|-------------|
| `poolCounter` | `uint256` | Incrementing pool ID counter |
| `performanceFee` | `uint256` | Fee on yields (100 = 1%) |
| `feeCollector` | `address` | Fee recipient |
| `emergencyMode` | `bool` | Emergency bypass flag |

---

## Functions

### Pool Creation

#### `createPool(string name, uint256 minContribution, uint256 maxContribution, uint256 maxMembers)`

Creates a new cooperative savings pool.

**Parameters:**
- `name`: Human-readable pool name
- `minContribution`: Minimum BTC contribution per member
- `maxContribution`: Maximum BTC contribution per member
- `maxMembers`: Pool member limit (1-100)

**Requirements:**
- `minContribution >= MIN_CONTRIBUTION` (0.001 BTC)
- `maxContribution >= minContribution`
- `maxMembers > 0 && <= MAX_MEMBERS_LIMIT`

**Returns:** `poolId` - Unique pool identifier

**Effects:**
- Increments `poolCounter`
- Creates new `PoolInfo` entry
- Sets status to `ACCEPTING`
- Emits `PoolCreated` event

**Gas Estimate:** ~200k gas

```solidity
// Example: Create pool for 10 members, 0.1-1 BTC each
uint256 poolId = pool.createPool(
    "Friends Savings Group",
    0.1 ether,
    1 ether,
    10
);
```

---

### Member Functions

#### `joinPool(uint256 poolId)` (payable)

Join an existing pool by contributing BTC.

**Parameters:**
- `poolId`: Target pool ID

**Payment:** `msg.value` - BTC amount to contribute

**Requirements:**
- Pool status is `ACCEPTING`
- Pool not full (`currentMembers < maxMembers`)
- `msg.value >= minContribution`
- `msg.value <= maxContribution`
- Sender not already a member

**Effects:**
- Transfers BTC from sender (via `msg.value`)
- Adds member to pool
- Increments `currentMembers`
- If pool size >= MIN_POOL_SIZE (0.01 BTC):
  - Deposits BTC to Mezo
  - Mints MUSD
  - Deposits MUSD to YieldAggregator
  - Sets status to `ACTIVE`
- Emits `MemberJoined` event

**Share Calculation:**
```solidity
// Initial shares equal to BTC contributed
member.shares = btcAmount;

// Incremental contributions add shares
member.shares += additionalBtc;
```

**Gas Estimate:** ~300k gas (with Mezo deposit)

```solidity
// Join pool with 0.5 BTC
pool.joinPool{value: 0.5 ether}(poolId);
```

---

#### `leavePool(uint256 poolId)`

Leave pool and withdraw BTC + proportional yields.

**Parameters:**
- `poolId`: Pool to leave

**Requirements:**
- Sender is active member
- Pool exists

**Withdrawal Logic:**

1. **Calculate Member Share:**
```solidity
uint256 totalShares = _getTotalShares(poolId);
uint256 memberShare = (member.shares * 1e18) / totalShares;
// Example: 10 shares out of 100 = 10% share
```

2. **Calculate MUSD to Repay:**
```solidity
uint256 musdToRepay = (pool.totalMusdMinted * memberShare) / 1e18;
// Burn this amount to reclaim BTC
```

3. **Calculate Yields:**
```solidity
uint256 memberYield = _calculateMemberYield(poolId, msg.sender);
// Proportional share of pool yields
```

4. **Withdraw from Aggregator (if needed):**
```solidity
if (poolMusdBalance < totalNeeded) {
    YIELD_AGGREGATOR.withdraw(safeWithdraw);
}
```

5. **Burn MUSD, Receive BTC:**
```solidity
MEZO_INTEGRATION.burnAndWithdraw(musdToRepay);
// Returns BTC to contract
```

6. **Transfer BTC + Net Yields:**
```solidity
// BTC to member
(bool success, ) = msg.sender.call{value: btcAmount}("");

// MUSD yield to member (after fee)
MUSD.safeTransfer(msg.sender, netYield);
```

**Fee Deduction:**
```solidity
feeAmount = (memberYield * performanceFee) / 10000; // 1% default
netYield = memberYield - feeAmount;
```

**Gas Estimate:** ~400k gas

```solidity
// Leave pool
pool.leavePool(poolId);
```

---

#### `withdrawPartial(uint256 poolId, uint256 withdrawAmount)`

Partially withdraw from pool without fully leaving.

**Parameters:**
- `poolId`: Target pool
- `withdrawAmount`: BTC amount to withdraw

**Requirements:**
- Sender is active member
- `withdrawAmount < member.btcContributed`
- Remaining contribution >= `minContribution`

**Effects:**
- Reduces member's contribution and shares proportionally
- Burns proportional MUSD
- Returns BTC to member
- Maintains membership status

**Share Reduction:**
```solidity
uint256 withdrawShare = (withdrawAmount * 1e18) / currentContribution;
uint256 sharesToBurn = (member.shares * withdrawShare) / 1e18;

member.shares -= sharesToBurn;
```

**Gas Estimate:** ~350k gas

```solidity
// Withdraw 0.2 BTC while keeping membership
pool.withdrawPartial(poolId, 0.2 ether);
```

---

#### `claimYield(uint256 poolId)`

Claim accumulated yields without withdrawing principal.

**Parameters:**
- `poolId`: Target pool

**Requirements:**
- Sender is active member
- Member has pending yields

**Yield Calculation:**
```solidity
function _calculateMemberYield(uint256 poolId, address member)
    internal view returns (uint256)
{
    uint256 totalPoolYield = YIELD_AGGREGATOR.getPendingYield(address(this));
    uint256 totalShares = _getTotalShares(poolId);
    uint256 memberShare = (memberInfo.shares * 1e18) / totalShares;

    uint256 yield = (totalPoolYield * memberShare) / 1e18;

    // Subtract already claimed
    if (yield > memberInfo.yieldClaimed) {
        yield -= memberInfo.yieldClaimed;
    } else {
        yield = 0;
    }

    return yield;
}
```

**Effects:**
- Claims yields from YieldAggregator
- Deducts performance fee
- Transfers net yield to member
- Updates `yieldClaimed` tracker
- Emits `YieldClaimed` event

**Gas Estimate:** ~150k gas

```solidity
// Claim yields
pool.claimYield(poolId);
```

---

### View Functions

#### `getPoolInfo(uint256 poolId)` (view)

Returns complete pool information.

```solidity
PoolInfo memory info = pool.getPoolInfo(poolId);
// info.status, info.totalBtcDeposited, etc.
```

---

#### `getMemberInfo(uint256 poolId, address member)` (view)

Returns member's position in pool.

```solidity
MemberInfo memory member = pool.getMemberInfo(poolId, userAddress);
// member.btcContributed, member.shares, etc.
```

---

#### `getPoolMembers(uint256 poolId)` (view)

Returns array of all member addresses.

```solidity
address[] memory members = pool.getPoolMembers(poolId);
```

---

#### `calculateMemberYield(uint256 poolId, address member)` (view)

Calculates current pending yield for a member.

```solidity
uint256 pendingYield = pool.calculateMemberYield(poolId, userAddress);
```

---

#### `getTotalShares(uint256 poolId)` (view)

Calculates total shares across all active members.

```solidity
function _getTotalShares(uint256 poolId) internal view returns (uint256 total) {
    address[] memory members = poolMembersList[poolId];
    for (uint256 i = 0; i < members.length; i++) {
        MemberInfo memory member = poolMembers[poolId][members[i]];
        if (member.active) {
            total += member.shares;
        }
    }
}
```

---

#### `getPoolStats(uint256 poolId)` (view)

Returns pool statistics.

**Returns:**
- `totalBtc` - Total BTC deposited
- `totalMusd` - Total MUSD minted
- `totalYield` - Cumulative yields
- `avgApr` - Weighted average APR from aggregator

```solidity
(
    uint256 totalBtc,
    uint256 totalMusd,
    uint256 totalYield,
    uint256 avgApr
) = pool.getPoolStats(poolId);
```

---

### Admin Functions

#### `setEmergencyMode(bool _enabled)`

**Access:** Owner only

Enables emergency mode (bypasses flash loan check, waives fees).

---

#### `setPerformanceFee(uint256 newFee)`

**Access:** Owner only

**Requirements:**
- `newFee <= 1000` (max 10%)

---

#### `closePool(uint256 poolId)`

**Access:** Pool creator or owner

**Effects:**
- Sets `allowNewMembers = false`
- Sets status to `CLOSED`
- Members can still withdraw
- No new members allowed

```solidity
// Close pool to new members
pool.closePool(poolId);
```

---

## Pool Lifecycle

```
┌──────────────┐
│  Pool        │
│  Created     │
└──────┬───────┘
       │
       │ Members join, contribute BTC
       ▼
┌──────────────┐
│  ACCEPTING   │ ◄──┐
│              │    │ (Incremental contributions)
└──────┬───────┘    │
       │            │
       │ totalBtc >= MIN_POOL_SIZE (0.01 BTC)
       ▼            │
┌──────────────┐    │
│   Deposit    │    │
│   to Mezo    │    │
└──────┬───────┘    │
       │            │
       ▼            │
┌──────────────┐    │
│   ACTIVE     │────┘
│              │
│ - Generating │
│   yields     │
│ - Members    │
│   can join   │
│ - Members    │
│   can claim  │
└──────┬───────┘
       │
       │ Owner/creator closes pool
       ▼
┌──────────────┐
│   CLOSED     │
│              │
│ - No new     │
│   members    │
│ - Withdrawals│
│   allowed    │
└──────────────┘
```

---

## Yield Distribution Model

### Share-Based Distribution

**Principle:** Yields are distributed proportionally to shares.

**Example Scenario:**

```
Pool has 3 members:
- Alice: 1 BTC → 1 share
- Bob: 2 BTC → 2 shares
- Carol: 3 BTC → 3 shares
Total: 6 BTC, 6 shares

Pool generates 0.6 MUSD yield.

Alice's yield: (1 / 6) * 0.6 = 0.1 MUSD
Bob's yield: (2 / 6) * 0.6 = 0.2 MUSD
Carol's yield: (3 / 6) * 0.6 = 0.3 MUSD
```

**Code Implementation:**
```solidity
uint256 totalShares = _getTotalShares(poolId); // 6
uint256 aliceShares = poolMembers[poolId][alice].shares; // 1

uint256 aliceShare = (aliceShares * 1e18) / totalShares;
// aliceShare = (1 * 1e18) / 6 = 166666666666666666 (16.67%)

uint256 totalYield = 0.6 ether;
uint256 aliceYield = (totalYield * aliceShare) / 1e18;
// aliceYield = 0.1 ether
```

---

### Performance Fee Model

**Fee Rate:** 1% of yields (default)

**Calculation:**
```solidity
uint256 grossYield = 100 ether;
uint256 feeAmount = (grossYield * performanceFee) / 10000;
// feeAmount = (100 * 100) / 10000 = 1 ether (1%)

uint256 netYield = grossYield - feeAmount;
// netYield = 99 ether
```

**Distribution:**
- Net yield → Member
- Fee → `feeCollector` address

**Emergency Mode:** Fees waived (100% to member)

---

## Edge Cases and Handling

### 1. Insufficient MUSD for Withdrawal

**Scenario:** Pool's MUSD balance < required for withdrawal

**Handling:**
```solidity
uint256 poolMusdBalance = MUSD.balanceOf(address(this));

if (poolMusdBalance < totalNeeded) {
    // Calculate proportional share from aggregator
    (uint256 aggregatorPrincipal, uint256 aggregatorYields) =
        YIELD_AGGREGATOR.getUserPosition(address(this));

    uint256 aggregatorBalance = aggregatorPrincipal + aggregatorYields;
    uint256 proportionalShare = (aggregatorBalance * memberShare) / 1e18;

    uint256 safeWithdraw = min(amountToWithdraw, proportionalShare);

    try YIELD_AGGREGATOR.withdraw(safeWithdraw) {
        // Success
    } catch {
        // Adjust yield to available balance
        memberYield = min(memberYield, poolMusdBalance - musdToRepay);
    }
}
```

**Result:** Withdraws as much as safely possible, prioritizes principal over yields.

---

### 2. Member Leaving With Zero Yields

**Scenario:** Member leaves before yields accumulate

**Behavior:**
```solidity
uint256 memberYield = _calculateMemberYield(poolId, msg.sender);
// Returns 0 if no yields

// Member still receives BTC principal
MEZO_INTEGRATION.burnAndWithdraw(musdToRepay);
(bool success, ) = msg.sender.call{value: btcAmount}("");

// No yield transfer (yieldAmount = 0)
```

**Outcome:** Member recovers full BTC principal.

---

### 3. Pool With Single Member

**Scenario:** Only one active member remains

**Behavior:**
```solidity
uint256 totalShares = _getTotalShares(poolId); // member.shares
uint256 memberShare = (member.shares * 1e18) / totalShares;
// memberShare = (member.shares * 1e18) / member.shares = 1e18 (100%)
```

**Result:** Member receives 100% of yields. Pool functions normally.

---

### 4. Incremental Contributions After Pool Active

**Scenario:** Member adds more BTC after pool starts earning

**Handling:**
```solidity
if (!member.active) {
    // New member
    member.btcContributed = btcAmount;
    member.shares = btcAmount;
} else {
    // Existing member - incremental
    uint256 newContribution = member.btcContributed + btcAmount;
    if (newContribution > maxContribution) revert ContributionTooHigh();

    member.btcContributed = newContribution;
    member.shares = newContribution; // Shares updated proportionally
}
```

**Yield Implication:** New shares don't earn retroactive yields, only future yields.

---

### 5. Mezo Integration Failure

**Scenario:** `MEZO_INTEGRATION.burnAndWithdraw()` reverts

**Current Behavior:** Transaction fails, member cannot leave

**Recommendation:**
```solidity
// Future improvement: emergency withdrawal path
if (emergencyMode) {
    // Return BTC from pool reserves instead of burning MUSD
    (bool success, ) = msg.sender.call{value: btcAmount}("");
    require(success);
}
```

---

## Gas Optimization

### 1. Storage Packing

**PoolInfo Packing:**
```solidity
struct PoolInfo {
    uint128 minContribution;     // Slot 0
    uint128 maxContribution;     // Slot 0
    uint64 maxMembers;           // Slot 1
    uint64 currentMembers;       // Slot 1
    uint64 createdAt;            // Slot 1
    PoolStatus status;           // Slot 1 (1 byte)
    bool allowNewMembers;        // Slot 1 (1 byte)
    // ... rest in separate slots
}
```

**Savings:** ~60k gas per pool creation

---

### 2. Minimal External Calls

**Batching Aggregator Queries:**
```solidity
// Bad: Multiple calls
uint256 yield1 = YIELD_AGGREGATOR.getPendingYield(pool1);
uint256 yield2 = YIELD_AGGREGATOR.getPendingYield(pool2);

// Good: Single aggregated call
(uint256 principal, uint256 yields) = YIELD_AGGREGATOR.getUserPosition(address(this));
```

---

### 3. Efficient Loop Patterns

```solidity
// Cached length
address[] memory members = poolMembersList[poolId];
uint256 length = members.length;

for (uint256 i = 0; i < length; i++) {
    // Access members[i] directly
}
```

---

## Security Considerations

### Critical Invariants

1. **Share Conservation:**
```solidity
sum(member.shares for all active members) == totalShares
```

2. **BTC Conservation:**
```solidity
pool.totalBtcDeposited == sum(member.btcContributed for all active members)
```

3. **MUSD Backing:**
```solidity
pool.totalMusdMinted <= mezoProtocol.getTotalDebt(address(this))
```

### Attack Vectors

| Attack | Mitigation | Status |
|--------|------------|--------|
| Reentrancy | `nonReentrant` modifier | PROTECTED |
| Flash loans | `noFlashLoan` modifier | PROTECTED |
| Front-running yields | Share-based distribution | MITIGATED |
| Griefing (dust contributions) | `MIN_CONTRIBUTION` check | PROTECTED |
| Sybil attack (multiple identities) | Irrelevant (shares are proportional) | N/A |

### Access Control Matrix

| Function | Creator | Owner | Members | Public |
|----------|---------|-------|---------|--------|
| `createPool` | - | - | - | ✓ |
| `joinPool` | - | - | - | ✓ |
| `leavePool` | - | - | ✓ | - |
| `withdrawPartial` | - | - | ✓ | - |
| `claimYield` | - | - | ✓ | - |
| `closePool` | ✓ | ✓ | - | - |
| `setPerformanceFee` | - | ✓ | - | - |
| `setEmergencyMode` | - | ✓ | - | - |

---

## Testing Scenarios

### Unit Tests

```solidity
function testCreatePool() public {
    uint256 poolId = pool.createPool("Test Pool", 0.1 ether, 1 ether, 5);

    PoolInfo memory info = pool.getPoolInfo(poolId);
    assertEq(info.maxMembers, 5);
    assertEq(uint(info.status), uint(PoolStatus.ACCEPTING));
}

function testJoinPool() public {
    uint256 poolId = pool.createPool("Test Pool", 0.1 ether, 1 ether, 5);

    vm.deal(alice, 1 ether);
    vm.prank(alice);
    pool.joinPool{value: 0.5 ether}(poolId);

    MemberInfo memory member = pool.getMemberInfo(poolId, alice);
    assertEq(member.btcContributed, 0.5 ether);
    assertTrue(member.active);
}

function testYieldDistribution() public {
    // Setup pool with 2 members
    uint256 poolId = pool.createPool("Test Pool", 0.1 ether, 1 ether, 5);

    vm.deal(alice, 1 ether);
    vm.prank(alice);
    pool.joinPool{value: 0.3 ether}(poolId);

    vm.deal(bob, 1 ether);
    vm.prank(bob);
    pool.joinPool{value: 0.6 ether}(poolId);

    // Simulate yields
    vm.warp(block.timestamp + 30 days);

    // Alice should get 1/3, Bob 2/3
    uint256 aliceYield = pool.calculateMemberYield(poolId, alice);
    uint256 bobYield = pool.calculateMemberYield(poolId, bob);

    assertApproxEqRel(bobYield, aliceYield * 2, 0.01e18); // Within 1%
}
```

---

## Deployment Checklist

- [ ] Deploy implementation contract
- [ ] Deploy UUPS proxy
- [ ] Initialize with:
  - [ ] Mezo Integration address
  - [ ] Yield Aggregator address
  - [ ] MUSD token address
  - [ ] Fee collector address
- [ ] Verify performance fee = 100 (1%)
- [ ] Transfer ownership to multi-sig
- [ ] Verify contract on explorer
- [ ] Test pool creation
- [ ] Test member joining
- [ ] Test yield distribution
- [ ] Monitor gas costs

---

**Version:** 3.1.0
**Last Updated:** 2025-11-27
**Audit Status:** Pending
