# Mezo Integration Limitations - RotatingPool Contract

**Contract:** RotatingPool.sol v3
**Status:** ⚠️ TESTNET ONLY - NOT PRODUCTION READY
**Issue ID:** M-03
**Severity:** 🔴 CRITICAL for Production Deployment
**Last Updated:** 2026-02-07

---

## Executive Summary

The RotatingPool contract's **native BTC yield generation is currently DISABLED** due to incomplete Mezo integration. While the contract accepts native BTC contributions and handles payouts correctly, **it does NOT generate any yields** for native BTC pools.

This means:

- ✅ Native BTC contributions work
- ✅ Native BTC payouts work
- ❌ **Native BTC yields are ZERO**
- ✅ WBTC yields work (via YieldAggregator)

---

## Technical Details

### Current Implementation

#### File: `/packages/contracts/src/pools/v3/RotatingPool.sol`

**Function: `_depositNativeBtcToMezo()` (Lines 873-891)**

```solidity
function _depositNativeBtcToMezo(uint256 poolId, uint256 btcAmount) internal {
    PoolInfo storage pool = pools[poolId];

    // Native BTC is already in contract via msg.value
    // We hold it safely until members claim their payouts

    // Future enhancement: When MezoIntegration is deployed, uncomment:
    // uint256 musdAmount = MEZO_INTEGRATION.depositAndMintNative{value: btcAmount}();
    // pool.totalMusdMinted += musdAmount;
    // emit MusdMinted(poolId, musdAmount);
    //
    // Note: For testnet without MezoIntegration deployed
    // BTC remains in contract as backing until claim
}
```

**This function is a complete no-op** - it does nothing except hold the BTC.

### Root Cause

The `MezoIntegration` contract referenced at address `0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6` either:

1. Does not exist on Mezo testnet
2. Does not support `depositAndMintNative()` function with native BTC
3. Was not deployed when RotatingPool was created

### Impact on Users

| Pool Type       | Contributions | Payouts  | Yields      | Overall Status         |
| --------------- | ------------- | -------- | ----------- | ---------------------- |
| WBTC Mode       | ✅ Works      | ✅ Works | ✅ Works    | 🟢 **FUNCTIONAL**      |
| Native BTC Mode | ✅ Works      | ✅ Works | ❌ **ZERO** | 🔴 **YIELDS DISABLED** |

**User Expectation vs Reality:**

Users choosing native BTC pools expect:

- Better UX (no token approval needed) ✅
- Earn yields on their BTC ❌ **NOT HAPPENING**

**The UI and documentation suggest yields will be generated, but they won't be.**

---

## Affected Functions

### 1. `makeContributionNative()` - Line 471

**Current Behavior:**

```solidity
// Member contributes 0.01 BTC
pool.makeContributionNative{value: 0.01 ether}(poolId);

// BTC stored in contract ✅
// Yields generated? NO ❌
```

**Expected Behavior (when integration is complete):**

```solidity
// BTC deposited to Mezo protocol
// MUSD minted based on BTC collateral
// Yields generated via Mezo staking
// pool.totalMusdMinted increases
```

### 2. `_completePeriod()` - Lines 933-991

**Current Behavior:**

```solidity
// Calculate yield generated
uint256 pendingYield = YIELD_AGGREGATOR.getPendingYield(address(this));
// For native BTC pools: pendingYield = 0 (always) ❌

// Yield for period
yieldForPeriod = 0; // Nothing to distribute
```

**Impact:**

- `pool.totalMusdMinted` = 0
- `pool.totalYieldGenerated` = 0
- `period.yieldAmount` = 0
- Members receive ZERO yield when claiming payouts

### 3. `claimPayout()` - Lines 538-599

**Current Behavior:**

```solidity
uint256 yieldAmount = period.yieldAmount; // Always 0 for native BTC
uint256 feeAmount = 0;
uint256 netYield = 0;

// Members receive principal only, no yields ❌
```

---

## Why WBTC Mode Works

WBTC pools bypass the broken Mezo integration:

```solidity
// File: _depositToMezo() - Lines 829-860
function _depositToMezo(uint256 poolId, uint256 btcAmount) internal {
    // ...

    // Approve and deposit WBTC to YieldAggregator
    WBTC.safeIncreaseAllowance(address(YIELD_AGGREGATOR), btcAmount);

    try YIELD_AGGREGATOR.deposit(btcAmount) {
        // Yields generated via YieldAggregator ✅
        pool.totalMusdMinted += musdEquivalent;
        emit MusdMinted(poolId, musdEquivalent);
    } catch {
        // Graceful fallback
    }
}
```

**WBTC flows:**

1. User contributes WBTC ✅
2. Contract deposits to YieldAggregator ✅
3. YieldAggregator generates yields (off-chain or via Mezo) ✅
4. Yields claimable via `YIELD_AGGREGATOR.claimYield()` ✅

---

## Solutions

### Option A: Complete Mezo Integration (RECOMMENDED)

**Priority:** P0 - Required before mainnet

**Steps:**

1. Deploy working `MezoIntegration` contract to Mezo testnet
2. Verify `depositAndMintNative()` function exists and accepts native BTC
3. Update RotatingPool constructor with correct MezoIntegration address
4. Uncomment integration code in `_depositNativeBtcToMezo()`
5. Test end-to-end native BTC yield generation
6. Update ABI and frontend

