# Blockchain Reorganization Detection - Implementation Summary

This document summarizes the enhanced reorg detection implementation for KhipuVault.

## Changes Made

### 1. Database Schema Updates

**File**: `/Users/munay/dev/KhipuVault/packages/database/prisma/schema.prisma`

Added new `BlockHash` table for efficient reorg detection:

```prisma
model BlockHash {
  id          String   @id @default(cuid())
  blockNumber Int      @unique
  blockHash   String
  parentHash  String
  timestamp   DateTime

  isFinalized Boolean  @default(false)
  confirmedAt Int?

  createdAt   DateTime @default(now())

  @@index([blockNumber])
  @@index([blockHash])
  @@index([isFinalized])
  @@index([blockNumber, isFinalized])
}
```

**Migration Required**: Run `pnpm db:migrate dev` in `packages/database/`

### 2. Enhanced Reorg Handler

**File**: `/Users/munay/dev/KhipuVault/packages/blockchain/src/services/reorg-handler.ts`

**New Features**:

- **Configuration via Environment Variables**:
  - `REORG_CONFIRMATION_DEPTH` (default: 6)
  - `REORG_CHECK_INTERVAL` (default: 30000ms)
  - `REORG_DETECTION_DEPTH` (default: 100)
  - `REORG_MAX_DEPTH` (default: 50)

- **Parent Hash Verification**:
  - Verifies entire block chain integrity
  - Detects exact fork point where chains diverged
  - More reliable than simple hash comparison

- **Block Hash Storage**:
  - New `storeBlockHash()` method
  - Stores block metadata as events are processed
  - Maintains rolling window of recent blocks

- **Fork Point Detection**:
  - New `detectForkPoint()` method
  - Identifies exact block where reorg occurred
  - Returns orphaned blocks for rollback

- **Block Finalization**:
  - New `finalizeBlocks()` method
  - Marks blocks with sufficient confirmations
  - Reduces memory by cleaning old data

- **Automatic Cleanup**:
  - New `cleanupOldBlockHashes()` method
  - Removes old finalized blocks (1000+ blocks old)
  - Prevents table bloat

- **Enhanced Statistics**:
  - Tracks total reorg count
  - Records maximum depth seen
  - Reports affected transactions

- **Improved Error Handling**:
  - Structured logging with context
  - Critical alerts for deep reorgs
  - Non-blocking hash storage

### 3. Base Listener Updates

**File**: `/Users/munay/dev/KhipuVault/packages/blockchain/src/listeners/base.ts`

- Added `storeBlockHashIfNeeded()` helper method
- Automatically called during event processing
- Non-blocking to avoid affecting event throughput

### 4. Individual Pool Listener Updates

**File**: `/Users/munay/dev/KhipuVault/packages/blockchain/src/listeners/individual-pool.ts`

- Integrated `storeBlockHashIfNeeded()` call in `processEvent()`
- Stores block hash for each processed event
- Pattern can be replicated in other listeners

### 5. Exports and API

**File**: `/Users/munay/dev/KhipuVault/packages/blockchain/src/index.ts`

New exports:

```typescript
export {
  getReorgHandler,
  ReorgHandler,
  CONFIRMATION_DEPTH,
  REORG_DETECTION_DEPTH,
  REORG_MAX_DEPTH,
} from "./services/reorg-handler";
```

### 6. Configuration Files

**File**: `/Users/munay/dev/KhipuVault/packages/blockchain/.env.example`

Added reorg configuration section with documented defaults.

### 7. Documentation

**File**: `/Users/munay/dev/KhipuVault/packages/blockchain/REORG_DETECTION.md`

Comprehensive documentation covering:

- Architecture and flow
- Configuration options
- API usage examples
- Monitoring and troubleshooting
- Best practices

## How It Works

### Detection Flow

1. **Block Processing**:

   ```
   Event received -> Store block hash -> Process event -> Mark as processed
   ```

2. **Periodic Checking** (every 30s):

   ```
   Fetch stored blocks -> Verify against chain -> Detect mismatches -> Find fork point
   ```

3. **Reorg Handling**:
   ```
   Fork detected -> Mark orphaned data -> Store new hashes -> Trigger re-indexing
   ```

### Parent Hash Chain Verification

```
Block 100: hash A, parent: X  ✅ Match
Block 101: hash B, parent: A  ✅ Match
Block 102: hash C, parent: B  ❌ Mismatch! Parent should be D
                                 ^
                            Fork detected at 102
```

### Database Transaction Flow

When reorg detected:

```sql
BEGIN TRANSACTION;

-- Mark deposits as reorged
UPDATE "Deposit" SET status = 'REORGED' WHERE "blockNumber" IN (orphaned);

-- Mark events as removed
UPDATE "EventLog" SET removed = true WHERE "blockNumber" IN (orphaned);

-- Delete orphaned block hashes
DELETE FROM "BlockHash" WHERE "blockNumber" IN (orphaned);

-- Store new canonical hashes
INSERT INTO "BlockHash" (new canonical blocks);

COMMIT;
```

