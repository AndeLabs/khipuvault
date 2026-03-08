/**
 * @fileoverview Keyboard Navigation Utilities
 * @module lib/accessibility/keyboard
 *
 * Tools for implementing accessible keyboard navigation patterns
 * including roving tabindex, arrow navigation, and keyboard shortcuts.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ============================================================================
// KEYBOARD CONSTANTS
// ============================================================================

/**
 * Standard keyboard keys for accessibility
 */
export const KEYS = {
  // Navigation
  TAB: "Tab",
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",

  // Arrow keys
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",

  // Home/End
  HOME: "Home",
  END: "End",

  // Page navigation
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",

  // Delete
  DELETE: "Delete",
  BACKSPACE: "Backspace",
} as const;

/**
 * Legacy key codes for older browser support
 * @deprecated Use KEYS instead when possible
 */
export const KEY_CODES = {
  TAB: 9,
  ENTER: 13,
  ESCAPE: 27,
  SPACE: 32,
  PAGE_UP: 33,
  PAGE_DOWN: 34,
  END: 35,
  HOME: 36,
  ARROW_LEFT: 37,
  ARROW_UP: 38,
  ARROW_RIGHT: 39,
  ARROW_DOWN: 40,
  DELETE: 46,
} as const;

// ============================================================================
// KEYBOARD EVENT HELPERS
// ============================================================================

/**
 * Check if a keyboard event matches a specific key
 *
 * @param event - Keyboard event
 * @param key - Key to check
 * @returns Whether the event matches the key
 *
 * @example
 * const handleKeyDown = (e) => {
 *   if (isKey(e, KEYS.ENTER)) {
 *     // Handle Enter key
 *   }
 * };
 */
export function isKey(event: KeyboardEvent | React.KeyboardEvent, key: string): boolean {
  return event.key === key;
}

/**
 * Check if any modifier key is pressed
 *
 * @param event - Keyboard event
 * @returns Whether any modifier is pressed
 */
export function hasModifier(event: KeyboardEvent | React.KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
}

/**
 * Handle keyboard click (Enter or Space)
 * Use this to make non-button elements keyboard accessible
 *
 * @param event - Keyboard event
 * @param callback - Function to call on Enter/Space
 *
 * @example
 * <div
 *   role="button"
 *   tabIndex={0}
 *   onKeyDown={(e) => handleKeyboardClick(e, handleClick)}
 * >
 *   Click me
 * </div>
 */
export function handleKeyboardClick(
  event: KeyboardEvent | React.KeyboardEvent,
  callback: () => void
): void {
  if (isKey(event, KEYS.ENTER) || isKey(event, KEYS.SPACE)) {
    event.preventDefault();
    callback();
  }
}

// ============================================================================
// ROVING TABINDEX
// ============================================================================

export interface RovingTabIndexOptions {
  orientation?: "horizontal" | "vertical" | "both";
  loop?: boolean;
  onNavigate?: (index: number) => void;
}

/**
 * Roving tabindex hook for keyboard navigation in lists
 * Implements ARIA authoring practices for composite widgets
 *
 * @param itemCount - Number of items in the list
 * @param options - Configuration options
 * @returns Current index and event handler
 *
 * @example
 * function TabList({ tabs }) {
 *   const { currentIndex, getItemProps } = useRovingTabIndex(tabs.length, {
 *     orientation: 'horizontal',
 *     loop: true,
 *   });
 *
 *   return tabs.map((tab, index) => (
 *     <button {...getItemProps(index)}>
 *       {tab.label}
 *     </button>
 *   ));
 * }
 */
