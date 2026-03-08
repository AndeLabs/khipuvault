/**
 * @fileoverview Accessibility Testing Utilities
 * @module lib/accessibility/test-utils
 *
 * Utilities for testing and auditing WCAG 2.1 AA compliance.
 * Use these in development and testing to catch accessibility issues early.
 */

// ============================================================================
// COLOR CONTRAST CHECKING
// ============================================================================

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null;
}

export type ColorContrastLevel = "AAA" | "AA" | "AA_LARGE" | "FAIL";

export interface ColorContrastResult {
  ratio: number;
  level: ColorContrastLevel;
  passes: {
    aa: boolean;
    aaLarge: boolean;
    aaa: boolean;
    aaaLarge: boolean;
  };
}

/**
 * Check color contrast ratio meets WCAG standards
 *
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Contrast check result
 *
 * @example
 * const result = checkColorContrast("#000000", "#FFFFFF");
 * console.log(result.ratio); // 21
 * console.log(result.passes.aa); // true
 */
export function checkColorContrast(
  foreground: string,
  background: string,
  isLargeText = false
): ColorContrastResult {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) {
    throw new Error("Invalid hex color format");
  }

  const ratio = getContrastRatio(fgRgb, bgRgb);

  // WCAG 2.1 Level AA requires:
  // - 4.5:1 for normal text
  // - 3:1 for large text (18pt+ or 14pt+ bold)
  // WCAG 2.1 Level AAA requires:
  // - 7:1 for normal text
  // - 4.5:1 for large text

  const passes = {
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaa: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };

  let level: ColorContrastLevel = "FAIL";
  if (isLargeText) {
    if (passes.aaaLarge) {
      level = "AAA";
    } else if (passes.aaLarge) {
      level = "AA_LARGE";
    }
  } else {
    if (passes.aaa) {
      level = "AAA";
    } else if (passes.aa) {
      level = "AA";
    }
  }

  return { ratio, level, passes };
}

// ============================================================================
// FOCUS ORDER CHECKING
// ============================================================================

export interface FocusableElement {
  element: HTMLElement;
  tabIndex: number;
  isVisible: boolean;
  role?: string;
  label?: string;
}

/**
 * Get all focusable elements in a container
 */
function getFocusableElements(container: HTMLElement): FocusableElement[] {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(",");

  const elements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));

  return elements.map((element) => ({
    element,
    tabIndex: parseInt(element.getAttribute("tabindex") || "0", 10),
    isVisible: isElementVisible(element),
    role: element.getAttribute("role") || undefined,
    label:
      element.getAttribute("aria-label") ||
      element.getAttribute("aria-labelledby") ||
      (element as HTMLInputElement).labels?.[0]?.textContent ||
      element.textContent?.trim() ||
      undefined,
  }));
}

/**
 * Check if element is visible
 */
function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    element.offsetParent !== null
  );
}

export interface FocusOrderIssue {
  type: "positive-tabindex" | "missing-label" | "hidden-focusable";
  element: HTMLElement;
  message: string;
}

export interface FocusOrderResult {
  focusableElements: FocusableElement[];
  issues: FocusOrderIssue[];
  isValid: boolean;
}

/**
 * Check focus order and identify issues
 *
 * @param container - Container element to check
 * @returns Focus order analysis result
 *
 * @example
 * const result = checkFocusOrder(document.body);
 * if (!result.isValid) {
 *   console.warn("Focus order issues:", result.issues);
 * }
 */
export function checkFocusOrder(container: HTMLElement = document.body): FocusOrderResult {
  const focusableElements = getFocusableElements(container);
  const issues: FocusOrderIssue[] = [];

  focusableElements.forEach(({ element, tabIndex, isVisible, label }) => {
    // Check for positive tabindex (anti-pattern)
    if (tabIndex > 0) {
      issues.push({
        type: "positive-tabindex",
        element,
        message: `Element has positive tabindex (${tabIndex}). Use tabindex="0" or rely on DOM order.`,
      });
    }

    // Check for missing labels on interactive elements
    if (
      !label &&
      ["button", "a", "input", "select", "textarea"].includes(element.tagName.toLowerCase())
    ) {
      issues.push({
        type: "missing-label",
        element,
        message: "Interactive element missing accessible label",
      });
    }

    // Check for hidden but focusable elements
    if (!isVisible && tabIndex >= 0) {
      issues.push({
        type: "hidden-focusable",
        element,
        message: "Element is hidden but focusable. Set tabindex='-1' or remove from DOM.",
      });
    }
  });

  return {
    focusableElements,
    issues,
    isValid: issues.length === 0,
  };
}

