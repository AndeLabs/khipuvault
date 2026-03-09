# Reorg Detection Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Blockchain Event Stream                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Event Listeners                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Individual   │  │ Cooperative  │  │    Mezo      │          │
│  │    Pool      │  │    Pool      │  │   Protocol   │  ...     │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               storeBlockHashIfNeeded()                           │
│               (called per event)                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BlockHash Table                              │
│  ┌────────────────────────────────────────────────────┐         │
│  │  blockNumber │ blockHash │ parentHash │ finalized  │         │
│  ├────────────────────────────────────────────────────┤         │
│  │     1001     │  0xabc... │  0x123...  │   false    │         │
│  │     1002     │  0xdef... │  0xabc...  │   false    │         │
│  │     1003     │  0x789... │  0xdef...  │   false    │         │
│  └────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ReorgHandler                                  │
│              (runs every 30 seconds)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Fetch stored blocks (last 100)     │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Fetch current chain blocks         │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Compare hashes & verify parents    │
        └─────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        ┌──────────────┐            ┌──────────────┐
        │  Match ✅    │            │  Mismatch ❌ │
        └──────────────┘            └──────────────┘
                │                           │
                ▼                           ▼
        ┌──────────────┐            ┌──────────────┐
        │  Finalize    │            │ Find Fork    │
        │   Blocks     │            │    Point     │
        └──────────────┘            └──────────────┘
                                            │
                                            ▼
                                    ┌──────────────┐
                                    │ Mark as      │
                                    │  REORGED     │
                                    └──────────────┘
                                            │
                                            ▼
                                    ┌──────────────┐
                                    │ Store New    │
                                    │   Hashes     │
                                    └──────────────┘
                                            │
                                            ▼
                                    ┌──────────────┐
                                    │ Re-index     │
                                    │  (automatic) │
                                    └──────────────┘
```

## Data Flow During Reorg

### Normal Operation

```
Block arrives → Store hash → Process events → Mark confirmed
```

### Reorg Detected

```
1. Detection Phase
   ┌──────────────────────────────────────────────────┐
   │ Stored: Block 100 (hash A) → Block 101 (hash B) │
   │ Chain:  Block 100 (hash A) → Block 101 (hash C) │
   │                                        ↑         │
   │                                  Mismatch!       │
   └──────────────────────────────────────────────────┘

2. Fork Point Identification
   ┌──────────────────────────────────────────────────┐
   │ Walk back comparing hashes...                    │
   │ Block 100: MATCH ✅                              │
   │ Block 101: MISMATCH ❌ → This is the fork point │
   └──────────────────────────────────────────────────┘

3. Rollback Phase (Atomic Transaction)
   ┌──────────────────────────────────────────────────┐
   │ BEGIN TRANSACTION                                │
   │                                                  │
   │ 1. UPDATE Deposit                                │
   │    SET status = 'REORGED'                        │
   │    WHERE blockNumber IN (101, 102, ...)          │
   │                                                  │
   │ 2. UPDATE EventLog                               │
   │    SET removed = true, processed = false         │
   │    WHERE blockNumber IN (101, 102, ...)          │
   │                                                  │
   │ 3. DELETE FROM BlockHash                         │
   │    WHERE blockNumber IN (101, 102, ...)          │
   │                                                  │
   │ 4. INSERT INTO BlockHash (new canonical blocks)  │
   │                                                  │
   │ COMMIT                                           │
   └──────────────────────────────────────────────────┘

4. Re-indexing Phase
   ┌──────────────────────────────────────────────────┐
   │ Event listeners detect new blocks 101, 102...    │
   │ → Process events from canonical chain            │
   │ → Upsert pattern prevents duplicates             │
   │ → Database now consistent with canonical chain   │
   └──────────────────────────────────────────────────┘
```

## Database Schema Relationships

```
┌─────────────────┐
│   BlockHash     │
│─────────────────│
│ id              │
│ blockNumber  ◄──┼─────┐
│ blockHash       │     │
│ parentHash      │     │ References
│ isFinalized     │     │
└─────────────────┘     │
                        │
┌─────────────────┐     │
│   EventLog      │     │
│─────────────────│     │
│ id              │     │
│ blockNumber     ├─────┘
│ blockHash       │
│ removed         │ ◄─── Set to true on reorg
│ processed       │
└─────────────────┘
        │
        │ Related to
        ▼
