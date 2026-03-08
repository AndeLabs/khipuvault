# Accessibility Integration Guide

Step-by-step guide to integrate accessibility utilities into KhipuVault.

## 1. Add Development Checker

Add the accessibility checker to your root layout to catch issues during development.

**File: `apps/web/src/app/layout.tsx`**

```tsx
import { A11yChecker } from "@/lib/accessibility";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* Development-only accessibility checker */}
        {process.env.NODE_ENV === "development" && <A11yChecker />}
      </body>
    </html>
  );
}
```

Press `Ctrl+Shift+A` to toggle the checker panel.

## 2. Add Skip to Content Link

Help keyboard users skip navigation and go straight to main content.

**File: `apps/web/src/components/layout/client-layout.tsx`**

```tsx
import { SkipToContent } from "@/lib/accessibility";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipToContent targetId="main-content" />

      <Header />

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      <Footer />
    </>
  );
}
```

## 3. Improve Modal Accessibility

Add focus trap and proper ARIA attributes to modals.

**File: `apps/web/src/features/individual-savings/components/deposit-card.tsx`**

```tsx
import {
  useFocusTrap,
  useEscapeKey,
  ariaDialogProps,
  announceTransaction,
} from "@/lib/accessibility";

export function DepositModal({ isOpen, onClose }) {
  // Trap focus within modal
  const modalRef = useFocusTrap(isOpen, {
    onDeactivate: onClose,
    escapeDeactivates: true,
  });

  // Also handle Escape key explicitly
  useEscapeKey(onClose, isOpen);

  const handleDeposit = async () => {
    // ... deposit logic

    if (success) {
      announceTransaction("success", "100 mUSD deposited successfully");
    } else {
      announceTransaction("error", "Deposit failed. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent ref={modalRef} {...ariaDialogProps("deposit-title", "deposit-description")}>
        <DialogHeader>
          <DialogTitle id="deposit-title">Deposit mUSD</DialogTitle>
          <DialogDescription id="deposit-description">
            Enter the amount you want to deposit
          </DialogDescription>
        </DialogHeader>

        {/* Modal content */}

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleDeposit}>Deposit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## 4. Add Screen Reader Announcements

Announce important state changes to screen reader users.

**File: `apps/web/src/features/individual-savings/components/actions-card.tsx`**

```tsx
import { useAnnouncer, announceTransaction } from "@/lib/accessibility";

export function ActionsCard() {
  const announce = useAnnouncer();
  const { deposit, isPending, isConfirming, isSuccess } = useDeposit();

  // Announce transaction status changes
  useEffect(() => {
    if (isPending) {
      announceTransaction("pending", "Transaction submitted to wallet");
    } else if (isConfirming) {
      announceTransaction("confirming", "Waiting for confirmation");
    } else if (isSuccess) {
      announceTransaction("success", "Deposit completed successfully");
    }
  }, [isPending, isConfirming, isSuccess]);

  const handleDeposit = async () => {
    announce("Processing deposit request");
    await deposit(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleDeposit} disabled={isPending || isConfirming}>
          {isPending ? "Confirming in wallet..." : "Deposit"}
        </Button>
      </CardContent>
    </Card>
  );
}
```

## 5. Improve Form Accessibility

Add proper labels and error messages to forms.

**File: `apps/web/src/features/rotating-pool/components/create-rosca-modal.tsx`**

```tsx
import { ariaInputProps, ariaRequiredProps } from "@/lib/accessibility";

export function CreateRoscaForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form onSubmit={handleSubmit}>
      {/* Pool Name */}
      <div>
        <Label htmlFor="pool-name">Pool Name</Label>
        <Input
          id="pool-name"
          {...ariaInputProps("pool-name", "pool-name-error", "pool-name-desc", errors.name)}
          {...ariaRequiredProps(true)}
        />
        <p id="pool-name-desc" className="text-sm text-gray-500">
          Give your pool a descriptive name
        </p>
        {errors.name && (
          <p id="pool-name-error" className="text-sm text-red-600" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      {/* Contribution Amount */}
      <div>
        <Label htmlFor="contribution-amount">Contribution Amount</Label>
        <Input
          id="contribution-amount"
          type="number"
          {...ariaInputProps(
            "contribution-amount",
            "contribution-amount-error",
            "contribution-amount-desc",
            errors.amount
          )}
          {...ariaRequiredProps(true)}
        />
        <p id="contribution-amount-desc" className="text-sm text-gray-500">
          Amount each member contributes per round
        </p>
        {errors.amount && (
          <p id="contribution-amount-error" className="text-sm text-red-600" role="alert">
            {errors.amount}
          </p>
        )}
      </div>

      <Button type="submit">Create Pool</Button>
    </form>
  );
}
```

## 6. Add Keyboard Navigation to Lists

Improve keyboard navigation in pool lists and transaction tables.

**File: `apps/web/src/features/rotating-pool/components/pool-list.tsx`**

```tsx
import { useRovingTabIndex, handleKeyboardClick } from "@/lib/accessibility";

