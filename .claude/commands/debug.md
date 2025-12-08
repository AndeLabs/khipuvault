---
description: Debug common issues in development
argument-hint: error-type (db, api, web, contracts, indexer)
---

# Debug: $ARGUMENTS

Troubleshoot KhipuVault development issues.

## Database Issues (db)

```bash
docker ps                    # Check if PostgreSQL is running
pnpm docker:up              # Start if not running
pnpm db:generate            # Regenerate Prisma client
pnpm db:push                # Push schema changes
```

## API Issues (api)

```bash
lsof -i :3001               # Check if port is in use
curl http://localhost:3001/health  # Health check
pnpm --filter @khipu/api dev      # Start in isolation
```

## Web Issues (web)

```bash
lsof -i :9002               # Check if port is in use
pnpm --filter @khipu/web dev      # Start in isolation
```

## Contract Issues (contracts)

```bash
cd packages/contracts
forge clean                 # Clean artifacts
forge build                 # Rebuild
forge test -vvvv            # Verbose test output
```

## Indexer Issues (indexer)

```bash
# Check RPC connectivity
curl -X POST https://rpc.test.mezo.org -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check listener logs
pnpm --filter @khipu/blockchain dev
```

Based on "$ARGUMENTS", run the relevant diagnostic commands and analyze the output.
