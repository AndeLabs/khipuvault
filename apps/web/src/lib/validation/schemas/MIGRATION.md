# Guía de Migración - Schemas Centralizados

Esta guía te ayudará a migrar de schemas inline/duplicados a los schemas centralizados.

## Antes vs Después

### ❌ Antes: Schema inline en componente

```typescript
// features/individual-savings/components/deposit-card.tsx
import * as z from "zod";

const depositSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be greater than 0"),
});

type DepositFormData = z.infer<typeof depositSchema>;

export function DepositCard() {
  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
  });
  // ...
}
```

### ✅ Después: Schema centralizado

```typescript
// features/individual-savings/components/deposit-card.tsx
import { depositSchema, type DepositFormData } from "@/lib/validation";

export function DepositCard() {
  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
  });
  // ...
}
```

**Beneficios:**

- Elimina duplicación de código
- Validación consistente en toda la app
- Mensajes de error en español centralizados
- Type-safe con tipos exportados
- Fácil de mantener y actualizar

---

## Migraciones Comunes

### 1. Formulario de Depósito Simple

**Antes:**

```typescript
const depositFormSchema = z.object({
  amount: z.string().min(1, "Required").refine(/* validación */),
});
```

**Después:**

```typescript
import { depositSchema } from "@/lib/validation";

// Usa directamente
const form = useForm({ resolver: zodResolver(depositSchema) });
```

---

### 2. Depósito con Validación de Balance

**Antes:**

```typescript
const depositSchema = z.object({
  amount: z.string().refine((val) => Number(val) <= Number(balance), "Insufficient balance"),
});
```

**Después:**

```typescript
import { createDepositSchemaWithBalance } from "@/lib/validation";

const depositSchema = createDepositSchemaWithBalance(balance);
const form = useForm({ resolver: zodResolver(depositSchema) });
```

---

### 3. Crear Pool con Validación de Rango

**Antes:**

```typescript
const createPoolSchema = z
  .object({
    name: z.string().min(3).max(50),
    minContribution: z.string().refine(/* ... */),
    maxContribution: z.string().refine(/* ... */),
    maxMembers: z.number().int().min(2).max(100),
  })
  .refine((data) => Number(data.minContribution) <= Number(data.maxContribution), {
    message: "Invalid range",
  });
```

**Después:**

```typescript
import { createCooperativePoolSchema } from "@/lib/validation";

const form = useForm({ resolver: zodResolver(createCooperativePoolSchema) });
// ✅ Ya incluye validación de rango min <= max
```

---

### 4. Comprar Tickets con Límite Dinámico

**Antes:**

```typescript
const buyTicketsSchema = z.object({
  ticketCount: z
    .number()
    .int()
    .min(1)
    .max(maxTicketsPerUser - currentTickets, `Max ${remaining} tickets`),
});
```

**Después:**

```typescript
import { createBuyTicketsSchema } from "@/lib/validation";

const buyTicketsSchema = createBuyTicketsSchema(maxTicketsPerUser, currentTickets);

const form = useForm({ resolver: zodResolver(buyTicketsSchema) });
```

---

### 5. Validación de Address

**Antes:**

```typescript
const schema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address"),
});
```

**Después:**

```typescript
import { addressSchema } from "@/lib/validation";

const schema = z.object({
  address: addressSchema, // ✅ También normaliza con checksum
});
```

---

### 6. Pool Rotativo (ROSCA)

**Antes:**

```typescript
const formSchema = z.object({
  name: z.string().min(3).max(50),
  memberCount: z.string().min(1),
  contributionAmount: z.string().min(1),
  periodDuration: z.string().min(1),
  periodUnit: z.enum(["days", "weeks", "months"]),
  useNativeBtc: z.boolean().default(false),
});
```

**Después:**

```typescript
import { createRotatingPoolSchema } from "@/lib/validation";

const form = useForm({
  resolver: zodResolver(createRotatingPoolSchema),
});
```

---

## Schemas Disponibles

### Common Schemas

```typescript
import {
  // Address
  addressSchema,
  optionalAddressSchema,

  // Amount
  amountSchema,
  createAmountRangeSchema,

  // ID
  poolIdSchema,
  roundIdSchema,

  // Percentage
  percentageSchema,
  basisPointsSchema,

  // String
  poolNameSchema,
  descriptionSchema,

  // Count
  countSchema,
  createMemberCountSchema,

  // Time
  timeUnitSchema,
  durationSchema,
  timestampSchema,
} from "@/lib/validation";
```

### Pool Schemas

