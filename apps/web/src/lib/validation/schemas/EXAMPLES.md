# Ejemplos de Uso - Schemas Centralizados

Ejemplos prácticos de cómo usar los schemas Zod centralizados en componentes reales.

## Ejemplo 1: Formulario de Depósito Básico

```typescript
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { depositSchema, type DepositFormData } from '@/lib/validation';
import { useTransactionExecute } from '@/features/transactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DepositFormProps {
  onDeposit: (amount: string) => Promise<void>;
  balance: string;
}

export function DepositForm({ onDeposit, balance }: DepositFormProps) {
  const { execute } = useTransactionExecute({ type: 'Deposit' });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
  });

  const onSubmit = async (data: DepositFormData) => {
    await execute(async () => {
      return await onDeposit(data.amount);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          {...register('amount')}
          type="text"
          placeholder="0.0"
        />
        {errors.amount && (
          <p className="text-sm text-destructive mt-1">
            {errors.amount.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        loading={isSubmitting}
      >
        Deposit
      </Button>
    </form>
  );
}
```

## Ejemplo 2: Depósito con Validación de Balance

```typescript
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { createDepositSchemaWithBalance } from '@/lib/validation';
import { formatBalance } from '@/lib/format';
import { TokenAmountInput } from '@/components/forms';

interface SmartDepositFormProps {
  balance: bigint;
  onDeposit: (amount: string) => Promise<void>;
}

export function SmartDepositForm({ balance, onDeposit }: SmartDepositFormProps) {
  const formattedBalance = formatBalance(balance.toString());

  // Schema dinámico que valida contra el balance
  const depositSchema = createDepositSchemaWithBalance(formattedBalance);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(depositSchema),
  });

  const amount = watch('amount');

  const setMaxAmount = () => {
    setValue('amount', formattedBalance);
  };

  const onSubmit = async (data: { amount: string }) => {
    await onDeposit(data.amount);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TokenAmountInput
        register={register('amount')}
        amount={amount}
        balance={formattedBalance}
        error={errors.amount?.message}
        onMaxClick={setMaxAmount}
      />

      <Button type="submit">
        Deposit {amount || '0'} mUSD
      </Button>
    </form>
  );
}
```

## Ejemplo 3: Crear Pool Cooperativo

```typescript
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  createCooperativePoolSchema,
  type CreateCooperativePoolFormData
} from '@/lib/validation';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function CreateCooperativePoolForm() {
  const form = useForm<CreateCooperativePoolFormData>({
    resolver: zodResolver(createCooperativePoolSchema),
    defaultValues: {
      name: '',
      minContribution: '',
      maxContribution: '',
      maxMembers: 10,
    },
  });

  const onSubmit = async (data: CreateCooperativePoolFormData) => {
    console.log('Creating pool:', data);
    // Llamar a hook de creación de pool
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Pool Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Pool</FormLabel>
              <FormControl>
                <Input placeholder="Mi Pool de Ahorro" {...field} />
              </FormControl>
              <FormDescription>
                Un nombre descriptivo para tu pool cooperativo
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Min Contribution */}
        <FormField
          control={form.control}
          name="minContribution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contribución Mínima (mUSD)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Max Contribution */}
        <FormField
          control={form.control}
          name="maxContribution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contribución Máxima (mUSD)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="1000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Max Members */}
        <FormField
          control={form.control}
          name="maxMembers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número Máximo de Miembros</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={2}
                  max={100}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>Entre 2 y 100 miembros</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">
          Crear Pool
        </Button>
      </form>
    </Form>
  );
}
```

## Ejemplo 4: Comprar Tickets con Límite Dinámico

