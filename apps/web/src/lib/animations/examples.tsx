/**
 * Animation System - Practical Examples
 * Real-world usage examples for KhipuVault components
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";

import {
  fadeIn,
  slideUp,
  staggerContainer,
  staggerItem,
  cardHover,
  modalOverlay,
  modalContent,
  springTransition,
  modalTransition,
  useScrollAnimation,
  useReducedMotion,
} from "@/lib/animations";

// Example 1: Animated Card with Hover
export function AnimatedPoolCard({
  title,
  value,
  children,
}: {
  title: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      variants={cardHover}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      className="rounded-lg border border-gray-200 bg-white p-6"
    >
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {children}
    </motion.div>
  );
}

// Example 2: Staggered List of Transactions
export function TransactionList({
  transactions,
}: {
  transactions: Array<{ id: string; amount: string; type: string }>;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      {transactions.map((tx) => (
        <motion.div
          key={tx.id}
          variants={staggerItem}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="flex justify-between">
            <span className="font-medium">{tx.type}</span>
            <span className="text-gray-600">{tx.amount}</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Example 3: Modal with Animations
export function AnimatedModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />

          {/* Modal Content */}
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={modalTransition}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-lg bg-white p-6">
              <h2 className="mb-4 text-2xl font-bold">{title}</h2>
              {children}
              <button
                onClick={onClose}
                className="mt-4 w-full rounded-lg bg-gray-100 px-4 py-2 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Example 4: Scroll-Triggered Animation
export function ScrollRevealSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { ref, inView } = useScrollAnimation<HTMLElement>();

  return (
    <motion.section
      ref={ref}
      variants={slideUp}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={springTransition}
      className="py-12"
    >
      <h2 className="mb-6 text-3xl font-bold">{title}</h2>
      {children}
    </motion.section>
  );
}

// Example 5: Stats Grid with Stagger
export function StatsGrid({
  stats,
}: {
  stats: Array<{ label: string; value: string; change?: string }>;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4 md:grid-cols-3"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          variants={staggerItem}
          className="rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6"
        >
          <p className="text-sm text-gray-600">{stat.label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
          {stat.change && <p className="mt-1 text-sm text-green-600">+{stat.change}</p>}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Example 6: Loading State with Conditional Animation
export function LoadingCard({ isLoading }: { isLoading: boolean }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-lg bg-white p-6"
    >
      {isLoading ? (
        <motion.div
          animate={
            prefersReducedMotion
              ? {}
              : {
                  opacity: [1, 0.5, 1],
                  transition: {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }
          }
        >
          Loading...
        </motion.div>
      ) : (
        <div>Content loaded!</div>
      )}
    </motion.div>
  );
}

// Example 7: Page Transition Wrapper
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={springTransition}
    >
      {children}
    </motion.div>
  );
}

// Example 8: Interactive Button with Tap Animation
export function AnimatedButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={springTransition}
      onClick={onClick}
      className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white"
    >
      {children}
    </motion.button>
  );
}

// Example 9: Dashboard Layout with Fade-In
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3 }}
      className="min-h-screen p-8"
    >
      {children}
    </motion.main>
  );
}

// Example 10: Notification Toast
export function NotificationToast({
  message,
  isVisible,
  onDismiss,
}: {
  message: string;
  isVisible: boolean;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={springTransition}
          className="fixed right-4 top-4 z-50 rounded-lg bg-green-500 p-4 text-white shadow-lg"
        >
          <p>{message}</p>
          <button onClick={onDismiss} className="mt-2 text-sm underline">
            Dismiss
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
