/**
 * @fileoverview Animated Card Component
 * @module components/ui/animated-card
 *
 * Card component with smooth entry animations using Framer Motion.
 * Respects user's reduced motion preferences for accessibility.
 */

"use client";

import { motion } from "framer-motion";
import * as React from "react";

import { fadeIn, slideUp, cardEntrance } from "@/lib/animations/variants";
import { springTransition, easeTransition } from "@/lib/animations/transitions";
import { useReducedMotion } from "@/lib/animations/hooks";
import { Card, CardProps } from "./card";
import { cn } from "@/lib/utils";

// Animation variant types
type AnimationVariant = "fadeIn" | "slideUp" | "cardEntrance" | "none";

interface AnimatedCardProps extends CardProps {
  /**
   * Animation variant to use
   * @default "cardEntrance"
   */
  animation?: AnimationVariant;
  /**
   * Delay before animation starts (in seconds)
   * @default 0
   */
  delay?: number;
  /**
   * Use spring transition instead of ease
   * @default true
   */
  useSpring?: boolean;
  /**
   * Custom initial state for animation
   */
  customInitial?: Record<string, any>;
  /**
   * Custom animate state
   */
  customAnimate?: Record<string, any>;
}

/**
 * Get animation variants based on variant type
 */
const getVariant = (variant: AnimationVariant) => {
  switch (variant) {
    case "fadeIn":
      return fadeIn;
    case "slideUp":
      return slideUp;
    case "cardEntrance":
      return cardEntrance;
    case "none":
      return {};
    default:
      return cardEntrance;
  }
};

/**
 * AnimatedCard component with entry animations
 * Automatically respects prefers-reduced-motion
 *
 * @example
 * ```tsx
 * <AnimatedCard animation="slideUp" delay={0.2}>
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>Content</CardContent>
 * </AnimatedCard>
 * ```
 */
export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      animation = "cardEntrance",
      delay = 0,
      useSpring = true,
      customInitial,
      customAnimate,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const variants = getVariant(animation);
    const transition = useSpring ? springTransition : easeTransition;

    // If user prefers reduced motion, render without animation
    if (prefersReducedMotion || animation === "none") {
      return (
        <Card ref={ref} className={className} {...props}>
          {children}
        </Card>
      );
    }

    return (
      <motion.div
        ref={ref}
        initial={customInitial || "hidden"}
        animate={customAnimate || "visible"}
        variants={variants}
        transition={{
          ...transition,
          delay,
        }}
        className={cn("w-full", className)}
      >
        <Card {...props}>{children}</Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

/**
 * AnimatedCard with hover effect
 * Combines entry animation with interactive hover state
 */
export const AnimatedHoverCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, children, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    // If user prefers reduced motion, don't add hover animation
    if (prefersReducedMotion) {
      return (
        <AnimatedCard ref={ref} className={className} {...props}>
          {children}
        </AnimatedCard>
      );
    }

    return (
      <AnimatedCard ref={ref} className={className} {...props}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatedCard>
    );
  }
);

AnimatedHoverCard.displayName = "AnimatedHoverCard";
