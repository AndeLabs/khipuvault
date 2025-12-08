---
name: express-api
description: Express.js API patterns with SIWE authentication, Zod validation, and Pino logging for Web3 backends
---

# Express.js API Patterns

This skill provides expertise in building secure, scalable APIs for Web3 applications.

## Route Structure

```typescript
// apps/api/src/routes/pools.ts
import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { PoolService } from "../services/pools";
import { logger } from "../lib/logger";

const router = Router();

// Validation schemas
const GetPoolSchema = z.object({
  poolAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

const DepositSchema = z.object({
  amount: z.string().regex(/^\d+$/), // BigInt as string
  poolType: z.enum(["INDIVIDUAL", "COOPERATIVE"]),
});

// GET /api/pools/:poolAddress
router.get("/:poolAddress", async (req, res, next) => {
  try {
    const { poolAddress } = GetPoolSchema.parse(req.params);
    const pool = await PoolService.getByAddress(poolAddress);

    if (!pool) {
      return res.status(404).json({ error: "Pool not found" });
    }

    res.json(pool);
  } catch (error) {
    next(error);
  }
});

// POST /api/pools/deposit (authenticated)
router.post("/deposit", authenticate, async (req, res, next) => {
  try {
    const data = DepositSchema.parse(req.body);
    const result = await PoolService.recordDeposit({
      ...data,
      userAddress: req.user.address,
    });

    logger.info(
      {
        userId: req.user.id,
        amount: data.amount,
      },
      "Deposit recorded",
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
```

## SIWE Authentication Middleware

```typescript
// apps/api/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { SiweMessage } from "siwe";
import jwt from "jsonwebtoken";
import { prisma } from "@khipu/database";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthenticatedRequest extends Request {
  user: { id: string; address: string };
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      address: string;
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    (req as AuthenticatedRequest).user = {
      id: user.id,
      address: user.address,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// SIWE verification endpoint
export async function verifySiwe(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { message, signature } = req.body;

    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });

    if (!fields.success) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Find or create user
    const user = await prisma.user.upsert({
      where: { address: fields.data.address },
      create: { address: fields.data.address },
      update: { lastActiveAt: new Date() },
    });

    // Generate JWT
    const token = jwt.sign(
      { address: user.address, userId: user.id },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({ token, user });
  } catch (error) {
    next(error);
  }
}
```

## Error Handling Middleware

```typescript
// apps/api/src/middleware/error.ts
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@khipu/database";
import { logger } from "../lib/logger";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation error",
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Resource already exists" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Resource not found" });
    }
  }

  // Log unexpected errors
  logger.error({ err, path: req.path }, "Unhandled error");

  // Don't expose internal errors in production
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(500).json({ error: message });
}
```

## Pino Logger Setup

```typescript
// apps/api/src/lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty" }
      : undefined,
  base: {
    service: "khipuvault-api",
    env: process.env.NODE_ENV,
  },
});

// Usage examples:
// logger.info({ userId, action: 'deposit' }, 'User deposited funds');
// logger.error({ err, txHash }, 'Transaction failed');
// logger.warn({ address }, 'Suspicious activity detected');
```

## Request Rate Limiting

```typescript
// apps/api/src/middleware/rateLimit.ts
import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 auth attempts per hour
  message: { error: "Too many authentication attempts" },
});
```

## Best Practices

- Always validate input with Zod schemas
- Use service layer for business logic (keep routes thin)
- Log with structured data using Pino
- Handle all error types in error middleware
- Apply rate limiting to sensitive endpoints
- Use SIWE for Web3 authentication
- Return consistent error response format