┌─────────────────┐
│    Deposit      │
│─────────────────│
│ id              │
│ blockNumber     │
│ blockHash       │
│ status          │ ◄─── Set to REORGED on reorg
│ txHash          │
└─────────────────┘
```

## Component Interaction

```
┌──────────────────────────────────────────────────────────────────┐
│                          Provider                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ResilientProvider                                       │    │
│  │  - Connection management                                 │    │
│  │  - Health monitoring                                     │    │
│  │  - Automatic reconnection                                │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      ReorgHandler                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Configuration:                                          │    │
│  │  - CONFIRMATION_DEPTH: 6                                 │    │
│  │  - DETECTION_DEPTH: 100                                  │    │
│  │  - MAX_DEPTH: 50                                         │    │
│  │  - CHECK_INTERVAL: 30s                                   │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  Methods:                                                │    │
│  │  - start()                    Start monitoring           │    │
│  │  - checkForReorgs()           Detect reorgs              │    │
│  │  - detectForkPoint()          Find divergence            │    │
│  │  - handleReorg()              Mark & rollback            │    │
│  │  - storeBlockHash()           Save block metadata        │    │
│  │  - finalizeBlocks()           Mark confirmed blocks      │    │
│  │  - cleanupOldBlockHashes()    Remove old data            │    │
│  │  - getReorgStats()            Get statistics             │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BaseEventListener                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  - reorgHandler: ReorgHandler                            │    │
│  │  - storeBlockHashIfNeeded(blockNumber)                   │    │
│  │  - isBlockFinalized(blockNumber)                         │    │
│  │  - getSafeBlockNumber()                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Concrete Listeners                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  IndividualPoolListener                                  │    │
│  │  CooperativePoolListener                                 │    │
│  │  LotteryPoolListener                                     │    │
│  │  MezoTroveManagerListener                                │    │
│  │  ...                                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

## State Machine

```
Block State Transitions:

  NEW
   │
   ▼
UNFINALIZED ──────────────┐
   │                      │
   │ +6 confirmations     │ Reorg detected
   ▼                      │
FINALIZED                 ▼
   │                   ORPHANED
   │                      │
   │ +1000 blocks         │ Atomic transaction
   ▼                      ▼
CLEANED UP            MARKED REORGED
                          │
                          ▼
                      RE-INDEXED
```

## Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                   Error Categories                           │
└─────────────────────────────────────────────────────────────┘

1. Non-Critical (Log & Continue)
   ├─ Block hash storage failure
   ├─ Finalization errors
   └─ Cleanup errors

2. Retryable (Exponential Backoff)
   ├─ Network errors
   ├─ RPC timeouts
   └─ Temporary DB issues

3. Critical (Alert & Manual Intervention)
   ├─ Reorg depth > MAX_DEPTH
   ├─ Database transaction failures
   └─ Chain consistency violations

4. Expected (Handle Gracefully)
   ├─ Duplicate key errors (idempotency)
   ├─ Block not found (still syncing)
   └─ Parent hash missing (partial data)
```

## Performance Characteristics

### Time Complexity

- Block hash storage: O(1) per block
- Reorg detection: O(n) where n = DETECTION_DEPTH
- Fork point detection: O(n) in worst case
- Rollback: O(m) where m = number of orphaned blocks

### Space Complexity

- Block hash storage: O(DETECTION_DEPTH) ≈ 20 KB for 100 blocks
- With cleanup: Bounded to recent blocks only
- After finalization: O(FINALIZED_BLOCKS_RETENTION) ≈ 200 KB for 1000 blocks

### Network Impact

- Hash storage: 1 RPC call per new block
- Reorg check: ~100 RPC calls every 30s (with DETECTION_DEPTH=100)
- Optimized with batch requests where possible

## Configuration Trade-offs

```
CONFIRMATION_DEPTH
  ↑ Higher = Safer but slower finality
  ↓ Lower = Faster but riskier

DETECTION_DEPTH
  ↑ Higher = Detect deeper reorgs but more RPC calls
  ↓ Lower = Less overhead but miss deep reorgs

REORG_MAX_DEPTH
  ↑ Higher = Handle deeper reorgs automatically
  ↓ Lower = More conservative, require manual review

CHECK_INTERVAL
  ↑ Higher = Less network overhead
  ↓ Lower = Faster detection but more RPC calls
```

## Monitoring Points

```
┌─────────────────────────────────────────────────────────────┐
│                    Health Metrics                            │
├─────────────────────────────────────────────────────────────┤
│ 1. Block Hash Coverage                                       │
│    SELECT COUNT(*), MIN(blockNumber), MAX(blockNumber)       │
│    FROM BlockHash WHERE isFinalized = false                  │
│                                                              │
│ 2. Reorg Frequency                                           │
│    SELECT COUNT(*), MAX(updatedAt)                           │
│    FROM Deposit WHERE status = 'REORGED'                     │
│                                                              │
│ 3. Orphaned Events                                           │
│    SELECT COUNT(*) FROM EventLog WHERE removed = true        │
│                                                              │
│ 4. Handler Status                                            │
│    getReorgHandler().getStatus()                             │
│                                                              │
│ 5. RPC Health                                                │
│    getProviderHealth()                                       │
└─────────────────────────────────────────────────────────────┘
```
