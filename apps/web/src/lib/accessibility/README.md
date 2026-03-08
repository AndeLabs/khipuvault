# Accessibility Utilities

Comprehensive accessibility utilities for KhipuVault to ensure **WCAG 2.1 AA compliance**.

## Overview

This library provides tools for:

- **ARIA attributes** - Proper roles, states, and properties
- **Focus management** - Trap focus in modals, return focus after close
- **Screen reader support** - Announcements and accessible formatting
- **Keyboard navigation** - Arrow keys, roving tabindex, shortcuts
- **Testing & auditing** - Color contrast checks, A11y reports
- **Development tools** - Real-time accessibility checker

## Quick Start

### 1. ARIA Helpers

Common ARIA patterns for consistent accessibility.

```tsx
import { ariaDialogProps, ariaLiveProps, ariaInputProps } from "@/lib/accessibility";

// Modal dialog
function Modal({ title }) {
  return (
    <div {...ariaDialogProps("modal-title")}>
      <h2 id="modal-title">{title}</h2>
    </div>
  );
}

// Live region for dynamic content
function StatusMessage({ message }) {
  return <div {...ariaLiveProps("polite")}>{message}</div>;
}

// Form input with validation
function Input({ id, error }) {
  return <input {...ariaInputProps(id, `${id}-error`, `${id}-desc`, error)} />;
}
```

### 2. Focus Management

Manage focus for keyboard users.

```tsx
import { useFocusTrap, useFocusReturn, SkipToContent } from "@/lib/accessibility";

// Trap focus in modal
function Modal({ isOpen, onClose }) {
  const trapRef = useFocusTrap(isOpen, {
    onDeactivate: onClose,
    escapeDeactivates: true,
  });

  return <div ref={trapRef}>{/* Modal content */}</div>;
}

// Return focus after modal closes
function TriggerButton({ isOpen, onToggle }) {
  const buttonRef = useFocusReturn(isOpen);

  return (
    <button ref={buttonRef} onClick={onToggle}>
      Open Modal
    </button>
  );
}

// Skip to main content
function Header() {
  return (
    <header>
      <SkipToContent targetId="main-content" />
      {/* Navigation */}
    </header>
  );
}
```

### 3. Screen Reader Utilities

Announce changes and format content for screen readers.

```tsx
import {
  useAnnouncer,
  announceTransaction,
  formatCurrency,
  ScreenReaderOnly,
} from "@/lib/accessibility";

// Make announcements
function DepositButton() {
  const announce = useAnnouncer();

  const handleDeposit = async () => {
    announce("Processing deposit");
    // ... deposit logic
    announceTransaction("success", "100 mUSD deposited");
  };

  return <button onClick={handleDeposit}>Deposit</button>;
}

// Format currency for screen readers
function Balance({ amount }) {
  return (
    <div>
      <span aria-label={formatCurrency(amount, "mUSD")}>{amount} mUSD</span>
    </div>
  );
}

// Screen reader only content
function IconButton() {
  return (
    <button>
      <TrashIcon />
      <ScreenReaderOnly>Delete item</ScreenReaderOnly>
    </button>
  );
}
```

### 4. Keyboard Navigation

Handle keyboard interactions properly.

```tsx
import {
  useRovingTabIndex,
  useArrowNavigation,
  KEYS,
  handleKeyboardClick,
} from "@/lib/accessibility";

// Tab list with roving tabindex
function TabList({ tabs }) {
  const { getItemProps, currentIndex } = useRovingTabIndex(tabs.length, {
    orientation: "horizontal",
    loop: true,
  });

  return (
    <div role="tablist">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          role="tab"
          {...getItemProps(index)}
          aria-selected={index === currentIndex}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// Arrow navigation in dropdown
function Dropdown({ items, onClose }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = useArrowNavigation({
    onNavigateDown: () => setSelectedIndex((i) => Math.min(i + 1, items.length - 1)),
    onNavigateUp: () => setSelectedIndex((i) => Math.max(i - 1, 0)),
    onEscape: onClose,
    onNavigateRight: () => {
      /* ... */
    },
  });

  return <div onKeyDown={handleKeyDown}>{/* Dropdown items */}</div>;
}

// Make div keyboard accessible
function Card({ onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => handleKeyboardClick(e, onClick)}
      onClick={onClick}
    >
      Click me
    </div>
  );
}
```

### 5. Testing & Auditing

Check accessibility compliance during development.

```tsx
import { checkColorContrast, generateA11yReport, printA11yReport } from "@/lib/accessibility";

// Check color contrast
const result = checkColorContrast("#000000", "#FFFFFF");
console.log(result.ratio); // 21
console.log(result.passes.aa); // true
console.log(result.level); // "AAA"

// Generate audit report
useEffect(() => {
  if (process.env.NODE_ENV === "development") {
    const report = generateA11yReport();
    printA11yReport(report);

    if (!report.passed) {
      console.warn("Accessibility issues found!");
    }
  }
}, []);
```

### 6. Development Checker

Visual accessibility checker for development (only shows in dev mode).

```tsx
import { A11yChecker } from "@/lib/accessibility";

// Add to root layout
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        {process.env.NODE_ENV === "development" && <A11yChecker />}
      </body>
    </html>
  );
}
```

Press `Ctrl+Shift+A` to toggle the accessibility panel.

## API Reference

### ARIA Helpers

