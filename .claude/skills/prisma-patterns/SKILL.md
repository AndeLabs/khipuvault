---
name: prisma-patterns
description: Prisma ORM patterns for PostgreSQL - schema design, migrations, efficient queries, transactions, and blockchain data handling
---

# Prisma Database Patterns

This skill provides expertise in Prisma ORM patterns for PostgreSQL, particularly for blockchain applications.

## Schema Design

### Blockchain Data Types

```prisma
model Transaction {
  id        String   @id @default(cuid())
  txHash    String   @unique // Ethereum tx hash
  blockNumber Int
  from      String   // Address
  to        String   // Address
  value     Decimal  @db.Decimal(78, 0) // uint256 max: 78 digits
  gasUsed   BigInt
  timestamp DateTime

  @@index([blockNumber])
  @@index([from])
  @@index([to])
}
```

### User Model with Wallet

```prisma
model User {
  id        String   @id @default(cuid())
  address   String   @unique // Ethereum address, lowercase
  nonce     String   @default(uuid()) // SIWE nonce
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  deposits  Deposit[]

  @@index([address])
}
```

## Query Patterns

### Idempotent Upserts (Event Processing)

```typescript
// Handle duplicate events
await prisma.deposit.upsert({
  where: { txHash },
  create: {
    txHash,
    userId,
    amount,
    blockNumber,
  },
  update: {}, // No update on duplicate
});
```

### Efficient Pagination

```typescript
// Cursor-based (recommended for large datasets)
const deposits = await prisma.deposit.findMany({
  take: 20,
  cursor: lastId ? { id: lastId } : undefined,
  skip: lastId ? 1 : 0,
  orderBy: { createdAt: "desc" },
});

// Offset-based (simpler, ok for smaller datasets)
const deposits = await prisma.deposit.findMany({
  take: 20,
  skip: page * 20,
  orderBy: { createdAt: "desc" },
});
```

### Aggregations

```typescript
const stats = await prisma.deposit.aggregate({
  _sum: { amount: true },
  _count: true,
  _avg: { amount: true },
  where: { userId },
});
```

### Transactions

```typescript
// Sequential operations
const [deposit, user] = await prisma.$transaction([
  prisma.deposit.create({ data: depositData }),
  prisma.user.update({
    where: { id: userId },
    data: { totalDeposits: { increment: amount } },
  }),
]);

// Interactive transaction (with logic)
await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  await tx.deposit.create({ data: { ...depositData, userId: user.id } });
  await tx.user.update({
    where: { id: user.id },
    data: { balance: { increment: amount } },
  });
});
```

## Commands

```bash
pnpm db:generate    # After schema changes
pnpm db:push        # Dev: push without migration
pnpm db:migrate dev # Prod: create migration
pnpm db:studio      # GUI browser
```

## Best Practices

- Use `Decimal(78,0)` for wei values
- Always add indexes for query fields
- Use `@unique` for blockchain identifiers
- Use upsert for idempotent event processing
- Prefer cursor pagination for large datasets
- Run `db:generate` after every schema change
