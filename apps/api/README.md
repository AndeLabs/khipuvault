# @khipu/api

REST API backend for KhipuVault.

## Features

- User portfolio and transaction management
- Pool data and analytics
- Transaction history
- Global statistics and leaderboards
- Event logs and activity timeline
- Comprehensive validation with Zod
- Error handling middleware
- CORS and security headers

## Setup

1. Configure environment variables in `.env`:
   ```bash
   PORT=3001
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   DATABASE_URL="postgresql://user:password@localhost:5432/khipuvault"
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Ensure database is set up:
   ```bash
   cd ../packages/database
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```

## Usage

```bash
pnpm dev      # Development mode with auto-reload
pnpm build    # Build for production
pnpm start    # Start production server
```

## API Endpoints

### Health
- `GET /health` - Health check

### Users
- `GET /api/users/:address` - Get user by address
- `GET /api/users/:address/portfolio` - Get user portfolio
- `GET /api/users/:address/transactions` - Get user transactions
- `GET /api/users/:address/positions` - Get user pool positions
- `POST /api/users` - Create or update user

### Pools
- `GET /api/pools` - Get all active pools
- `GET /api/pools/:poolId` - Get pool by ID
- `GET /api/pools/address/:address` - Get pool by contract address
- `GET /api/pools/:poolId/analytics` - Get pool analytics (TVL, APR over time)
- `GET /api/pools/address/:address/users` - Get all users in a pool
- `POST /api/pools/address/:address/refresh` - Refresh pool statistics

### Transactions
- `GET /api/transactions/recent` - Get recent transactions
- `GET /api/transactions/stats` - Get transaction statistics
- `GET /api/transactions/:txHash` - Get transaction by hash
- `GET /api/transactions/pool/:poolAddress` - Get transactions for a pool

### Analytics
- `GET /api/analytics/global` - Get global platform statistics
- `GET /api/analytics/timeline?days=30` - Get activity timeline
- `GET /api/analytics/top-pools?limit=10` - Get top pools by TVL
- `GET /api/analytics/top-users?limit=10` - Get top users by balance
- `GET /api/analytics/events` - Get recent event logs

## Architecture

```
src/
├── routes/              # Express routes
│   ├── users.ts
│   ├── pools.ts
│   ├── transactions.ts
│   ├── analytics.ts
│   └── health.ts
├── services/            # Business logic
│   ├── users.ts
│   ├── pools.ts
│   ├── transactions.ts
│   └── analytics.ts
├── middleware/          # Express middleware
│   ├── error-handler.ts
│   ├── not-found.ts
│   └── validate.ts
└── index.ts            # Main entry point
```

## Development

```bash
# Run in development mode
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Type check
pnpm tsc --noEmit
```

## Error Handling

The API uses a centralized error handling middleware that:
- Validates requests with Zod schemas
- Returns consistent error responses
- Logs errors for debugging
- Handles both operational and unexpected errors

## Security

- CORS enabled with configurable origins
- Helmet.js for security headers
- Input validation on all endpoints
- SQL injection protection via Prisma
