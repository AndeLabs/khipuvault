---
description: Check blockchain event indexer health and sync status
argument-hint: component (listeners|sync|reorg|all)
---

# Indexer Health Check: $ARGUMENTS

Diagnose the blockchain event indexer for KhipuVault.

## Component Checks

### 1. RPC Connectivity

```bash
# Get current block number from Mezo testnet
curl -s -X POST https://rpc.test.mezo.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### 2. Sync Status

Check if indexer is synced with chain head:

```bash
# Query last processed block from database
pnpm --filter @khipu/database db:studio
# Or via API if available
curl -s http://localhost:3001/api/indexer/status
```

Compare:

- `lastProcessedBlock` from database
- `eth_blockNumber` from RPC
- Lag should be < 100 blocks for healthy status

### 3. Event Listeners

Verify listeners are active for:

- **IndividualPool** (0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393)
  - Events: Deposit, Withdraw, YieldClaimed
- **CooperativePool** (0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88)
  - Events: MemberJoined, ContributionMade, PayoutDistributed

### 4. Recent Events

```bash
# Check for recent transactions in database
# Should see new entries if blockchain has activity
```

### 5. Error Analysis

Look for common issues:

- RPC rate limiting (429 errors)
- Connection timeouts
- Reorg detection failures
- Database connection errors

## Diagnostic Commands

```bash
# Start indexer with verbose logging
LOG_LEVEL=debug pnpm --filter @khipu/blockchain dev

# Check for retry patterns (indicates issues)
# Look for "retry", "error", "failed" in logs
```

## Health Indicators

| Metric      | Healthy | Warning  | Critical |
| ----------- | ------- | -------- | -------- |
| Block lag   | < 10    | 10-100   | > 100    |
| RPC latency | < 500ms | 500ms-2s | > 2s     |
| Error rate  | 0%      | < 5%     | > 5%     |
| Retry count | 0       | 1-3      | > 3      |

## Output

Report:

- Current sync status (blocks behind)
- Active listeners and their status
- Recent errors with timestamps
- Recommendations for fixing issues
