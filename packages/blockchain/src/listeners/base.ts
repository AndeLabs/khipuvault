import { ethers } from "ethers";

import { getProvider } from "../provider";
import { getReorgHandler, CONFIRMATION_DEPTH } from "../services/reorg-handler";

// Polling configuration
const POLL_INTERVAL_MS = 5000; // 5 seconds
const MAX_BLOCKS_PER_POLL = 1000; // Max blocks to fetch per poll

export abstract class BaseEventListener {
  protected contract: ethers.Contract;
  protected provider: ethers.JsonRpcProvider;
  protected reorgHandler = getReorgHandler();
  protected lastProcessedBlock: number = 0;
  protected pollInterval: NodeJS.Timeout | null = null;
  protected isPolling: boolean = false;

  constructor(contractAddress: string, abi: ethers.InterfaceAbi) {
    this.provider = getProvider();
    this.contract = new ethers.Contract(contractAddress, abi, this.provider);
  }

  /**
   * Start listening to events from a specific block
   * Uses polling with eth_getLogs instead of event filters (more compatible with Mezo RPC)
   * @param fromBlock Starting block for historical indexing
   * @param enableReorgChecking Enable periodic reorg checking (default: true)
   */
  async startListening(fromBlock: number = 0, enableReorgChecking: boolean = true): Promise<void> {
    console.log(`🎧 Starting ${this.constructor.name} from block ${fromBlock}`);
    console.log(`📊 Confirmation depth: ${CONFIRMATION_DEPTH} blocks`);
    console.log(`🔄 Using polling mode (${POLL_INTERVAL_MS}ms interval)`);

    // Start reorg checking if enabled
    if (enableReorgChecking) {
      this.reorgHandler.start();
    }

    // Index historical events first (only finalized blocks)
    if (fromBlock > 0) {
      const safeBlock = await this.reorgHandler.getSafeBlockNumber();
      const safeFromBlock = Math.min(fromBlock, safeBlock);
      console.log(`📚 Indexing finalized blocks only (up to block ${safeBlock})`);
      await this.indexHistoricalEvents(safeFromBlock);
    }

    // Set initial block for polling
    this.lastProcessedBlock = await this.provider.getBlockNumber();
    console.log(`📍 Starting polling from block ${this.lastProcessedBlock}`);

    // Start polling for new events (replaces filter-based listeners)
    this.startPolling();
  }

  /**
   * Start polling for new events using eth_getLogs
   * More reliable than eth_newFilter on RPCs that don't maintain filters
   */
  protected startPolling(): void {
    if (this.isPolling) return;
    this.isPolling = true;

    this.pollInterval = setInterval(async () => {
      try {
        await this.pollForEvents();
      } catch (error) {
        console.error(`❌ Polling error in ${this.constructor.name}:`, error);
      }
    }, POLL_INTERVAL_MS);

    console.log(`✅ ${this.constructor.name} polling active`);
  }

  /**
   * Poll for new events since last processed block
   */
  protected async pollForEvents(): Promise<void> {
    const currentBlock = await this.provider.getBlockNumber();

    if (currentBlock <= this.lastProcessedBlock) {
      return; // No new blocks
    }

    const fromBlock = this.lastProcessedBlock + 1;
    const toBlock = Math.min(currentBlock, fromBlock + MAX_BLOCKS_PER_POLL - 1);

    try {
      // Use queryFilter which internally uses eth_getLogs (no persistent filter needed)
      const events = await this.contract.queryFilter("*", fromBlock, toBlock);

      for (const event of events) {
        try {
          const parsedLog = this.contract.interface.parseLog({
            topics: [...event.topics],
            data: event.data,
          });

          if (parsedLog) {
            await this.processEvent(event, parsedLog);
          }
        } catch (parseError) {
          // Skip events we can't parse (might be from different contract version)
        }
      }

      if (events.length > 0) {
        console.log(`📦 Processed ${events.length} events from blocks ${fromBlock}-${toBlock}`);
      }

      this.lastProcessedBlock = toBlock;
    } catch (error) {
      console.error(`❌ Error fetching logs ${fromBlock}-${toBlock}:`, error);
    }
  }

  /**
   * Stop listening to events
   */
  stopListening(): void {
    // Stop polling
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;

    // Also remove any legacy filter-based listeners
    this.contract.removeAllListeners();
    this.reorgHandler.stop();
    console.log(`🛑 Stopped ${this.constructor.name}`);
  }

  /**
   * Check if a block is finalized (safe to process)
   * @param blockNumber Block number to check
   * @returns True if block has enough confirmations
   */
  protected async isBlockFinalized(blockNumber: number): Promise<boolean> {
    return this.reorgHandler.isBlockFinalized(blockNumber);
  }

  /**
   * Get the current safe block number (with confirmation depth)
   * @returns Block number that is considered final
   */
  protected async getSafeBlockNumber(): Promise<number> {
    return this.reorgHandler.getSafeBlockNumber();
  }

  /**
   * Setup real-time event listeners (DEPRECATED - now using polling)
   * Override only if you need additional filter-based listeners
   * Default: empty (polling handles all events)
   */
  protected setupEventListeners(): void {
    // No-op: Polling mode handles all events via eth_getLogs
    // Subclasses can override if they need filter-based listeners
  }

  /**
   * Index historical events from a starting block
   */
  protected abstract indexHistoricalEvents(fromBlock: number): Promise<void>;

  /**
   * Store block hash for reorg detection
   * Called automatically when processing events
   */
  protected async storeBlockHashIfNeeded(blockNumber: number): Promise<void> {
    try {
      await this.reorgHandler.storeBlockHash(blockNumber);
    } catch (error) {
      // Non-critical error - log but don't throw
      console.error(`⚠️ Failed to store block hash for ${blockNumber}:`, error);
    }
  }

  /**
   * Process a single event
   * Subclasses should implement this to handle specific event types
   */
  protected abstract processEvent(
    event: ethers.Log,
    parsedLog: ethers.LogDescription
  ): Promise<void>;
}