export function PoolList({ pools }) {
  const { getItemProps, currentIndex } = useRovingTabIndex(pools.length, {
    orientation: "vertical",
    loop: true,
    onNavigate: (index) => {
      // Optionally highlight the focused pool
      setHighlightedIndex(index);
    },
  });

  return (
    <div role="list">
      {pools.map((pool, index) => (
        <div
          key={pool.id}
          role="listitem"
          {...getItemProps(index)}
          onClick={() => handleSelectPool(pool)}
          onKeyDown={(e) => handleKeyboardClick(e, () => handleSelectPool(pool))}
          className={currentIndex === index ? "ring-primary ring-2" : ""}
        >
          <PoolCard pool={pool} />
        </div>
      ))}
    </div>
  );
}
```

## 7. Format Numbers for Screen Readers

Use accessible formatting for currency and percentages.

**File: `apps/web/src/features/individual-savings/components/position-card.tsx`**

```tsx
import { formatCurrency, formatPercentage } from "@/lib/accessibility";

export function PositionCard({ balance, apy }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Position</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <span className="text-sm text-gray-600">Balance</span>
          <p className="text-2xl font-bold" aria-label={formatCurrency(balance, "mUSD")}>
            {balance.toFixed(2)} mUSD
          </p>
        </div>

        <div>
          <span className="text-sm text-gray-600">APY</span>
          <p className="text-xl font-semibold text-green-600" aria-label={formatPercentage(apy)}>
            {apy.toFixed(2)}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

## 8. Test Color Contrast

Ensure all text meets WCAG AA standards.

**File: `apps/web/src/components/ui/button.tsx`**

```tsx
import { checkColorContrast } from "@/lib/accessibility";

// During development, check your color combinations
if (process.env.NODE_ENV === "development") {
  // Primary button (white text on primary bg)
  const primaryResult = checkColorContrast("#FFFFFF", "#0A5C36");
  console.log("Primary button contrast:", primaryResult.ratio, primaryResult.passes.aa);

  // Secondary button (gray text on white bg)
  const secondaryResult = checkColorContrast("#6B7280", "#FFFFFF");
  console.log("Secondary button contrast:", secondaryResult.ratio, secondaryResult.passes.aa);
}
```

## 9. Add Keyboard Shortcuts

Provide keyboard shortcuts for power users.

**File: `apps/web/src/app/dashboard/page.tsx`**

```tsx
import { useKeyboardShortcuts } from "@/lib/accessibility";

export default function DashboardPage() {
  const router = useRouter();

  useKeyboardShortcuts([
    {
      key: "i",
      description: "Go to Individual Savings",
      callback: () => router.push("/dashboard/individual-savings"),
    },
    {
      key: "c",
      description: "Go to Cooperative Savings",
      callback: () => router.push("/dashboard/cooperative-savings"),
    },
    {
      key: "p",
      description: "Go to Prize Pool",
      callback: () => router.push("/dashboard/prize-pool"),
    },
    {
      key: "d",
      ctrlKey: true,
      description: "Open Deposit Modal",
      callback: () => setDepositModalOpen(true),
    },
  ]);

  return <div>Dashboard content</div>;
}
```

## 10. Test Accessibility

Run automated accessibility audits in your tests.

**File: `apps/web/src/__tests__/accessibility.test.ts`**

```tsx
import { generateA11yReport } from "@/lib/accessibility";
import { render } from "@testing-library/react";

describe("Accessibility", () => {
  it("should meet WCAG AA standards on individual savings page", () => {
    render(<IndividualSavingsPage />);

    const report = generateA11yReport();

    expect(report.passed).toBe(true);
    expect(report.issues.critical).toBe(0);
    expect(report.scores.overall).toBeGreaterThanOrEqual(80);
  });

  it("should have proper focus order", () => {
    const { container } = render(<DepositModal isOpen={true} />);

    const { focusOrderIssues } = generateA11yReport(container as HTMLElement);

    expect(focusOrderIssues).toHaveLength(0);
  });
});
```

## Checklist

After integration, verify these items:

- [ ] Accessibility checker added to root layout
- [ ] Skip to content link added
- [ ] All modals have focus traps
- [ ] Transaction statuses are announced
- [ ] Form inputs have proper labels
- [ ] Error messages are announced
- [ ] Lists have keyboard navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Images have alt text
- [ ] Buttons have accessible names
- [ ] Proper heading hierarchy (H1 > H2 > H3)
- [ ] All pages have meaningful titles

## Testing

Test accessibility with:

1. **Keyboard only** - Try to use the app without a mouse
2. **Screen reader** - Test with NVDA (Windows) or VoiceOver (Mac)
3. **Dev tools** - Use browser accessibility inspector
4. **Automated tools** - Use the built-in A11yChecker component

Press `Ctrl+Shift+A` to open the accessibility checker during development.

## Resources

- See `README.md` for full API documentation
- Check examples in individual utility files
- Refer to WCAG 2.1 guidelines for specific requirements