**Implementation:**

```solidity
function _depositNativeBtcToMezo(uint256 poolId, uint256 btcAmount) internal {
    PoolInfo storage pool = pools[poolId];

    // Deposit native BTC to Mezo and mint MUSD
    uint256 musdAmount = MEZO_INTEGRATION.depositAndMintNative{value: btcAmount}();
    pool.totalMusdMinted += musdAmount;
    emit MusdMinted(poolId, musdAmount);

    // Deposit MUSD to YieldAggregator for yield generation
    MUSD.safeIncreaseAllowance(address(YIELD_AGGREGATOR), musdAmount);
    try YIELD_AGGREGATOR.deposit(musdAmount) {
        // Success
    } catch {
        // Graceful degradation
    }
}
```

**Estimated Effort:** 2-3 days (assuming MezoIntegration contract already exists)

---

### Option B: Disable Native BTC Mode (QUICK FIX)

**Priority:** P1 - Temporary workaround

**Steps:**

1. Remove `makeContributionNative()` function
2. Require all pools to use WBTC mode
3. Update frontend to hide native BTC option
4. Add clear documentation that only WBTC pools generate yields

**Pros:**

- Quick fix
- No broken expectations
- WBTC mode is fully functional

**Cons:**

- Worse UX (requires WBTC wrapping + approval)
- Defeats purpose of "native BTC support"

---

### Option C: Document Limitations Clearly (MINIMAL)

**Priority:** P2 - If Options A/B not feasible short-term

**Steps:**

1. Add warning in UI when creating native BTC pool:

   ```
   ⚠️ WARNING: Native BTC pools currently do NOT generate yields
   Only use if you want convenience of native BTC contributions
   For yield generation, use WBTC mode instead
   ```

2. Update pool creation modal with prominent disclaimer

3. Add to documentation:

   ```markdown
   ## Yield Generation

   - **WBTC Pools:** ✅ Generate yields via YieldAggregator
   - **Native BTC Pools:** ❌ No yields (Mezo integration pending)
   ```

4. Add to smart contract comments

**Pros:**

- Honest about limitations
- Allows users to make informed choice
- No code changes needed

**Cons:**

- Confusing for users
- May damage trust
- Still a poor experience

---

## Verification Checklist

Before deploying to mainnet, verify:

- [ ] MezoIntegration contract deployed and working
- [ ] `depositAndMintNative()` function callable with native BTC
- [ ] Test pool created with native BTC
- [ ] Contributions made with native BTC
- [ ] Verify `pool.totalMusdMinted` increases after contribution
- [ ] Wait for period completion
- [ ] Verify `period.yieldAmount` > 0
- [ ] Member claims payout successfully
- [ ] Member receives principal + yield
- [ ] Yield amount matches expected APY
- [ ] Fee collector receives performance fee
- [ ] All events emitted correctly
- [ ] Frontend displays yields correctly

---

## Testing Commands

### Check if MezoIntegration is deployed:

```bash
cast code 0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6 --rpc-url https://rpc.test.mezo.org
```

**Current Result:** Likely returns `0x` (no code deployed)

### Check pool yields:

```solidity
// Get pool stats
(uint256 totalBtc, uint256 totalMusd, uint256 totalYield,,) = pool.getPoolStats(poolId);

// For native BTC pools:
// totalBtc > 0 ✅
// totalMusd == 0 ❌ (should be > 0)
// totalYield == 0 ❌ (should be > 0)
```

### Check period yields:

```solidity
// Get period info
(,,,, uint256 payoutAmount, uint256 yieldAmount,,) = pool.poolPeriods(poolId, periodNumber);

// For native BTC pools:
// payoutAmount > 0 ✅ (principal)
// yieldAmount == 0 ❌ (should be > 0)
```

---

## Related Issues

- **H-01:** Dual-mode pool hijacking ✅ FIXED
- **H-02:** Insufficient balance checks ✅ FIXED
- **M-03:** Mocked Mezo integration ⚠️ **THIS ISSUE**
- **M-04:** O(n) loop scalability ✅ FIXED

---

## References

- **Mezo Official Docs:** https://mezo.org/docs
- **Mezo GitHub:** https://github.com/mezo-org
- **MUSD Contract:** https://github.com/mezo-org/musd (v1.1.0)
- **Mezo Testnet RPC:** https://rpc.test.mezo.org
- **Mezo Testnet Chain ID:** 31611

---

## Recommendation

**For Testnet:** Option C (Document limitations) is acceptable for testing
**For Mainnet:** **MUST implement Option A** before deployment

**Timeline:**

- **Immediate:** Add UI warnings (Option C)
- **This Sprint:** Investigate Mezo integration status
- **Next Sprint:** Implement full integration (Option A)
- **Before Mainnet:** Verify all functionality end-to-end

---

## Status History

| Date       | Status         | Action                                   |
| ---------- | -------------- | ---------------------------------------- |
| 2026-02-07 | 🔴 CRITICAL    | Issue identified during deep code review |
| 2026-02-07 | 📝 DOCUMENTED  | This documentation created               |
| TBD        | 🔧 IN PROGRESS | Integration implementation started       |
| TBD        | ✅ RESOLVED    | Full Mezo integration complete           |

---

**Contact:** Development Team
**Priority:** P0 before mainnet
**Blocked:** Mainnet deployment until resolved