- `ariaLiveProps(mode, atomic)` - Live region props
- `ariaLoadingProps(isLoading, loadingText)` - Loading state props
- `ariaAlertProps(type)` - Alert message props
- `ariaProgressProps(current, max, label, min)` - Progress indicator props
- `ariaTabPanelProps(tabId, panelId, isSelected)` - Tab panel props
- `ariaExpandableProps(triggerId, contentId, isExpanded)` - Expandable section props
- `ariaDialogProps(titleId, descriptionId)` - Modal dialog props
- `ariaTooltipProps(tooltipId, isOpen)` - Tooltip props
- `ariaInputProps(inputId, errorId, descriptionId, error)` - Form input props
- `ariaRequiredProps(isRequired)` - Required field props
- `formatAccessibleCurrency(amount, currency, locale)` - Format currency
- `formatAccessiblePercentage(value, decimals)` - Format percentage
- `generateAriaId(prefix)` - Generate unique ID

### Focus Management

- `createFocusTrap(container, options)` - Create focus trap
- `useFocusTrap(isActive, options)` - Focus trap hook
- `useFocusReturn(isActive)` - Return focus hook
- `skipToContent(targetId)` - Skip to main content
- `SkipToContent` - Skip link component
- `useFocusLock(isLocked)` - Lock focus in container
- `useAutoFocus(shouldFocus)` - Auto-focus element
- `useFocusVisible()` - Detect keyboard focus

### Screen Reader

- `announce(message, priority, clearDelay)` - Announce to screen readers
- `announceTransaction(status, details)` - Announce transaction status
- `announceLoading(isLoading, loadingMessage, completeMessage)` - Announce loading state
- `useAnnouncer()` - Announcement hook
- `useAnnounceChange(value, formatter, enabled)` - Announce value changes
- `ScreenReaderOnly` - Screen reader only component
- `VisuallyHidden` - Visually hidden component
- `formatNumber(value, options)` - Format number
- `formatCurrency(amount, currency, locale)` - Format currency
- `formatPercentage(value, precision)` - Format percentage
- `formatDate(date, options)` - Format date
- `formatDuration(seconds)` - Format duration
- `formatTxHash(hash)` - Format transaction hash
- `formatAddress(address)` - Format wallet address
- `formatPoolStatus(status)` - Format pool status
- `formatHealthScore(score)` - Format health score

### Keyboard Navigation

- `KEYS` - Keyboard key constants
- `isKey(event, key)` - Check if key matches
- `hasModifier(event)` - Check for modifier keys
- `handleKeyboardClick(event, callback)` - Handle Enter/Space
- `useRovingTabIndex(itemCount, options)` - Roving tabindex hook
- `useArrowNavigation(options)` - Arrow navigation hook
- `useKeyboardShortcuts(shortcuts, enabled)` - Keyboard shortcuts hook
- `useTypeahead(items, onMatch, getItemText)` - Typeahead search hook
- `useEscapeKey(onEscape, enabled)` - Escape key handler
- `useEnterKey(callback, enabled)` - Enter key handler

### Testing Utilities

- `checkColorContrast(foreground, background, isLargeText)` - Check contrast ratio
- `checkFocusOrder(container)` - Check focus order
- `checkKeyboardNavigation(element, options)` - Test keyboard nav
- `generateA11yReport(container)` - Generate audit report
- `printA11yReport(report)` - Print report to console

### Development Tools

- `A11yChecker` - Visual accessibility checker
- `A11yIndicator` - Minimal issue indicator

## WCAG 2.1 AA Compliance

This library helps ensure compliance with:

- **1.3.1 Info and Relationships** - Proper ARIA roles and landmarks
- **1.4.3 Contrast (Minimum)** - Color contrast checking
- **2.1.1 Keyboard** - All functionality available via keyboard
- **2.1.2 No Keyboard Trap** - Focus management and escape routes
- **2.4.3 Focus Order** - Logical tab order
- **2.4.7 Focus Visible** - Visible focus indicators
- **3.2.1 On Focus** - No context changes on focus
- **3.3.2 Labels or Instructions** - Form labels and instructions
- **4.1.2 Name, Role, Value** - Proper ARIA attributes
- **4.1.3 Status Messages** - Live region announcements

## Best Practices

### 1. Always provide text alternatives

```tsx
// Good
<img src="chart.png" alt="Bitcoin price chart showing upward trend" />

// Bad
<img src="chart.png" />
```

### 2. Use semantic HTML first

```tsx
// Good
<button onClick={handleClick}>Submit</button>

// Avoid (unless necessary)
<div role="button" tabIndex={0} onClick={handleClick}>Submit</div>
```

### 3. Ensure keyboard accessibility

```tsx
// Good
<Card onClick={handleClick} onKeyDown={(e) => handleKeyboardClick(e, handleClick)} tabIndex={0} />

// Bad
<Card onClick={handleClick} /> // No keyboard support
```

### 4. Announce dynamic changes

```tsx
// Good
const announce = useAnnouncer();
announce("New message received");

// Bad
// Silent updates that screen readers miss
```

### 5. Test with keyboard only

Try navigating your app using only:

- `Tab` / `Shift+Tab` for navigation
- `Enter` / `Space` for activation
- Arrow keys for menus/lists
- `Escape` to close modals

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Articles](https://webaim.org/articles/)

## License

Part of KhipuVault project.
