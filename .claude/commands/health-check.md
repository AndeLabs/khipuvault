---
description: Check health status of all services (API, web, indexer, database)
---

# Health Check

Verify the health and connectivity of all KhipuVault services.

## Service Checks

### 1. Database (PostgreSQL)

```bash
# Check if Docker container is running
docker ps | grep postgres

# Test database connection
pnpm --filter @khipu/database db:generate --no-engine-check
```

### 2. API Server (Port 3001)

```bash
# Health endpoint
curl -s http://localhost:3001/health | head -20

# If no response, check if running
lsof -i :3001
```

### 3. Web Frontend (Port 9002)

```bash
# Check if accessible
curl -s -o /dev/null -w "%{http_code}" http://localhost:9002

# If not 200, check if running
lsof -i :9002
```

### 4. Blockchain RPC (Mezo Testnet)

```bash
# Check RPC connectivity and get current block
curl -s -X POST https://rpc.test.mezo.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### 5. Indexer Service

```bash
# Check if indexer process is running
pgrep -f "blockchain" || echo "Indexer not running"

# Check recent logs for errors
tail -50 ~/.khipuvault/logs/indexer.log 2>/dev/null || echo "No log file found"
```

## Quick Status Commands

```bash
# All services at once
docker ps && \
lsof -i :3001 -i :9002 | head -10 && \
curl -s http://localhost:3001/health
```

## Output

Report status for each service:

- **HEALTHY**: Service responding normally
- **DEGRADED**: Service running but with issues
- **DOWN**: Service not responding
- **UNKNOWN**: Cannot determine status

Include:

- Response times
- Error messages if any
- Recommendations for fixing issues
