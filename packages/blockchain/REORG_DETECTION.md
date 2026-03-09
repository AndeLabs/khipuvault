# Blockchain Reorganization Detection

This document describes the chain reorganization (reorg) detection and handling system in the KhipuVault blockchain indexer.

## Overview

Blockchain reorganizations occur when the network temporarily forks and then converges on a different canonical chain. This can cause previously indexed events to become invalid. The reorg detection system ensures data consistency by:

1. Tracking block hashes in a dedicated table
2. Verifying parent hash chains to detect forks
3. Marking affected transactions as reorged
4. Allowing re-indexing of the new canonical chain

## Configuration

Set these environment variables to configure reorg detection:

```bash
# Number of confirmations before considering a block final (default: 6)
REORG_CONFIRMATION_DEPTH=6

# How often to check for reorgs in milliseconds (default: 30000 = 30s)
REORG_CHECK_INTERVAL=30000

# Number of recent block hashes to keep (default: 100)
REORG_DETECTION_DEPTH=100

# Maximum reorg depth to handle automatically (default: 50)
REORG_MAX_DEPTH=50
```

## How It Works

### 1. Block Hash Tracking

As events are processed, the system stores block hashes in the `BlockHash` table:

```typescript
{
  blockNumber: number;
  blockHash: string;
  parentHash: string;
  timestamp: Date;
  isFinalized: boolean;
}
```

### 2. Parent Hash Verification

The reorg handler periodically:

- Fetches recent stored block hashes
- Compares them against the current chain
- Verifies parent hash chains for continuity
- Detects the exact fork point where chains diverged

### 3. Fork Point Detection

When a reorg is detected:

```
Stored Chain:  ... -> Block 100 (hash A) -> Block 101 (hash B) -> Block 102 (hash C)
Current Chain: ... -> Block 100 (hash A) -> Block 101 (hash D) -> Block 102 (hash E)
                                             ^
                                        Fork Point
```

The system identifies Block 100 as the fork point and marks Blocks 101-102 as orphaned.

### 4. Atomic Rollback

When a reorg is detected, the system atomically:

- Marks affected `Deposit` records as `REORGED`
- Marks affected `EventLog` records as `removed: true`
- Deletes orphaned `BlockHash` records
- Stores new canonical block hashes

### 5. Re-indexing

After marking orphaned data:

- Event listeners automatically re-process the new canonical blocks
- Historical indexing picks up any missed events
- Idempotent upserts prevent duplicate processing

## Database Schema

### BlockHash Table

```prisma
model BlockHash {
  id          String   @id @default(cuid())
  blockNumber Int      @unique
  blockHash   String
  parentHash  String
  timestamp   DateTime

  isFinalized Boolean  @default(false)
  confirmedAt Int?     // Block number when considered confirmed

  createdAt   DateTime @default(now())

  @@index([blockNumber])
  @@index([blockHash])
  @@index([isFinalized])
}
```

### Transaction Status

Deposits and events can have these statuses:

- `PENDING`: Waiting for confirmations
- `CONFIRMED`: Finalized and safe
- `REORGED`: Invalidated by chain reorganization
- `FAILED`: Transaction failed

## API Usage

### Get Reorg Handler

```typescript
import { getReorgHandler } from "@khipu/blockchain";

const reorgHandler = getReorgHandler();

// Start periodic checking
reorgHandler.start();

// Check current status
const status = reorgHandler.getStatus();
console.log(status);
// {
//   isRunning: true,
//   config: { confirmationDepth: 6, ... },
//   stats: { reorgCount: 0, maxDepthSeen: 0 }
// }
```

### Manual Reorg Check

```typescript
const result = await reorgHandler.checkForReorgs();

if (result.detected) {
  console.log(`Reorg detected!`);
  console.log(`Depth: ${result.reorgDepth}`);
  console.log(`Fork point: ${result.forkPoint}`);
  console.log(`Affected transactions: ${result.affectedTransactions}`);
}
```

### Get Reorg Statistics

```typescript
const stats = await reorgHandler.getReorgStats();
console.log(stats);
// {
//   totalReorgsDetected: 5,
//   maxReorgDepth: 3,
//   lastReorgAt: Date,
//   totalAffectedBlocks: 15,
//   totalAffectedTransactions: 42
// }
```

### Verify Block Range

```typescript
// Check if specific blocks are consistent with the chain
const inconsistentBlocks = await reorgHandler.verifyBlockRange(1000, 2000);

if (inconsistentBlocks.length > 0) {
  console.log(`Inconsistent blocks: ${inconsistentBlocks}`);
}
```

## Safety Guarantees

### Confirmation Depth

Blocks are only considered finalized after `CONFIRMATION_DEPTH` confirmations (default: 6 blocks on Mezo testnet, ~1 minute).

### Maximum Reorg Depth

Reorgs deeper than `REORG_MAX_DEPTH` (default: 50 blocks) require manual intervention. The system will:

- Log the critical error
- Not automatically mark transactions as reorged
- Require admin review before proceeding

### Audit Trail

The system never deletes data:

- Reorged deposits are marked with `status: REORGED`
- Orphaned events are marked with `removed: true`
- All historical data remains queryable for auditing

## Monitoring

### Logs

The reorg handler emits structured logs:

```
🔍 ReorgHandler initialized with config: {...}
🔄 Reorg detected: { depth: 3, forkPoint: 1000, orphanedBlocks: 3 }
✅ Reorg handled: { affectedDeposits: 5, affectedEvents: 12, newBlocksStored: 3 }
🧹 Cleaned up 100 old block hashes (before block 500)
```

### Health Metrics

Query reorg statistics for monitoring:

```sql
-- Count reorged transactions
SELECT COUNT(*) FROM "Deposit" WHERE status = 'REORGED';

-- Find recent reorgs
SELECT "blockNumber", "updatedAt"
FROM "Deposit"
WHERE status = 'REORGED'
ORDER BY "updatedAt" DESC
LIMIT 10;

-- Check block hash coverage
SELECT COUNT(*), MIN("blockNumber"), MAX("blockNumber")
FROM "BlockHash"
WHERE "isFinalized" = false;
```

## Best Practices

1. **Set appropriate confirmation depth**: Higher values = safer but slower finality
2. **Monitor reorg statistics**: Alert on frequent or deep reorgs
3. **Regular verification**: Run `verifyBlockRange()` periodically
4. **Database backups**: Keep backups before major chain events
5. **Review critical reorgs**: Manually verify reorgs deeper than expected

## Troubleshooting

### High Reorg Frequency

If you see many reorgs:

- Increase `REORG_CONFIRMATION_DEPTH`
- Check network health
- Verify RPC provider reliability

### Deep Reorgs

If reorgs exceed `REORG_MAX_DEPTH`:

- Review chain explorer for network issues
- Compare stored hashes with multiple RPC providers
- Consider manual database rollback and re-sync

### Missing Block Hashes

If block hashes aren't being stored:

- Check that listeners are calling `storeBlockHashIfNeeded()`
- Verify database permissions
- Check for RPC provider errors

## Related Documentation

- [Prisma Schema](../../database/prisma/schema.prisma)
- [Event Listeners](./src/listeners/)
- [Retry Logic](./src/utils/retry.ts)