export function useRovingTabIndex(itemCount: number, options: RovingTabIndexOptions = {}) {
  const { orientation = "vertical", loop = true, onNavigate } = options;
  const [currentIndex, setCurrentIndex] = useState(0);

  const navigate = useCallback(
    (newIndex: number) => {
      let index = newIndex;

      // Handle looping
      if (loop) {
        if (index < 0) {
          index = itemCount - 1;
        }
        if (index >= itemCount) {
          index = 0;
        }
      } else {
        index = Math.max(0, Math.min(itemCount - 1, index));
      }

      setCurrentIndex(index);
      onNavigate?.(index);
    },
    [itemCount, loop, onNavigate]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent | React.KeyboardEvent) => {
      const { key } = event;

      // Vertical or both
      if (orientation === "vertical" || orientation === "both") {
        if (key === KEYS.ARROW_DOWN) {
          event.preventDefault();
          navigate(currentIndex + 1);
        } else if (key === KEYS.ARROW_UP) {
          event.preventDefault();
          navigate(currentIndex - 1);
        }
      }

      // Horizontal or both
      if (orientation === "horizontal" || orientation === "both") {
        if (key === KEYS.ARROW_RIGHT) {
          event.preventDefault();
          navigate(currentIndex + 1);
        } else if (key === KEYS.ARROW_LEFT) {
          event.preventDefault();
          navigate(currentIndex - 1);
        }
      }

      // Home/End
      if (key === KEYS.HOME) {
        event.preventDefault();
        navigate(0);
      } else if (key === KEYS.END) {
        event.preventDefault();
        navigate(itemCount - 1);
      }
    },
    [currentIndex, navigate, orientation, itemCount]
  );

  const getItemProps = useCallback(
    (index: number) => ({
      tabIndex: index === currentIndex ? 0 : -1,
      onKeyDown: handleKeyDown,
      onFocus: () => setCurrentIndex(index),
      "data-index": index,
    }),
    [currentIndex, handleKeyDown]
  );

  return {
    currentIndex,
    setCurrentIndex: navigate,
    getItemProps,
    handleKeyDown,
  };
}

// ============================================================================
// ARROW NAVIGATION
// ============================================================================

export interface ArrowNavigationOptions {
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onNavigateLeft?: () => void;
  onNavigateRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  onEscape?: () => void;
}

/**
 * Hook for handling arrow key navigation
 *
 * @param options - Navigation callbacks
 * @returns Event handler
 *
 * @example
 * function Dropdown({ items, onClose }) {
 *   const [selectedIndex, setSelectedIndex] = useState(0);
 *
 *   const handleKeyDown = useArrowNavigation({
 *     onNavigateDown: () => setSelectedIndex(i => i + 1),
 *     onNavigateUp: () => setSelectedIndex(i => i - 1),
 *     onEscape: onClose,
 *   });
 *
 *   return <div onKeyDown={handleKeyDown}>...</div>;
 * }
 */
export function useArrowNavigation(options: ArrowNavigationOptions) {
  const { onNavigateUp, onNavigateDown, onNavigateLeft, onNavigateRight, onHome, onEnd, onEscape } =
    options;

  return useCallback(
    (event: KeyboardEvent | React.KeyboardEvent) => {
      const { key } = event;

      if (key === KEYS.ARROW_UP && onNavigateUp) {
        event.preventDefault();
        onNavigateUp();
      } else if (key === KEYS.ARROW_DOWN && onNavigateDown) {
        event.preventDefault();
        onNavigateDown();
      } else if (key === KEYS.ARROW_LEFT && onNavigateLeft) {
        event.preventDefault();
        onNavigateLeft();
      } else if (key === KEYS.ARROW_RIGHT && onNavigateRight) {
        event.preventDefault();
        onNavigateRight();
      } else if (key === KEYS.HOME && onHome) {
        event.preventDefault();
        onHome();
      } else if (key === KEYS.END && onEnd) {
        event.preventDefault();
        onEnd();
      } else if (key === KEYS.ESCAPE && onEscape) {
        event.preventDefault();
        onEscape();
      }
    },
    [onNavigateUp, onNavigateDown, onNavigateLeft, onNavigateRight, onHome, onEnd, onEscape]
  );
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  callback: () => void;
  description?: string;
}

