# KhipuVault UI Components

> Guide to UI components in `apps/web/src/components`

## Table of Contents

- [Overview](#overview)
- [UI Primitives (shadcn/ui)](#ui-primitives-shadcnui)
- [Wallet Components](#wallet-components)
- [Form Components](#form-components)
- [Layout Components](#layout-components)
- [Common Components](#common-components)
- [Error Components](#error-components)
- [Mezo Components](#mezo-components)
- [Section Components](#section-components)

---

## Overview

KhipuVault uses [shadcn/ui](https://ui.shadcn.com/) as the component library foundation. Components are organized into:

- **UI Primitives** (`components/ui/`) - Base components from shadcn/ui
- **Feature Components** (`features/**/components/`) - Feature-specific components
- **Shared Components** (`components/`) - Reusable across features

All components use **Tailwind CSS** for styling and follow accessibility best practices.

---

## UI Primitives (shadcn/ui)

Located in `components/ui/`, these are base components from shadcn/ui.

### Button

```tsx
import { Button } from "@/components/ui/button";

// Variants: default, destructive, outline, secondary, ghost, link
<Button variant="default">Primary Action</Button>
<Button variant="outline">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Cancel</Button>

// Sizes: default, sm, lg, icon
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// States
<Button disabled>Disabled</Button>
<Button disabled>
  <Loader className="animate-spin mr-2" /> Loading...
</Button>
```

### Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Pool Statistics</CardTitle>
    <CardDescription>Your savings performance</CardDescription>
  </CardHeader>
  <CardContent>
    <p>TVL: $1,234,567</p>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>;
```

### Dialog / Modal

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Deposit MUSD</DialogTitle>
      <DialogDescription>Enter the amount to deposit</DialogDescription>
    </DialogHeader>
    {/* Form content */}
    <DialogFooter>
      <Button onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={handleSubmit}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

### Toast

```tsx
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";

// Add Toaster to layout
<Toaster />;

// Trigger toasts
toast({
  title: "Success",
  description: "Your deposit was successful",
});

toast({
  variant: "destructive",
  title: "Error",
  description: "Transaction failed",
});
```

### Other UI Components

| Component      | Location               | Description                  |
| -------------- | ---------------------- | ---------------------------- |
| `Accordion`    | `ui/accordion.tsx`     | Collapsible content sections |
| `Alert`        | `ui/alert.tsx`         | Alert messages               |
| `AlertDialog`  | `ui/alert-dialog.tsx`  | Confirmation dialogs         |
| `Avatar`       | `ui/avatar.tsx`        | User avatars                 |
| `Badge`        | `ui/badge.tsx`         | Status badges                |
| `Checkbox`     | `ui/checkbox.tsx`      | Checkboxes                   |
| `Collapsible`  | `ui/collapsible.tsx`   | Collapsible panels           |
| `DropdownMenu` | `ui/dropdown-menu.tsx` | Dropdown menus               |
| `Form`         | `ui/form.tsx`          | Form with react-hook-form    |
| `Input`        | `ui/input.tsx`         | Text inputs                  |
| `Label`        | `ui/label.tsx`         | Form labels                  |
| `Popover`      | `ui/popover.tsx`       | Popovers                     |
| `Progress`     | `ui/progress.tsx`      | Progress bars                |
| `RadioGroup`   | `ui/radio-group.tsx`   | Radio buttons                |
| `ScrollArea`   | `ui/scroll-area.tsx`   | Scrollable areas             |
| `Select`       | `ui/select.tsx`        | Select dropdowns             |
| `Separator`    | `ui/separator.tsx`     | Visual separators            |
| `Sheet`        | `ui/sheet.tsx`         | Side panels                  |
| `Skeleton`     | `ui/skeleton.tsx`      | Loading skeletons            |
| `Slider`       | `ui/slider.tsx`        | Range sliders                |
| `Switch`       | `ui/switch.tsx`        | Toggle switches              |
| `Table`        | `ui/table.tsx`         | Data tables                  |
| `Tabs`         | `ui/tabs.tsx`          | Tab navigation               |
| `Tooltip`      | `ui/tooltip.tsx`       | Tooltips                     |
| `Chart`        | `ui/chart.tsx`         | Chart components (Recharts)  |
| `Sidebar`      | `ui/sidebar.tsx`       | Sidebar component            |

---

## Wallet Components

### ConnectButton

MetaMask-only wallet connection button.

**Location:** `components/wallet/connect-button.tsx`

```tsx
import { ConnectButton, WalletInfo, WalletStatus } from "@/components/wallet/connect-button";

// Main connect button - shows "Try Testnet" on landing, MetaMask connection on dashboard
<ConnectButton />

// Wallet information display (balance, deposit)
<WalletInfo />

// Connection status indicator
<WalletStatus />
```

**Features:**

- MetaMask-only connection (no other wallets)
- Shows BTC balance when connected
- Copy address to clipboard
- Link to Mezo Explorer
- Disconnect option
- SSR-safe with hydration handling

---

## Form Components

### TokenAmountInput

Input for token amounts with balance display and max button.

**Location:** `components/forms/token-amount-input.tsx`

```tsx
import { TokenAmountInput } from "@/components/forms/token-amount-input";

<TokenAmountInput
  value={amount}
  onChange={setAmount}
  balance={userBalance}
  symbol="MUSD"
  decimals={18}
  min="10"
  max="100000"
  disabled={isProcessing}
  error={validationError}
/>;
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | Current input value |
| `onChange` | `(value: string) => void` | Value change handler |
| `balance` | `bigint \| undefined` | User's token balance |
| `symbol` | `string` | Token symbol (e.g., "MUSD") |
| `decimals` | `number` | Token decimals (default: 18) |
| `min` | `string` | Minimum value |
| `max` | `string` | Maximum value |
| `disabled` | `boolean` | Disable input |
| `error` | `string` | Error message |

### FormField

Wrapper for form fields with label and error display.

**Location:** `components/forms/form-field.tsx`

```tsx
import { FormField } from "@/components/forms/form-field";

<FormField label="Pool Name" error={errors.name?.message} required>
  <Input {...register("name")} />
</FormField>;
```

---

## Layout Components

### DashboardShell

Main dashboard layout wrapper.

**Location:** `components/layout/dashboard-shell.tsx`

```tsx
import { DashboardShell } from "@/components/layout/dashboard-shell";

<DashboardShell>
  <div className="grid gap-4">{/* Dashboard content */}</div>
</DashboardShell>;
```

### Sidebar

Dashboard sidebar navigation.

**Location:** `components/layout/sidebar.tsx`

```tsx
import { Sidebar } from "@/components/layout/sidebar";

<Sidebar />;
```

### Header

Application header with navigation and wallet connection.

**Location:** `components/layout/header.tsx`

```tsx
import { Header } from "@/components/layout/header";

<Header />;
```

### Footer

Application footer.

**Location:** `components/layout/footer.tsx`

```tsx
import { Footer } from "@/components/layout/footer";

<Footer />;
```

### DashboardHeader

Dashboard page header with title and actions.

**Location:** `components/layout/dashboard-header.tsx`

```tsx
import { DashboardHeader } from "@/components/layout/dashboard-header";

<DashboardHeader
  title="Individual Savings"
  description="Earn yield on your MUSD deposits"
  actions={<Button>Deposit</Button>}
/>;
```

---

## Common Components

### AmountDisplay

Formatted token amount display.

**Location:** `components/common/amount-display.tsx`

```tsx
import { AmountDisplay } from "@/components/common/amount-display";

<AmountDisplay
  amount={1234567890000000000000n} // 1234.56 MUSD in wei
  symbol="MUSD"
  decimals={18}
  showSymbol
/>;
// Output: "1,234.56 MUSD"
```

### EmptyState

Empty state placeholder.

**Location:** `components/common/empty-state.tsx`

```tsx
import { EmptyState } from "@/components/common/empty-state";

<EmptyState
  icon={<WalletIcon />}
  title="No deposits yet"
  description="Start earning yield by depositing MUSD"
  action={<Button>Make First Deposit</Button>}
/>;
```

### TransactionStatus

Transaction status display.

**Location:** `components/common/transaction-status.tsx`

```tsx
import { TransactionStatus } from "@/components/common/transaction-status";

<TransactionStatus
  status="pending" // "pending" | "success" | "error"
  hash="0x..."
  message="Waiting for confirmation..."
/>;
```

### TransactionLink

Link to transaction on Mezo Explorer.

**Location:** `components/ui/transaction-link.tsx`

```tsx
import { TransactionLink } from "@/components/ui/transaction-link";

<TransactionLink hash="0x..." />;
// Renders: "View on Explorer" with external link icon
```

### SkeletonPatterns

Pre-built skeleton loading patterns.

**Location:** `components/ui/skeleton-patterns.tsx`

```tsx
import { CardSkeleton, StatsSkeleton, TableSkeleton } from "@/components/ui/skeleton-patterns";

// While loading
{
  isLoading ? <CardSkeleton /> : <Card>...</Card>;
}
```

---

## Error Components

### ErrorBoundary

React error boundary for graceful error handling.

**Location:** `components/error/error-boundary.tsx`

```tsx
import { ErrorBoundary } from "@/components/error/error-boundary";

<ErrorBoundary fallback={<ErrorFallback />}>
  <ComponentThatMightError />
</ErrorBoundary>;
```

### ErrorFallback

Default error fallback UI.

**Location:** `components/error/error-fallback.tsx`

```tsx
import { ErrorFallback } from "@/components/error/error-fallback";

<ErrorFallback error={error} resetErrorBoundary={reset} />;
```

### TransactionErrorFallback

Error fallback specific to transaction errors.

**Location:** `components/error/transaction-error-fallback.tsx`

```tsx
import { TransactionErrorFallback } from "@/components/error/transaction-error-fallback";

<TransactionErrorFallback error={txError} onRetry={handleRetry} />;
```

### PoolErrorFallback

Error fallback for pool-related errors.

**Location:** `components/error/pool-error-fallback.tsx`

```tsx
import { PoolErrorFallback } from "@/components/error/pool-error-fallback";

<PoolErrorFallback poolType="individual" error={error} onRetry={refetch} />;
```

### Web3ErrorBoundary

Error boundary specifically for Web3 errors.

**Location:** `components/web3-error-boundary.tsx`

```tsx
import { Web3ErrorBoundary } from "@/components/web3-error-boundary";

<Web3ErrorBoundary>
  <Web3Component />
</Web3ErrorBoundary>;
```

---

## Mezo Components

Components specific to Mezo protocol integration.

### PriceDisplay

BTC price from Mezo price feed.

**Location:** `components/mezo/price-display.tsx`

```tsx
import { PriceDisplay } from "@/components/mezo/price-display";

<PriceDisplay />;
// Output: "BTC: $65,432.10"
```

### LiquidationRiskBadge

Visual indicator of liquidation risk.

**Location:** `components/mezo/liquidation-risk-badge.tsx`

```tsx
import { LiquidationRiskBadge } from "@/components/mezo/liquidation-risk-badge";

<LiquidationRiskBadge collateralRatio={150} />;
// Shows: "Safe" (green), "Warning" (yellow), or "At Risk" (red)
```

### TransactionStatus (Mezo)

Mezo-specific transaction status.

**Location:** `components/mezo/transaction-status.tsx`

```tsx
import { TransactionStatus } from "@/components/mezo/transaction-status";

<TransactionStatus hash="0x..." />;
```

---

## Section Components

Landing page sections.

### Hero

Hero section with main CTA.

**Location:** `components/sections/hero.tsx`

```tsx
import { Hero } from "@/components/sections/hero";

<Hero />;
```

### HowItWorks

Explanation of how KhipuVault works.

**Location:** `components/sections/how-it-works.tsx`

```tsx
import { HowItWorks } from "@/components/sections/how-it-works";

<HowItWorks />;
```

### Products

Product showcase section.

**Location:** `components/sections/products.tsx`

```tsx
import { Products } from "@/components/sections/products";

<Products />;
```

### MezoInfo

Information about Mezo integration.

**Location:** `components/sections/mezo-info.tsx`

```tsx
import { MezoInfo } from "@/components/sections/mezo-info";

<MezoInfo />;
```

### Contracts

Contract addresses display.

**Location:** `components/sections/contracts.tsx`

```tsx
import { Contracts } from "@/components/sections/contracts";

<Contracts />;
```

### FAQ

Frequently asked questions.

**Location:** `components/sections/faq.tsx`

```tsx
import { FAQ } from "@/components/sections/faq";

<FAQ />;
```

### CTA

Call-to-action section.

**Location:** `components/sections/cta.tsx`

```tsx
import { CTA } from "@/components/sections/cta";

<CTA />;
```

### Partners

Partner logos section.

**Location:** `components/sections/partners.tsx`

```tsx
import { Partners } from "@/components/sections/partners";

<Partners />;
```

---

## Styling Guidelines

### Tailwind CSS Classes

KhipuVault uses Tailwind CSS with custom theme extensions:

```tsx
// Primary brand colors
<div className="bg-primary text-primary-foreground" />
<div className="bg-lavanda" />  // Brand purple

// Semantic colors
<div className="bg-background text-foreground" />
<div className="bg-card text-card-foreground" />
<div className="bg-muted text-muted-foreground" />
<div className="bg-destructive text-destructive-foreground" />

// Common patterns
<div className="rounded-lg border border-border shadow-sm" />
<div className="p-4 space-y-4" />
<div className="flex items-center gap-2" />
```

### cn() Utility

Use `cn()` for conditional class merging:

```tsx
import { cn } from "@/lib/utils";

<div
  className={cn("base-classes", isActive && "active-classes", variant === "large" && "lg:p-8")}
/>;
```

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [HOOKS.md](./HOOKS.md) - Custom hooks documentation
- [WEB3.md](./WEB3.md) - Blockchain integration
