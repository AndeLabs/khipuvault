# Integration Components - Quick Start Guide

This guide shows you the fastest way to start using the newly integrated Animation, i18n, and Validation systems in KhipuVault.

## 1. Add Animations to Cards (30 seconds)

Replace regular `Card` with `AnimatedCard`:

```tsx
// Before
import { Card } from "@/components/ui/card";
<Card>...</Card>;

// After
import { AnimatedCard } from "@/components/ui/animated-card";
<AnimatedCard animation="slideUp" delay={0.2}>
  <Card>...</Card>
</AnimatedCard>;
```

## 2. Add Stagger Animations to Lists (1 minute)

Wrap your list items:

```tsx
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";

<AnimatedList speed="normal">
  {items.map((item) => (
    <AnimatedListItem key={item.id}>
      <YourComponent item={item} />
    </AnimatedListItem>
  ))}
</AnimatedList>;
```

## 3. Add Language Selector (30 seconds)

Add to your header/navigation:

```tsx
import { LanguageSelector } from "@/components/ui/language-selector";

<header>
  <Logo />
  <nav>...</nav>
  <LanguageSelector showLabel />
</header>;
```

## 4. Use Translations (1 minute)

Replace hardcoded strings with translations:

```tsx
import { useTranslation } from "@/lib/i18n/hooks";

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("nav.dashboard")}</h1>
      <Button>{t("pool.deposit")}</Button>
      <p>{t("stats.totalValueLocked")}</p>
    </div>
  );
}
```

**Available translation keys:**

- `common.*` - Connect, disconnect, approve, cancel, etc.
- `wallet.*` - Wallet-related strings
- `pool.*` - Pool actions and labels
- `nav.*` - Navigation labels
- `stats.*` - Statistics labels
- `errors.*` - Error messages
- `transaction.*` - Transaction statuses

See `/apps/web/src/lib/i18n/messages/en.ts` for all keys.

## 5. Add Form Validation (2 minutes)

Replace `Input` with `ValidatedInput`:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { depositSchema, type DepositFormData } from "@/lib/validation/schemas";
import { ValidatedInput } from "@/components/forms/validated-input";

function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ValidatedInput
        name="amount"
        label="Amount"
        register={register}
        error={errors.amount}
        placeholder="0.00"
        required
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

**Available schemas:**

- `depositSchema` - Deposit forms
- `withdrawSchema` - Withdrawal forms
- `createRotatingPoolSchema` - ROSCA creation
- `buyTicketsSchema` - Lottery tickets
- `addressSchema` - Ethereum addresses
- `amountSchema` - Amount validation

See `/apps/web/src/lib/validation/schemas/` for all schemas.

## Common Patterns

### Animated Grid of Cards

```tsx
import { AnimatedGrid, AnimatedListItem } from "@/components/ui/animated-list";
import { Card } from "@/components/ui/card";

<AnimatedGrid cols={{ sm: 1, md: 2, lg: 3 }} gap="md">
  {items.map((item) => (
    <AnimatedListItem key={item.id}>
      <Card>{item.content}</Card>
    </AnimatedListItem>
  ))}
</AnimatedGrid>;
```

### Dashboard with Language Selector

```tsx
import { useTranslation } from "@/lib/i18n/hooks";
import { LanguageSelector } from "@/components/ui/language-selector";
import { AnimatedCard } from "@/components/ui/animated-card";

function Dashboard() {
  const { t } = useTranslation();

  return (
    <div>
      <header className="mb-8 flex items-center justify-between">
        <h1>{t("nav.dashboard")}</h1>
        <LanguageSelector showLabel />
      </header>

      <AnimatedCard animation="slideUp">
        <Card>
          <h2>{t("stats.totalValueLocked")}</h2>
          <p>$1,234,567</p>
        </Card>
      </AnimatedCard>
    </div>
  );
}
```

### Form with Validation and Translations

```tsx
import { useTranslation } from "@/lib/i18n/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { depositSchema } from "@/lib/validation/schemas";
import { ValidatedInput } from "@/components/forms/validated-input";

function DepositForm() {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(depositSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ValidatedInput
        name="amount"
        label={t("pool.enterAmount")}
        register={register}
        error={errors.amount}
        placeholder="0.00"
        helperText={t("pool.minDeposit") + ": 0.01 mUSD"}
        required
      />
      <Button type="submit">{t("pool.deposit")}</Button>
    </form>
  );
}
```

## Accessibility

All components automatically:

- Respect `prefers-reduced-motion` (animations disabled if user prefers)
- Include proper ARIA attributes
- Support keyboard navigation
- Work with screen readers

## Import Summary

```tsx
// Animations
import { AnimatedCard, AnimatedHoverCard } from "@/components/ui/animated-card";
import { AnimatedList, AnimatedListItem, AnimatedGrid } from "@/components/ui/animated-list";

// i18n
import { useTranslation } from "@/lib/i18n/hooks";
import {
  LanguageSelector,
  LanguageToggle,
  LanguageSwitcher,
} from "@/components/ui/language-selector";

// Validation
import {
  ValidatedInput,
  ValidationError,
  useInlineValidation,
} from "@/components/forms/validated-input";
import { depositSchema, withdrawSchema /* etc */ } from "@/lib/validation/schemas";

// Or use the centralized export
import { AnimatedCard, AnimatedList, LanguageSelector } from "@/components/ui";
import { ValidatedInput } from "@/components/forms";
```

## Next Steps

1. See full documentation: `/apps/web/src/components/INTEGRATION.md`
2. View examples: `/apps/web/src/components/examples/integration-examples.tsx`
3. Check available schemas: `/apps/web/src/lib/validation/schemas/README.md`
4. Browse translation keys: `/apps/web/src/lib/i18n/messages/en.ts`

## Tips

- **Animations**: Start with `animation="slideUp"` or `animation="cardEntrance"`
- **Lists**: Use `speed="normal"` for most cases, `speed="fast"` for many items
- **Language**: Place `<LanguageSelector />` in your app header
- **Forms**: Always use `zodResolver` with `useForm` for validation
- **Translations**: Use `{t("key.path")}` for all user-facing text

That's it! You're ready to use the integrated systems. 🚀
