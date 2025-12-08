import { ethers } from "ethers";
import { getProvider } from "../provider";
import { getReorgHandler, CONFIRMATION_DEPTH } from "../services/reorg-handler";

export abstract class BaseEventListener {
  protected contract: ethers.Contract;
  protected provider: ethers.JsonRpcProvider;
  protected reorgHandler = getReorgHandler();

  constructor(contractAddress: string, abi: ethers.InterfaceAbi) {
    this.provider = getProvider();
    this.contract = new ethers.Contract(contractAddress, abi, this.provider);
  }

  /**
   * Start listening to events from a specific block
   * @param fromBlock Starting block for historical indexing
   * @param enableReorgChecking Enable periodic reorg checking (default: true)
   */
  async startListening(
    fromBlock: number = 0,
    enableReorgChecking: boolean = true,
  ): Promise<void> {
    console.log(`🎧 Starting ${this.constructor.name} from block ${fromBlock}`);
    console.log(`📊 Confirmation depth: ${CONFIRMATION_DEPTH} blocks`);

    // Start reorg checking if enabled
    if (enableReorgChecking) {
      this.reorgHandler.start();
    }

    // Listen to new events
    this.setupEventListeners();

    // Index historical events (only finalized blocks)
    if (fromBlock > 0) {
      const safeBlock = await this.reorgHandler.getSafeBlockNumber();
      const safeFromBlock = Math.min(fromBlock, safeBlock);
      console.log(
        `📚 Indexing finalized blocks only (up to block ${safeBlock})`,
      );
      await this.indexHistoricalEvents(safeFromBlock);
    }
  }

  /**
   * Stop listening to events
   */
  stopListening(): void {
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
   * Setup real-time event listeners
   */
  protected abstract setupEventListeners(): void;

  /**
   * Index historical events from a starting block
   */
  protected abstract indexHistoricalEvents(fromBlock: number): Promise<void>;

  /**
   * Process a single event
   */
  protected abstract processEvent(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
  ): Promise<void>;
}
