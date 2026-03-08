/**
 * @fileoverview Lazy Loading Configuration
 * @module lib/lazy-components
 *
 * Centralized lazy loading configuration for heavy components.
 * Reduces initial bundle size by loading components on-demand.
 *
 * Pattern: All lazy components use Next.js dynamic() with appropriate
 * loading skeletons and SSR configuration.
 *
 * Usage Example:
 * ```tsx
 * import { LazyBuyTicketsModal } from "@/lib/lazy-components";
 *
 * function Page() {
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onClick={() => setIsOpen(true)}>Buy Tickets</Button>
 *       <LazyBuyTicketsModal open={isOpen} onOpenChange={setIsOpen} />
 *     </>
 *   );
 * }
 * ```
 *
 * Benefits:
 * - Smaller initial bundle size
 * - Faster page loads
 * - Better Core Web Vitals
 * - Progressive loading with skeletons
 *
 * Guidelines:
 * - Use for modals, tabs content, and heavy interactive components
 * - Use appropriate skeleton for visual consistency
 * - Set ssr: false for client-only components
 */

"use client";

import dynamic from "next/dynamic";

import type { ComponentType } from "react";

import {
  CardSkeleton,
  ChartSkeleton,
  FormSkeleton,
  HeroSkeleton,
  ListSkeleton,
} from "@/components/ui/skeleton-patterns";

// ============================================================================
// INDIVIDUAL SAVINGS
// ============================================================================

/**
 * Pool Statistics - Heavy component with multiple data fetches
 * Used in: Individual Savings page sidebar
 */
export const LazyPoolStatistics = dynamic(
  () => import("@/features/individual-savings").then((mod) => mod.PoolStatistics),
  {
    loading: () => <CardSkeleton className="h-[500px]" />,
    ssr: false,
  }
);

/**
 * Transaction History - Table with pagination
 * Used in: Individual Savings page main content
 */
export const LazyTransactionHistory = dynamic(
  () => import("@/features/individual-savings").then((mod) => mod.TransactionHistory),
  {
    loading: () => <CardSkeleton className="h-[400px]" />,
    ssr: false,
  }
);

/**
 * Yield Analytics - Chart component with calculations
 * Used in: Individual Savings page main content
 */
export const LazyYieldAnalytics = dynamic(
  () => import("@/features/individual-savings").then((mod) => mod.YieldAnalytics),
  {
    loading: () => <ChartSkeleton className="h-[400px]" />,
    ssr: false,
  }
);

// ============================================================================
// PRIZE POOL (LOTTERY)
// ============================================================================

/**
 * Buy Tickets Modal - Form with approval flow
 * Only loaded when user clicks "Buy Tickets"
 */
export const LazyBuyTicketsModal = dynamic(
  () => import("@/features/prize-pool").then((mod) => mod.BuyTicketsModal),
  {
    loading: () => <FormSkeleton className="h-[500px]" />,
    ssr: false,
  }
);

/**
 * Probability Calculator - Interactive form
 * Used in: Prize Pool page tabs
 */
export const LazyProbabilityCalculator = dynamic(
  () => import("@/features/prize-pool").then((mod) => mod.ProbabilityCalculator),
  {
    loading: () => <CardSkeleton className="h-[300px]" />,
    ssr: false,
  }
);

/**
 * Draw History - Table with past lottery results
 * Used in: Prize Pool page history tab
 */
export const LazyDrawHistory = dynamic(
  () => import("@/features/prize-pool").then((mod) => mod.DrawHistory),
  {
    loading: () => <ListSkeleton count={5} className="h-[400px]" />,
    ssr: false,
  }
);

/**
 * How It Works - Static informational content
 * Used in: Prize Pool page info tab
 */
export const LazyHowItWorks = dynamic(
  () => import("@/features/prize-pool").then((mod) => mod.HowItWorks),
  {
    loading: () => <CardSkeleton className="h-[300px]" />,
    ssr: false,
  }
);

// ============================================================================
// COOPERATIVE SAVINGS
// ============================================================================

/**
 * Pool Details Modal - Heavy component with member list
 * Only loaded when user clicks on a pool
 */
export const LazyPoolDetailsModal = dynamic(
  () => import("@/features/cooperative-savings").then((mod) => mod.PoolDetailsModal),
  {
    loading: () => <HeroSkeleton className="h-[600px]" />,
    ssr: false,
  }
);

/**
 * Create Pool Modal - Form with multiple inputs
 * Only loaded when user clicks "Create Pool"
 */
export const LazyCreatePoolModalV3 = dynamic(
  () => import("@/features/cooperative-savings").then((mod) => mod.CreatePoolModalV3),
  {
    loading: () => <FormSkeleton className="h-[600px]" />,
    ssr: false,
  }
);