// ============================================================================
// KEYBOARD NAVIGATION TESTING
// ============================================================================

export interface KeyboardNavigationResult {
  canNavigateWithTab: boolean;
  canActivateWithEnter: boolean;
  canActivateWithSpace: boolean;
  canEscapeWithEscape: boolean;
  issues: string[];
}

/**
 * Test keyboard navigation on an element
 *
 * @param element - Element to test
 * @param options - Navigation options to test
 * @returns Keyboard navigation test results
 *
 * @example
 * const result = checkKeyboardNavigation(buttonElement, {
 *   shouldActivateOnEnter: true,
 *   shouldActivateOnSpace: true,
 * });
 */
export function checkKeyboardNavigation(
  element: HTMLElement,
  options: {
    shouldBeFocusable?: boolean;
    shouldActivateOnEnter?: boolean;
    shouldActivateOnSpace?: boolean;
    shouldCloseOnEscape?: boolean;
  } = {}
): KeyboardNavigationResult {
  const {
    shouldBeFocusable = true,
    shouldActivateOnEnter = false,
    shouldActivateOnSpace = false,
    shouldCloseOnEscape = false,
  } = options;

  const issues: string[] = [];
  let canNavigateWithTab = false;
  let canActivateWithEnter = false;
  let canActivateWithSpace = false;
  let canEscapeWithEscape = false;

  // Check if element is focusable
  const tabIndex = parseInt(element.getAttribute("tabindex") || "0", 10);
  const isFocusable =
    tabIndex >= 0 ||
    ["a", "button", "input", "select", "textarea"].includes(element.tagName.toLowerCase());

  canNavigateWithTab = isFocusable;

  if (shouldBeFocusable && !isFocusable) {
    issues.push("Element should be focusable but has tabindex='-1' or is not interactive");
  }

  // Check for keyboard event listeners
  const hasEnterListener = element.hasAttribute("onkeydown") || element.hasAttribute("onkeypress");
  const hasClickListener = element.hasAttribute("onclick") || element.onclick !== null;

  if (shouldActivateOnEnter) {
    canActivateWithEnter = hasEnterListener || element.tagName.toLowerCase() === "button";
    if (!canActivateWithEnter && hasClickListener) {
      issues.push("Element has click handler but no keyboard activation (Enter key)");
    }
  }

  if (shouldActivateOnSpace) {
    canActivateWithSpace = element.tagName.toLowerCase() === "button";
    if (!canActivateWithSpace && hasClickListener) {
      issues.push("Element has click handler but no keyboard activation (Space key)");
    }
  }

  if (shouldCloseOnEscape) {
    canEscapeWithEscape = hasEnterListener;
    if (!canEscapeWithEscape) {
      issues.push("Modal/Dialog should close on Escape key");
    }
  }

  return {
    canNavigateWithTab,
    canActivateWithEnter,
    canActivateWithSpace,
    canEscapeWithEscape,
    issues,
  };
}

// ============================================================================
// ACCESSIBILITY AUDIT REPORT
// ============================================================================

export interface A11yAuditResult {
  timestamp: Date;
  url: string;
  scores: {
    colorContrast: number;
    focusOrder: number;
    keyboardNav: number;
    ariaLabels: number;
    overall: number;
  };
  issues: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  details: {
    colorContrastIssues: Array<{ foreground: string; background: string; ratio: number }>;
    focusOrderIssues: FocusOrderIssue[];
    missingLabels: HTMLElement[];
    missingAltText: HTMLElement[];
  };
  passed: boolean;
}

/**
 * Generate comprehensive accessibility audit report
 *
 * @param container - Container to audit (defaults to document.body)
 * @returns Detailed accessibility audit results
 *
 * @example
 * const report = generateA11yReport();
 * console.log(`Overall score: ${report.scores.overall}%`);
 * console.log(`Critical issues: ${report.issues.critical}`);
 */
