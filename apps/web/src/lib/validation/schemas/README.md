# Validation Schemas

Schemas Zod centralizados para validación de formularios en KhipuVault.

## Estructura

```
schemas/
├── common.ts                 # Schemas reutilizables comunes
├── pool-schemas.ts          # Schemas para formularios de pools
├── transaction-schemas.ts   # Schemas para transacciones
├── user-schemas.ts          # Schemas para datos de usuario
└── index.ts                 # Re-exporta todo
```

## Common Schemas

### Address Schemas

```typescript
import { addressSchema, optionalAddressSchema } from "@/lib/validation";

// Validación básica
const schema = z.object({
  userAddress: addressSchema, // 0x... formato
  referer: optionalAddressSchema, // Opcional
});
```

### Amount Schemas

```typescript
import { amountSchema, createAmountRangeSchema } from "@/lib/validation";

// Monto simple
const depositSchema = z.object({
  amount: amountSchema, // > 0
});

// Con rango personalizado
const contributionSchema = z.object({
  amount: createAmountRangeSchema(0.001, 10, "BTC"),
});
```

### ID Schemas

```typescript
import { poolIdSchema, roundIdSchema } from "@/lib/validation";

const schema = z.object({
  poolId: poolIdSchema, // number o string -> number
  roundId: roundIdSchema,
});
```

### Percentage & Basis Points

```typescript
import { percentageSchema, basisPointsSchema } from "@/lib/validation";

const schema = z.object({
  apy: percentageSchema, // 0-100
  fee: basisPointsSchema, // 0-10000 (100 bp = 1%)
});
```

### String Schemas

```typescript
import { poolNameSchema, descriptionSchema } from "@/lib/validation";

const schema = z.object({
  name: poolNameSchema, // 3-50 chars, alphanumeric + space/-/_
  description: descriptionSchema, // max 500 chars, opcional
});
```

### Time Schemas

```typescript
import { timeUnitSchema, durationSchema, timestampSchema } from "@/lib/validation";

const schema = z.object({
  duration: durationSchema, // > 0
  unit: timeUnitSchema, // "days" | "weeks" | "months"
  deadline: timestampSchema, // Unix timestamp
});
```

## Pool Schemas

### Individual Pools

```typescript
import { depositSchema, withdrawSchema } from "@/lib/validation";

// Con validación de balance
import { createDepositSchemaWithBalance } from "@/lib/validation";

const schema = createDepositSchemaWithBalance(userBalance);
```

### Cooperative Pools

```typescript
import { createCooperativePoolSchema, joinCooperativePoolSchema } from "@/lib/validation";

const form = useForm<CreateCooperativePoolFormData>({
  resolver: zodResolver(createCooperativePoolSchema),
});
```

### Rotating Pools (ROSCA)

```typescript
import {
  createRotatingPoolSchema,
  joinRotatingPoolSchema,
  contributeToRotatingPoolSchema,
} from "@/lib/validation";

const form = useForm<CreateRotatingPoolFormData>({
  resolver: zodResolver(createRotatingPoolSchema),
});
```

## Transaction Schemas

### Record Transaction

```typescript
import {
  recordTransactionSchema,
  type TransactionType,
  type TransactionStatus,
} from "@/lib/validation";

const schema = recordTransactionSchema;
```

### Buy Lottery Tickets

```typescript
import { buyTicketsSchema, createBuyTicketsSchema } from '@/lib/validation';

// Schema básico
const form = useForm({
  resolver: zodResolver(buyTicketsSchema),
});

// Con límite personalizado
const schemaWithLimit = createBuyTicketsSchema(
  maxTicketsPerUser: 10,
  currentTickets: 3
);
```

### Approve Tokens

```typescript
import { approveTokenSchema, approveMaxSchema } from "@/lib/validation";

const form = useForm<ApproveTokenFormData>({
  resolver: zodResolver(approveTokenSchema),
});
```

## User Schemas

### User Profile

