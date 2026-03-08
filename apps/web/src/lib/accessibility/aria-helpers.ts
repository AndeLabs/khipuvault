/**
 * @fileoverview ARIA Helpers for Accessibility
 * @module lib/accessibility/aria-helpers
 *
 * Common ARIA patterns and helpers for consistent accessibility
 * across components. Based on WAI-ARIA 1.2 specification.
 */

// ============================================================================
// ARIA LIVE REGIONS
// ============================================================================

export type AriaLive = "off" | "polite" | "assertive";

/**
 * ARIA live region props for dynamic content
 * Use "polite" for most updates, "assertive" for critical alerts
 */
export function ariaLiveProps(mode: AriaLive = "polite", atomic = true) {
  return {
    "aria-live": mode,
    "aria-atomic": atomic,
  } as const;
}

/**
 * ARIA props for loading states
 */
export function ariaLoadingProps(isLoading: boolean, loadingText = "Loading...") {
  return {
    "aria-busy": isLoading,
    "aria-label": isLoading ? loadingText : undefined,
    ...ariaLiveProps("polite"),
  };
}

// ============================================================================
// ARIA ROLES AND PATTERNS
// ============================================================================

/**
 * ARIA props for alert messages
 */
export function ariaAlertProps(type: "error" | "warning" | "success" | "info" = "info") {
  const role = type === "error" ? "alert" : "status";
  return {
    role,
    "aria-live": type === "error" ? ("assertive" as const) : ("polite" as const),
  };
}

/**
 * ARIA props for progress indicators
 */
export function ariaProgressProps(current: number, max: number, label: string, min = 0) {
  return {
    role: "progressbar" as const,
    "aria-valuenow": current,
    "aria-valuemin": min,
    "aria-valuemax": max,
    "aria-label": label,
    "aria-valuetext": `${Math.round((current / max) * 100)}% complete`,
  };
}

/**
 * ARIA props for tab panels
 */
export function ariaTabPanelProps(tabId: string, panelId: string, isSelected: boolean) {
  return {
    tab: {
      id: tabId,
      role: "tab" as const,
      "aria-selected": isSelected,
      "aria-controls": panelId,
      tabIndex: isSelected ? 0 : -1,
    },
    panel: {
      id: panelId,
      role: "tabpanel" as const,
      "aria-labelledby": tabId,
      hidden: !isSelected,
      tabIndex: 0,
    },
  };
}

/**
 * ARIA props for expandable sections (accordion, disclosure)
 */
export function ariaExpandableProps(triggerId: string, contentId: string, isExpanded: boolean) {
  return {
    trigger: {
      id: triggerId,
      "aria-expanded": isExpanded,
      "aria-controls": contentId,
    },
    content: {
      id: contentId,
      "aria-labelledby": triggerId,
      hidden: !isExpanded,
    },
  };
}

/**
 * ARIA props for modal dialogs
 */
export function ariaDialogProps(titleId: string, descriptionId?: string) {
  return {
    role: "dialog" as const,
    "aria-modal": true,
    "aria-labelledby": titleId,
    ...(descriptionId && { "aria-describedby": descriptionId }),
  };
}

/**
 * ARIA props for tooltip triggers
 */
export function ariaTooltipProps(tooltipId: string, isOpen: boolean) {
  return {
    trigger: {
      "aria-describedby": isOpen ? tooltipId : undefined,
    },
    tooltip: {
      id: tooltipId,
      role: "tooltip" as const,
    },
  };
}

// ============================================================================
// FORM ACCESSIBILITY
// ============================================================================

/**
 * ARIA props for form inputs with validation
 */
export function ariaInputProps(
  inputId: string,
  errorId: string,
  descriptionId?: string,
  error?: string
) {
  return {
    id: inputId,
    "aria-invalid": !!error,
    "aria-describedby":
      [error ? errorId : null, descriptionId].filter(Boolean).join(" ") || undefined,
    "aria-errormessage": error ? errorId : undefined,
  };
}

/**
 * ARIA props for required form fields
 */
export function ariaRequiredProps(isRequired: boolean) {
  return {
    "aria-required": isRequired,
    required: isRequired,
  };
}

// ============================================================================
// CURRENCY AND NUMBERS
// ============================================================================

/**
 * Generate accessible label for currency values
 */
export function formatAccessibleCurrency(
  amount: number | string,
  currency: string,
  locale = "en-US"
): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return `Invalid ${currency} amount`;
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency === "BTC" ? "BTC" : "USD",
    minimumFractionDigits: currency === "BTC" ? 6 : 2,
    maximumFractionDigits: currency === "BTC" ? 8 : 2,
  });

  // Custom handling for BTC since Intl doesn't support it
  if (currency === "BTC") {
    return `${numAmount.toFixed(8)} Bitcoin`;
  }

  return formatter.format(numAmount);
}

/**
 * Generate accessible label for percentages
 */
export function formatAccessiblePercentage(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)} percent`;
}

// ============================================================================
// STATUS HELPERS
// ============================================================================

/**
 * Transaction status accessible labels
 */
export const TX_STATUS_LABELS = {
  pending: "Transaction pending, please wait",
  confirming: "Transaction confirming on blockchain",
  success: "Transaction completed successfully",
  error: "Transaction failed",
  idle: "Ready to submit transaction",
} as const;

/**
 * Pool status accessible labels
 */
export const POOL_STATUS_LABELS = {
  open: "Pool is open for participation",
  active: "Pool is active",
  closed: "Pool is closed",
  completed: "Pool has completed",
  cancelled: "Pool was cancelled",
} as const;

// ============================================================================
// UNIQUE ID GENERATION
// ============================================================================

let idCounter = 0;

/**
 * Generate unique ID for ARIA relationships
 * Use this to create IDs for aria-labelledby, aria-describedby, etc.
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Reset ID counter (useful for testing)
 */
export function resetAriaIdCounter(): void {
  idCounter = 0;
}
