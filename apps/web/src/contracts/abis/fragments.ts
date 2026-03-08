/**
 * @fileoverview Minimal ABI Fragments for Type-Safe Contract Interactions
 * @module contracts/abis/fragments
 *
 * These minimal typed ABIs ensure correct TypeScript inference with wagmi
 * without importing full JSON ABIs. Use these for mutation hooks.
 *
 * @example
 * ```ts
 * import { COOPERATIVE_POOL_FRAGMENTS } from "@/contracts/abis/fragments";
 *
 * mutation.write({
 *   address: poolAddress,
 *   abi: COOPERATIVE_POOL_FRAGMENTS.joinPool,
 *   functionName: "joinPool",
 *   args: [BigInt(poolId)],
 *   value: amount,
 * });
 * ```
 */

// ============================================================================
// COOPERATIVE POOL V3 FRAGMENTS
// ============================================================================

export const COOPERATIVE_POOL_FRAGMENTS = {
  joinPool: [
    {
      type: "function",
      name: "joinPool",
      inputs: [{ name: "poolId", type: "uint256" }],
      outputs: [],
      stateMutability: "payable",
    },
  ] as const,

  leavePool: [
    {
      type: "function",
      name: "leavePool",
      inputs: [{ name: "poolId", type: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,

  createPool: [
    {
      type: "function",
      name: "createPool",
      inputs: [
        { name: "name", type: "string" },
        { name: "minContribution", type: "uint256" },
        { name: "maxContribution", type: "uint256" },
        { name: "maxMembers", type: "uint256" },
      ],
      outputs: [{ name: "poolId", type: "uint256" }],
      stateMutability: "nonpayable",
    },
  ] as const,

  claimYield: [
    {
      type: "function",
      name: "claimYield",
      inputs: [{ name: "poolId", type: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,

  closePool: [
    {
      type: "function",
      name: "closePool",
      inputs: [{ name: "poolId", type: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,

  withdrawPartial: [
    {
      type: "function",
      name: "withdrawPartial",
      inputs: [
        { name: "poolId", type: "uint256" },
        { name: "withdrawAmount", type: "uint256" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,
} as const;

// ============================================================================
// INDIVIDUAL POOL V3 FRAGMENTS
// ============================================================================

export const INDIVIDUAL_POOL_FRAGMENTS = {
  deposit: [
    {
      type: "function",
      name: "deposit",
      inputs: [{ name: "amount", type: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,

  withdraw: [
    {
      type: "function",
      name: "withdraw",
      inputs: [{ name: "amount", type: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,

  claimYield: [
    {
      type: "function",
      name: "claimYield",
      inputs: [],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,

  setAutoCompound: [
    {
      type: "function",
      name: "setAutoCompound",
      inputs: [{ name: "enabled", type: "bool" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,
} as const;

// ============================================================================
// LOTTERY POOL V3 FRAGMENTS
// ============================================================================

export const LOTTERY_POOL_FRAGMENTS = {
  buyTickets: [
    {
      type: "function",
      name: "buyTickets",
      inputs: [{ name: "quantity", type: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,

  claimPrize: [
    {
      type: "function",
      name: "claimPrize",
      inputs: [{ name: "roundId", type: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,
} as const;

// ============================================================================
// ROTATING POOL (ROSCA) FRAGMENTS
// ============================================================================

export const ROTATING_POOL_FRAGMENTS = {
  createPool: [
    {
      type: "function",
      name: "createPool",
      inputs: [
        { name: "contributionAmount", type: "uint256" },
        { name: "cycleDuration", type: "uint256" },
        { name: "maxMembers", type: "uint256" },
        { name: "name", type: "string" },
        { name: "useNativeBtc", type: "bool" },
      ],
      outputs: [{ name: "poolId", type: "uint256" }],
      stateMutability: "nonpayable",
    },
  ] as const,

  joinPool: [
    {
      type: "function",
      name: "joinPool",
      inputs: [{ name: "poolId", type: "uint256" }],
      outputs: [],
      stateMutability: "payable",
    },
  ] as const,

  contribute: [
    {
      type: "function",
      name: "contribute",
      inputs: [{ name: "poolId", type: "uint256" }],
      outputs: [],
      stateMutability: "payable",
    },
  ] as const,

  claimPayout: [
    {
      type: "function",
      name: "claimPayout",
      inputs: [{ name: "poolId", type: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,
} as const;

// ============================================================================
// ERC20 FRAGMENTS (MUSD, etc.)
// ============================================================================

export const ERC20_FRAGMENTS = {
  approve: [
    {
      type: "function",
      name: "approve",
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "nonpayable",
    },
  ] as const,

  transfer: [
    {
      type: "function",
      name: "transfer",
      inputs: [
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "nonpayable",
    },
  ] as const,

  balanceOf: [
    {
      type: "function",
      name: "balanceOf",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
    },
  ] as const,

  allowance: [
    {
      type: "function",
      name: "allowance",
      inputs: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
      ],
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
    },
  ] as const,
} as const;

// ============================================================================
// MEZO PROTOCOL FRAGMENTS
// ============================================================================

/**
 * Mezo Borrower Operations - For Trove (CDP) management
 */
export const MEZO_BORROWER_FRAGMENTS = {
  openTrove: [
    {
      type: "function",
      name: "openTrove",
      inputs: [
        { name: "_debtAmount", type: "uint256" },
        { name: "_upperHint", type: "address" },
        { name: "_lowerHint", type: "address" },
      ],
      outputs: [],
      stateMutability: "payable",
    },
  ] as const,

  closeTrove: [
    {
      type: "function",
      name: "closeTrove",
      inputs: [],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,

  addColl: [
    {
      type: "function",
      name: "addColl",
      inputs: [
        { name: "_upperHint", type: "address" },
        { name: "_lowerHint", type: "address" },
      ],
      outputs: [],
      stateMutability: "payable",
    },
  ] as const,

  withdrawColl: [
    {
      type: "function",
      name: "withdrawColl",
      inputs: [
        { name: "_amount", type: "uint256" },
        { name: "_upperHint", type: "address" },
        { name: "_lowerHint", type: "address" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,

  withdrawMUSD: [
    {
      type: "function",
      name: "withdrawMUSD",
      inputs: [
        { name: "_amount", type: "uint256" },
        { name: "_upperHint", type: "address" },
        { name: "_lowerHint", type: "address" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,

  repayMUSD: [
    {
      type: "function",
      name: "repayMUSD",
      inputs: [
        { name: "_amount", type: "uint256" },
        { name: "_upperHint", type: "address" },
        { name: "_lowerHint", type: "address" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,
} as const;

/**
 * Mezo Stability Pool - For providing MUSD liquidity
 */
export const MEZO_STABILITY_POOL_FRAGMENTS = {
  provideToSP: [
    {
      type: "function",
      name: "provideToSP",
      inputs: [{ name: "_amount", type: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,

  withdrawFromSP: [
    {
      type: "function",
      name: "withdrawFromSP",
      inputs: [{ name: "_amount", type: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,
} as const;
