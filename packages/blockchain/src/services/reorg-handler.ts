/**
 * @fileoverview Chain Reorganization Handler
 * @module services/reorg-handler
 *
 * Handles blockchain reorganizations (reorgs) to ensure data consistency.
 * Reorgs happen when the blockchain temporarily forks and then converges
 * on a different canonical chain.
 *
 * Strategy:
 * 1. Confirmation Depth: Wait for N confirmations before considering events final
 * 2. Block Hash Verification: Detect reorgs by comparing stored vs chain block hashes
 * 3. Rollback: Remove orphaned events when reorg detected
 * 4. Re-index: Fetch events from new canonical chain
 */

import { ethers } from "ethers";
import { prisma } from "@khipu/database";
import { getProvider } from "../provider";

// Number of confirmations required before considering a block final
// Mezo testnet: 6 blocks (~1 minute)
// Adjust based on chain finality characteristics
const CONFIRMATION_DEPTH = 6;

// How often to check for reorgs (in milliseconds)
const REORG_CHECK_INTERVAL = 30000; // 30 seconds

// Maximum number of blocks to check for reorgs at once
const MAX_REORG_CHECK_DEPTH = 100;

interface BlockInfo {
  number: number;
  hash: string;
  parentHash: string;
}

interface ReorgResult {
  detected: boolean;
  reorgDepth: number;
  orphanedBlocks: number[];
  newCanonicalBlocks: BlockInfo[];
}

/**
 * Service for detecting and handling blockchain reorganizations
 */
export class ReorgHandler {
  private provider: ethers.JsonRpcProvider;
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.provider = getProvider();
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
    console.log(
      `🔍 ReorgHandler started (checking every ${REORG_CHECK_INTERVAL / 1000}s)`,
    );

    // Run initial check
    this.checkForReorgs().catch(console.error);

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
   * Check for chain reorganizations
   */
  async checkForReorgs(): Promise<ReorgResult> {
    try {
      // Get the most recent blocks we have stored
      const storedBlocks = await prisma.eventLog.findMany({
        select: {
          blockNumber: true,
          blockHash: true,
        },
        distinct: ["blockNumber"],
        orderBy: { blockNumber: "desc" },
        take: MAX_REORG_CHECK_DEPTH,
      });

      if (storedBlocks.length === 0) {
        return {
          detected: false,
          reorgDepth: 0,
          orphanedBlocks: [],
          newCanonicalBlocks: [],
        };
      }

      // Group by block number (we might have multiple events per block)
      const blockMap = new Map<number, string>();
      for (const block of storedBlocks) {
        if (!blockMap.has(block.blockNumber)) {
          blockMap.set(block.blockNumber, block.blockHash);
        }
      }

      // Check each stored block against the chain
      const orphanedBlocks: number[] = [];
      const newCanonicalBlocks: BlockInfo[] = [];

      for (const [blockNumber, storedHash] of blockMap) {
        try {
          const chainBlock = await this.provider.getBlock(blockNumber);

          if (!chainBlock) {
            console.warn(`⚠️ Block ${blockNumber} not found on chain`);
            continue;
          }

          if (chainBlock.hash !== storedHash) {
            console.warn(`🔄 Reorg detected at block ${blockNumber}`);
            console.warn(`  Stored: ${storedHash}`);
            console.warn(`  Chain:  ${chainBlock.hash}`);

            orphanedBlocks.push(blockNumber);
            newCanonicalBlocks.push({
              number: blockNumber,
              hash: chainBlock.hash,
              parentHash: chainBlock.parentHash,
            });
          }
        } catch (error) {
          console.error(`❌ Error checking block ${blockNumber}:`, error);
        }
      }

      if (orphanedBlocks.length > 0) {
        console.log(
          `🔄 Reorg detected: ${orphanedBlocks.length} orphaned blocks`,
        );
        await this.handleReorg(orphanedBlocks, newCanonicalBlocks);
      }

      return {
        detected: orphanedBlocks.length > 0,
        reorgDepth: orphanedBlocks.length,
        orphanedBlocks,
        newCanonicalBlocks,
      };
    } catch (error) {
      console.error("❌ Error checking for reorgs:", error);
      return {
        detected: false,
        reorgDepth: 0,
        orphanedBlocks: [],
        newCanonicalBlocks: [],
      };
    }
  }

  /**
   * Handle a detected reorganization
   */
  private async handleReorg(
    orphanedBlocks: number[],
    newCanonicalBlocks: BlockInfo[],
  ): Promise<void> {
    console.log(`🔄 Handling reorg for blocks: ${orphanedBlocks.join(", ")}`);

    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Mark orphaned deposits as REORGED (don't delete for audit trail)
      await tx.deposit.updateMany({
        where: {
          blockNumber: { in: orphanedBlocks },
        },
        data: {
          status: "REORGED",
        },
      });

      // Mark orphaned event logs as removed for audit trail
      // Note: We mark as removed instead of modifying args since Prisma
      // doesn't support JSON concatenation in updateMany
      await tx.eventLog.updateMany({
        where: {
          blockNumber: { in: orphanedBlocks },
        },
        data: {
          processed: false,
          removed: true,
        },
      });

      console.log(`✅ Marked ${orphanedBlocks.length} blocks as reorged`);
    });

    // Note: Re-indexing of the new canonical blocks should be handled by
    // the main event listeners. The blocks will be picked up on the next
    // historical indexing run or via real-time event subscriptions.
  }

  /**
   * Verify block consistency for a range
   * @param fromBlock Starting block number
   * @param toBlock Ending block number
   * @returns Array of inconsistent block numbers
   */
  async verifyBlockRange(
    fromBlock: number,
    toBlock: number,
  ): Promise<number[]> {
    const inconsistentBlocks: number[] = [];

    // Get stored events in range
    const storedEvents = await prisma.eventLog.findMany({
      where: {
        blockNumber: {
          gte: fromBlock,
          lte: toBlock,
        },
      },
      select: {
        blockNumber: true,
        blockHash: true,
      },
      distinct: ["blockNumber"],
    });

    // Verify each block
    for (const event of storedEvents) {
      try {
        const chainBlock = await this.provider.getBlock(event.blockNumber);
        if (chainBlock && chainBlock.hash !== event.blockHash) {
          inconsistentBlocks.push(event.blockNumber);
        }
      } catch (error) {
        console.error(`Error verifying block ${event.blockNumber}:`, error);
      }
    }

    return inconsistentBlocks;
  }

  /**
   * Get reorg statistics
   */
  async getReorgStats(): Promise<{
    totalReorgedDeposits: number;
    totalReorgedEvents: number;
    affectedBlocks: number[];
  }> {
    const reorgedDeposits = await prisma.deposit.count({
      where: { status: "REORGED" },
    });

    const reorgedEvents = await prisma.eventLog.findMany({
      where: {
        args: {
          contains: "reorgDetected",
        },
      },
      select: {
        blockNumber: true,
      },
      distinct: ["blockNumber"],
    });

    return {
      totalReorgedDeposits: reorgedDeposits,
      totalReorgedEvents: reorgedEvents.length,
      affectedBlocks: reorgedEvents.map((e) => e.blockNumber),
    };
  }
}

// Singleton instance
let reorgHandlerInstance: ReorgHandler | null = null;

export function getReorgHandler(): ReorgHandler {
  if (!reorgHandlerInstance) {
    reorgHandlerInstance = new ReorgHandler();
  }
  return reorgHandlerInstance;
}

export { CONFIRMATION_DEPTH };
