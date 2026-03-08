/**
 * @fileoverview Keyboard Navigation Utilities
 * @module lib/accessibility/keyboard-navigation
 *
 * Utilities for keyboard-accessible navigation.
 * Essential for WCAG 2.1.1 (Keyboard) compliance.
 */

"use client";

import * as React from "react";

/**
 * Common key codes for navigation
 */
export const Keys = {
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  TAB: "Tab",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",
} as const;

interface UseKeyboardNavigationOptions {
  /** Called when Enter or Space is pressed */
  onSelect?: () => void;
  /** Called when Escape is pressed */
  onEscape?: () => void;
  /** Called for arrow key navigation */
  onNavigate?: (direction: "up" | "down" | "left" | "right") => void;
  /** Whether the element is disabled */
  disabled?: boolean;
}

/**
 * Hook for handling keyboard navigation
 */
export function useKeyboardNavigation(options: UseKeyboardNavigationOptions = {}) {
  const { onSelect, onEscape, onNavigate, disabled = false } = options;

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) {
        return;
      }

      switch (event.key) {
        case Keys.ENTER:
        case Keys.SPACE:
          if (onSelect) {
            event.preventDefault();
            onSelect();
          }
          break;

        case Keys.ESCAPE:
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;

        case Keys.ARROW_UP:
          if (onNavigate) {
            event.preventDefault();
            onNavigate("up");
          }
          break;

        case Keys.ARROW_DOWN:
          if (onNavigate) {
            event.preventDefault();
            onNavigate("down");
          }
          break;

        case Keys.ARROW_LEFT:
          if (onNavigate) {
            event.preventDefault();
            onNavigate("left");
          }
          break;

        case Keys.ARROW_RIGHT:
          if (onNavigate) {
            event.preventDefault();
            onNavigate("right");
          }
          break;
      }
    },
    [disabled, onSelect, onEscape, onNavigate]
  );

  return {
    onKeyDown: handleKeyDown,
    tabIndex: disabled ? -1 : 0,
    role: "button",
    "aria-disabled": disabled,
  };
}

/**
 * Hook for roving tabindex navigation (for lists, menus, etc.)
 */
export function useRovingTabIndex(itemCount: number, options: { loop?: boolean } = {}) {
  const { loop = true } = options;
  const [activeIndex, setActiveIndex] = React.useState(0);

  const getNavigateHandler = React.useCallback(
    (index: number) => (direction: "up" | "down" | "left" | "right") => {
      let newIndex = index;

      if (direction === "up" || direction === "left") {
        newIndex = index - 1;
        if (newIndex < 0) {
          newIndex = loop ? itemCount - 1 : 0;
        }
      } else if (direction === "down" || direction === "right") {
        newIndex = index + 1;
        if (newIndex >= itemCount) {
          newIndex = loop ? 0 : itemCount - 1;
        }
      }

      setActiveIndex(newIndex);
    },
    [itemCount, loop]
  );

  const getItemProps = React.useCallback(
    (index: number) => ({
      tabIndex: index === activeIndex ? 0 : -1,
      onFocus: () => setActiveIndex(index),
    }),
    [activeIndex]
  );

  return {
    activeIndex,
    setActiveIndex,
    getNavigateHandler,
    getItemProps,
  };
}

/**
 * Hook for skip link functionality
 */
export function useSkipLink(targetId: string) {
  const skipToContent = React.useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.tabIndex = -1;
      target.focus();
      // Reset tabindex after focus
      setTimeout(() => {
        target.removeAttribute("tabindex");
      }, 100);
    }
  }, [targetId]);

  return { skipToContent };
}

/**
 * Create keyboard shortcuts handler
 */
export function createKeyboardShortcuts(
  shortcuts: Record<string, () => void>
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    // Build key combo string
    const combo = [
      event.ctrlKey && "ctrl",
      event.metaKey && "meta",
      event.altKey && "alt",
      event.shiftKey && "shift",
      event.key.toLowerCase(),
    ]
      .filter(Boolean)
      .join("+");

    const handler = shortcuts[combo];
    if (handler) {
      event.preventDefault();
      handler();
    }
  };
}

/**
 * Hook for global keyboard shortcuts
 */
export function useGlobalShortcuts(shortcuts: Record<string, () => void>, enabled: boolean = true) {
  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    const handler = createKeyboardShortcuts(shortcuts);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts, enabled]);
}
