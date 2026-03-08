/**
 * Animation Transitions for Framer Motion
 * Predefined transition configurations for consistent timing
 */

import type { Transition } from "framer-motion";

/**
 * Spring transition - Smooth, natural feel
 * Best for: Interactive elements, buttons, cards
 */
export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1,
};

/**
 * Soft spring transition - Very gentle
 * Best for: Large content blocks, page transitions
 */
export const softSpringTransition: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 25,
  mass: 1,
};

/**
 * Bouncy spring transition - Playful feel
 * Best for: Success states, celebrations
 */
export const bouncySpringTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 20,
  mass: 1,
};

/**
 * Ease transition - Smooth and predictable
 * Best for: Fade animations, subtle changes
 */
export const easeTransition: Transition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3,
};

/**
 * Ease out transition - Fast start, slow end
 * Best for: Elements entering the screen
 */
export const easeOutTransition: Transition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.3,
};

/**
 * Ease in transition - Slow start, fast end
 * Best for: Elements leaving the screen
 */
export const easeInTransition: Transition = {
  type: "tween",
  ease: "easeIn",
  duration: 0.2,
};

/**
 * Quick transition - Snappy and responsive
 * Best for: UI feedback, hover states
 */
export const quickTransition: Transition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.15,
};

/**
 * Slow transition - Deliberate and emphasized
 * Best for: Important state changes, modals
 */
export const slowTransition: Transition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.5,
};

/**
 * Modal transition - Smooth enter/exit for modals
 */
export const modalTransition: Transition = {
  type: "spring",
  stiffness: 350,
  damping: 35,
  mass: 0.8,
};

/**
 * Page transition - For route changes
 */
export const pageTransition: Transition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
};

/**
 * Stagger transition - For sequential animations
 */
export const staggerTransition = {
  staggerChildren: 0.1,
  delayChildren: 0.05,
};

/**
 * Layout transition - For layout animations
 */
export const layoutTransition: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 50,
  mass: 1.5,
};

/**
 * Notification transition - For toast/notification
 */
export const notificationTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

/**
 * Collapse transition - For expand/collapse animations
 */
export const collapseTransition: Transition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.25,
};

/**
 * Default transition - General purpose
 */
export const defaultTransition: Transition = springTransition;
