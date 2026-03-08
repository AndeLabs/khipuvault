# Component Integration Guide

This document describes the newly integrated components that bring together Animation, i18n, and Validation systems into KhipuVault's frontend.

## Overview

The following integration components have been created to make it easy to use the animation, internationalization, and validation systems throughout the application:

1. **AnimatedCard** - Cards with smooth entry animations
2. **AnimatedList** - Lists with stagger animations
3. **LanguageSelector** - Language switching UI
4. **ValidatedInput** - Form inputs with validation

## Animation Components

### AnimatedCard

Card component with smooth entry animations using Framer Motion. Automatically respects `prefers-reduced-motion`.

**Location:** `/apps/web/src/components/ui/animated-card.tsx`

**Usage:**

```tsx
import { AnimatedCard } from "@/components/ui/animated-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function MyComponent() {
  return (
    <AnimatedCard animation="slideUp" delay={0.2}>
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Total Value: $1,000,000</p>
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}
```

**Props:**

- `animation`: `"fadeIn" | "slideUp" | "cardEntrance" | "none"` (default: `"cardEntrance"`)
- `delay`: number (default: `0`) - Delay in seconds before animation starts
- `useSpring`: boolean (default: `true`) - Use spring transition instead of ease
- `customInitial`, `customAnimate`: Custom animation states

**Variants:**

- `AnimatedHoverCard` - Adds hover scale effect

### AnimatedList

List container with staggered child animations.

**Location:** `/apps/web/src/components/ui/animated-list.tsx`

**Usage:**

```tsx
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";

function TransactionList({ transactions }) {
  return (
    <AnimatedList speed="normal">
      {transactions.map((tx) => (
        <AnimatedListItem key={tx.id}>
          <TransactionCard transaction={tx} />
        </AnimatedListItem>
      ))}
    </AnimatedList>
  );
}
```

**Props:**

- `speed`: `"slow" | "normal" | "fast"` (default: `"normal"`)
- `staggerDelay`: number - Custom stagger delay between items
- `delayChildren`: number - Initial delay before first child animates
- `animateOnScroll`: boolean (default: `false`) - Animate when scrolled into view

**Variants:**

- `AnimatedGrid` - Grid layout with stagger animations

```tsx
<AnimatedGrid cols={{ sm: 1, md: 2, lg: 3 }} gap="md">
  <AnimatedListItem>
    <Card>1</Card>
  </AnimatedListItem>
  <AnimatedListItem>
    <Card>2</Card>
  </AnimatedListItem>
  <AnimatedListItem>
    <Card>3</Card>
  </AnimatedListItem>
</AnimatedGrid>
```

## i18n Components

### LanguageSelector

Dropdown component to switch between supported languages (Spanish/English).

**Location:** `/apps/web/src/components/ui/language-selector.tsx`

**Usage:**

```tsx
import { LanguageSelector } from "@/components/ui/language-selector";

// In your header or navigation
function Header() {
  return (
    <nav>
      <Logo />
      <LanguageSelector showLabel />
    </nav>
  );
}
```

**Props:**

- `showLabel`: boolean (default: `false`) - Show language name in button
- `showFlag`: boolean (default: `true`) - Show flag emoji
- `variant`: `"default" | "ghost" | "outline"` (default: `"ghost"`)
- `size`: `"default" | "sm" | "lg" | "icon"` (default: `"default"`)
- `onLanguageChange`: `(locale: Locale) => void` - Callback when language changes

**Variants:**

1. **LanguageToggle** - Simple toggle between languages

```tsx
<LanguageToggle />
```

2. **LanguageSwitcher** - Radio button style for settings pages

```tsx
<LanguageSwitcher />
```

**Using Translations:**

```tsx
import { useTranslation } from "@/lib/i18n/hooks";

function MyComponent() {
  const { t, locale, setLocale } = useTranslation();

  return (
    <div>
      <h1>{t("nav.dashboard")}</h1>
      <p>{t("pool.deposit")}</p>
      <Button>{t("common.connect")}</Button>
    </div>
  );
}
```

## Form Components

### ValidatedInput

Input component with built-in Zod validation and React Hook Form integration.

**Location:** `/apps/web/src/components/forms/validated-input.tsx`

**Usage with React Hook Form:**

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { depositSchema, type DepositFormData } from "@/lib/validation/schemas";
import { ValidatedInput } from "@/components/forms/validated-input";

function DepositForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
  });

  const onSubmit = (data: DepositFormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ValidatedInput
        name="amount"
        label="Amount"
        register={register}
        error={errors.amount}
        placeholder="0.00"
        helperText="Enter amount in mUSD"
        required
        showSuccess
      />
      <Button type="submit">Deposit</Button>
    </form>
  );
}
```

**Props:**

- `name`: string - Field name (must match form schema)
- `label`: string - Label text
- `helperText`: string - Helper text shown below input
- `error`: FieldError - Validation error from React Hook Form
- `register`: UseFormRegister - React Hook Form register function
- `showValidationIcon`: boolean (default: `true`) - Show validation status icon
- `showSuccess`: boolean (default: `false`) - Show success state when valid
- `required`: boolean (default: `false`)
- `errorMessage`: string - Custom error message

**Standalone Validation (without React Hook Form):**

```tsx
import { useInlineValidation } from "@/components/forms/validated-input";
import { amountSchema } from "@/lib/validation/schemas";

