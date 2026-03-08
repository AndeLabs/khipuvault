/**
 * @fileoverview Focus Trap for Modals and Dialogs
 * @module lib/accessibility/focus-trap
 *
 * Traps focus within a container for modal dialogs.
 * Essential for WCAG 2.4.3 (Focus Order) compliance.
 */

"use client";

import * as React from "react";

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "area[href]",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable]",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

interface FocusTrapProps {
  children: React.ReactNode;
  /** Whether the trap is active */
  active?: boolean;
  /** Element to return focus to when trap is deactivated */
  returnFocusTo?: HTMLElement | null;
  /** Auto-focus first element when activated */
  autoFocus?: boolean;
  /** Initial element to focus (by ID) */
  initialFocusId?: string;
}

/**
 * Focus Trap Component
 * Traps keyboard focus within its children
 */
export function FocusTrap({
  children,
  active = true,
  returnFocusTo,
  autoFocus = true,
  initialFocusId,
}: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!active) {
      return;
    }

    // Store currently focused element
    previouslyFocusedRef.current = returnFocusTo ?? (document.activeElement as HTMLElement);

    // Focus initial element
    if (autoFocus && containerRef.current) {
      const focusTarget = initialFocusId
        ? document.getElementById(initialFocusId)
        : containerRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);

      if (focusTarget) {
        // Small delay to ensure element is rendered
        requestAnimationFrame(() => {
          focusTarget.focus();
        });
      }
    }

    return () => {
      // Return focus when unmounted
      if (previouslyFocusedRef.current && document.body.contains(previouslyFocusedRef.current)) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [active, autoFocus, initialFocusId, returnFocusTo]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (!active || event.key !== "Tab" || !containerRef.current) {
        return;
      }

      const focusableElements =
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift+Tab from first element -> go to last
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // Tab from last element -> go to first
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [active]
  );

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
}

/**
 * Hook for managing focus trap
 */
export function useFocusTrap(active: boolean = true) {
  const containerRef = React.useRef<HTMLElement | null>(null);
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);

  const activate = React.useCallback(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    if (containerRef.current) {
      const firstFocusable = containerRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
      firstFocusable?.focus();
    }
  }, []);

  const deactivate = React.useCallback(() => {
    if (previouslyFocusedRef.current && document.body.contains(previouslyFocusedRef.current)) {
      previouslyFocusedRef.current.focus();
    }
  }, []);

  React.useEffect(() => {
    if (active) {
      activate();
    } else {
      deactivate();
    }
  }, [active, activate, deactivate]);

  return {
    containerRef,
    activate,
    deactivate,
  };
}
