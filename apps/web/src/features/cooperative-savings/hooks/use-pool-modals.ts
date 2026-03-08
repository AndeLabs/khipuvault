/**
 * @fileoverview Pool Modals State Management Hook
 * @module features/cooperative-savings/hooks/use-pool-modals
 *
 * Centralizes modal state management for cooperative pools.
 * Reduces complexity in page components.
 */

"use client";

import { useState, useCallback } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface UsePoolModalsReturn {
  // Modal states
  createModalOpen: boolean;
  joinModalOpen: boolean;
  leaveDialogOpen: boolean;
  detailsModalOpen: boolean;

  // Selected pool
  selectedPoolId: number | null;

  // Modal openers
  openCreateModal: () => void;
  openJoinModal: (poolId: number) => void;
  openLeaveDialog: (poolId: number) => void;
  openDetailsModal: (poolId: number) => void;

  // Modal closers
  closeCreateModal: () => void;
  closeJoinModal: () => void;
  closeLeaveDialog: () => void;
  closeDetailsModal: () => void;

  // Utility
  closeAllModals: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing cooperative pool modal states
 *
 * @example
 * ```tsx
 * const {
 *   createModalOpen,
 *   openCreateModal,
 *   closeCreateModal,
 *   selectedPoolId,
 * } = usePoolModals();
 * ```
 */
export function usePoolModals(): UsePoolModalsReturn {
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Selected pool
  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null);

  // Modal openers
  const openCreateModal = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const openJoinModal = useCallback((poolId: number) => {
    setSelectedPoolId(poolId);
    setJoinModalOpen(true);
  }, []);

  const openLeaveDialog = useCallback((poolId: number) => {
    setSelectedPoolId(poolId);
    setLeaveDialogOpen(true);
  }, []);

  const openDetailsModal = useCallback((poolId: number) => {
    setSelectedPoolId(poolId);
    setDetailsModalOpen(true);
  }, []);

  // Modal closers
  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
  }, []);

  const closeJoinModal = useCallback(() => {
    setJoinModalOpen(false);
    setSelectedPoolId(null);
  }, []);

  const closeLeaveDialog = useCallback(() => {
    setLeaveDialogOpen(false);
    setSelectedPoolId(null);
  }, []);

  const closeDetailsModal = useCallback(() => {
    setDetailsModalOpen(false);
    setSelectedPoolId(null);
  }, []);

  // Close all modals
  const closeAllModals = useCallback(() => {
    setCreateModalOpen(false);
    setJoinModalOpen(false);
    setLeaveDialogOpen(false);
    setDetailsModalOpen(false);
    setSelectedPoolId(null);
  }, []);

  return {
    // States
    createModalOpen,
    joinModalOpen,
    leaveDialogOpen,
    detailsModalOpen,
    selectedPoolId,

    // Openers
    openCreateModal,
    openJoinModal,
    openLeaveDialog,
    openDetailsModal,

    // Closers
    closeCreateModal,
    closeJoinModal,
    closeLeaveDialog,
    closeDetailsModal,

    // Utility
    closeAllModals,
  };
}
