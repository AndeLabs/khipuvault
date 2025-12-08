# @khipu/database

Prisma database client for KhipuVault.

## Setup

1. Configure DATABASE_URL in `.env`
2. Generate Prisma client: `pnpm db:generate`
3. Push schema to DB: `pnpm db:push`
4. Seed database: `pnpm db:seed`

## Usage

```typescript
import { prisma } from "@khipu/database";

// Query example
const users = await prisma.user.findMany();
```

## Development

```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes
pnpm db:push

# Create migration
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio

# Seed database
pnpm db:seed
```