/**
 * Hook for registering keyboard shortcuts
 *
 * @param shortcuts - Array of keyboard shortcut configurations
 * @param enabled - Whether shortcuts are enabled
 *
 * @example
 * useKeyboardShortcuts([
 *   { key: 's', ctrlKey: true, callback: handleSave, description: 'Save' },
 *   { key: '/', callback: handleSearch, description: 'Search' },
 * ]);
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      for (const shortcut of shortcuts) {
        const matchesKey = event.key === shortcut.key;
        const matchesCtrl = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const matchesMeta = shortcut.metaKey ? event.metaKey : !event.metaKey;
        const matchesAlt = shortcut.altKey ? event.altKey : !event.altKey;
        const matchesShift = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;

        if (matchesKey && matchesCtrl && matchesMeta && matchesAlt && matchesShift) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts, enabled]);
}

// ============================================================================
// TYPEAHEAD SEARCH
// ============================================================================

/**
 * Hook for typeahead search in lists (e.g., dropdown menus)
 * Allows users to type characters to quickly find items
 *
 * @param items - Array of items to search
 * @param onMatch - Callback when an item matches
 * @param getItemText - Function to extract searchable text from item
 * @returns Whether typeahead is active
 *
 * @example
 * function Select({ options }) {
 *   const [selectedIndex, setSelectedIndex] = useState(0);
 *
 *   useTypeahead(
 *     options,
 *     (index) => setSelectedIndex(index),
 *     (option) => option.label
 *   );
 *
 *   // ...
 * }
 */
export function useTypeahead<T>(
  items: T[],
  onMatch: (index: number) => void,
  getItemText: (item: T) => string = (item) => String(item)
): boolean {
  const searchString = useRef("");
  const clearTimeoutRef = useRef<number | undefined>(undefined);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle printable characters
      if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      // Don't search when typing in inputs
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      event.preventDefault();

      // Clear existing timeout
      if (clearTimeoutRef.current) {
        window.clearTimeout(clearTimeoutRef.current);
      }

      // Add character to search string
      searchString.current += event.key.toLowerCase();
      setIsSearching(true);

      // Find matching item
      const matchIndex = items.findIndex((item) =>
        getItemText(item).toLowerCase().startsWith(searchString.current)
      );

      if (matchIndex !== -1) {
        onMatch(matchIndex);
      }

      // Clear search string after 500ms of no input
      clearTimeoutRef.current = window.setTimeout(() => {
        searchString.current = "";
        setIsSearching(false);
      }, 500);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (clearTimeoutRef.current) {
        window.clearTimeout(clearTimeoutRef.current);
      }
    };
  }, [items, onMatch, getItemText]);

  return isSearching;
}

// ============================================================================
// ESCAPE HANDLER
// ============================================================================

/**
 * Hook for handling Escape key to close modals, dropdowns, etc.
 *
 * @param onEscape - Callback when Escape is pressed
 * @param enabled - Whether the handler is enabled
 *
 * @example
 * function Modal({ isOpen, onClose }) {
 *   useEscapeKey(onClose, isOpen);
 *
 *   return <div>...</div>;
 * }
 */
export function useEscapeKey(onEscape: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === KEYS.ESCAPE) {
        event.preventDefault();
        onEscape();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onEscape, enabled]);
}

// ============================================================================
// ENTER HANDLER
// ============================================================================

/**
 * Hook for handling Enter key on an element
 *
 * @param callback - Callback when Enter is pressed
 * @param enabled - Whether the handler is enabled
 * @returns Ref to attach to the element
 *
 * @example
 * function Card({ onClick }) {
 *   const cardRef = useEnterKey(onClick);
 *
 *   return <div ref={cardRef} tabIndex={0}>...</div>;
 * }
 */
export function useEnterKey<T extends HTMLElement>(
  callback: () => void,
  enabled = true
): React.RefObject<T | null> {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (!enabled || !elementRef.current) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === KEYS.ENTER) {
        event.preventDefault();
        callback();
      }
    };

    const element = elementRef.current;
    element.addEventListener("keydown", handleKeyDown);

    return () => {
      element.removeEventListener("keydown", handleKeyDown);
    };
  }, [callback, enabled]);

  return elementRef;
}