```typescript
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { createBuyTicketsSchema } from '@/lib/validation';
import { useBuyTicketsWithApprove } from '@/hooks/web3/lottery';

interface BuyTicketsFormProps {
  roundId: number;
  ticketPrice: bigint;
  maxTicketsPerUser: number;
  currentUserTickets: number;
}

export function BuyTicketsForm({
  roundId,
  ticketPrice,
  maxTicketsPerUser,
  currentUserTickets,
}: BuyTicketsFormProps) {
  const remainingTickets = maxTicketsPerUser - currentUserTickets;

  // Schema dinámico basado en tickets restantes
  const buyTicketsSchema = createBuyTicketsSchema(
    maxTicketsPerUser,
    currentUserTickets
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buyTicketsSchema),
    defaultValues: {
      ticketCount: 1,
      roundId,
    },
  });

  const ticketCount = watch('ticketCount');
  const totalCost = ticketPrice * BigInt(ticketCount || 0);

  const { buyTickets, isProcessing } = useBuyTicketsWithApprove();

  const onSubmit = async (data: { ticketCount: number; roundId: number }) => {
    await buyTickets(data.roundId, data.ticketCount, ticketPrice);
  };

  // Quick select buttons
  const quickSelect = [1, 5, 10].filter(n => n <= remainingTickets);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Número de Tickets</label>
        <Input
          {...register('ticketCount', { valueAsNumber: true })}
          type="number"
          min={1}
          max={remainingTickets}
        />
        {errors.ticketCount && (
          <p className="text-sm text-destructive">
            {errors.ticketCount.message}
          </p>
        )}
      </div>

      {/* Quick Select */}
      <div className="flex gap-2">
        {quickSelect.map((num) => (
          <Button
            key={num}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setValue('ticketCount', num)}
          >
            {num}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setValue('ticketCount', remainingTickets)}
        >
          Max ({remainingTickets})
        </Button>
      </div>

      {/* Cost Summary */}
      <div className="rounded-lg border p-4">
        <div className="flex justify-between">
          <span>Costo Total</span>
          <span className="font-bold">
            {(totalCost / BigInt(1e18)).toString()} mUSD
          </span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isProcessing || remainingTickets === 0}
        loading={isProcessing}
      >
        Comprar Tickets
      </Button>
    </form>
  );
}
```

## Ejemplo 5: Validación de Address Ethereum

```typescript
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { addressSchema } from '@/lib/validation';
import { z } from 'zod';

const referralSchema = z.object({
  referrerAddress: addressSchema,
});

type ReferralFormData = z.infer<typeof referralSchema>;

export function ReferralForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
  });

  const onSubmit = async (data: ReferralFormData) => {
    // data.referrerAddress es un address checksummed
    console.log('Referrer:', data.referrerAddress);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Input
          {...register('referrerAddress')}
          placeholder="0x..."
        />
        {errors.referrerAddress && (
          <p className="text-sm text-destructive">
            {errors.referrerAddress.message}
          </p>
        )}
      </div>

      <Button type="submit">
        Aplicar Referido
      </Button>
    </form>
  );
}
```

## Ejemplo 6: Pool Rotativo (ROSCA) Completo

