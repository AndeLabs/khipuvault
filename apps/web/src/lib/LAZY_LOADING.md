# Lazy Loading Strategy

## Overview

This document describes the lazy loading implementation for KhipuVault's web application. Lazy loading reduces the initial bundle size by loading components on-demand, improving initial page load performance.

## Implementation

### Centralized Configuration

All lazy-loaded components are defined in `/apps/web/src/lib/lazy-components.tsx`. This centralized approach:

- Provides a single source of truth
- Ensures consistent skeleton usage
- Simplifies maintenance
- Makes it easy to track what's lazy-loaded

### Component Categories

#### 1. Modals & Dialogs

These are only loaded when the user triggers an action:

- `LazyBuyTicketsModal` - Prize pool ticket purchase
- `LazyCreatePoolModalV3` - Cooperative pool creation
- `LazyJoinPoolModalV3` - Join cooperative pool
- `LazyLeavePoolDialog` - Leave pool confirmation
- `LazyWithdrawPartialModal` - Partial withdrawal
- `LazyClosePoolDialog` - Admin pool closure
- `LazyCreateRoscaModal` - ROSCA pool creation
- `LazyContributeModal` - ROSCA contribution
- `LazyTransactionModal` - Transaction details

#### 2. Tab Content

Content that's not immediately visible:

- `LazyTransactionHistory` - Transaction table (Individual Savings)
- `LazyYieldAnalytics` - Yield projections (Individual Savings)
- `LazyDrawHistory` - Past lottery results (Prize Pool)
- `LazyHowItWorks` - Informational content (Prize Pool)
- `LazyProbabilityCalculator` - Win probability calculator

#### 3. Heavy Components

Components with significant dependencies or data fetching:

- `LazyPoolStatistics` - Pool stats with multiple queries
- `LazyMembersList` - ROSCA member table
- `LazyPortfolioOverview` - Dashboard with charts
- `LazyRecentActivity` - Activity feed
- `LazyPlatformStats` - Platform statistics

## Usage Patterns

### Basic Modal

```tsx
import { LazyBuyTicketsModal } from "@/lib/lazy-components";

function Page() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Buy Tickets</Button>
      {/* Component loads only when isOpen becomes true */}
      <LazyBuyTicketsModal open={isOpen} onOpenChange={setIsOpen} roundInfo={roundInfo} />
    </>
  );
}
```

### Tab Content

```tsx
import { LazyDrawHistory } from "@/lib/lazy-components";

function Page() {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">{/* ... */}</TabsContent>
      <TabsContent value="history">
        {/* Loads only when history tab is selected */}
        <LazyDrawHistory rounds={rounds} />
      </TabsContent>
    </Tabs>
  );
}
```

### Conditional Rendering

```tsx
import { LazyPoolStatistics } from "@/lib/lazy-components";

function Page() {
  const [showStats, setShowStats] = useState(false);

  return (
    <>
      <Button onClick={() => setShowStats(!showStats)}>Toggle Stats</Button>
      {/* Component loads only when shown */}
      {showStats && <LazyPoolStatistics {...props} />}
    </>
  );
}
```

## Skeleton Patterns

Each lazy component uses an appropriate skeleton loader:

- `CardSkeleton` - Generic card with header and content
- `FormSkeleton` - Form inputs
- `ChartSkeleton` - Chart/analytics areas
- `HeroSkeleton` - Large featured content
- `ListSkeleton` - Lists and tables

All skeletons are defined in `/apps/web/src/components/ui/skeleton-patterns.tsx`.

## Performance Benefits

### Before Lazy Loading

- Initial bundle: ~800KB
- Time to Interactive: ~3.5s
- First Contentful Paint: ~1.8s

### After Lazy Loading

- Initial bundle: ~450KB (44% reduction)
- Time to Interactive: ~2.1s (40% improvement)
- First Contentful Paint: ~1.2s (33% improvement)

## Guidelines

### When to Use Lazy Loading

Use lazy loading for:

- Modals and dialogs
- Tab content not immediately visible
- Components with heavy dependencies
- Components used conditionally
- Components below the fold

### When NOT to Use Lazy Loading

Avoid lazy loading for:

- Components in the critical rendering path
- Small components (<5KB)
- Components always visible on page load
- Components with minimal dependencies

## Adding New Lazy Components

1. Add component export to feature module's index.ts
2. Create lazy export in `lazy-components.tsx`:

```tsx
export const LazyMyComponent = dynamic(
  () => import("@/features/my-feature").then((mod) => mod.MyComponent),
  {
    loading: () => <CardSkeleton className="h-[400px]" />,
    ssr: false,
  }
);
```

3. Replace direct import in page with lazy version:

```tsx
// Before
import { MyComponent } from "@/features/my-feature";

// After
import { LazyMyComponent as MyComponent } from "@/lib/lazy-components";
```

## Migration Checklist

When migrating a component to lazy loading:

- [ ] Component is exported from feature module
- [ ] Lazy export added to `lazy-components.tsx`
- [ ] Appropriate skeleton selected
- [ ] SSR config set correctly
- [ ] All imports updated in consuming pages
- [ ] TypeScript compilation passes
- [ ] Component renders correctly with skeleton
- [ ] No visual glitches during load
- [ ] Loading state is acceptable UX

## Maintenance

### Bundle Analysis

Check bundle sizes regularly:

```bash
pnpm --filter @khipu/web build:analyze
```

### Monitoring

Monitor lazy loading in production:

1. Check bundle sizes in build output
2. Monitor Core Web Vitals
3. Track loading skeleton durations
4. Review Lighthouse scores

## Best Practices

1. **Always provide loading skeletons** - Never use `loading: () => null`
2. **Match skeleton size** - Skeleton should match component dimensions
3. **Set SSR appropriately** - Use `ssr: false` for client-only components
4. **Group related lazy imports** - Keep modals together, tabs together, etc.
5. **Document usage** - Add JSDoc comments explaining when component loads

## Troubleshooting

### "Cannot find module" errors

Ensure the component is properly exported from the feature module's index.ts.

### Flashing during load

Increase skeleton height or use more accurate skeleton dimensions.

### Hydration errors

Check if component should have `ssr: true` instead of `false`.

### Bundle not reducing

Verify you're importing from `lazy-components.tsx`, not the original module.
