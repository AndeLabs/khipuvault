/**
 * @fileoverview Accessibility Checker Component
 * @module lib/accessibility/a11y-checker
 *
 * Development-only component that checks for common accessibility issues
 * and provides visual feedback. Only renders in development mode.
 */

"use client";

import { useEffect, useState } from "react";

import { generateA11yReport, type A11yAuditResult } from "./test-utils";

// ============================================================================
// TYPES
// ============================================================================

interface A11yIssue {
  type: "error" | "warning" | "info";
  category: string;
  message: string;
  element?: HTMLElement;
  suggestion?: string;
}

// ============================================================================
// ACCESSIBILITY CHECKER COMPONENT
// ============================================================================

/**
 * Development-only accessibility checker
 * Shows overlay with accessibility issues found on the page
 *
 * @example
 * // Add to root layout in development
 * {process.env.NODE_ENV === 'development' && <A11yChecker />}
 */
export function A11yChecker({ enabled = true }: { enabled?: boolean }) {
  const [issues, setIssues] = useState<A11yIssue[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [report, setReport] = useState<A11yAuditResult | null>(null);

  const isDev = process.env.NODE_ENV === "development";
  const isEnabled = isDev && enabled;

  useEffect(() => {
    // Only run in development
    if (!isEnabled) {
      return;
    }
    // Run audit on mount and after DOM changes
    const runAudit = () => {
      const newIssues: A11yIssue[] = [];

      // Check for missing alt text
      const images = document.querySelectorAll<HTMLImageElement>("img");
      images.forEach((img) => {
        if (!img.alt && !img.getAttribute("aria-label") && !img.getAttribute("role")) {
          newIssues.push({
            type: "error",
            category: "Images",
            message: `Image missing alt text: ${img.src}`,
            element: img,
            suggestion:
              'Add alt="" for decorative images or descriptive alt text for informative images',
          });
        }
      });

      // Check for missing form labels
      const inputs = document.querySelectorAll<HTMLInputElement>("input, select, textarea");
      inputs.forEach((input) => {
        const hasLabel =
          input.labels?.length ||
          input.getAttribute("aria-label") ||
          input.getAttribute("aria-labelledby");

        if (!hasLabel && input.type !== "hidden" && input.type !== "submit") {
          newIssues.push({
            type: "error",
            category: "Forms",
            message: `Form input missing label: ${input.name || input.id || input.type}`,
            element: input,
            suggestion: "Add a <label> element or aria-label attribute",
          });
        }
      });

      // Check for heading hierarchy
      const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
      let lastLevel = 0;
      headings.forEach((heading) => {
        const level = parseInt(heading.tagName[1]);

        if (lastLevel > 0 && level > lastLevel + 1) {
          newIssues.push({
            type: "warning",
            category: "Headings",
            message: `Heading level skipped: ${heading.tagName} after H${lastLevel}`,
            element: heading as HTMLElement,
            suggestion: "Use sequential heading levels (don't skip from H2 to H4)",
          });
        }

        lastLevel = level;
      });

      // Check for missing page title
      if (!document.title || document.title.trim() === "") {
        newIssues.push({
          type: "error",
          category: "Document",
          message: "Page missing title",
          suggestion: "Add a descriptive <title> in the document head",
        });
      }

      // Check for missing main landmark
      const hasMain = document.querySelector("main, [role='main']");
      if (!hasMain) {
        newIssues.push({
          type: "warning",
          category: "Landmarks",
          message: "Page missing main landmark",
          suggestion: 'Add a <main> element or role="main" to identify the main content',
        });
      }

      // Check for buttons without accessible names
      const buttons = document.querySelectorAll<HTMLButtonElement>("button");
      buttons.forEach((button) => {
        const hasAccessibleName =
          button.textContent?.trim() ||
          button.getAttribute("aria-label") ||
          button.getAttribute("aria-labelledby");

        if (!hasAccessibleName) {
          newIssues.push({
            type: "error",
            category: "Buttons",
            message: "Button without accessible name",
            element: button,
            suggestion: "Add text content or aria-label to describe the button's purpose",
          });
        }
      });

      // Check for links without href
      const links = document.querySelectorAll<HTMLAnchorElement>("a");
      links.forEach((link) => {
        if (!link.href && !link.getAttribute("role")) {
          newIssues.push({
            type: "warning",
            category: "Links",
            message: "Link without href attribute",
            element: link,
            suggestion: 'Add href attribute or use role="button" with proper keyboard handling',
          });
        }
      });

      // Check for positive tabindex
      const positiveTabindex = document.querySelectorAll(
        "[tabindex]:not([tabindex='-1']):not([tabindex='0'])"
      );
      positiveTabindex.forEach((element) => {
        const tabindex = element.getAttribute("tabindex");
        if (tabindex && parseInt(tabindex) > 0) {
          newIssues.push({
            type: "warning",
            category: "Keyboard",
            message: `Element has positive tabindex (${tabindex})`,
            element: element as HTMLElement,
            suggestion: 'Use tabindex="0" or rely on natural DOM order',
          });
        }
      });

      setIssues(newIssues);

      // Generate full report
      const auditReport = generateA11yReport();
      setReport(auditReport);
    };

    runAudit();

    // Re-run audit on DOM changes (debounced)
    let timeoutId: number;
    const observer = new MutationObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(runAudit, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["alt", "aria-label", "aria-labelledby", "tabindex"],
    });

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [isEnabled]);

  // Keyboard shortcut to toggle panel
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + A
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "A") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isEnabled]);

  // Only render in development
  if (!isEnabled) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] rounded-full bg-red-500 p-3 text-white shadow-lg hover:bg-red-600"
        title="Toggle Accessibility Checker (Ctrl+Shift+A)"
        aria-label={`Accessibility issues: ${issues.length}`}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        {issues.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black">
            {issues.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-end p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl"
        role="dialog"
        aria-label="Accessibility Checker"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gray-50 p-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Accessibility Checker</h2>
            <p className="text-sm text-gray-600">
              {issues.length} issue{issues.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            aria-label="Close accessibility checker"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Report Summary */}
        {report && (
          <div className="border-b bg-gray-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Overall Score</span>
              <span
                className={`text-2xl font-bold ${
                  report.scores.overall >= 80
                    ? "text-green-600"
                    : report.scores.overall >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {report.scores.overall}%
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <div className="text-gray-600">Focus</div>
                <div className="font-semibold">{report.scores.focusOrder}%</div>
              </div>
              <div>
                <div className="text-gray-600">Labels</div>
                <div className="font-semibold">{report.scores.ariaLabels}%</div>
              </div>
              <div>
                <div className="text-gray-600">Keyboard</div>
                <div className="font-semibold">{report.scores.keyboardNav}%</div>
              </div>
              <div>
                <div className="text-gray-600">Contrast</div>
                <div className="font-semibold">{report.scores.colorContrast}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Issues List */}
        <div className="max-h-[50vh] overflow-y-auto">
          {issues.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg
                className="mx-auto mb-3 h-12 w-12 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="font-medium">No accessibility issues found!</p>
              <p className="text-sm">Great job maintaining accessible code.</p>
            </div>
          ) : (
            <div className="divide-y">
              {issues.map((issue, index) => (
                <div
                  key={index}
                  className="p-4 hover:bg-gray-50"
                  onClick={() => {
                    if (issue.element) {
                      issue.element.scrollIntoView({ behavior: "smooth", block: "center" });
                      issue.element.focus();
                      // Highlight element temporarily
                      issue.element.style.outline = "3px solid #ef4444";
                      setTimeout(() => {
                        if (issue.element) {
                          issue.element.style.outline = "";
                        }
                      }, 2000);
                    }
                  }}
                >
                  <div className="mb-1 flex items-start gap-2">
                    <span
                      className={`mt-0.5 inline-block h-2 w-2 rounded-full ${
                        issue.type === "error"
                          ? "bg-red-500"
                          : issue.type === "warning"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                      }`}
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">{issue.category}</span>
                        <span
                          className={`text-xs font-semibold uppercase ${
                            issue.type === "error"
                              ? "text-red-600"
                              : issue.type === "warning"
                                ? "text-yellow-600"
                                : "text-blue-600"
                          }`}
                        >
                          {issue.type}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-900">{issue.message}</p>
                      {issue.suggestion && (
                        <p className="mt-1 text-xs text-gray-600">💡 {issue.suggestion}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-3 text-xs text-gray-600">
          Press <kbd className="rounded bg-gray-200 px-1.5 py-0.5 font-mono">Ctrl+Shift+A</kbd> to
          toggle this panel
        </div>
      </div>
    </div>
  );
}

/**
 * Minimal accessibility indicator (always visible in dev)
 */
export function A11yIndicator() {
  const [issueCount, setIssueCount] = useState(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const checkIssues = () => {
      let count = 0;

      // Quick checks
      count += document.querySelectorAll("img:not([alt])").length;
      count += document.querySelectorAll('input:not([type="hidden"]):not([aria-label])').length;

      setIssueCount(count);
    };

    checkIssues();
    const interval = setInterval(checkIssues, 5000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== "development" || issueCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 rounded-lg bg-yellow-100 px-3 py-2 text-xs font-medium text-yellow-900 shadow-lg">
      ⚠️ {issueCount} a11y issues
    </div>
  );
}
