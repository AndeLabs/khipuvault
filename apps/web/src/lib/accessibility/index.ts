/**
 * @fileoverview Accessibility Utilities Index
 * @module lib/accessibility
 *
 * Comprehensive accessibility utilities for WCAG 2.1 AA compliance.
 * Includes ARIA helpers, focus management, screen reader utilities,
 * keyboard navigation, testing tools, and audit helpers.
 */

// ============================================================================
// ARIA HELPERS
// ============================================================================

export {
  // Live regions
  ariaLiveProps,
  ariaLoadingProps,
  type AriaLive,
  // Roles and patterns
  ariaAlertProps,
  ariaProgressProps,
  ariaTabPanelProps,
  ariaExpandableProps,
  ariaDialogProps,
  ariaTooltipProps,
  // Form accessibility
  ariaInputProps,
  ariaRequiredProps,
  // Currency and numbers
  formatAccessibleCurrency,
  formatAccessiblePercentage,
  // Status helpers
  TX_STATUS_LABELS,
  POOL_STATUS_LABELS,
  // ID generation
  generateAriaId,
  resetAriaIdCounter,
} from "./aria-helpers";

// ============================================================================
// TESTING UTILITIES
// ============================================================================

export {
  // Color contrast
  checkColorContrast,
  type ColorContrastLevel,
  type ColorContrastResult,
  // Focus order
  checkFocusOrder,
  type FocusableElement,
  type FocusOrderIssue,
  type FocusOrderResult,
  // Keyboard navigation
  checkKeyboardNavigation,
  type KeyboardNavigationResult,
  // Audit reports
  generateA11yReport,
  printA11yReport,
  type A11yAuditResult,
} from "./test-utils";

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

export {
  // Focus trap
  createFocusTrap,
  useFocusTrap,
  // Focus return
  useFocusReturn,
  // Skip to content
  skipToContent,
  SkipToContent,
  // Focus lock
  useFocusLock,
  // Auto focus
  useAutoFocus,
  // Focus visible
  useFocusVisible,
} from "./focus-management";

// ============================================================================
// SCREEN READER UTILITIES
// ============================================================================

export {
  // Announcements
  announce,
  announceTransaction,
  announceLoading,
  // React hooks
  useAnnouncer,
  useAnnounceChange,
  // Components
  ScreenReaderOnly,
  VisuallyHidden,
  // Formatters
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatDate,
  formatDuration,
  formatTxHash,
  formatAddress,
  formatPoolStatus,
  formatHealthScore,
} from "./screen-reader";

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

export {
  // Constants
  KEYS,
  KEY_CODES,
  // Event helpers
  isKey,
  hasModifier,
  handleKeyboardClick,
  // Roving tabindex
  useRovingTabIndex,
  type RovingTabIndexOptions,
  // Arrow navigation
  useArrowNavigation,
  type ArrowNavigationOptions,
  // Keyboard shortcuts
  useKeyboardShortcuts,
  type KeyboardShortcut,
  // Typeahead
  useTypeahead,
  // Other handlers
  useEscapeKey,
  useEnterKey,
} from "./keyboard";

// ============================================================================
// ACCESSIBILITY CHECKER (DEV ONLY)
// ============================================================================

export { A11yChecker, A11yIndicator } from "./a11y-checker";

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * @example Basic ARIA usage
 * ```tsx
 * import { ariaLiveProps, ariaDialogProps } from '@/lib/accessibility';
 *
 * function Modal({ title, isOpen }) {
 *   return (
 *     <div {...ariaDialogProps('modal-title')} {...ariaLiveProps('assertive')}>
 *       <h2 id="modal-title">{title}</h2>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Focus trap in modal
 * ```tsx
 * import { useFocusTrap } from '@/lib/accessibility';
 *
 * function Modal({ isOpen, onClose }) {
 *   const trapRef = useFocusTrap(isOpen, { onDeactivate: onClose });
 *
 *   return <div ref={trapRef}>...</div>;
 * }
 * ```
 *
 * @example Screen reader announcements
 * ```tsx
 * import { useAnnouncer, announceTransaction } from '@/lib/accessibility';
 *
 * function DepositButton() {
 *   const announce = useAnnouncer();
 *
 *   const handleDeposit = async () => {
 *     announce('Processing deposit');
 *     // ... deposit logic
 *     announceTransaction('success', '100 mUSD deposited');
 *   };
 * }
 * ```
 *
 * @example Keyboard navigation
 * ```tsx
 * import { useRovingTabIndex, KEYS } from '@/lib/accessibility';
 *
 * function TabList({ tabs }) {
 *   const { getItemProps, currentIndex } = useRovingTabIndex(tabs.length, {
 *     orientation: 'horizontal',
 *   });
 *
 *   return tabs.map((tab, index) => (
 *     <button {...getItemProps(index)}>{tab.label}</button>
 *   ));
 * }
 * ```
 *
 * @example Testing accessibility
 * ```tsx
 * import { generateA11yReport, printA11yReport } from '@/lib/accessibility';
 *
 * // In development
 * useEffect(() => {
 *   if (process.env.NODE_ENV === 'development') {
 *     const report = generateA11yReport();
 *     printA11yReport(report);
 *   }
 * }, []);
 * ```
 *
 * @example Dev-mode checker
 * ```tsx
 * import { A11yChecker } from '@/lib/accessibility';
 *
 * // In root layout
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         {process.env.NODE_ENV === 'development' && <A11yChecker />}
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