## Migration Steps

### 1. Update Database Schema

```bash
cd packages/database
pnpm db:migrate dev
```

Enter migration name: `add_block_hash_table`

### 2. Generate Prisma Client

```bash
pnpm db:generate
```

### 3. Update Environment Variables

Copy new variables from `.env.example` to `.env`:

```bash
# Reorg Detection
REORG_CONFIRMATION_DEPTH=6
REORG_CHECK_INTERVAL=30000
REORG_DETECTION_DEPTH=100
REORG_MAX_DEPTH=50
```

### 4. Test the Implementation

Start the indexer:

```bash
cd packages/blockchain
pnpm dev
```

Expected logs:

```
🔍 ReorgHandler initialized with config: { confirmationDepth: 6, ... }
🔍 ReorgHandler started (checking every 30s)
✅ Finalized X blocks
```

## Monitoring

### Check Block Hash Storage

```sql
SELECT COUNT(*), MIN("blockNumber"), MAX("blockNumber")
FROM "BlockHash";
```

### Check for Reorgs

```sql
SELECT COUNT(*) FROM "Deposit" WHERE status = 'REORGED';
SELECT COUNT(*) FROM "EventLog" WHERE removed = true;
```

### Programmatic Monitoring

```typescript
import { getReorgHandler } from "@khipu/blockchain";

const handler = getReorgHandler();

// Get statistics
const stats = await handler.getReorgStats();
console.log(stats);

// Get current status
const status = handler.getStatus();
console.log(status);
```

## Performance Considerations

### Storage

- Block hashes: ~200 bytes per block
- 100 blocks = ~20 KB
- 1000 blocks = ~200 KB
- Cleaned up automatically after finalization

### RPC Calls

- Hash storage: 1 call per unique block
- Reorg checking: ~100 calls every 30s (with 100 detection depth)
- Finalization: No extra calls (uses existing data)

### Database Impact

- Minimal: Single upsert per block processed
- Cleanup runs automatically
- Indexes ensure fast lookups

## Testing Recommendations

### Unit Tests (Future)

```typescript
describe("ReorgHandler", () => {
  test("detects fork point correctly", async () => {
    // Test fork point detection logic
  });

  test("handles deep reorgs", async () => {
    // Test max depth enforcement
  });

  test("finalizes blocks with confirmations", async () => {
    // Test finalization logic
  });
});
```

### Integration Tests (Future)

- Simulate reorg by manipulating test chain
- Verify data consistency after reorg
- Test re-indexing of canonical blocks

### Manual Testing

1. Monitor logs during normal operation
2. Check block hash storage is working
3. Verify finalization after confirmations
4. Test reorg detection with testnet data

## Rollout Plan

### Phase 1: Deploy Schema

- [x] Add BlockHash table
- [ ] Run migration on testnet DB
- [ ] Verify table creation

### Phase 2: Enable Hash Storage

- [x] Implement storage in listeners
- [ ] Deploy to testnet indexer
- [ ] Monitor hash accumulation

### Phase 3: Enable Detection

- [x] Activate reorg checking
- [ ] Monitor for false positives
- [ ] Tune configuration if needed

### Phase 4: Full Production

- [ ] Deploy to mainnet (when ready)
- [ ] Set up monitoring alerts
- [ ] Document operational runbooks

## Related Files

### Modified Files

- `/packages/database/prisma/schema.prisma` - Added BlockHash table
- `/packages/blockchain/src/services/reorg-handler.ts` - Enhanced detection
- `/packages/blockchain/src/listeners/base.ts` - Added hash storage helper
- `/packages/blockchain/src/listeners/individual-pool.ts` - Integrated storage
- `/packages/blockchain/src/index.ts` - Exported reorg APIs
- `/packages/blockchain/.env.example` - Added configuration

### New Files

- `/packages/blockchain/REORG_DETECTION.md` - User documentation
- `/REORG_IMPLEMENTATION.md` - This implementation summary

### To Update (Other Listeners)

- `/packages/blockchain/src/listeners/cooperative-pool.ts`
- `/packages/blockchain/src/listeners/lottery-pool.ts`
- `/packages/blockchain/src/listeners/rotating-pool.ts`
- `/packages/blockchain/src/listeners/mezo-trove-manager.ts`
- `/packages/blockchain/src/listeners/mezo-stability-pool.ts`

Each should add:

```typescript
protected async processEvent(event: ethers.Log, parsedLog: ethers.LogDescription): Promise<void> {
  // Store block hash for reorg detection
  await this.storeBlockHashIfNeeded(event.blockNumber);

  // ... rest of processing
}
```

## Notes

- All changes are backward compatible
- No breaking changes to existing APIs
- Graceful degradation if features disabled
- Comprehensive error handling
- Structured logging for debugging
