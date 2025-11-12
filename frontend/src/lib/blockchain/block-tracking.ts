/**
 * @fileoverview Block tracking utilities for historical event scanning
 * @module lib/blockchain/block-tracking
 *
 * Manages block range tracking and caching for efficient historical event indexing.
 * Uses localStorage for persistent storage across sessions.
 *
 * @example
 * ```ts
 * const tracker = new BlockTracker('cooperative-pool')
 * const lastScanned = tracker.getLastScannedBlock()
 * tracker.updateLastScannedBlock(12345678n)
 * ```
 */

import { PublicClient } from 'viem'

/**
 * Configuration for block tracking
 */
export interface BlockTrackingConfig {
  /** Contract deployment block (earliest block to scan) */
  deploymentBlock: bigint
  /** Maximum blocks to scan in a single batch */
  maxBlockRange: bigint
  /** Number of blocks to scan behind current for safety */
  confirmationBlocks: number
  /** Enable localStorage caching */
  enableCache: boolean
}

/**
 * Default configuration for Mezo Testnet
 */
export const DEFAULT_BLOCK_CONFIG: BlockTrackingConfig = {
  // CooperativePool V3 deployed on Nov 12, 2024
  // Block number can be found in deployment transaction
  deploymentBlock: 1000000n, // Update with actual deployment block
  maxBlockRange: 10000n, // Scan max 10k blocks at a time
  confirmationBlocks: 5, // Wait 5 blocks for finality
  enableCache: true,
}

/**
 * Block tracking metadata
 */
export interface BlockTrackingMetadata {
  lastScannedBlock: bigint
  lastScannedAt: number // Unix timestamp
  totalScans: number
  contractAddress: string
}

/**
 * BlockTracker - Manages block range tracking for historical event scanning
 *
 * Features:
 * - Persistent storage across sessions (localStorage)
 * - Automatic block range calculation
 * - Safety checks to prevent re-scanning
 * - Monitoring and metrics
 */
export class BlockTracker {
  private readonly storageKey: string
  private readonly config: BlockTrackingConfig
  private metadata: BlockTrackingMetadata | null = null

  constructor(
    contractName: string,
    contractAddress: string,
    config: Partial<BlockTrackingConfig> = {}
  ) {
    this.storageKey = `block-tracker:${contractName}:${contractAddress}`
    this.config = { ...DEFAULT_BLOCK_CONFIG, ...config }
    this.loadMetadata()
  }

  /**
   * Load metadata from localStorage
   */
  private loadMetadata(): void {
    if (!this.config.enableCache || typeof window === 'undefined') {
      return
    }

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convert string to bigint for lastScannedBlock
        this.metadata = {
          ...parsed,
          lastScannedBlock: BigInt(parsed.lastScannedBlock || 0),
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load block tracking metadata:', error)
      this.metadata = null
    }
  }

  /**
   * Save metadata to localStorage
   */
  private saveMetadata(): void {
    if (!this.config.enableCache || typeof window === 'undefined' || !this.metadata) {
      return
    }

    try {
      // Convert bigint to string for JSON serialization
      const toStore = {
        ...this.metadata,
        lastScannedBlock: this.metadata.lastScannedBlock.toString(),
      }
      localStorage.setItem(this.storageKey, JSON.stringify(toStore))
    } catch (error) {
      console.warn('⚠️ Failed to save block tracking metadata:', error)
    }
  }

  /**
   * Get the last scanned block number
   * Returns deployment block if never scanned before
   */
  getLastScannedBlock(): bigint {
    return this.metadata?.lastScannedBlock || this.config.deploymentBlock
  }

  /**
   * Update the last scanned block
   */
  updateLastScannedBlock(blockNumber: bigint): void {
    if (!this.metadata) {
      this.metadata = {
        lastScannedBlock: blockNumber,
        lastScannedAt: Date.now(),
        totalScans: 1,
        contractAddress: '',
      }
    } else {
      this.metadata.lastScannedBlock = blockNumber
      this.metadata.lastScannedAt = Date.now()
      this.metadata.totalScans++
    }

    this.saveMetadata()
  }

  /**
   * Calculate block ranges to scan
   * Returns array of [fromBlock, toBlock] tuples
   */
  async calculateBlockRanges(
    publicClient: PublicClient,
    targetBlock?: bigint
  ): Promise<Array<[bigint, bigint]>> {
    const currentBlock = targetBlock ?? (await publicClient.getBlockNumber())
    const safeBlock = currentBlock - BigInt(this.config.confirmationBlocks)
    const fromBlock = this.getLastScannedBlock()

    // If already up to date
    if (fromBlock >= safeBlock) {
      return []
    }

    const totalBlocks = safeBlock - fromBlock
    const ranges: Array<[bigint, bigint]> = []

    // Split into manageable chunks
    let start = fromBlock
    while (start < safeBlock) {
      const end = start + this.config.maxBlockRange
      const rangeEnd = end > safeBlock ? safeBlock : end
      ranges.push([start, rangeEnd])
      start = rangeEnd + 1n
    }

    return ranges
  }

  /**
   * Get metadata for monitoring
   */
  getMetadata(): BlockTrackingMetadata | null {
    return this.metadata
  }

  /**
   * Reset tracking (useful for testing or forced re-sync)
   */
  reset(): void {
    this.metadata = null
    if (this.config.enableCache && typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey)
    }
  }

  /**
   * Check if a full scan is needed
   * Returns true if never scanned before or data is stale
   */
  needsFullScan(maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
    if (!this.metadata) return true

    const age = Date.now() - this.metadata.lastScannedAt
    return age > maxAgeMs
  }
}

/**
 * Utility function to estimate scan time
 */
export function estimateScanTime(blockCount: bigint, blocksPerSecond: number = 1000): number {
  const blocks = Number(blockCount)
  const seconds = blocks / blocksPerSecond
  return Math.ceil(seconds)
}

/**
 * Utility function to format block range for logging
 */
export function formatBlockRange(from: bigint, to: bigint): string {
  return `${from.toLocaleString()} → ${to.toLocaleString()} (${(to - from).toLocaleString()} blocks)`
}
