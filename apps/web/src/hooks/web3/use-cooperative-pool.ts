/**
 * @fileoverview Comprehensive CooperativePoolV3 Hook - Production Ready
 *
 * Features:
 * - Create pools with custom parameters
 * - Join pools with native BTC payments
 * - Leave pools with yield distribution
 * - Claim yields with performance fee
 * - Contribute more BTC to existing membership
 * - View all pool members
 * - Calculate pending yields
 * - Pool statistics and metadata
 * - Emergency mode support
 * - Flash loan protection
 *
 * Contract: CooperativePoolV3 (UUPS Upgradeable)
 *
 * NOTE: This file has been refactored into smaller modules in the ./cooperative directory.
 * The exports below maintain backward compatibility with existing code.
 */

"use client";

// Re-export everything from the refactored modules
// All hooks are now properly organized in ./cooperative/index.ts
export * from "./cooperative";