/**
 * Join Pool Modal - Form with approval flow
 * Only loaded when user clicks "Join Pool"
 */
export const LazyJoinPoolModalV3 = dynamic(
  () => import("@/features/cooperative-savings").then((mod) => mod.JoinPoolModalV3),
  {
    loading: () => <FormSkeleton className="h-[400px]" />,
    ssr: false,
  }
);

/**
 * Leave Pool Dialog - Confirmation dialog with data fetch
 * Only loaded when user clicks "Leave Pool"
 */
export const LazyLeavePoolDialog = dynamic(
  () => import("@/features/cooperative-savings").then((mod) => mod.LeavePoolDialog),
  {
    loading: () => <CardSkeleton className="h-[300px]" />,
    ssr: false,
  }
);

/**
 * Withdraw Partial Modal - Form for partial withdrawals
 * Only loaded when user clicks "Withdraw Partial"
 */
export const LazyWithdrawPartialModal = dynamic(
  () => import("@/features/cooperative-savings").then((mod) => mod.WithdrawPartialModal),
  {
    loading: () => <FormSkeleton className="h-[400px]" />,
    ssr: false,
  }
);

/**
 * Close Pool Dialog - Admin confirmation dialog
 * Only loaded when admin clicks "Close Pool"
 */
export const LazyClosePoolDialog = dynamic(
  () => import("@/features/cooperative-savings").then((mod) => mod.ClosePoolDialog),
  {
    loading: () => <CardSkeleton className="h-[300px]" />,
    ssr: false,
  }
);

// ============================================================================
// ROTATING POOL (ROSCA)
// ============================================================================

/**
 * Create ROSCA Modal - Complex form with validations
 * Only loaded when user clicks "Create ROSCA"
 */
export const LazyCreateRoscaModal = dynamic(
  () =>
    import("@/features/rotating-pool/components/create-rosca-modal").then(
      (mod) => mod.CreateRoscaModal
    ),
  {
    loading: () => <FormSkeleton className="h-[600px]" />,
    ssr: false,
  }
);

/**
 * Contribute Modal - Form for ROSCA contributions
 * Only loaded when user clicks "Contribute"
 */
export const LazyContributeModal = dynamic(
  () =>
    import("@/features/rotating-pool/components/contribute-modal").then(
      (mod) => mod.ContributeModal
    ),
  {
    loading: () => <FormSkeleton className="h-[400px]" />,
    ssr: false,
  }
);

/**
 * Members List - Table with pool members
 * Used in: ROSCA pool detail page
 */
export const LazyMembersList = dynamic(
  () => import("@/features/rotating-pool/components/members-list").then((mod) => mod.MembersList),
  {
    loading: () => <ListSkeleton count={5} className="h-[400px]" />,
    ssr: false,
  }
);

// ============================================================================
// TRANSACTIONS
// ============================================================================

/**
 * Transaction Modal - Detailed transaction view
 * Only loaded when user clicks on a transaction
 */
export const LazyTransactionModal = dynamic(
  () =>
    import("@/features/transactions/components/transaction-modal").then(
      (mod) => mod.TransactionModal
    ),
  {
    loading: () => <CardSkeleton className="h-[500px]" />,
    ssr: false,
  }
);

// ============================================================================
// PORTFOLIO
// ============================================================================

/**
 * Portfolio Overview - Dashboard with multiple charts
 * Used in: Main dashboard page
 */
export const LazyPortfolioOverview = dynamic(
  () =>
    import("@/features/portfolio/components/portfolio-overview").then(
      (mod) => mod.PortfolioOverview
    ),
  {
    loading: () => <ChartSkeleton className="h-[500px]" />,
    ssr: false,
  }
);

/**
 * Recent Activity - Activity feed with transactions
 * Used in: Main dashboard page
 */
export const LazyRecentActivity = dynamic(
  () => import("@/features/portfolio/components/recent-activity").then((mod) => mod.RecentActivity),
  {
    loading: () => <ListSkeleton count={5} className="h-[400px]" />,
    ssr: false,
  }
);

/**
 * Platform Stats - Statistics grid
 * Used in: Main dashboard page
 */
export const LazyPlatformStats = dynamic(
  () => import("@/features/portfolio/components/platform-stats").then((mod) => mod.PlatformStats),
  {
    loading: () => <CardSkeleton className="h-[300px]" />,
    ssr: false,
  }
);

// ============================================================================
// MEZO INTEGRATION
// ============================================================================

/**
 * Mezo components are already lazy loaded in their pages
 * No additional exports needed here
 */