```typescript
import { userProfileSchema, updateUserProfileSchema } from "@/lib/validation";

const form = useForm<UpdateUserProfileFormData>({
  resolver: zodResolver(updateUserProfileSchema),
});
```

### User Preferences

```typescript
import {
  notificationPreferencesSchema,
  uiPreferencesSchema,
  userSettingsSchema,
} from "@/lib/validation";

const form = useForm<UIPreferencesFormData>({
  resolver: zodResolver(uiPreferencesSchema),
});
```

### Referrals

```typescript
import {
  applyReferralSchema,
  createCustomReferralSchema,
  referralCodeSchema,
} from "@/lib/validation";
```

### Watchlist

```typescript
import { addToWatchlistSchema, removeFromWatchlistSchema } from "@/lib/validation";
```

## Validation Helpers

### Transaction Helpers

```typescript
import { isFinalTransactionStatus, isPendingTransaction } from "@/lib/validation";

if (isFinalTransactionStatus(tx.status)) {
  // Transacción finalizada (CONFIRMED, FAILED, CANCELLED)
}

if (isPendingTransaction(tx.status)) {
  // Mostrar loading
}
```

### User Helpers

```typescript
import { isValidUsername, normalizeTwitterHandle, normalizeTelegramHandle } from "@/lib/validation";

const twitterHandle = normalizeTwitterHandle("@khipuvault");
// "khipuvault"
```

## Migración desde schemas.ts (Legacy)

Los siguientes schemas tienen alias para retrocompatibilidad:

| Legacy                 | Nuevo                         |
| ---------------------- | ----------------------------- |
| `depositFormSchema`    | `depositSchema`               |
| `withdrawFormSchema`   | `withdrawSchema`              |
| `createPoolFormSchema` | `createCooperativePoolSchema` |
| `joinPoolFormSchema`   | `joinCooperativePoolSchema`   |
| `buyTicketsFormSchema` | `buyTicketsSchema`            |

**Migrar gradualmente:**

```typescript
// Antes
import { depositFormSchema } from "@/lib/validation";

// Después
import { depositSchema } from "@/lib/validation";
```

## Ejemplos de Uso

### Formulario con React Hook Form

```typescript
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { depositSchema, type DepositFormData } from '@/lib/validation';

export function DepositForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
  });

  const onSubmit = async (data: DepositFormData) => {
    console.log(data.amount);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('amount')} />
      {errors.amount && <span>{errors.amount.message}</span>}
      <button type="submit">Deposit</button>
    </form>
  );
}
```

### Schema Dinámico con Validación de Balance

```typescript
import { createDepositSchemaWithBalance } from "@/lib/validation";

export function DepositFormWithBalance({ balance }: { balance: string }) {
  const depositSchema = createDepositSchemaWithBalance(balance);

  const form = useForm({
    resolver: zodResolver(depositSchema),
  });

  // ...
}
```

### Validación Manual

```typescript
import { depositSchema } from "@/lib/validation";

const result = depositSchema.safeParse({ amount: "100" });

if (result.success) {
  console.log(result.data.amount); // "100"
} else {
  console.error(result.error.errors);
}
```

## Mejores Prácticas

1. **Usa schemas centralizados**: No dupliques validaciones en componentes
2. **Mensajes en español**: Todos los mensajes de error están en español
3. **Schemas dinámicos**: Usa factories (`createXSchema`) para validaciones basadas en estado
4. **Transformaciones**: Los schemas normalizan datos automáticamente (trim, toLowerCase, etc.)
5. **Type-safety**: Usa tipos inferidos con `z.infer<typeof schema>`

## Características

- ✅ Mensajes de error en español
- ✅ Transformaciones automáticas (trim, toLowerCase, getAddress)
- ✅ Validaciones personalizadas con `.refine()`
- ✅ Schemas composables y reutilizables
- ✅ Type-safe con TypeScript
- ✅ Soporte para valores opcionales
- ✅ Validaciones de rangos dinámicas
- ✅ Integración con React Hook Form
