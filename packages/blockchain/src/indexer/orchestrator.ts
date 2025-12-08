import { prisma } from "@khipu/database";
import { IndividualPoolListener } from "../listeners/individual-pool";
import { CooperativePoolListener } from "../listeners/cooperative-pool";
import { getCurrentBlock } from "../provider";

export class IndexerOrchestrator {
  private listeners: Map<string, any> = new Map();
  private isRunning: boolean = false;

  /**
   * Add a listener for a contract
   */
  addListener(
    name: string,
    listener: IndividualPoolListener | CooperativePoolListener,
  ): void {
    this.listeners.set(name, listener);
  }

  /**
   * Start all listeners
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️  Indexer already running");
      return;
    }

    console.log("🚀 Starting blockchain indexer...");
    this.isRunning = true;

    const currentBlock = await getCurrentBlock();
    console.log(`📍 Current block: ${currentBlock}`);

    // Get last indexed block from database
    const lastEvent = await prisma.eventLog.findFirst({
      orderBy: { blockNumber: "desc" },
    });

    const fromBlock = lastEvent ? lastEvent.blockNumber + 1 : 0;

    console.log(`📚 Starting from block: ${fromBlock}`);

    // Start all listeners
    const listenerPromises = Array.from(this.listeners.entries()).map(
      async ([name, listener]) => {
        try {
          await listener.startListening(fromBlock);
        } catch (error) {
          console.error(`❌ Error starting ${name}:`, error);
        }
      },
    );

    await Promise.all(listenerPromises);

    console.log("✅ All listeners active");
  }

  /**
   * Stop all listeners
   */
  stop(): void {
    if (!this.isRunning) {
      console.log("⚠️  Indexer not running");
      return;
    }

    console.log("🛑 Stopping blockchain indexer...");

    for (const [name, listener] of this.listeners.entries()) {
      try {
        listener.stopListening();
      } catch (error) {
        console.error(`❌ Error stopping ${name}:`, error);
      }
    }

    this.isRunning = false;
    console.log("✅ Indexer stopped");
  }

  /**
   * Get indexer status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      listeners: Array.from(this.listeners.keys()),
    };
  }
}