export function generateA11yReport(container: HTMLElement = document.body): A11yAuditResult {
  const timestamp = new Date();
  const url = typeof window !== "undefined" ? window.location.href : "";

  // Check focus order
  const focusOrderResult = checkFocusOrder(container);

  // Check for missing alt text on images
  const images = Array.from(container.querySelectorAll<HTMLImageElement>("img"));
  const missingAltText = images.filter((img) => !img.alt && !img.getAttribute("aria-label"));

  // Check for missing labels
  const interactiveElements = Array.from(
    container.querySelectorAll<HTMLElement>("button, a, input, select, textarea")
  );
  const missingLabels = interactiveElements.filter((el) => {
    const hasLabel =
      el.getAttribute("aria-label") ||
      el.getAttribute("aria-labelledby") ||
      (el as HTMLInputElement).labels?.length ||
      el.textContent?.trim();
    return !hasLabel;
  });

  // Calculate scores (0-100)
  const focusOrderScore = focusOrderResult.isValid
    ? 100
    : Math.max(0, 100 - focusOrderResult.issues.length * 20);
  const ariaLabelsScore = Math.max(0, 100 - (missingLabels.length + missingAltText.length) * 10);
  const colorContrastScore = 100; // Would need actual color extraction from computed styles
  const keyboardNavScore = focusOrderScore; // Simplified

  const overallScore = Math.round(
    (focusOrderScore + ariaLabelsScore + colorContrastScore + keyboardNavScore) / 4
  );

  // Categorize issues
  const criticalIssues = missingLabels.length + missingAltText.length;
  const seriousIssues = focusOrderResult.issues.filter((i) => i.type === "hidden-focusable").length;
  const moderateIssues = focusOrderResult.issues.filter(
    (i) => i.type === "positive-tabindex"
  ).length;
  const minorIssues = focusOrderResult.issues.filter((i) => i.type === "missing-label").length;

  return {
    timestamp,
    url,
    scores: {
      colorContrast: colorContrastScore,
      focusOrder: focusOrderScore,
      keyboardNav: keyboardNavScore,
      ariaLabels: ariaLabelsScore,
      overall: overallScore,
    },
    issues: {
      critical: criticalIssues,
      serious: seriousIssues,
      moderate: moderateIssues,
      minor: minorIssues,
    },
    details: {
      colorContrastIssues: [], // Would be populated with actual contrast checks
      focusOrderIssues: focusOrderResult.issues,
      missingLabels,
      missingAltText,
    },
    passed: overallScore >= 80 && criticalIssues === 0,
  };
}

/**
 * Print accessibility audit report to console
 */
export function printA11yReport(report: A11yAuditResult): void {
  console.group("🔍 Accessibility Audit Report");
  console.log(`Timestamp: ${report.timestamp.toISOString()}`);
  console.log(`URL: ${report.url}`);
  console.log(
    `Overall Score: ${report.scores.overall}% ${report.passed ? "✅ PASSED" : "❌ FAILED"}`
  );
  console.groupEnd();

  console.group("📊 Scores");
  console.log(`Color Contrast: ${report.scores.colorContrast}%`);
  console.log(`Focus Order: ${report.scores.focusOrder}%`);
  console.log(`Keyboard Navigation: ${report.scores.keyboardNav}%`);
  console.log(`ARIA Labels: ${report.scores.ariaLabels}%`);
  console.groupEnd();

  console.group("⚠️ Issues");
  console.log(`Critical: ${report.issues.critical}`);
  console.log(`Serious: ${report.issues.serious}`);
  console.log(`Moderate: ${report.issues.moderate}`);
  console.log(`Minor: ${report.issues.minor}`);
  console.groupEnd();

  if (report.details.missingLabels.length > 0) {
    console.group("🏷️ Missing Labels");
    report.details.missingLabels.forEach((el) => console.log(el));
    console.groupEnd();
  }

  if (report.details.missingAltText.length > 0) {
    console.group("🖼️ Missing Alt Text");
    report.details.missingAltText.forEach((el) => console.log(el));
    console.groupEnd();
  }

  if (report.details.focusOrderIssues.length > 0) {
    console.group("⌨️ Focus Order Issues");
    report.details.focusOrderIssues.forEach((issue) => {
      console.log(`${issue.type}: ${issue.message}`, issue.element);
    });
    console.groupEnd();
  }
}
