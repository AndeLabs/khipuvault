/**
 * Animation System
 * Centralized animation utilities for Framer Motion
 *
 * @example
 * ```tsx
 * import { motion } from 'framer-motion';
 * import { fadeIn, springTransition, useReducedMotion } from '@/lib/animations';
 *
 * export function MyComponent() {
 *   const prefersReducedMotion = useReducedMotion();
 *
 *   return (
 *     <motion.div
 *       variants={fadeIn}
 *       initial="hidden"
 *       animate="visible"
 *       transition={springTransition}
 *     >
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 */

// Variants
export {
  fadeIn,
  fadeOut,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  scaleIn,
  scaleOut,
  staggerContainer,
  staggerItem,
  cardHover,
  modalOverlay,
  modalContent,
  drawerLeft,
  drawerRight,
  drawerBottom,
  pulse,
  spin,
  notificationSlideIn,
  expand,
  cardEntrance,
} from "./variants";

// Transitions
export {
  springTransition,
  softSpringTransition,
  bouncySpringTransition,
  easeTransition,
  easeOutTransition,
  easeInTransition,
  quickTransition,
  slowTransition,
  modalTransition,
  pageTransition,
  staggerTransition,
  layoutTransition,
  notificationTransition,
  collapseTransition,
  defaultTransition,
} from "./transitions";

// Hooks
export {
  useReducedMotion,
  useScrollAnimation,
  usePresence,
  useAnimationState,
  useStaggerDelay,
  useHoverAnimation,
  useAccessibleAnimation,
} from "./hooks";

// Type exports
export type { Variants, Transition } from "framer-motion";
