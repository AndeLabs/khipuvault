---
description: Run full stack integration tests (contract → indexer → API → frontend)
argument-hint: flow (deposit|withdraw|yield|full)
---

# Integration Test: $ARGUMENTS

Test the complete data flow through all KhipuVault system layers.

## Test Flows

### Deposit Flow

```
User Wallet → Smart Contract → Blockchain Event → Indexer → Database → API → Frontend
```

### Withdraw Flow

```
Frontend → API → Smart Contract → Blockchain Event → Indexer → Database Update
```

### Yield Flow

```
YieldAggregator → Mezo Staking → Yield Event → Indexer → User Balance Update
```

## Pre-requisites

Before running integration tests:

```bash
# 1. Ensure all services are running
pnpm dev

# 2. Verify database is clean or seeded
pnpm db:seed

# 3. Check RPC connectivity
curl -s -X POST https://rpc.test.mezo.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Test Steps

### 1. Contract Interaction Test

```bash
# Run contract tests first
cd packages/contracts
forge test -vvv --match-test "test_Deposit"
```

### 2. Event Indexing Test

- Make a test deposit transaction
- Verify event is captured by indexer
- Check database for new record

```bash
# Monitor indexer logs
LOG_LEVEL=debug pnpm --filter @khipu/blockchain dev
```

### 3. API Response Test

```bash
# Get user transactions
curl -s http://localhost:3001/api/transactions?userAddress=TEST_ADDRESS

# Verify deposit appears in response
```

### 4. Data Consistency Check

Compare:

- On-chain balance (from contract)
- Database record (from Prisma)
- API response (from endpoint)

All three should match.

## Automated Test Commands

```bash
# Run all integration tests
pnpm test:integration

# Run specific flow test
pnpm test:integration --grep "deposit flow"

# Run with coverage
pnpm test:integration --coverage
```

## Expected Results

| Step            | Expected              | Actual |
| --------------- | --------------------- | ------ |
| Contract call   | Success               | ?      |
| Event emitted   | Deposit(user, amount) | ?      |
| Indexer capture | < 30s                 | ?      |
| Database record | Created               | ?      |
| API response    | Includes tx           | ?      |
| Frontend update | Shows new balance     | ?      |

## Common Issues

1. **Event not indexed**
   - Check indexer is running
   - Verify contract address in listener
   - Check block confirmation depth

2. **Database mismatch**
   - Possible reorg occurred
   - Check for duplicate txHash handling

3. **API stale data**
   - Check cache invalidation
   - Verify React Query refetch

## Output

Report:

- Test results for each step
- Timing for each operation
- Any failures with error details
- Data consistency verification
- Recommendations for fixes
