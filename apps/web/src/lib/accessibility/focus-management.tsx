/**
 * @fileoverview Focus Management Utilities
 * @module lib/accessibility/focus-management
 *
 * Tools for managing focus in modals, dialogs, and complex UIs.
 * Ensures keyboard users can navigate effectively.
 */

"use client";

import { useEffect, useRef } from "react";

// ============================================================================
// FOCUS TRAP
// ============================================================================

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(",");

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
    (element) => {
      // Filter out hidden elements
      const style = window.getComputedStyle(element);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0" &&
        element.offsetParent !== null
      );
    }
  );
}

/**
 * Focus trap implementation for modals and dialogs
 *
 * @param containerRef - Ref to the container element
 * @param options - Focus trap options
 * @returns Cleanup function
 *
 * @example
 * const modalRef = useRef<HTMLDivElement>(null);
 *
 * useEffect(() => {
 *   if (isOpen && modalRef.current) {
 *     return createFocusTrap(modalRef.current);
 *   }
 * }, [isOpen]);
 */
export function createFocusTrap(
  container: HTMLElement,
  options: {
    initialFocus?: HTMLElement;
    returnFocusOnDeactivate?: boolean;
    escapeDeactivates?: boolean;
    onDeactivate?: () => void;
  } = {}
): () => void {
  const {
    initialFocus,
    returnFocusOnDeactivate = true,
    escapeDeactivates = true,
    onDeactivate,
  } = options;

  // Store the element that had focus before trap was activated
  const previousActiveElement = document.activeElement as HTMLElement;

  // Get all focusable elements
  const updateFocusableElements = () => getFocusableElements(container);
  let focusableElements = updateFocusableElements();

  // Focus the first focusable element or the specified initial focus
  const firstFocusable = initialFocus || focusableElements[0];
  if (firstFocusable) {
    firstFocusable.focus();
  }

  // Handle tab key to trap focus
  const handleKeyDown = (event: KeyboardEvent) => {
    // Update focusable elements (in case DOM changed)
    focusableElements = updateFocusableElements();

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Handle Escape key
    if (escapeDeactivates && event.key === "Escape") {
      event.preventDefault();
      onDeactivate?.();
      return;
    }

    // Handle Tab key
    if (event.key === "Tab") {
      // If no focusable elements, prevent tabbing
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      // Shift + Tab (backwards)
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      }
      // Tab (forwards)
      else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }
  };

  // Add event listener
  container.addEventListener("keydown", handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener("keydown", handleKeyDown);

    // Return focus to previous element
    if (returnFocusOnDeactivate && previousActiveElement) {
      previousActiveElement.focus();
    }
  };
}

/**
 * React hook for focus trap
 *
 * @param isActive - Whether the focus trap is active
 * @param options - Focus trap options
 * @returns Ref to attach to the container
 *
 * @example
 * function Modal({ isOpen, onClose }) {
 *   const trapRef = useFocusTrap(isOpen, { onDeactivate: onClose });
 *
 *   return (
 *     <div ref={trapRef}>
 *       {/* Modal content *\/}
 *     </div>
 *   );
 * }
 */
export function useFocusTrap<T extends HTMLElement>(
  isActive: boolean,
  options: {
    initialFocus?: HTMLElement | null;
    returnFocusOnDeactivate?: boolean;
    escapeDeactivates?: boolean;
    onDeactivate?: () => void;
  } = {}
) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (isActive && containerRef.current) {
      return createFocusTrap(containerRef.current, {
        ...options,
        initialFocus: options.initialFocus || undefined,
      });
    }
  }, [isActive, options]);

  return containerRef;
}

// ============================================================================
// FOCUS RETURN
// ============================================================================

/**
 * Hook to return focus to the triggering element after a modal/dialog closes
 *
 * @example
 * function Modal({ isOpen, onClose }) {
 *   const returnFocusRef = useFocusReturn(isOpen);
 *
 *   return (
 *     <>
 *       <button ref={returnFocusRef} onClick={() => onClose()}>
 *         Open Modal
 *       </button>
 *       {isOpen && <ModalContent />}
 *     </>
 *   );
 * }
 */
export function useFocusReturn<T extends HTMLElement>(isActive: boolean) {
  const triggerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Store the currently focused element when activated
    if (isActive) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
    // Return focus when deactivated
    else if (previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [isActive]);

  return triggerRef;
}

