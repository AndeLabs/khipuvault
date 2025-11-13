/**
 * @fileoverview CooperativePool Contract ABI
 * @module lib/web3/cooperative-pool-abi
 *
 * CooperativePool V3 deployed on Mezo Testnet (Nov 12, 2024)
 * Implementation: 0xde2649bda9a0db84079cac3b15d93f1de5ceb7f7
 * Proxy (UUPS): 0x323fca9b377fe29b8fc95ddbd9fe54cea1655f88
 *
 * Use the Proxy address for all interactions
 */

export const COOPERATIVE_POOL_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_mezoIntegration', type: 'address', internalType: 'address' },
      { name: '_yieldAggregator', type: 'address', internalType: 'address' },
      { name: '_musd', type: 'address', internalType: 'address' },
      { name: '_feeCollector', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  // Events
  {
    type: 'event',
    name: 'PoolCreated',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: false },
      { name: 'creator', type: 'address', indexed: false },
      { name: 'name', type: 'string', indexed: false },
      { name: 'minContribution', type: 'uint256', indexed: false },
      { name: 'maxMembers', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'MemberJoined',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: false },
      { name: 'member', type: 'address', indexed: false },
      { name: 'btcAmount', type: 'uint256', indexed: false },
      { name: 'shares', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'MemberLeft',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: false },
      { name: 'member', type: 'address', indexed: false },
      { name: 'btcAmount', type: 'uint256', indexed: false },
      { name: 'yieldAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'YieldClaimed',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: false },
      { name: 'member', type: 'address', indexed: false },
      { name: 'yieldAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'YieldDistributed',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: false },
      { name: 'totalYield', type: 'uint256', indexed: false },
      { name: 'feeAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PoolStatusUpdated',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: false },
      { name: 'status', type: 'uint8', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PoolClosed',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  // Read Functions
  {
    type: 'function',
    name: 'poolCounter',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPoolInfo',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'poolId', type: 'uint256' },
          { name: 'name', type: 'string' },
          { name: 'creator', type: 'address' },
          { name: 'minContribution', type: 'uint256' },
          { name: 'maxContribution', type: 'uint256' },
          { name: 'maxMembers', type: 'uint256' },
          { name: 'currentMembers', type: 'uint256' },
          { name: 'totalBtcDeposited', type: 'uint256' },
          { name: 'totalMusdMinted', type: 'uint256' },
          { name: 'totalYieldGenerated', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'allowNewMembers', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getMemberInfo',
    inputs: [
      { name: 'poolId', type: 'uint256' },
      { name: 'member', type: 'address' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'btcContributed', type: 'uint256' },
          { name: 'shares', type: 'uint256' },
          { name: 'yieldClaimed', type: 'uint256' },
          { name: 'joinedAt', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPoolMembers',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPoolStats',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [
      { name: 'totalBtc', type: 'uint256' },
      { name: 'totalMusd', type: 'uint256' },
      { name: 'totalYield', type: 'uint256' },
      { name: 'totalShares', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'calculateMemberYield',
    inputs: [
      { name: 'poolId', type: 'uint256' },
      { name: 'member', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTotalShares',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  // Write Functions
  {
    type: 'function',
    name: 'createPool',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'minContribution', type: 'uint256' },
      { name: 'maxContribution', type: 'uint256' },
      { name: 'maxMembers', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'joinPool',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'leavePool',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimYield',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'closePool',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // Constants
  {
    type: 'function',
    name: 'MIN_CONTRIBUTION',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MIN_POOL_SIZE',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MAX_POOL_SIZE',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MAX_MEMBERS_LIMIT',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'performanceFee',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const
