/**
 * @fileoverview Chain Reorganization Handler
 * @module services/reorg-handler
 *
 * Handles blockchain reorganizations (reorgs) to ensure data consistency.
 * Reorgs happen when the blockchain temporarily forks and then converges
 * on a different canonical chain.
 *
 * Strategy:
 * 1. Block Hash Tracking: Store recent block hashes in dedicated table
 * 2. Parent Hash Verification: Detect reorgs by verifying parent hash chain
 * 3. Confirmation Depth: Wait for N confirmations before considering events final
 * 4. Fork Point Detection: Identify exact block where chain diverged
 * 5. Atomic Rollback: Mark orphaned events in transaction
 * 6. Re-index: Listeners pick up events from new canonical chain
 */

import { ethers } from "ethers";

import { prisma } from "@khipu/database";

import { getProvider } from "../provider";

// ============================================================================
// CONFIGURATION
// ============================================================================

// Number of confirmations required before considering a block final
// Mezo testnet: 6 blocks (~1 minute with 10s block time)
// Adjust based on chain finality characteristics
const CONFIRMATION_DEPTH = parseInt(process.env.REORG_CONFIRMATION_DEPTH || "6", 10);

// How often to check for reorgs (in milliseconds)
const REORG_CHECK_INTERVAL = parseInt(
  process.env.REORG_CHECK_INTERVAL || "30000", // 30 seconds
  10
);

// Number of recent block hashes to keep for reorg detection
// Larger depth = more memory but can detect deeper reorgs
const REORG_DETECTION_DEPTH = parseInt(process.env.REORG_DETECTION_DEPTH || "100", 10);

// Maximum reorg depth to handle automatically
// Reorgs deeper than this will be logged but require manual intervention
const REORG_MAX_DEPTH = parseInt(process.env.REORG_MAX_DEPTH || "50", 10);

// How long to keep finalized block hashes before cleanup (in blocks)
const FINALIZED_BLOCKS_RETENTION = 1000;

// ============================================================================
// TYPES
// ============================================================================

interface BlockInfo {
  number: number;
  hash: string;
  parentHash: string;
  timestamp?: number;
}

interface ReorgResult {
  detected: boolean;
  reorgDepth: number;
  forkPoint: number | null; // Block number where chains diverged
  orphanedBlocks: number[];
  newCanonicalBlocks: BlockInfo[];
  affectedTransactions: number;
}

interface ReorgStats {
  totalReorgsDetected: number;
  maxReorgDepth: number;
  lastReorgAt: Date | null;
  totalAffectedBlocks: number;
  totalAffectedTransactions: number;
}

/**
 * Service for detecting and handling blockchain reorganizations
 */
export class ReorgHandler {
  private provider: ethers.JsonRpcProvider;
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private reorgCount: number = 0;
  private maxDepthSeen: number = 0;

  constructor() {
    this.provider = getProvider();
    console.log("🔍 ReorgHandler initialized with config:", {
      confirmationDepth: CONFIRMATION_DEPTH,
      detectionDepth: REORG_DETECTION_DEPTH,
      maxDepth: REORG_MAX_DEPTH,
      checkInterval: `${REORG_CHECK_INTERVAL / 1000}s`,
    });
  }

