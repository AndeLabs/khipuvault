/**
 * Animation Hooks for Framer Motion
 * Custom hooks for animation logic and accessibility
 */

"use client";

import { useInView as useFramerInView } from "framer-motion";
import { useEffect, useState, useRef } from "react";

import type { UseInViewOptions } from "framer-motion";

/**
 * Detects if user prefers reduced motion
 * Respects prefers-reduced-motion media query
 * @returns true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    // Older browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Scroll animation hook with reduced motion support
 * Automatically disables animation if user prefers reduced motion
 * @param options - Framer Motion useInView options
 * @returns ref and inView state
 */
export function useScrollAnimation<T extends Element>(options?: UseInViewOptions) {
  const prefersReducedMotion = useReducedMotion();

  // Use framer-motion's useInView but respect reduced motion
  const ref = useRef<T>(null);
  const isInView = useFramerInView(ref, {
    once: true,
    amount: 0.2,
    ...options,
  });

  // If user prefers reduced motion, always return true (no animation)
  return {
    ref,
    inView: prefersReducedMotion ? true : isInView,
  };
}

/**
 * Custom presence hook for enter/exit animations
 * Tracks if component is present in the DOM
 * @param isVisible - Whether the component should be visible
 * @returns isPresent state
 */
export function usePresence(isVisible: boolean) {
  const [isPresent, setIsPresent] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setIsPresent(true);
    } else {
      // Delay removal to allow exit animation
      const timer = setTimeout(() => setIsPresent(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return isPresent;
}

/**
 * Animation state hook for complex animation sequences
 * @param initialState - Initial animation state
 * @returns current state and state setter
 */
export function useAnimationState<T extends string>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const prefersReducedMotion = useReducedMotion();

  // Skip state transitions if reduced motion is preferred
  const setAnimationState = (newState: T) => {
    if (!prefersReducedMotion) {
      setState(newState);
    }
  };

  return [state, setAnimationState] as const;
}

/**
 * Stagger delay calculator
 * Calculates delay for staggered animations
 * @param index - Item index
 * @param baseDelay - Base delay in seconds
 * @param delayIncrement - Delay increment per item
 * @returns delay in seconds
 */
export function useStaggerDelay(
  index: number,
  baseDelay: number = 0,
  delayIncrement: number = 0.1
): number {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return 0;
  }

  return baseDelay + index * delayIncrement;
}

/**
 * Hover animation state
 * Manages hover state with reduced motion support
 */
export function useHoverAnimation() {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const hoverProps = prefersReducedMotion
    ? {}
    : {
        onHoverStart: () => setIsHovered(true),
        onHoverEnd: () => setIsHovered(false),
      };

  return {
    isHovered: prefersReducedMotion ? false : isHovered,
    hoverProps,
  };
}

/**
 * Animation controls with accessibility
 * Returns safe animation controls that respect reduced motion
 */
export function useAccessibleAnimation() {
  const prefersReducedMotion = useReducedMotion();

  return {
    shouldAnimate: !prefersReducedMotion,
    animateProps: prefersReducedMotion ? { initial: false, animate: false, exit: false } : {},
  };
}