// ============================================================================
// SKIP TO CONTENT
// ============================================================================

/**
 * Skip to main content (for keyboard users)
 *
 * @param targetId - ID of the main content element
 *
 * @example
 * <button onClick={() => skipToContent('main-content')}>
 *   Skip to main content
 * </button>
 */
export function skipToContent(targetId: string): void {
  const target = document.getElementById(targetId);
  if (target) {
    // Make sure the target is focusable
    const originalTabIndex = target.getAttribute("tabindex");
    if (!originalTabIndex) {
      target.setAttribute("tabindex", "-1");
    }

    // Focus the target
    target.focus();

    // Scroll to the target
    target.scrollIntoView({ behavior: "smooth", block: "start" });

    // Remove temporary tabindex after focus
    if (!originalTabIndex) {
      target.addEventListener(
        "blur",
        () => {
          target.removeAttribute("tabindex");
        },
        { once: true }
      );
    }
  }
}

/**
 * Skip to content component
 *
 * @example
 * <SkipToContent targetId="main-content" />
 */
export function SkipToContent({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      onClick={(e) => {
        e.preventDefault();
        skipToContent(targetId);
      }}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
    >
      Skip to main content
    </a>
  );
}

// ============================================================================
// FOCUS LOCK
// ============================================================================

/**
 * Hook to lock focus within a container during certain interactions
 * Useful for combo boxes, menus, and other complex widgets
 *
 * @param isLocked - Whether focus should be locked
 * @returns Ref to attach to the container
 *
 * @example
 * function Combobox() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const lockRef = useFocusLock(isOpen);
 *
 *   return (
 *     <div ref={lockRef}>
 *       {/* Combobox content *\/}
 *     </div>
 *   );
 * }
 */
export function useFocusLock<T extends HTMLElement>(isLocked: boolean) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!isLocked || !containerRef.current) {
      return;
    }

    const handleFocusIn = (event: FocusEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        event.preventDefault();
        event.stopPropagation();

        // Return focus to container
        const focusableElements = getFocusableElements(containerRef.current);
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    };

    document.addEventListener("focusin", handleFocusIn, true);

    return () => {
      document.removeEventListener("focusin", handleFocusIn, true);
    };
  }, [isLocked]);

  return containerRef;
}

// ============================================================================
// AUTO FOCUS
// ============================================================================

/**
 * Hook to auto-focus an element when a condition is met
 *
 * @param shouldFocus - Whether to focus the element
 * @returns Ref to attach to the element
 *
 * @example
 * function ErrorMessage({ hasError }) {
 *   const errorRef = useAutoFocus(hasError);
 *
 *   return <div ref={errorRef}>{/* Error content *\/}</div>;
 * }
 */
export function useAutoFocus<T extends HTMLElement>(shouldFocus: boolean) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      elementRef.current.focus();
    }
  }, [shouldFocus]);

  return elementRef;
}

// ============================================================================
// FOCUS VISIBLE
// ============================================================================

/**
 * Hook to detect if focus should show visible focus indicator
 * (keyboard navigation vs mouse click)
 *
 * @returns Whether focus was triggered by keyboard
 *
 * @example
 * function Button() {
 *   const isFocusVisible = useFocusVisible();
 *
 *   return (
 *     <button className={isFocusVisible ? 'ring-2' : ''}>
 *       Click me
 *     </button>
 *   );
 * }
 */
export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = React.useState(false);
  const hadKeyboardEvent = useRef(false);

  useEffect(() => {
    const handleKeyDown = () => {
      hadKeyboardEvent.current = true;
    };

    const handleMouseDown = () => {
      hadKeyboardEvent.current = false;
    };

    const handleFocus = () => {
      setIsFocusVisible(hadKeyboardEvent.current);
    };

    const handleBlur = () => {
      setIsFocusVisible(false);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("mousedown", handleMouseDown, true);
    window.addEventListener("focus", handleFocus, true);
    window.addEventListener("blur", handleBlur, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("mousedown", handleMouseDown, true);
      window.removeEventListener("focus", handleFocus, true);
      window.removeEventListener("blur", handleBlur, true);
    };
  }, []);

  return isFocusVisible;
}

// Fix React import
import * as React from "react";