  /**
   * Start periodic reorg checking
   */
  start(): void {
    if (this.isRunning) {
      console.log("⚠️ ReorgHandler already running");
      return;
    }

    this.isRunning = true;
    console.log(`🔍 ReorgHandler started (checking every ${REORG_CHECK_INTERVAL / 1000}s)`);

    // Run initial check and cleanup
    Promise.all([this.checkForReorgs(), this.cleanupOldBlockHashes()]).catch(console.error);

    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.checkForReorgs().catch(console.error);
    }, REORG_CHECK_INTERVAL);
  }

  /**
   * Stop periodic reorg checking
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log("🛑 ReorgHandler stopped");
  }

  /**
   * Get the safe block number (current - confirmation depth)
   */
  async getSafeBlockNumber(): Promise<number> {
    const currentBlock = await this.provider.getBlockNumber();
    return Math.max(0, currentBlock - CONFIRMATION_DEPTH);
  }

  /**
   * Check if a specific block is finalized (has enough confirmations)
   */
  async isBlockFinalized(blockNumber: number): Promise<boolean> {
    const currentBlock = await this.provider.getBlockNumber();
    return currentBlock - blockNumber >= CONFIRMATION_DEPTH;
  }

  /**
   * Store block hash for reorg detection
   * Call this for each new block processed
   */
  async storeBlockHash(blockNumber: number): Promise<void> {
    try {
      const block = await this.provider.getBlock(blockNumber);
      if (!block?.hash) {
        console.warn(`⚠️ Could not fetch block ${blockNumber} for hash storage`);
        return;
      }

      // Check if already stored
      const existing = await prisma.blockHash.findUnique({
        where: { blockNumber },
      });

      if (existing) {
        // Block already stored, check for consistency
        if (existing.blockHash !== block.hash) {
          console.warn(`⚠️ Block ${blockNumber} hash mismatch during storage`, {
            stored: existing.blockHash,
            chain: block.hash,
          });
        }
        return;
      }

      // Store new block hash
      await prisma.blockHash.create({
        data: {
          blockNumber,
          blockHash: block.hash,
          parentHash: block.parentHash,
          timestamp: new Date(block.timestamp * 1000),
          isFinalized: false,
        },
      });
    } catch (error) {
      // Log but don't throw - hash storage is best-effort
      console.error(`❌ Error storing block hash for ${blockNumber}:`, error);
    }
  }

  /**
   * Check for chain reorganizations using parent hash verification
   * This is more reliable than just comparing block hashes
   */
  async checkForReorgs(): Promise<ReorgResult> {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const safeBlock = currentBlock - CONFIRMATION_DEPTH;

      // Get recent stored block hashes (unfinalized only)
      const storedBlocks = await prisma.blockHash.findMany({
        where: {
          blockNumber: {
            gte: Math.max(0, safeBlock - REORG_DETECTION_DEPTH),
            lte: safeBlock,
          },
          isFinalized: false,
        },
        orderBy: { blockNumber: "desc" },
        take: REORG_DETECTION_DEPTH,
      });

      if (storedBlocks.length === 0) {
        return {
          detected: false,
          reorgDepth: 0,
          forkPoint: null,
          orphanedBlocks: [],
          newCanonicalBlocks: [],
          affectedTransactions: 0,
        };
      }

      // Verify parent hash chain
      const { forkPoint, orphanedBlocks } = await this.detectForkPoint(storedBlocks);

      if (orphanedBlocks.length === 0) {
        // No reorg detected, mark old blocks as finalized
        await this.finalizeBlocks(storedBlocks.map((b) => b.blockNumber));
        return {
          detected: false,
          reorgDepth: 0,
          forkPoint: null,
          orphanedBlocks: [],
          newCanonicalBlocks: [],
          affectedTransactions: 0,
        };
      }

      // Fetch new canonical blocks
      const newCanonicalBlocks: BlockInfo[] = [];
      for (const blockNum of orphanedBlocks) {
        try {
          const chainBlock = await this.provider.getBlock(blockNum);
          if (chainBlock && chainBlock.hash) {
            newCanonicalBlocks.push({
              number: blockNum,
              hash: chainBlock.hash,
              parentHash: chainBlock.parentHash,
              timestamp: chainBlock.timestamp,
            });
          }
        } catch (error) {
          console.error(`❌ Error fetching new canonical block ${blockNum}:`, error);
        }
      }

      const reorgDepth = orphanedBlocks.length;

      // Check if reorg is too deep
      if (reorgDepth > REORG_MAX_DEPTH) {
        console.error(
          `🚨 CRITICAL: Reorg depth (${reorgDepth}) exceeds maximum (${REORG_MAX_DEPTH})`
        );
        console.error(`   Fork point: ${forkPoint}`);
        console.error(`   Manual intervention required!`);
        // Still log but don't automatically handle
        return {
          detected: true,
          reorgDepth,
          forkPoint,
          orphanedBlocks,
          newCanonicalBlocks,
          affectedTransactions: 0,
        };
      }

      console.log(`🔄 Reorg detected:`, {
        depth: reorgDepth,
        forkPoint,
        orphanedBlocks: orphanedBlocks.length,
      });

      // Handle the reorg
      const affectedTxs = await this.handleReorg(orphanedBlocks, newCanonicalBlocks, forkPoint);

      // Update stats
      this.reorgCount++;
      this.maxDepthSeen = Math.max(this.maxDepthSeen, reorgDepth);

      return {
        detected: true,
        reorgDepth,
        forkPoint,
        orphanedBlocks,
        newCanonicalBlocks,
        affectedTransactions: affectedTxs,
      };
    } catch (error) {
      console.error("❌ Error checking for reorgs:", error);
      return {
        detected: false,
        reorgDepth: 0,
        forkPoint: null,
        orphanedBlocks: [],
        newCanonicalBlocks: [],
        affectedTransactions: 0,
      };
    }
  }

  /**
   * Detect fork point by verifying parent hash chain
   * Returns the block number where the chain diverged and list of orphaned blocks
   */
  private async detectForkPoint(
    storedBlocks: Array<{ blockNumber: number; blockHash: string; parentHash: string }>
  ): Promise<{ forkPoint: number | null; orphanedBlocks: number[] }> {
    const orphanedBlocks: number[] = [];
    let forkPoint: number | null = null;

    // Sort blocks by number (descending)
    const sorted = [...storedBlocks].sort((a, b) => b.blockNumber - a.blockNumber);

    for (let i = 0; i < sorted.length; i++) {
      const stored = sorted[i];

      try {
        // Fetch current chain block
        const chainBlock = await this.provider.getBlock(stored.blockNumber);

        if (!chainBlock?.hash) {
          console.warn(`⚠️ Block ${stored.blockNumber} not found on chain`);
          continue;
        }

        // Check if hashes match
        if (chainBlock.hash !== stored.blockHash) {
          console.warn(`🔄 Block ${stored.blockNumber} hash mismatch:`, {
            stored: stored.blockHash,
            chain: chainBlock.hash,
          });
          orphanedBlocks.push(stored.blockNumber);
          continue;
        }

        // Hashes match - check parent hash for extra verification
        if (i < sorted.length - 1) {
          const previousStored = sorted[i + 1];
          if (previousStored.blockNumber === stored.blockNumber - 1) {
            if (stored.parentHash !== previousStored.blockHash) {
              console.warn(`🔄 Parent hash mismatch at block ${stored.blockNumber}`);
              orphanedBlocks.push(stored.blockNumber);
              continue;
            }
          }
        }

        // This block is valid - we found the fork point
        if (orphanedBlocks.length > 0 && forkPoint === null) {
          forkPoint = stored.blockNumber;
          console.log(`✅ Fork point found at block ${forkPoint}`);
          break;
        }
      } catch (error) {
        console.error(`❌ Error checking block ${stored.blockNumber}:`, error);
      }
    }

    // If we checked all blocks and found mismatches but no valid fork point,
    // the fork point is before our stored range
    if (orphanedBlocks.length > 0 && forkPoint === null) {
      const oldestChecked = Math.min(...sorted.map((b) => b.blockNumber));
      forkPoint = oldestChecked - 1;
      console.warn(`⚠️ Fork point is before stored range, assuming block ${forkPoint}`);
    }

    return { forkPoint, orphanedBlocks };
  }

  /**
   * Handle a detected reorganization
   * Returns the number of affected transactions
   */
  private async handleReorg(
    orphanedBlocks: number[],
    newCanonicalBlocks: BlockInfo[],
    forkPoint: number | null
  ): Promise<number> {
    console.log(`🔄 Handling reorg:`, {
      orphanedBlocks: orphanedBlocks.length,
      forkPoint,
      blocks: orphanedBlocks.join(", "),
    });

    let affectedDeposits = 0;
    let affectedEvents = 0;

    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Mark orphaned deposits as REORGED (don't delete for audit trail)
      const depositResult = await tx.deposit.updateMany({
        where: {
          blockNumber: { in: orphanedBlocks },
          status: { not: "REORGED" }, // Don't re-mark already reorged
        },
        data: {
          status: "REORGED",
        },
      });
      affectedDeposits = depositResult.count;

      // Mark orphaned event logs as removed
      const eventResult = await tx.eventLog.updateMany({
        where: {
          blockNumber: { in: orphanedBlocks },
          removed: false, // Don't re-mark already removed
        },
        data: {
          processed: false,
          removed: true,
        },
      });
      affectedEvents = eventResult.count;

      // Delete orphaned block hashes
      await tx.blockHash.deleteMany({
        where: {
          blockNumber: { in: orphanedBlocks },
        },
      });

      // Store new canonical block hashes
      for (const block of newCanonicalBlocks) {
        await tx.blockHash.upsert({
          where: { blockNumber: block.number },
          create: {
            blockNumber: block.number,
            blockHash: block.hash,
            parentHash: block.parentHash,
            timestamp: block.timestamp ? new Date(block.timestamp * 1000) : new Date(),
            isFinalized: false,
          },
          update: {
            blockHash: block.hash,
            parentHash: block.parentHash,
            timestamp: block.timestamp ? new Date(block.timestamp * 1000) : new Date(),
            isFinalized: false,
          },
        });
      }

      console.log(`✅ Reorg handled:`, {
        affectedDeposits,
        affectedEvents,
        newBlocksStored: newCanonicalBlocks.length,
      });
    });

    // Note: Re-indexing of the new canonical blocks should be handled by
    // the main event listeners. The blocks will be picked up on the next
    // historical indexing run or via real-time event subscriptions.

    return affectedDeposits + affectedEvents;
  }

  /**
   * Mark blocks as finalized (have enough confirmations)
   */
  private async finalizeBlocks(blockNumbers: number[]): Promise<void> {
    if (blockNumbers.length === 0) {
      return;
    }

    try {
      const currentBlock = await this.provider.getBlockNumber();

      // Only finalize blocks with enough confirmations
      const toFinalize = blockNumbers.filter((bn) => currentBlock - bn >= CONFIRMATION_DEPTH);

      if (toFinalize.length > 0) {
        await prisma.blockHash.updateMany({
          where: {
            blockNumber: { in: toFinalize },
            isFinalized: false,
          },
          data: {
            isFinalized: true,
            confirmedAt: currentBlock,
          },
        });

        console.log(`✅ Finalized ${toFinalize.length} blocks`);
      }
    } catch (error) {
      console.error("❌ Error finalizing blocks:", error);
    }
  }

  /**
   * Cleanup old finalized block hashes to prevent table bloat
   */
  private async cleanupOldBlockHashes(): Promise<void> {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const cutoffBlock = currentBlock - FINALIZED_BLOCKS_RETENTION;

      if (cutoffBlock <= 0) {
        return;
      }

      const result = await prisma.blockHash.deleteMany({
        where: {
          blockNumber: { lt: cutoffBlock },
          isFinalized: true,
        },
      });

      if (result.count > 0) {
        console.log(`🧹 Cleaned up ${result.count} old block hashes (before block ${cutoffBlock})`);
      }
    } catch (error) {
      console.error("❌ Error cleaning up block hashes:", error);
    }
  }

  /**
   * Verify block consistency for a range
   * @param fromBlock Starting block number
   * @param toBlock Ending block number
   * @returns Array of inconsistent block numbers
   */
  async verifyBlockRange(fromBlock: number, toBlock: number): Promise<number[]> {
    const inconsistentBlocks: number[] = [];

    // Get stored block hashes in range
    const storedBlocks = await prisma.blockHash.findMany({
      where: {
        blockNumber: {
          gte: fromBlock,
          lte: toBlock,
        },
      },
    });

    // Verify each block
    for (const stored of storedBlocks) {
      try {
        const chainBlock = await this.provider.getBlock(stored.blockNumber);
        if (chainBlock && chainBlock.hash !== stored.blockHash) {
          inconsistentBlocks.push(stored.blockNumber);
          console.warn(`⚠️ Inconsistent block ${stored.blockNumber}:`, {
            stored: stored.blockHash,
            chain: chainBlock.hash,
          });
        }
      } catch (error) {
        console.error(`❌ Error verifying block ${stored.blockNumber}:`, error);
      }
    }

    return inconsistentBlocks;
  }

  /**
   * Get comprehensive reorg statistics
   */
  async getReorgStats(): Promise<ReorgStats> {
    const [reorgedDeposits, reorgedEvents, removedEventBlocks] = await Promise.all([
      prisma.deposit.count({
        where: { status: "REORGED" },
      }),
      prisma.eventLog.count({
        where: { removed: true },
      }),
      prisma.eventLog.findMany({
        where: { removed: true },
        select: { blockNumber: true },
        distinct: ["blockNumber"],
      }),
    ]);

    // Get unique affected blocks
    const affectedBlocks = new Set(removedEventBlocks.map((e) => e.blockNumber));

    // Find when last reorg occurred
    const lastReorgedDeposit = await prisma.deposit.findFirst({
      where: { status: "REORGED" },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });

    return {
      totalReorgsDetected: this.reorgCount,
      maxReorgDepth: this.maxDepthSeen,
      lastReorgAt: lastReorgedDeposit?.updatedAt || null,
      totalAffectedBlocks: affectedBlocks.size,
      totalAffectedTransactions: reorgedDeposits + reorgedEvents,
    };
  }

  /**
   * Get current handler status
   */
  getStatus(): {
    isRunning: boolean;
    config: {
      confirmationDepth: number;
      detectionDepth: number;
      maxDepth: number;
      checkInterval: number;
    };
    stats: {
      reorgCount: number;
      maxDepthSeen: number;
    };
  } {
    return {
      isRunning: this.isRunning,
      config: {
        confirmationDepth: CONFIRMATION_DEPTH,
        detectionDepth: REORG_DETECTION_DEPTH,
        maxDepth: REORG_MAX_DEPTH,
        checkInterval: REORG_CHECK_INTERVAL,
      },
      stats: {
        reorgCount: this.reorgCount,
        maxDepthSeen: this.maxDepthSeen,
      },
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Singleton instance
let reorgHandlerInstance: ReorgHandler | null = null;

export function getReorgHandler(): ReorgHandler {
  if (!reorgHandlerInstance) {
    reorgHandlerInstance = new ReorgHandler();
  }
  return reorgHandlerInstance;
}

// Export configuration constants
export { CONFIRMATION_DEPTH, REORG_DETECTION_DEPTH, REORG_MAX_DEPTH, REORG_CHECK_INTERVAL };
