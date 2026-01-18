# KhipuVault Security Audit Report

**Audit Date:** 2025-12-13
**Auditor:** Claude Code Security Analysis
**Version:** 3.0.0
**Scope:** Full Stack (Smart Contracts, API, Frontend)

---

## Executive Summary

| Component       | Critical | High  | Medium | Low    | Score      |
| --------------- | -------- | ----- | ------ | ------ | ---------- |
| Smart Contracts | 2        | 5     | 8      | 7      | 6/10       |
| API Backend     | 0        | 2     | 3      | 4      | 8.5/10     |
| Frontend        | 0        | 1     | 5      | 3      | 8/10       |
| **TOTAL**       | **2**    | **8** | **16** | **14** | **7.5/10** |

**Overall Assessment:** The codebase demonstrates good security practices but has **2 critical vulnerabilities in smart contracts** that must be fixed before mainnet deployment.

---

## Critical Findings (Fix Immediately)

### C-01: Referral Rewards Insolvency Risk

**Location:** `IndividualPoolV3.sol:279-285`
**Severity:** CRITICAL

```solidity
// BUG: Rewards accrued without backing funds
uint256 bonus = (musdAmount * referralBonus) / 10000;
referralRewards[referrer] += bonus;  // No actual MUSD set aside!
```

**Impact:** Referrers cannot claim rewards if contract balance is insufficient. Protocol insolvency risk.

**Fix:**

```solidity
// Option 1: Fund from protocol fees
uint256 bonus = (musdAmount * referralBonus) / 10000;
require(MUSD_TOKEN.balanceOf(address(this)) >= totalReferralRewards + bonus, "Insufficient reserves");
referralRewards[referrer] += bonus;

// Option 2: Deduct from deposit
uint256 bonus = (musdAmount * referralBonus) / 10000;
uint256 netDeposit = musdAmount - bonus;
referralRewards[referrer] += bonus;
```

---

### C-02: Lottery Ticket Index Bug

**Location:** `LotteryPool.sol:369-376`
**Severity:** CRITICAL

```solidity
// BUG: firstTicketIndex overwritten on subsequent purchases
participant.firstTicketIndex = firstTicket;  // OVERWRITES original!
```

**Impact:** Users buying multiple ticket batches have orphaned tickets that can never win.

**Fix:**

```solidity
if (participant.ticketCount == 0) {
    participant.firstTicketIndex = totalTicketsSold;
}
participant.lastTicketIndex = totalTicketsSold + ticketCount - 1;
```

---

## High Severity Findings

### Smart Contracts

| ID   | Issue                            | Location              | Impact                                |
| ---- | -------------------------------- | --------------------- | ------------------------------------- |
| H-01 | Flash loan protection bypass     | Multiple              | Attackers can exploit via constructor |
| H-02 | Unbounded loop DoS               | CooperativePoolV3:597 | Withdrawals fail with many members    |
| H-03 | State update after external call | YieldAggregatorV3:193 | Fund loss on partial failure          |
| H-04 | Unchecked external call          | MezoIntegrationV3:279 | Users may receive less BTC            |
| H-05 | Missing event for fee collector  | LotteryPool:704       | Untrackable admin changes             |

### API Backend

| ID   | Issue                        | Location    | Impact                               |
| ---- | ---------------------------- | ----------- | ------------------------------------ |
| H-06 | In-memory nonce store        | auth.ts:26  | Auth fails on restart/multi-instance |
| H-07 | Health check blocked by CORS | index.ts:76 | Load balancer health checks fail     |

### Frontend

| ID   | Issue                   | Location     | Impact                            |
| ---- | ----------------------- | ------------ | --------------------------------- |
| H-08 | Vulnerable dependencies | package.json | 4 known CVEs (DNS rebinding, DoS) |

---

## Medium Severity Findings

### Smart Contracts (8)

- M-01: Division before multiplication precision loss
- M-02: Missing slippage protection in withdrawals
- M-03: Stale members array (gas waste)
- M-04: Single-step ownership transfer
- M-05: Missing zero address check in constructor
- M-06: Fund lock on cancelled lottery (no refund mechanism)
- M-07: Centralization risk (emergency mode)
- M-08: Potential underflow in yield calculation

### API Backend (3)

- M-09: In-memory token blacklist (single instance only)
- M-10: Auth stats endpoint exposure
- M-11: Inconsistent pagination limits

### Frontend (5)

- M-12: Missing CSRF tokens on API calls
- M-13: BigInt to Number precision loss
- M-14: Client-only input validation
- M-15: Missing message signing validation (SIWE)
- M-16: Cookie storage without secure flags

---

## Priority Action Plan

### Phase 1: Critical (Before Any Deployment)

```
1. Fix C-01: Referral rewards insolvency
2. Fix C-02: Lottery ticket index bug
3. Update vulnerable dependencies
```

### Phase 2: High (Before Mainnet)

```
4. Add time-based flash loan protection
5. Cache totalShares to prevent DoS
6. Deploy Redis for distributed state
7. Fix CORS health check exception
```

### Phase 3: Medium (Next Sprint)

```
8. Add slippage protection
9. Implement refund mechanism for cancelled lotteries
10. Add CSRF tokens to API client
11. Replace Number(BigInt) with formatUnits
12. Implement SIWE authentication
```

---

## Smart Contract Specific Fixes

### Flash Loan Protection (H-01)

```solidity
// Add block-based protection
mapping(address => uint256) public depositBlock;

function deposit(uint256 amount) external {
    depositBlock[msg.sender] = block.number;
    // ... rest of deposit logic
}

function withdraw(uint256 amount) external {
    require(block.number > depositBlock[msg.sender], "Same block withdrawal");
    // ... rest of withdraw logic
}
```