function MyInput() {
  const [value, setValue] = useState("");
  const { error, validate } = useInlineValidation(amountSchema);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    validate(newValue);
  };

  return (
    <ValidatedInput
      name="amount"
      value={value}
      onChange={handleChange}
      error={error ? { type: "custom", message: error } : undefined}
    />
  );
}
```

**Additional Exports:**

- `ValidationError` - Standalone error display component
- `FieldGroup` - Wrapper for grouping form fields

## Available Validation Schemas

Import schemas from `/apps/web/src/lib/validation/schemas`:

### Common Schemas

- `addressSchema` - Ethereum address validation
- `amountSchema` - Positive amount validation
- `poolNameSchema` - Pool name validation
- `createAmountRangeSchema(min, max, token)` - Amount with min/max

### Pool Schemas

- `depositSchema` - For deposit forms
- `withdrawSchema` - For withdrawal forms
- `createRotatingPoolSchema` - For ROSCA creation
- `createCooperativePoolSchema` - For cooperative pool creation

### Transaction Schemas

- `recordTransactionSchema` - For transaction recording
- `buyTicketsSchema` - For lottery ticket purchases
- `approveTokenSchema` - For token approvals

### User Schemas

- `userProfileSchema` - User profile updates
- `updateUserProfileSchema` - Partial profile updates
- `referralCodeSchema` - Referral code validation

## Complete Example

Here's a complete example combining all integration components:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "@/lib/i18n/hooks";
import { depositSchema, type DepositFormData } from "@/lib/validation/schemas";

import { AnimatedCard, AnimatedList, AnimatedListItem } from "@/components/ui";
import { LanguageSelector } from "@/components/ui/language-selector";
import { ValidatedInput } from "@/components/forms/validated-input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DashboardPage() {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
  });

  const onDeposit = (data: DepositFormData) => {
    console.log("Deposit:", data);
  };

  const stats = [
    { label: t("stats.totalValueLocked"), value: "$1,234,567" },
    { label: t("stats.totalUsers"), value: "5,678" },
    { label: t("stats.averageApy"), value: "12.5%" },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("nav.dashboard")}</h1>
        <LanguageSelector showLabel />
      </div>

      {/* Stats Cards */}
      <AnimatedList speed="normal">
        {stats.map((stat, i) => (
          <AnimatedListItem key={i}>
            <Card className="p-6">
              <h3 className="text-muted-foreground text-sm">{stat.label}</h3>
              <p className="mt-2 text-2xl font-bold">{stat.value}</p>
            </Card>
          </AnimatedListItem>
        ))}
      </AnimatedList>

      {/* Deposit Form */}
      <AnimatedCard animation="slideUp" delay={0.3}>
        <Card>
          <CardHeader>
            <CardTitle>{t("pool.deposit")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onDeposit)} className="space-y-4">
              <ValidatedInput
                name="amount"
                label={t("pool.enterAmount")}
                register={register}
                error={errors.amount}
                placeholder="0.00"
                required
                showSuccess
              />
              <Button type="submit" className="w-full">
                {t("pool.deposit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </AnimatedCard>
    </div>
  );
}
```

## Accessibility

All integration components follow accessibility best practices:

### Animations

- Automatically respect `prefers-reduced-motion` setting
- Animations are disabled if user prefers reduced motion
- No motion sickness-inducing animations

### Language Selector

- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly

### Form Validation

- Proper `aria-invalid` and `aria-describedby` attributes
- Error messages announced to screen readers via `role="alert"`
- Clear visual indicators for errors and success states

## Examples

See comprehensive examples in:

- `/apps/web/src/components/examples/integration-examples.tsx`

Each example demonstrates:

1. `AnimatedCardExample` - Basic animated cards
2. `AnimatedListExample` - Staggered list animations
3. `AnimatedGridExample` - Grid layouts with animations
4. `LanguageSelectorExample` - All language selector variants
5. `ValidatedFormExample` - Complete form with validation
6. `InlineValidationExample` - Standalone validation hook
7. `CompleteDashboardExample` - All features together

## Testing

Run the Next.js dev server to see the examples:

```bash
pnpm dev
```

Then navigate to the examples page to see the components in action.

## Further Reading

- [Animation System Documentation](/apps/web/src/lib/animations/README.md)
- [i18n System Documentation](/apps/web/src/lib/i18n/README.md)
- [Validation Schemas Documentation](/apps/web/src/lib/validation/schemas/README.md)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [Framer Motion](https://www.framer.com/motion/)
