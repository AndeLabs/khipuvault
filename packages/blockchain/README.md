# @khipu/blockchain

Blockchain event indexer for KhipuVault. Listens to on-chain events and stores them in the database.

## Features

- Real-time event listening for IndividualPool and CooperativePool contracts
- Historical event indexing with automatic resumption
- Retry logic with exponential backoff
- Batch processing for efficient RPC usage
- Graceful shutdown handling

## Setup

1. Configure environment variables in `.env`:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/khipuvault"
   RPC_URL="https://rpc.test.mezo.org"
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Ensure database is set up:
   ```bash
   cd ../database
   pnpm db:generate
   pnpm db:push
   ```

## Usage

### Start the indexer

```bash
pnpm dev        # Development mode with auto-reload
pnpm start      # Production mode
pnpm index start # Via CLI
```

### Programmatic usage

```typescript
import { startIndexer } from '@khipu/blockchain'

const orchestrator = await startIndexer()

// Later...
orchestrator.stop()
```

## Events Indexed

### IndividualPool
- `Deposited` - User deposits into pool
- `Withdrawn` - User withdraws from pool
- `YieldClaimed` - User claims earned yield
- `YieldDistributed` - Yield distributed to pool

### CooperativePool
- `PoolCreated` - New cooperative pool created
- `MemberJoined` - Member joins pool with contribution
- `MemberLeft` - Member leaves pool with refund
- `PoolActivated` - Pool reaches target and activates
- `YieldDistributed` - Yield distributed to pool members

## Architecture

```
src/
├── listeners/           # Event listeners for each contract
│   ├── base.ts         # Base listener class
│   ├── individual-pool.ts
│   └── cooperative-pool.ts
├── indexer/            # Orchestration layer
│   └── orchestrator.ts # Manages all listeners
├── utils/              # Utilities
│   └── retry.ts        # Retry and batch processing
├── provider.ts         # Ethers provider setup
├── index.ts            # Main entry point
└── cli.ts              # CLI interface
```

## Development

```bash
# Run in development mode
pnpm dev

# Build
pnpm build

# Type check
pnpm tsc --noEmit
```