### Unbounded Loop Fix (H-02)

```solidity
// Add running total instead of loop
mapping(uint256 => uint256) public poolTotalShares;

function joinPool(uint256 poolId, uint256 amount) external {
    // ... join logic
    poolTotalShares[poolId] += shares;
}

function leavePool(uint256 poolId) external {
    // ... leave logic
    poolTotalShares[poolId] -= member.shares;
}
```

### Refund Mechanism (M-06)

```solidity
function claimRefund(uint256 roundId) external nonReentrant {
    LotteryRound storage lottery = lotteryRounds[roundId];
    require(lottery.status == LotteryStatus.CANCELLED, "Not cancelled");

    Participant storage participant = participants[roundId][msg.sender];
    require(participant.btcContributed > 0, "No contribution");
    require(!participant.refundClaimed, "Already claimed");

    participant.refundClaimed = true;
    uint256 refund = participant.btcContributed;

    (bool success, ) = msg.sender.call{value: refund}("");
    require(success, "Refund failed");

    emit RefundClaimed(roundId, msg.sender, refund);
}
```

---

## API Security Improvements

### Redis for Distributed State

```typescript
// Replace in-memory stores with Redis
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Nonce storage
async function storeNonce(nonce: string): Promise<void> {
  await redis.setex(`nonce:${nonce}`, 600, "valid"); // 10 min TTL
}

async function consumeNonce(nonce: string): Promise<boolean> {
  const result = await redis.del(`nonce:${nonce}`);
  return result === 1;
}

// Token blacklist
async function blacklistToken(jti: string, exp: number): Promise<void> {
  const ttl = exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await redis.setex(`blacklist:${jti}`, ttl, "1");
  }
}
```

### CORS Health Check Fix

```typescript
origin: (origin, callback) => {
  // Allow health checks without origin
  if (!origin && req.path === "/health") {
    return callback(null, true);
  }
  // ... rest of CORS logic
};
```

---

## Frontend Security Improvements

### Update Dependencies

```bash
pnpm update @modelcontextprotocol/sdk@latest
pnpm update sats-connect@^3.5.0
pnpm audit fix
```

### CSRF Protection

```typescript
// lib/api-client.ts
export class KhipuApiClient {
  async fetch(url: string, options: RequestInit = {}) {
    const csrfToken = this.getCsrfToken();
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "X-CSRF-Token": csrfToken,
      },
    });
  }

  private getCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
  }
}
```

### BigInt Safe Conversions

```typescript
// Before (RISKY)
const balance = Number(userInfo.deposit / BigInt(1e18));

// After (SAFE)
import { formatUnits } from "viem";
const balance = formatUnits(userInfo.deposit, 18);
```

---

## Testing Recommendations

### Smart Contracts

```bash
# Run full test suite with gas report
cd packages/contracts
forge test --gas-report

# Run specific security tests
forge test --match-test "testReentrancy|testFlashLoan|testOverflow"

# Fuzz testing
forge test --fuzz-runs 10000
```

### API

```bash
# Security scan
pnpm audit

# Run with security tests
pnpm test:security
```

### Frontend

```bash
# Dependency audit
pnpm audit

# Build to check for issues
pnpm build
```

---

## Compliance Checklist

### OWASP Top 10 (2021)

| Risk                           | Smart Contracts | API     | Frontend  |
| ------------------------------ | --------------- | ------- | --------- |
| A01: Broken Access Control     | ⚠️ Medium       | ✅ Pass | ✅ Pass   |
| A02: Cryptographic Failures    | ✅ Pass         | ✅ Pass | ✅ Pass   |
| A03: Injection                 | N/A             | ✅ Pass | ✅ Pass   |
| A04: Insecure Design           | ⚠️ Critical     | ✅ Pass | ✅ Pass   |
| A05: Security Misconfiguration | ⚠️ Medium       | ✅ Pass | ⚠️ Low    |
| A06: Vulnerable Components     | ✅ Pass         | ⚠️ High | ⚠️ High   |
| A07: Auth Failures             | ✅ Pass         | ✅ Pass | ⚠️ Medium |
| A08: Data Integrity            | ⚠️ Critical     | ✅ Pass | ✅ Pass   |
| A09: Logging Failures          | ⚠️ High         | ✅ Pass | ✅ Pass   |
| A10: SSRF                      | N/A             | ✅ Pass | ✅ Pass   |

### Smart Contract Security Standard (SCSVS)

| Category        | Status                  |
| --------------- | ----------------------- |
| Architecture    | ⚠️ Needs Review         |
| Access Control  | ✅ Pass                 |
| Blockchain Data | ✅ Pass                 |
| DoS Attacks     | ⚠️ Vulnerable           |
| Gas Usage       | ⚠️ Needs Optimization   |
| Arithmetic      | ✅ Pass (Solidity 0.8+) |
| Reentrancy      | ✅ Pass (nonReentrant)  |

---

## Conclusion

KhipuVault has a solid security foundation but requires immediate attention to:

1. **2 Critical bugs** in smart contracts (referral insolvency, lottery tickets)
2. **Dependency vulnerabilities** across the stack
3. **Distributed state management** for production API deployment

**Estimated Fix Time:**

- Critical fixes: 1-2 days
- High priority: 3-5 days
- Medium priority: 1-2 weeks

**Recommendation:** Do not deploy to mainnet until Critical and High issues are resolved.

---

_Report generated by Claude Code Security Analysis_
_For questions: security@khipuvault.com_
