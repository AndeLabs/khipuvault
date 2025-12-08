---
name: zod-validation
description: Zod schema validation patterns for API requests, blockchain data, and type-safe validation
---

# Zod Validation Patterns

This skill provides expertise in Zod for runtime type validation.

## Basic Schemas

```typescript
import { z } from "zod";

// Ethereum address validation
const AddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
  .transform((addr) => addr.toLowerCase() as `0x${string}`);

// Transaction hash validation
const TxHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash");

// BigInt as string (for API transport)
const BigIntStringSchema = z
  .string()
  .regex(/^\d+$/, "Must be a numeric string")
  .transform((val) => BigInt(val));

// Wei amount with bounds
const WeiAmountSchema = z
  .string()
  .regex(/^\d+$/)
  .refine((val) => BigInt(val) > 0n, "Amount must be positive")
  .refine(
    (val) =>
      BigInt(val) <=
      BigInt(
        "115792089237316195423570985008687907853269984665640564039457584007913129639935",
      ),
    "Exceeds max uint256",
  );
```

## API Request Schemas

```typescript
// User registration/auth
const AuthRequestSchema = z.object({
  message: z.string().min(1),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
});

// Deposit request
const DepositRequestSchema = z.object({
  poolAddress: AddressSchema,
  amount: WeiAmountSchema,
  poolType: z.enum(["INDIVIDUAL", "COOPERATIVE", "LOTTERY"]),
});

// Pagination
const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "amount", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Query filters
const TransactionFilterSchema = z
  .object({
    userAddress: AddressSchema.optional(),
    poolAddress: AddressSchema.optional(),
    status: z.enum(["PENDING", "CONFIRMED", "FAILED"]).optional(),
    type: z.enum(["DEPOSIT", "WITHDRAW", "YIELD_CLAIM"]).optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
  })
  .merge(PaginationSchema);
```

## Response Schemas

```typescript
// Pool response
const PoolResponseSchema = z.object({
  address: AddressSchema,
  type: z.enum(["INDIVIDUAL", "COOPERATIVE", "LOTTERY"]),
  totalDeposits: z.string(), // BigInt as string
  participantCount: z.number(),
  status: z.enum(["ACTIVE", "PAUSED", "CLOSED"]),
  createdAt: z.string().datetime(),
});

// Transaction response
const TransactionResponseSchema = z.object({
  id: z.string(),
  txHash: TxHashSchema,
  userAddress: AddressSchema,
  poolAddress: AddressSchema,
  amount: z.string(),
  type: z.enum(["DEPOSIT", "WITHDRAW", "YIELD_CLAIM"]),
  status: z.enum(["PENDING", "CONFIRMED", "FAILED"]),
  blockNumber: z.number().nullable(),
  createdAt: z.string().datetime(),
  confirmedAt: z.string().datetime().nullable(),
});

// Paginated response
const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });

// Usage
const TransactionsResponseSchema = PaginatedResponseSchema(
  TransactionResponseSchema,
);
```

## Middleware Integration

```typescript
import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

// Generic validation middleware
export function validate<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}

// Validate query params
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

// Usage in routes
router.post(
  "/deposit",
  authenticate,
  validate(DepositRequestSchema),
  depositController,
);

router.get(
  "/transactions",
  authenticate,
  validateQuery(TransactionFilterSchema),
  transactionsController,
);
```

## Type Inference

```typescript
// Infer TypeScript types from schemas
type AuthRequest = z.infer<typeof AuthRequestSchema>;
type DepositRequest = z.infer<typeof DepositRequestSchema>;
type TransactionFilter = z.infer<typeof TransactionFilterSchema>;
type PoolResponse = z.infer<typeof PoolResponseSchema>;

// Use in service layer
async function createDeposit(data: DepositRequest): Promise<PoolResponse> {
  // TypeScript knows the exact shape of data
  const { poolAddress, amount, poolType } = data;
  // ...
}
```

## Advanced Patterns

### Discriminated Unions

```typescript
const TransactionEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("DEPOSIT"),
    amount: WeiAmountSchema,
    poolAddress: AddressSchema,
  }),
  z.object({
    type: z.literal("WITHDRAW"),
    amount: WeiAmountSchema,
    poolAddress: AddressSchema,
    fee: WeiAmountSchema,
  }),
  z.object({
    type: z.literal("YIELD_CLAIM"),
    amount: WeiAmountSchema,
    yieldSource: z.string(),
  }),
]);
```

### Conditional Validation

```typescript
const PoolConfigSchema = z
  .object({
    type: z.enum(["INDIVIDUAL", "COOPERATIVE"]),
    minDeposit: WeiAmountSchema,
    // Required only for COOPERATIVE
    votingThreshold: z.number().min(1).max(100).optional(),
  })
  .refine(
    (data) => data.type !== "COOPERATIVE" || data.votingThreshold !== undefined,
    { message: "Voting threshold required for cooperative pools" },
  );
```

## Best Practices

- Always validate at API boundaries
- Use `.transform()` for type coercion
- Use `.refine()` for custom validation logic
- Export both schemas and inferred types
- Create reusable base schemas for common patterns
- Use discriminated unions for polymorphic data
- Keep error messages user-friendly