```typescript
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  createRotatingPoolSchema,
  type CreateRotatingPoolFormData
} from '@/lib/validation';
import { useCreateRotatingPool } from '@/hooks/web3/rotating';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export function CreateRoscaModal({ onSuccess }: { onSuccess: () => void }) {
  const { createPool, isPending, isSuccess } = useCreateRotatingPool();

  const form = useForm<CreateRotatingPoolFormData>({
    resolver: zodResolver(createRotatingPoolSchema),
    defaultValues: {
      name: '',
      memberCount: 12,
      contributionAmount: '0.01',
      periodDuration: 30,
      periodUnit: 'days',
      useNativeBtc: false,
    },
  });

  const onSubmit = async (data: CreateRotatingPoolFormData) => {
    // Conversiones necesarias para el contrato
    const contributionWei = parseEther(data.contributionAmount);
    const periodSeconds = convertToSeconds(
      data.periodDuration,
      data.periodUnit
    );

    await createPool({
      name: data.name,
      memberCount: BigInt(data.memberCount),
      contributionAmount: contributionWei,
      periodDuration: periodSeconds,
      useNativeBtc: data.useNativeBtc,
      memberAddresses: [], // Open pool
    });

    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del ROSCA</FormLabel>
              <FormControl>
                <Input placeholder="Círculo de Ahorro Mensual" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="memberCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Miembros</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={3}
                  max={50}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>Entre 3 y 50 miembros</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contributionAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contribución por Período (BTC)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="periodDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duración del Período</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="periodUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="days">Días</SelectItem>
                    <SelectItem value="weeks">Semanas</SelectItem>
                    <SelectItem value="months">Meses</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="useNativeBtc"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <FormLabel>Usar BTC Nativo</FormLabel>
                <FormDescription>
                  Usar BTC nativo en lugar de WBTC (avanzado)
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending || isSuccess}>
          {isPending ? 'Creando...' : isSuccess ? 'Creado!' : 'Crear ROSCA'}
        </Button>
      </form>
    </Form>
  );
}

// Helper function
function convertToSeconds(duration: number, unit: 'days' | 'weeks' | 'months'): bigint {
  const SECONDS_PER_DAY = 86400;
  switch (unit) {
    case 'days':
      return BigInt(duration * SECONDS_PER_DAY);
    case 'weeks':
      return BigInt(duration * 7 * SECONDS_PER_DAY);
    case 'months':
      return BigInt(duration * 30 * SECONDS_PER_DAY);
  }
}
```

## Ejemplo 7: Validación Manual (sin React Hook Form)

```typescript
import { depositSchema } from "@/lib/validation";

export async function validateDepositAmount(amount: string): Promise<boolean> {
  const result = depositSchema.safeParse({ amount });

  if (!result.success) {
    const errors = result.error.errors.map((e) => e.message);
    console.error("Validation errors:", errors);
    return false;
  }

  console.log("Valid amount:", result.data.amount);
  return true;
}

// Uso
const isValid = await validateDepositAmount("100");
if (isValid) {
  // Proceder con depósito
}
```

## Ejemplo 8: Schema Extendido

```typescript
import { depositSchema } from "@/lib/validation";
import { z } from "zod";

// Extender schema existente con campos adicionales
const depositWithNotesSchema = depositSchema.extend({
  notes: z.string().max(200, "Máximo 200 caracteres").optional(),
  category: z.enum(["savings", "investment", "emergency"], {
    errorMap: () => ({ message: "Selecciona una categoría válida" }),
  }),
  recurring: z.boolean().default(false),
});

type DepositWithNotesFormData = z.infer<typeof depositWithNotesSchema>;

export function AdvancedDepositForm() {
  const form = useForm<DepositWithNotesFormData>({
    resolver: zodResolver(depositWithNotesSchema),
    defaultValues: {
      amount: "",
      notes: "",
      category: "savings",
      recurring: false,
    },
  });

  // ...
}
```

## Mejores Prácticas

### 1. Usa schemas centralizados siempre que sea posible

```typescript
// ✅ Bueno
import { depositSchema } from "@/lib/validation";

// ❌ Malo - duplicar validación
const myDepositSchema = z.object({ amount: z.string().min(1) });
```

### 2. Aprovecha los schemas dinámicos

```typescript
// ✅ Bueno - validación dinámica
const schema = createDepositSchemaWithBalance(userBalance);

// ❌ Malo - validación estática sin considerar contexto
const schema = depositSchema;
```

### 3. Usa tipos inferidos

```typescript
// ✅ Bueno
type FormData = z.infer<typeof depositSchema>;

// ❌ Malo - tipos duplicados
interface FormData {
  amount: string;
}
```

### 4. Valida antes de enviar a blockchain

```typescript
// ✅ Bueno
const onSubmit = async (data: DepositFormData) => {
  // Schema ya validó que amount es válido
  const amountWei = parseEther(data.amount);
  await deposit(amountWei);
};
```

### 5. Mensajes de error claros

```typescript
// Los schemas ya tienen mensajes en español
{errors.amount && (
  <p className="text-sm text-destructive">
    {errors.amount.message} {/* Mensaje en español automático */}
  </p>
)}
```
