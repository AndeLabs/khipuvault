/**
 * @fileoverview Common Web3 Utilities - Main Export Module
 * @module hooks/web3/common
 *
 * Central export point for shared Web3 utilities and helpers
 */

"use client";

// Re-export contract mutation factory
export * from "./use-contract-mutation";

// Re-export safe Web3 wrappers
export * from "./use-web3-safe";

// Re-export transaction utilities
export * from "./use-transaction-verification";

// Re-export event utilities
export * from "./use-pool-events";
export * from "./use-pool-real-time-sync";

// Re-export token approval utilities
export * from "./use-musd-approval";
