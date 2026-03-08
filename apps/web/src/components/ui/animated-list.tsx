/**
 * @fileoverview Animated List Component
 * @module components/ui/animated-list
 *
 * List container with stagger animations for children.
 * Respects user's reduced motion preferences.
 */

"use client";

import { motion } from "framer-motion";
import * as React from "react";

import { staggerContainer, staggerItem } from "@/lib/animations/variants";
import { useReducedMotion } from "@/lib/animations/hooks";
import { cn } from "@/lib/utils";

interface AnimatedListProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
> {
  /**
   * Delay between each child animation (in seconds)
   * @default 0.1
   */
  staggerDelay?: number;
  /**
   * Initial delay before first child animates (in seconds)
   * @default 0.05
   */
  delayChildren?: number;
  /**
   * Animation speed preset
   * @default "normal"
   */
  speed?: "slow" | "normal" | "fast";
  /**
   * Whether to animate on scroll into view
   * @default false
   */
  animateOnScroll?: boolean;
  /**
   * Custom variants for container
   */
  customVariants?: any;
}

/**
 * Get stagger timing based on speed preset
 */
const getStaggerTiming = (speed: "slow" | "normal" | "fast") => {
  switch (speed) {
    case "slow":
      return { stagger: 0.15, delay: 0.1 };
    case "normal":
      return { stagger: 0.1, delay: 0.05 };
    case "fast":
      return { stagger: 0.05, delay: 0.02 };
    default:
      return { stagger: 0.1, delay: 0.05 };
  }
};

/**
 * AnimatedList - Container for staggered list animations
 *
 * @example
 * ```tsx
 * <AnimatedList speed="normal">
 *   <AnimatedListItem>Item 1</AnimatedListItem>
 *   <AnimatedListItem>Item 2</AnimatedListItem>
 *   <AnimatedListItem>Item 3</AnimatedListItem>
 * </AnimatedList>
 * ```
 */
export const AnimatedList = React.forwardRef<HTMLDivElement, AnimatedListProps>(
  (
    {
      staggerDelay,
      delayChildren,
      speed = "normal",
      animateOnScroll = false,
      customVariants,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const timing = getStaggerTiming(speed);

    // Use custom delays if provided, otherwise use speed preset
    const containerVariants = customVariants || {
      ...staggerContainer,
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay || timing.stagger,
          delayChildren: delayChildren || timing.delay,
        },
      },
    };

    // If user prefers reduced motion, render without animation
    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
        viewport={animateOnScroll ? { once: true, amount: 0.2 } : undefined}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedList.displayName = "AnimatedList";

interface AnimatedListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Custom variants for item animation
   */
  customVariants?: any;
  /**
   * Additional motion props
   */
  motionProps?: any;
}

/**
 * AnimatedListItem - Individual item within AnimatedList
 * Should be a direct child of AnimatedList for stagger effect
 *
 * @example
 * ```tsx
 * <AnimatedList>
 *   <AnimatedListItem>
 *     <Card>Content</Card>
 *   </AnimatedListItem>
 * </AnimatedList>
 * ```
 */
export const AnimatedListItem = React.forwardRef<HTMLDivElement, AnimatedListItemProps>(
  ({ customVariants, motionProps, className, children, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    // If user prefers reduced motion, render without animation
    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        variants={customVariants || staggerItem}
        className={className}
        {...motionProps}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedListItem.displayName = "AnimatedListItem";

/**
 * AnimatedGrid - Grid layout with stagger animations
 * Similar to AnimatedList but with grid display
 *
 * @example
 * ```tsx
 * <AnimatedGrid cols={3}>
 *   <AnimatedListItem><Card>1</Card></AnimatedListItem>
 *   <AnimatedListItem><Card>2</Card></AnimatedListItem>
 *   <AnimatedListItem><Card>3</Card></AnimatedListItem>
 * </AnimatedGrid>
 * ```
 */
interface AnimatedGridProps extends AnimatedListProps {
  /**
   * Number of columns (responsive)
   * @default { sm: 1, md: 2, lg: 3 }
   */
  cols?: number | { sm?: number; md?: number; lg?: number };
  /**
   * Gap between items
   * @default "md"
   */
  gap?: "sm" | "md" | "lg";
}

export const AnimatedGrid = React.forwardRef<HTMLDivElement, AnimatedGridProps>(
  ({ cols = { sm: 1, md: 2, lg: 3 }, gap = "md", className, ...props }, ref) => {
    // Generate grid classes
    const gridClasses = React.useMemo(() => {
      const gapClasses = {
        sm: "gap-2",
        md: "gap-4",
        lg: "gap-6",
      };

      if (typeof cols === "number") {
        return cn("grid", `grid-cols-${cols}`, gapClasses[gap]);
      }

      const responsiveCols = [];
      if (cols.sm) responsiveCols.push(`grid-cols-${cols.sm}`);
      if (cols.md) responsiveCols.push(`md:grid-cols-${cols.md}`);
      if (cols.lg) responsiveCols.push(`lg:grid-cols-${cols.lg}`);

      return cn("grid", responsiveCols.join(" "), gapClasses[gap]);
    }, [cols, gap]);

    return <AnimatedList ref={ref} className={cn(gridClasses, className)} {...props} />;
  }
);

AnimatedGrid.displayName = "AnimatedGrid";