```typescript
import {
  // Individual
  depositSchema,
  withdrawSchema,
  createDepositSchemaWithBalance,
  createWithdrawSchemaWithBalance,

  // Cooperative
  createCooperativePoolSchema,
  joinCooperativePoolSchema,

  // Rotating
  createRotatingPoolSchema,
  joinRotatingPoolSchema,
  contributeToRotatingPoolSchema,
} from "@/lib/validation";
```

### Transaction Schemas

```typescript
import {
  recordTransactionSchema,
  buyTicketsSchema,
  createBuyTicketsSchema,
  approveTokenSchema,
  claimPrizeSchema,
} from "@/lib/validation";
```

### User Schemas

```typescript
import {
  userProfileSchema,
  updateUserProfileSchema,
  notificationPreferencesSchema,
  uiPreferencesSchema,
  applyReferralSchema,
  addToWatchlistSchema,
} from "@/lib/validation";
```

---

## Pasos de Migración

### Paso 1: Identificar schemas duplicados

Busca en tu componente:

```typescript
// Busca patrones como estos
const schema = z.object({ ... });
const formSchema = z.object({ ... });
```

### Paso 2: Encontrar el schema equivalente

Consulta:

- `/apps/web/src/lib/validation/schemas/README.md`
- `/apps/web/src/lib/validation/schemas/index.ts`

### Paso 3: Importar el schema

```typescript
import { depositSchema, type DepositFormData } from "@/lib/validation";
```

### Paso 4: Actualizar el formulario

```typescript
const form = useForm<DepositFormData>({
  resolver: zodResolver(depositSchema),
});
```

### Paso 5: Eliminar código duplicado

Elimina:

- Definición del schema inline
- Type inference manual
- Validaciones duplicadas

### Paso 6: Verificar

```bash
pnpm tsc -p apps/web/tsconfig.json --noEmit
```

---

## Casos Especiales

### Schema Personalizado que No Existe

Si necesitas un schema que no existe en los centralizados:

**Opción 1: Extender schema existente**

```typescript
import { depositSchema } from "@/lib/validation";

const customDepositSchema = depositSchema.extend({
  notes: z.string().optional(),
  category: z.enum(["savings", "investment"]),
});
```

**Opción 2: Crear factory function en schemas**

```typescript
// En pool-schemas.ts
export const createCustomPoolSchema = (config: PoolConfig) =>
  z.object({
    // ...
  });
```

**Opción 3: Componer schemas**

```typescript
import { amountSchema, addressSchema } from "@/lib/validation";

const customSchema = z.object({
  amount: amountSchema,
  recipient: addressSchema,
  memo: z.string().max(100),
});
```

---

## Retrocompatibilidad

Los siguientes imports siguen funcionando:

```typescript
// ✅ Siguen funcionando
import {
  depositFormSchema, // alias de depositSchema
  withdrawFormSchema, // alias de withdrawSchema
  createPoolFormSchema, // alias de createCooperativePoolSchema
  type DepositFormData,
  type WithdrawFormData,
} from "@/lib/validation";
```

Pero se recomienda migrar a los nuevos nombres:

```typescript
// ✅ Recomendado
import {
  depositSchema,
  withdrawSchema,
  createCooperativePoolSchema,
  type DepositFormData,
  type WithdrawFormData,
} from "@/lib/validation";
```

---

## Checklist de Migración

- [ ] Identificar todos los schemas inline en el componente
- [ ] Verificar que existe un schema centralizado equivalente
- [ ] Importar schema y tipo desde `@/lib/validation`
- [ ] Actualizar useForm con el schema importado
- [ ] Eliminar definiciones de schema locales
- [ ] Eliminar inferencias de tipo manuales
- [ ] Verificar que compile sin errores
- [ ] Probar el formulario en el navegador
- [ ] Verificar mensajes de validación

---

## Preguntas Frecuentes

### ¿Qué hago si mi validación es muy específica?

Si la validación es realmente única para un solo componente, puedes:

1. Usar `.refine()` en el componente
2. Extender el schema base
3. Proponer agregar un factory function si es reutilizable

### ¿Cómo manejo validaciones asíncronas?

```typescript
const schema = depositSchema.refine(
  async (data) => {
    const hasBalance = await checkBalance(data.amount);
    return hasBalance;
  },
  { message: "Insufficient balance" }
);
```

### ¿Puedo cambiar mensajes de error?

Sí, pero no es recomendado. Mejor:

1. Proponer cambio en schema centralizado
2. O usar transform/refine para casos específicos

```typescript
const customSchema = depositSchema.refine((data) => Number(data.amount) > 0, {
  message: "Custom error message",
});
```

---

## Soporte

Si encuentras un caso que no está cubierto:

1. Revisa `/apps/web/src/lib/validation/schemas/README.md`
2. Busca ejemplos en componentes existentes
3. Crea un issue o pregunta al equipo
